import type {
	MetaFunction,
	LoaderFunction,
	ActionFunction
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	useLoaderData,
	useActionData,
	Link,
	useFetcher,
	Outlet,
	useParams
} from '@remix-run/react';

import { getUser } from '~/utils/session.server';
import { prisma } from '~/utils/db.server';
import { getProducts } from '~/models/products.server';
import { getStatuses } from '~/models/status.server';
import { validateTitle, validateDescription } from '~/utils/functions';
import { getTicket, deleteTicket } from '~/models/tickets.server';
import { getNoteListingByTicketId } from '~/models/notes.server';
import { FaTools } from 'react-icons/fa';
import LogoutButton from '~/components/LogoutButton';

export const meta: MetaFunction = ({
	data
}: {
	data: LoaderData | undefined;
}) => {
	if (!data) {
		return {
			title: 'No ticket'
		};
	} else {
		return {
			title: 'Support Desk | Tickets'
		};
	}
};

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	statuses: Awaited<ReturnType<typeof getStatuses>>;
	products: Awaited<ReturnType<typeof getProducts>>;
	ticket: Awaited<ReturnType<typeof getTicket>>;
	notesByTicketId: Awaited<ReturnType<typeof getNoteListingByTicketId>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const [user, statuses, products, ticket, notesByTicketId] = await Promise.all(
		[
			getUser(request),
			getStatuses(),
			getProducts(),
			getTicket(params.ticketId),
			getNoteListingByTicketId(params.ticketId)
		]
	);

	const data: LoaderData = {
		user,
		products,
		statuses,
		ticket,
		notesByTicketId
	};

	return data;
};

type ActionData = {
	formError?: string;
	fieldErrors?: {
		title: string | undefined;
		description: string | undefined;
	};
	fields?: {
		title: string;
		status: string;
		product: string;
		description: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request, params }) => {
	const form = await request.formData();

	const title = form.get('title');
	const status = form.get('status');
	const product = form.get('product');
	const description = form.get('description');
	/* const intent = form.get('intent'); */

	const ticketId = params.ticketId;

	/* if (intent === 'delete') {
		await deleteTicket(ticketId);
		return redirect('/board/admin/users/ticketlist');
	} */

	function onlyNumbers(str: string) {
		return /^[0-9]+$/.test(str);
	}

	if (typeof title !== 'string' || onlyNumbers(title) === true) {
		return badRequest({
			formError: 'The title must be at least 3 characters long.'
		});
	}

	if (typeof status !== 'string') {
		return badRequest({ formError: 'A status must be selected.' });
	}

	if (typeof product !== 'string') {
		return badRequest({ formError: 'A product must be selected.' });
	}

	if (typeof description !== 'string' || onlyNumbers(description) === true) {
		return badRequest({
			formError: 'Issue description must be at least 5 characters long.'
		});
	}

	const fieldErrors = {
		title: validateTitle(title),
		description: validateDescription(description)
	};

	const fields = { title, status, product, description };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const ticket = await prisma.ticket.findUnique({
		where: { ticketId }
	});

	const authorId = ticket?.authorId;

	if (!authorId) {
		return badRequest({ formError: 'Author not found' });
	}

	const ticketProduct = await prisma.product.findUnique({
		where: { device: product }
	});

	if (!ticketProduct) {
		return badRequest({ formError: 'Product not found' });
	}

	const ticketProductId = ticketProduct.productId;

	const ticketStatus = await prisma.status.findUnique({
		where: { type: status }
	});

	if (!ticketStatus) {
		return badRequest({ formError: 'Status not found' });
	}

	const ticketStatusId = ticketStatus.statusId;

	await prisma.ticket.update({
		data: {
			authorId,
			ticketProductId,
			ticketStatusId,
			title,
			description
		},
		where: { ticketId: params.ticketId }
	});

	return redirect('/board/admin/users/ticketlist');
};

