// export default function newTicketRoute() {
// 	return <div>New Ticket</div>;
// }

import type { LoaderFunction, ActionFunction } from 'remix';
import type { Product, Status } from '@prisma/client';
import { getProducts } from '~/utils/products.server';
import { getStatuses } from '~/utils/status.server';

import {
	useLoaderData,
	useActionData,
	json,
	Link,
	useFetcher,
	// useFetchers,
	useSearchParams,
	useTransition,
	Form,
	redirect,
	useCatch
} from 'remix';

import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';

// TODO: Insert Meta to describe what's going on in this file through the page tab

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
	return json(data);
};

function validateStatus(type: unknown) {
	if (type === '-- Please select a status --') {
		return 'A status must be selected';
	}
}

function validateProduct(product: unknown) {
	if (product === '-- Please select a product --') {
		return 'A product must be selected';
	}
}

function validateDescription(description: unknown) {
	if (typeof description !== 'string' || description.length < 10) {
		return 'descriptions must be at least 10 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		product: string | undefined;
		description: string | undefined;
		type: string | undefined;
	};
	fields?: {
		product: string;
		description: string;
		type: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();

	let { ...values } = Object.fromEntries(form);
	const { username, email, product, description, type } = values;

	const redirectTo = form.get('redirectTo') || '/';
	if (!username && !email && !product && !description && !type) {
		return null;
	} else if (
		typeof username !== 'string' ||
		typeof email !== 'string' ||
		typeof product !== 'string' ||
		typeof description !== 'string' ||
		typeof type !== 'string' ||
		typeof redirectTo !== 'string'
	) {
		return badRequest({ formError: 'Form not submitted correctly.' });
	}

	const fieldErrors = {
		product: validateProduct(product),
		description: validateDescription(description),
		type: validateStatus(type)
	};

	const fields = { product, description, type };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const ticketProduct = await db.product.findUnique({
		where: { device: product }
	});

	if (!ticketProduct) {
		return badRequest({ formError: 'Product not found' });
	}

	const ticketProductId = ticketProduct.productId;

	const ticketStatus = await db.status.findUnique({ where: { type: type } });

	if (!ticketStatus) {
		return badRequest({ formError: 'Status not found' });
	}

	const ticketStatusId = ticketStatus.type;

	await db.ticket.create({
		data: {
			description,
			authorId: userId,
			ticketProductId,
			ticketStatusId
		}
	});
	return redirect(`/new-ticket`);
};

export default function NewTicketRoute() {
	const user = useLoaderData().user;
	const products: Product[] = useLoaderData().products;
	const statuses: Status[] = useLoaderData().statuses;

	const actionData = useActionData<ActionData>();

	const fetcher = useFetcher();
	// const fetchers = useFetchers();
	const [searchParams] = useSearchParams();
	const transition = useTransition();

	function handleSelect(selectedValue: string) {
		fetcher.submit(
			{ selected: selectedValue },
			{ method: 'post', action: '/new-ticket' }
		);
	}

	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<Form>
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
					</Form>
					<fetcher.Form reloadDocument method='post' className='form'>
						<div className='form-group'>
							<label htmlFor='status'>Status: </label>
							{statuses.length ? (
								<select
									name='status'
									id='status'
									defaultValue='-- Please select a status --'
									onSelect={(e) => handleSelect}
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
						{actionData?.fieldErrors?.type ? (
							<p className='form-validation-error' role='alert' id='type-error'>
								{actionData.fieldErrors.type}
							</p>
						) : null}
					</fetcher.Form>
					<fetcher.Form reloadDocument method='post' className='form'>
						<div className='form-group'>
							<label htmlFor='product'>Product: </label>
							{products.length ? (
								<select
									name='product'
									id='product'
									defaultValue='-- Please select a product --'
									onSelect={(e) => handleSelect}
									className='form-select'
									autoFocus
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
								className='form-validation-error'
								role='alert'
								id='product-error'
							>
								{actionData.fieldErrors.product}
							</p>
						) : null}
					</fetcher.Form>
					<Form reloadDocument method='post' className='form'>
						<input
							type='hidden'
							name='redirectTo'
							defaultValue={searchParams.get('redirectTo') ?? undefined}
						/>
						<div className='form-group'>
							<label htmlFor='description'>Issue Description: </label>
							<textarea
								name='description'
								id='description'
								className='form-textarea'
							/>
						</div>

						{transition.submission ? (
							<button type='submit' className='btn form-btn' disabled>
								Sending your ticket..
							</button>
						) : (
							<button type='submit' className='btn form-btn'>
								Send
							</button>
						)}
					</Form>
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
					<p>You must be logged in to create a role.</p>
					<Link to='/login?redirectTo=/roles/new-role'>
						<button className='btn form-btn'>Login</button>
					</Link>
				</div>
			</div>
		);
	}
	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	return (
		<div className='error-container'>
			<div className='form-container form-content'>
				Something unexpected went wrong. Sorry about that.
			</div>
		</div>
	);
}
