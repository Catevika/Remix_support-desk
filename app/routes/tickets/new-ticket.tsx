import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix';
import type { Product, Status } from '@prisma/client';

import {
	useLoaderData,
	useActionData,
	json,
	Link,
	useFetcher,
	redirect,
	useCatch
} from 'remix';

import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';
import { getProducts } from '~/utils/products.server';
import { getStatuses } from '~/utils/status.server';

// TODO: Voir comment gérer les fields errors sur des select
// TODO: changer le style des errors pour qu'il y ait moins d'espace en dessous

export const meta: MetaFunction = () => {
	return {
		title: 'Remix Support-Desk | Ticket',
		description: 'Create a new ticket!'
	};
};

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	products: Awaited<ReturnType<typeof getProducts>>;
	statuses: Awaited<ReturnType<typeof getStatuses>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const [user, products, statuses] = await Promise.all([
		getUser(request),
		getProducts(),
		getStatuses()
	]);

	const data: LoaderData = {
		user,
		products,
		statuses
	};

	return data;
};

function validateTitle(title: unknown) {
	if (!title || typeof title !== 'string' || title.length < 3) {
		return 'The title must be a string of at least 3 characters long.';
	}
}

function validateStatus(status: unknown) {
	if (!status || typeof status !== 'string') {
		return 'A status must be selected';
	}
}

function validateProduct(product: unknown) {
	if (!product || typeof product !== 'string') {
		return 'A product must be selected';
	}
}

function validateDescription(description: unknown) {
	if (typeof description !== 'string' || description.length < 10) {
		return 'The description must be at least 10 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		title: string | undefined;
		status: string | undefined;
		product: string | undefined;
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

export const action: ActionFunction = async ({ request }) => {
	const form = await request.formData();

	let { ...values } = Object.fromEntries(form);
	const { title, status, product, description } = values;

	function onlyNumbers(str: string) {
		return /^[0-9]+$/.test(str);
	}

	if ((typeof title !== 'string') || onlyNumbers(title) === true || (typeof title === 'string' && title.length < 3)) {
		return badRequest({ formError: 'The title must be a string of at least 3 characters long.' });
	}

	if (typeof status !== 'string') {
		return badRequest({ formError: 'A status must be selected.' });
	}

	if (typeof product !== 'string') {
		return badRequest({ formError: 'A product must be selected' });
	}

	if ((typeof description !== 'string') || onlyNumbers(description) === true || (typeof title === 'string' && description.length < 10)) {
		return badRequest({ formError: 'The description of the issue must be a string of at least 10 characters long.' });
	}

	const fieldErrors = {
		title: validateTitle(title),
		status: validateStatus(status),
		product: validateProduct(product),
		description: validateDescription(description),
	};

	const fields = { title, status, product, description };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const userId = await requireUserId(request);

	const ticketProduct = await db.product.findUnique({
		where: { device: product }
	});

	if (!ticketProduct) {
		return badRequest({ formError: 'Product not found' });
	}

	const ticketProductId = ticketProduct.productId;

	const ticketStatus = await db.status.findUnique({ where: { type: status } });

	if (!ticketStatus) {
		return badRequest({ formError: 'Status not found' });
	}

	const ticketStatusId = ticketStatus.statusId;

	await db.ticket.create({
		data: {
			authorId: userId,
			ticketProductId,
			ticketStatusId,
			title,
			description
		}
	});
	return redirect(`/tickets/new-ticket`);
};

export default function NewTicketRoute() {
	const data = useLoaderData();
	const user = data.user;
	const statuses: Status[] = data.statuses;
	const products: Product[] = data.products;

	const actionData = useActionData<ActionData>();

	const fetcher = useFetcher();

	function handleSelectStatus(selectedStatus: string) {
		return fetcher.submission?.formData.get('status') === selectedStatus;
	}

	function handleSelectProduct(selectedProduct: string) {
		return fetcher.submission?.formData.get('product') === selectedProduct;
	}

	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<p className='list'>
						New Ticket from:<span className='capitalize'>&nbsp;{user?.username}</span>
					</p>
					<p className='list'>
						Email:
						<span>&nbsp;{user?.email}</span>
					</p>
					<fetcher.Form reloadDocument method='post' className='form'>
						<div>
							<label htmlFor="title">
								Title:{''}
								<input type='text' defaultValue={actionData?.fields?.title} name='title' aria-invalid={Boolean(actionData?.fieldErrors?.title)} aria-errormessage={actionData?.fieldErrors?.title ? 'title-error' : undefined} autoFocus />
							</label>
							{actionData?.fieldErrors?.title ? (
								<p
									className='error-danger'
									role='alert'
									id='title-error'
								>
									{actionData.fieldErrors.title}
								</p>
							) : null}
						</div>
						<div className='form-group'>
							<label htmlFor='status'>Status: </label>
							{statuses.length ? (
								<select
									name='status'
									id='status'
									defaultValue='-- Please select a status --'
									onSelect={(e) => handleSelectStatus}
									className='form-select'
								>
									<option
										defaultValue='-- Please select a status --'
										disabled
										className='form-option-disabled'
									>
										-- Please select a status --
									</option>
									{statuses.map((status: Status) => (
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
						</div>
						<div className='form-group'>
							<label htmlFor='product'>Product: </label>
							{products.length ? (
								<select
									name='product'
									id='product'
									defaultValue='-- Please select a product --'
									onSelect={(e) => handleSelectProduct}
									className='form-select'
								>
									<option
										defaultValue='-- Please select a product --'
										disabled
										className='form-option-disabled'
									>
										-- Please select a product --
									</option>
									{products.map((product: Product) => (
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
						</div>
						<div className='form-group'>
							<label htmlFor='description'>Issue Description:
								<textarea
									defaultValue={actionData?.fields?.description}
									name='description'
									aria-invalid={Boolean(actionData?.fieldErrors?.description)}
									aria-errormessage={actionData?.fieldErrors?.description
										? 'description-error'
										: undefined}
									id='description'
									className='form-textarea'
								/>
							</label>
							{actionData?.fieldErrors?.description ? (
								<p
									className='error-danger'
									role='alert'
									id='description-error'
								>
									{actionData.fieldErrors.description}
								</p>
							) : null}
						</div>
						{actionData?.formError ? (
							<p className='error-danger' role='alert'>
								{actionData.formError}
							</p>
						) : null}
						<button type='submit' className='btn form-btn'>
							Send
						</button>
					</fetcher.Form>
				</div>
			</main>
		</>
	);
}

export function CatchBoundary() {
	const caught = useCatch();

	if (caught.status === 401) {
		return (
			<div className='error-container'>
				<div className='form-container form-content'>
					<p>You must be logged in to create a ticket.</p>
					<Link to='/login?redirectTo=/tickets/new-ticket'>
						<button className='btn form-btn'>Login</button>
					</Link>
				</div>
			</div>
		);
	}
	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error; }) {
	console.error(error);
	return (
		<div className='error-container'>
			<div className='form-container form-content'>
				Something unexpected went wrong. Sorry about that.
			</div>
		</div>
	);
}
