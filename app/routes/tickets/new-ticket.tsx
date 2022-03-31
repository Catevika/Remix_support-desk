import type { LinksFunction, LoaderFunction, ActionFunction } from 'remix';
import {
	Link,
	useLoaderData,
	useActionData,
	json,
	redirect,
	useTransition,
	useFetcher,
	useCatch
} from 'remix';
import { db } from '~/utils/db.server';
import { getUser, requireUserId } from '~/utils/session.server';
import stylesUrl from '~/styles/form.css';
import { FaTools } from 'react-icons/fa';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	productListItems: Array<{ productId: string; device: string }>;
};

// TODO: Insert Meta to describe what's going on in this file through the page tab

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);

	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}

	const productListItems = await db.product.findMany({
		select: { productId: true, device: true },
		orderBy: { device: 'asc' }
	});

	const loaderData: LoaderData = {
		productListItems,
		user
	};

	return json(loaderData);
};

function validateTicket(description: string) {
	if (description.length < 8) {
		return 'Description content must be at least 8 characters long';
	}
}

function validateProduct(product: string) {
	if (product === '-- Please select a product --') {
		return 'A product must be selected';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		description: string | undefined;
		product: string | undefined;
	};
	fields?: {
		description: string;
		product: string;
	};
};

const badRequest = (actionData: ActionData) =>
	json(actionData, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();

	let { ...values } = Object.fromEntries(form);
	const { username, email, description, product } = values;

	if (!username && !email && !description && !product) {
		return null;
	} else if (
		typeof username !== 'string' ||
		typeof email !== 'string' ||
		typeof description !== 'string' ||
		typeof product !== 'string'
	) {
		return badRequest({ formError: 'Form not submitted correctly.' });
	}

	const fieldErrors = {
		description: validateTicket(description),
		product: validateProduct(product)
	};

	const fields = { description, product };

	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	await db.ticket.create({
		data: {
			description,
			authorId: userId,
			ticketProductId: '1'
			// TODO: reprendre ici
		}
	});

	return redirect('/tickets/new-ticket');
};

export default function NewTicketRoute() {
	const fetcher = useFetcher();

	function handleSelect(selectedValue: string) {
		fetcher.submit(
			{ selected: selectedValue },
			{ method: 'post', action: '/tickets/new-ticket' }
		);
	}

	const data = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();
	const transition = useTransition();

	return (
		<>
			{/* TODO: replace Link with the back button that comes back to the previous route */}
			<header className='container header'>
				<Link to='/boards/employee' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Board
				</Link>
				<h1>Create New Ticket</h1>
			</header>
			<main className='form-container'>
				<div className='form-content'>
					<div className='form-group'>
						<label htmlFor='username'>Username</label>
						<input
							type='text'
							name='username'
							value={data.user?.username}
							disabled
							className='capitalize'
						/>
					</div>
					<div className='form-group'>
						<label htmlFor='email'>Email</label>
						<input
							type='email'
							className='form-control'
							value={data.user?.email}
							disabled
						/>
					</div>
					<fetcher.Form method='post'>
						<div className='form-group'>
							<label htmlFor='product'>Product </label>
							{data.productListItems.length ? (
								<select
									name='product'
									id='product'
									defaultValue={'-- Please select a product --'}
									onSelect={(e) => handleSelect}
									className='form-select'
									autoFocus
								>
									<option
										value='-- Please select a product --'
										disabled
										className='form-option-disabled'
									>
										-- Please select a product --
									</option>
									{data.productListItems.map((product) => (
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
								'No product available'
							)}
						</div>
						<div className='form-group'>
							<label htmlFor='description'>Description of the issue</label>
							<textarea
								name='description'
								id='description'
								placeholder='Description'
								className='form-textarea'
							/>
						</div>
						<div>
							{actionData?.formError ? (
								<p className='form-validation-error' role='alert'>
									{actionData.formError}
								</p>
							) : null}
						</div>
						{transition.submission ? (
							<button type='submit' className='btn form-btn' disabled>
								Adding...
							</button>
						) : (
							<button type='submit' className='btn form-btn'>
								Add
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
			<div className='container form-container'>
				<p>You must be logged in to create a ticket.</p>
				<Link to='/login?redirectTo=/tickets/new-ticket'>
					<button className='btn form-btn'>Login</button>
				</Link>
			</div>
		);
	}
	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	return (
		<div className='container form-container'>
			Something unexpected went wrong. Sorry about that.
		</div>
	);
}
