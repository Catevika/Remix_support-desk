import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix';
import {
	Form,
	Link,
	json,
	useLoaderData,
	useActionData,
	redirect,
	useCatch
} from 'remix';

import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';

export const meta: MetaFunction = () => {
	return {
		title: 'Remix Support-Desk | Status',
		description: 'Create a new status!'
	};
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

function validateStatus(type: string) {
	if (!type || type.length < 3) {
		return 'Status must be at least 3 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		type: string | undefined;
	};
	fields?: {
		type: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();
	const type = form.get('type');
	if (typeof type !== 'string') {
		return badRequest({
			formError: `Type must be an at least 3 characters long string`
		});
	}

	const fieldErrors = {
		type: validateStatus(type)
	};

	const fields = { type };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const typeExists = await db.status.findUnique({
		where: { type }
	});

	if (typeExists) {
		return badRequest({
			fields,
			formError: `Status '${type}' already exists`
		});
	}

	await db.status.create({
		data: { type, technicianId: userId }
	});
	return redirect(`/status/new-status`);
};

export default function NewStatusRoute() {
	const data = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();

	return (
		<>
			<main className='form-container'>
				<div className='form-content'>
					<Form reloadDocument method='post' className='form'>
						<p className='list'>
							New Status from&nbsp;
							<span className='capitalize'>{data?.user?.username}</span>
						</p>
						<div className='form-group'>
							<label htmlFor='type'>
								New Status:{' '}
								<input
									type='text'
									defaultValue={actionData?.fields?.type}
									name='type'
									aria-invalid={Boolean(actionData?.fieldErrors?.type)}
									aria-errormessage={
										actionData?.fieldErrors?.type ? 'type-error' : undefined
									}
								/>
							</label>
							{actionData?.fieldErrors?.type ? (
								<p
									className='error-danger'
									role='alert'
									id='type-error'
								>
									{actionData.fieldErrors.type}
								</p>
							) : null}
						</div>
						<div>
							{actionData?.formError ? (
								<p className='error-danger' role='alert'>
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
					<p>You must be logged in to create a status.</p>
					<Link to='/login?redirectTo=/statuss/new-status'>
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