export default function userTicketIdRoute() {
	const { ticket, notesByTicketId, statuses, products } =
		useLoaderData<LoaderData>();
	const actionData = useActionData() as ActionData;

	const fetcher = useFetcher();

	function handleSelectStatus(selectedStatus: string) {
		return fetcher.submission?.formData.get('status') === selectedStatus;
	}

	function handleSelectProduct(selectedProduct: string) {
		return fetcher.submission?.formData.get('product') === selectedProduct;
	}

	const hasNotes = notesByTicketId && notesByTicketId.length > 1;

	const isUpdating = Boolean(
		fetcher.submission?.formData.get('intent') === 'update'
	);

	return (
		<>
			<header className='container header'>
				<Link to='/board/admin/users/ticketlist' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Tickets
				</Link>
				<h1>Ticket</h1>
				<LogoutButton />
			</header>
			<div className='form-container form-container-admin'>
				<p>
					Ticket from:
					<span className='capitalize'>
						&nbsp;{ticket?.author?.username}&nbsp;
					</span>{' '}
					- Email:<span>&nbsp;{ticket?.author?.email}</span>
					{notesByTicketId?.length ? (
						<em>&nbsp;-&nbsp;Scroll to see its associated notes</em>
					) : null}
				</p>
				<div className='form-scroll'>
					<fetcher.Form
						replace
						method='post'
						className='form'
						key={ticket?.ticketId}
					>
						<div className='form-content'>
							<div className='form-group'>
								<label htmlFor='title'>
									Title:{''}
									<input
										type='text'
										id='title'
										name='title'
										defaultValue={ticket?.title}
										aria-invalid={Boolean(actionData?.fieldErrors?.title)}
										aria-errormessage={
											actionData?.fieldErrors?.title ? 'title-error' : undefined
										}
										autoFocus
									/>
									{actionData?.fieldErrors?.title ? (
										<p className='error-danger' role='alert' id='title-error'>
											{actionData.fieldErrors.title}
										</p>
									) : null}
								</label>
							</div>
							<div className='form-group'>
								<label htmlFor='status'>
									Status:
									{statuses.length ? (
										<select
											id='status'
											name='status'
											defaultValue={ticket?.ticketStatus?.type}
											onSelect={(e) => handleSelectStatus}
											className='form-select'
										>
											<option
												defaultValue='- Select a status -'
												disabled
												className='form-option-disabled'
											>
												- Select a status -
											</option>
											{statuses.map((status) => (
												<option
													key={status.statusId}
													value={status.type}
													className='form-option'
												>
													{status.type}
												</option>
											))}
										</select>
									) : (
										<p className='error-danger'>'No status available'</p>
									)}
								</label>
							</div>
							<div className='form-group'>
								<label htmlFor='product'>
									Product:
									{products.length ? (
										<select
											id='product'
											name='product'
											defaultValue={ticket?.ticketProduct?.device}
											onSelect={(e) => handleSelectProduct}
											className='form-select'
										>
											<option
												defaultValue={'- Select a product -'}
												disabled
												className='form-option-disabled'
											>
												- Select a product -
											</option>
											{products.map((product) => (
												<option
													key={product.productId}
													value={product.device}
													className='form-option'
												>
													{product.device}
												</option>
											))}
										</select>
									) : (
										<p className='error-danger'>'No product available'</p>
									)}
								</label>
							</div>
							<div className='form-group'>
								<label htmlFor='description'>
									Issue Description:
									<textarea
										defaultValue={ticket?.description}
										id='description'
										name='description'
										aria-invalid={Boolean(actionData?.fieldErrors?.description)}
										aria-errormessage={
											actionData?.fieldErrors?.description
												? 'description-error'
												: undefined
										}
										className='form-textarea'
									/>
								</label>
							</div>
							{actionData?.fieldErrors?.description ? (
								<p className='error-danger' role='alert' id='description-error'>
									{actionData.fieldErrors.description}
								</p>
							) : null}
							{actionData?.formError ? (
								<p className='error-danger' role='alert'>
									{actionData.formError}
								</p>
							) : null}
							{ticket ? (
								<>
									<div className='form-group inline-center'>
										<label className='inline-date'>
											Created at:&nbsp;
											<input
												type='text'
												id='createdAt'
												name='createdAt'
												defaultValue={new Date(ticket.createdAt).toLocaleString(
													'en-us',
													{
														month: '2-digit',
														day: '2-digit',
														year: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false
													}
												)}
												className='form-input-date'
												disabled
											/>
										</label>
										<label className='inline-date'>
											Updated at:&nbsp;
											<input
												type='text'
												id='updatedAt'
												name='updatedAt'
												defaultValue={new Date(ticket.updatedAt).toLocaleString(
													'en-us',
													{
														month: '2-digit',
														day: '2-digit',
														year: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false
													}
												)}
												className='form-input-date'
												disabled
											/>
										</label>
									</div>
								</>
							) : null}
							<div className='inline'>
								<button
									type='submit'
									name='intent'
									value='update'
									className='btn'
									disabled={isUpdating}
								>
									{isUpdating ? 'Updating...' : 'Update'}
								</button>
								<Link to='/board/admin/users/ticketlist/'>
									<button className='btn'>Back to Ticket List</button>
								</Link>
								{/* <button
									type='submit'
									name='intent'
									value='delete'
									className='btn  btn-danger'
									disabled={isDeleting}
								>
									{isDeleting ? 'isDeleting...' : 'Delete'}
								</button> */}
								<Link
									to={`/board/admin/users/ticketlist/${ticket?.ticketId}/add`}
									className='btn btn-note'
								>
									Add Note
								</Link>
								<Outlet />
							</div>
							<div className='inline'>
								{hasNotes ? (
									<Link
										to={`/board/admin/users/ticketlist/${ticket?.ticketId}/deleteNote`}
										className='btn btn-danger'
									>
										Delete all Notes
									</Link>
								) : null}
								<Link
									to={`/board/admin/users/ticketlist/${ticket?.ticketId}/deleteTicket`}
									className='btn btn-danger'
								>
									Delete Ticket
								</Link>
							</div>
						</div>
					</fetcher.Form>
					{notesByTicketId?.length ? (
						<>
							<div className='table'>
								<div className='row row-head'>
									<p>Author</p>
									<p>Text</p>
									<p>Date</p>
									<p className='view'>View</p>
								</div>
								{notesByTicketId?.length
									? notesByTicketId.map((note) => (
											<div key={note.noteId} className='row'>
												<p>{note.noteUser.username}</p>
												<p>{note.text}</p>
												<p>
													{new Date(note.createdAt).toLocaleString('en-us', {
														month: '2-digit',
														day: '2-digit',
														year: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false
													}) !==
													new Date(note.updatedAt).toLocaleString('en-us', {
														month: '2-digit',
														day: '2-digit',
														year: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false
													}) ? (
														<span>
															{new Date(note.updatedAt).toLocaleString(
																'en-us',
																{
																	month: '2-digit',
																	day: '2-digit',
																	year: '2-digit',
																	hour: '2-digit',
																	minute: '2-digit',
																	hour12: false
																}
															)}
														</span>
													) : (
														<span>
															{new Date(note.createdAt).toLocaleString(
																'en-us',
																{
																	month: '2-digit',
																	day: '2-digit',
																	year: '2-digit',
																	hour: '2-digit',
																	minute: '2-digit',
																	hour12: false
																}
															)}
														</span>
													)}
												</p>
												<p>
													<Link
														to={`/board/admin/users/ticketlist/${ticket?.ticketId}/${note.noteId}`}
														className='view'
													>
														View
													</Link>
												</p>
											</div>
									  ))
									: null}
							</div>
						</>
					) : null}
				</div>
			</div>
		</>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	const { userId } = useParams();
	console.log(error);
	return (
		<div className='error-container' style={{ fontSize: '1.5rem' }}>
			<div className='form-container-message form-content'>
				<p>
					To{' '}
					<span className='error-danger error-danger-big'>
						delete a ticket:
					</span>
				</p>
				<p>first delete its associated notes,</p>
				<p>then come back to the ticket</p>
				<p>and click the delete button.</p>
				<p>OR</p>
				<p>delete the ticket via the database.</p>
				<p>
					<span className='error-danger error-danger-big'>
						These actions are permanent.
					</span>
				</p>
				<Link to={`/board/admin/users/ticketlist`}>
					<button className='btn form-btn'>Back to Ticket List</button>
				</Link>
			</div>
		</div>
	);
}
