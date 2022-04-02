import {
	json,
	LoaderFunction,
	ActionFunction,
	redirect,
	useCatch
} from 'remix';
import { Form, Link, useLoaderData, useActionData } from 'remix';

import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';

// TODO: Insert Meta to describe what's going on in this file through the page tab

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
		return 'Product must be at least 3 characters long';
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
			formError: `Product must be an at least 3 characters long string`
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

	await db.product.create({
		data: { device, authorId: userId }
	});
	return redirect(`/products/new-product`);
};

export default function NewProductRoute() {
	const data = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();

	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<Form reloadDocument method='post' className='form'>
						<div className='form-group'>
							<label htmlFor='username'>New Product added by</label>
							<input
								type='text'
								name='username'
								value={data?.user?.username}
								disabled
								className='capitalize'
							/>
						</div>
						<div className='form-group'>
							<label htmlFor='device'>
								New Product:{' '}
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
							<button type='submit' className='btn form-btn'>
								Add
							</button>
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
			<div className='error-container'>
				<div className='form-container form-content'>
					<p>You must be logged in to add a new product.</p>
					<Link to='/login?redirectTo=/products/new-product'>
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
