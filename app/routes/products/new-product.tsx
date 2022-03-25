import {
	json,
	LinksFunction,
	LoaderFunction,
	ActionFunction,
	redirect,
	useTransition,
	useCatch
} from 'remix';
import { Form, Link, useLoaderData, useActionData } from 'remix';
import ProductDisplay from '~/components/Product';

import stylesUrl from '~/styles/form.css';
import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}
	const data: LoaderData = {
		user
	};

	return json(data);
};

function validateProduct(device: string) {
	if (!device || device.length < 3) {
		return 'Device must be at least 3 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		device: string | undefined;
	};
	fields?: {
		device: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();
	const device = form.get('device');
	if (typeof device !== 'string') {
		return badRequest({
			formError: `Device must be an at least 3 characters long string`
		});
	}

	const fieldErrors = {
		device: validateProduct(device)
	};

	const fields = { device };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const productExists = await db.product.findUnique({
		where: { device }
	});

	if (productExists) {
		return badRequest({
			fields,
			formError: `Product '${device}' already exists`
		});
	}

	const product = await db.product.create({
		data: { device, authorId: userId }
	});
	return redirect(`/products/${product.productId}`);
};

export default function NewProductRoute() {
	const data = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();
	const transition = useTransition();

	if (transition.submission) {
		const username = transition.submission.formData.get('username');
		const device = transition.submission.formData.get('device');
		if (
			typeof username === 'string' &&
			typeof device === 'string' &&
			!validateProduct(device)
		) {
			return (
				<>
					<p>Product created by: {username}</p>
					<ProductDisplay device={device} isOwner={true} canDelete={false} />
				</>
			);
		}
	}

	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<Form method='post' className='form'>
						<div className='form-group'>
							<label htmlFor='username'>Product added by:</label>
							<input
								type='text'
								name='username'
								value={data?.user?.username}
								disabled
							/>
						</div>
						<div className='form-group'>
							<label htmlFor='device'>
								Device:{' '}
								<input
									type='text'
									defaultValue={actionData?.fields?.device}
									name='device'
									aria-invalid={Boolean(actionData?.fieldErrors?.device)}
									aria-errormessage={
										actionData?.fieldErrors?.device
											? 'product-error'
											: undefined
									}
								/>
							</label>
							{actionData?.fieldErrors?.device ? (
								<p
									className='form-validation-error'
									role='alert'
									id='name-error'
								>
									{actionData.fieldErrors.device}
								</p>
							) : null}
						</div>
						<div>
							{actionData?.formError ? (
								<p className='form-validation-error' role='alert'>
									{actionData.formError}
								</p>
							) : null}
							{transition.submission ? (
								<button type='submit' className='btn form-btn'>
									Adding new product to the database...
								</button>
							) : (
								<button type='submit' className='btn form-btn'>
									Add
								</button>
							)}
						</div>
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
			<div className='container form-container'>
				<p>You must be logged in to create a product.</p>
				<Link to='/login?redirectTo=/products/new-product'>
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
