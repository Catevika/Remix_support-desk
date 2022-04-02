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
import { getProducts } from '~/api/products';

// TODO: Insert Meta to describe what's going on in this file through the page tab

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	products: Awaited<ReturnType<typeof db.getProducts>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}

	const products = await db.product.getProducts();

	const data: LoaderData = {
		products,
		user
	};

	return json(data);
};

function validateTicket(description: string) {
	if (!description || description.length < 3) {
		return 'Description must be at least 3 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		description: string | undefined;
	};
	fields?: {
		description: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();

	const description = form.get('description');
	if (typeof description !== 'string') {
		return badRequest({
			formError: `Ticket must be an at least 3 characters long string`
		});
	}

	const fieldErrors = {
		description: validateTicket(description)
	};

	const fields = { description };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	await db.ticket.create({
		data: { description, authorId: userId, productId: productId }
	});
	return redirect(`/roles/new-role`);
};

export default function NewRoleRoute() {
	const data = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();

	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<Form reloadDocument method='post' className='form'>
						<div className='form-group'>
							<label htmlFor='username'>New Role added by:</label>
							<input
								type='text'
								name='username'
								value={data?.user?.username}
								disabled
								className='capitalize'
							/>
						</div>
						<div className='form-group'>
							<label htmlFor='roleType'>
								New Role:{' '}
								<input
									type='text'
									defaultValue={actionData?.fields?.roleType}
									name='roleType'
									aria-invalid={Boolean(actionData?.fieldErrors?.roleType)}
									aria-errormessage={
										actionData?.fieldErrors?.roleType ? 'role-error' : undefined
									}
								/>
							</label>
							{actionData?.fieldErrors?.roleType ? (
								<p
									className='form-validation-error'
									role='alert'
									id='name-error'
								>
									{actionData.fieldErrors.roleType}
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
