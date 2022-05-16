import type { LoaderFunction, ActionFunction } from 'remix';
import type { Product, Status } from '@prisma/client';

import {
	useLoaderData,
	useActionData,
	json,
	Link,
	useFetcher,
	useTransition,
	redirect,
	useCatch
} from 'remix';

import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';
import { getProducts } from '~/utils/products.server';
import { getStatuses } from '~/utils/status.server';

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
		return 'Description must be at least 10 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		product: string | undefined;
		description: string | undefined;
		status: string | undefined;
	};
	fields?: {
		product: string;
		description: string;
		status: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const form = await request.formData();

	let { ...values } = Object.fromEntries(form);
	const { product, description, status } = values;

	if (!product && !description && !status) {
		return null;
	} else if (typeof status !== 'string') {
		return badRequest({ formError: 'A status must be selected' });
	} else if (typeof product !== 'string') {
		return badRequest({ formError: 'A product must be selected' });
	} else if (typeof description !== 'string' || description.length < 10) {
		return badRequest({ formError: 'Descriptions must be at least 10 characters long' });
	}

	// } else if (
	// 	typeof product !== 'string' ||
	// 	typeof description !== 'string' ||
	// 	typeof status !== 'string'
	// ) {
	// 	return badRequest({ formError: 'Form not submitted correctly.' });
	// }

	const fieldErrors = {
		product: validateProduct(product),
		description: validateDescription(description),
		status: validateStatus(status)
	};

	const fields = { product, description, status };
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
			description
		}
	});
	return redirect(`/tickets/new-ticket`);
};

export default function NewTicketRoute() {
	const data = useLoaderData();
	const user = data.user;
	const products: Product[] = data.products;
	const statuses: Status[] = data.statuses;

	const actionData = useActionData<ActionData>();

	const fetcher = useFetcher();
	const transition = useTransition();

	function handleSelectStatus(selectedStatus: string) {
		fetcher.submission?.formData.get('status') === selectedStatus;
	}

	function handleSelectProduct(selectedProduct: string) {
		fetcher.submission?.formData.get('product') === selectedProduct;
	}


	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<div className='form-group'>
						<p>
							New Ticket from:
							<span className='capitalize'>&nbsp;{user?.username}</span>
						</p>
						<p>
							Email:
							<span>&nbsp;{user?.email}</span>
						</p>
					</div>
					<fetcher.Form /* reloadDocument */ method='post' className='form'>
						<div className='form-group'>
							<label htmlFor='status'>Status: </label>
							{statuses.length ? (
								<select
									name='status'
									id='status'
									defaultValue='-- Please select a status --'
									onSelect={(e) => handleSelectStatus}
									className='form-select'
									autoFocus
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
						{actionData?.fieldErrors?.status ? (
							<p
								className='error-danger'
								role='alert'
								id='status-error'
							>
								{actionData.fieldErrors.status}
							</p>
						) : null}
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
						{actionData?.fieldErrors?.product ? (
							<p
								className='error-danger'
								role='alert'
								id='product-error'
							>
								{actionData.fieldErrors.product}
							</p>
						) : null}
						<div className='form-group'>
							<label htmlFor='description'>Issue Description: </label>
							<textarea
								name='description'
								id='description'
								className='form-textarea'
							/>
						</div>
						{actionData?.formError ? (
							<p className='error-danger' role='alert'>
								{actionData.formError}
							</p>
						) : null}
						{transition.submission ? (
							<button className='btn form-btn' disabled>
								Sending your ticket..
							</button>
						) : (
							<button type='submit' className='btn form-btn'>
								Send
							</button>

						)}
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
