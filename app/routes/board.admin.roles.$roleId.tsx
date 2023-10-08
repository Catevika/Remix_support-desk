import type {
	MetaFunction,
	LoaderFunction,
	ActionFunction
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	Form,
	Link,
	useLoaderData,
	useActionData,
	useNavigation,
	useRouteError,
	isRouteErrorResponse
} from '@remix-run/react';

import { requireUserId, getUser } from '~/utils/session.server';
import { prisma } from '~/utils/db.server';
import { validateRole } from '~/utils/functions';
import { deleteRole, getRole } from '~/models/roles.server';

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	role: Awaited<ReturnType<typeof getRole>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const user = await getUser(request);

	if (!user || user.service !== 'Information Technology') {
		throw new Response('Unauthorized', { status: 401 });
	}

	if (params.roleId === 'new-role') {
		const data: LoaderData = {
			user,
			role: null
		};

		return data;
	} else {
		const role = await getRole(params.roleId);

		const data: LoaderData = {
			user,
			role
		};

		return data;
	}
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [{ title: 'No role' }];
	} else {
		return [{ title: 'Support Desk | Roles' }];
	}
};

type ActionData = {
	formError?: string;
	fieldErrors?: {
		roleType: string | undefined;
	};
	fields?: {
		roleType: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request, params }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();
	const roleType = form.get('roleType');

	if (typeof roleType !== 'string') {
		return badRequest({
			formError: `Role must be an at least 3 characters long string`
		});
	}

	const intent = form.get('intent');

	if (intent === 'delete') {
		await deleteRole(params.roleId);
		return redirect('/board/admin/roles/new-role');
	}

	const fieldErrors = {
		roleType: validateRole(roleType)
	};

	const fields = { roleType };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const roleExists = await prisma.role.findUnique({
		where: { roleType }
	});

	if (roleExists) {
		return badRequest({
			fields,
			formError: `Role '${roleType}' already exists`
		});
	}

	if (params.roleId === 'new-role') {
		await prisma.role.create({
			data: { roleType, authorId: userId }
		});
	} else {
		await prisma.role.update({
			data: { roleType },
			where: { roleId: params.roleId }
		});
	}

	return redirect('/board/admin/roles/new-role');
};

export default function adminRoleRoute() {
	const data = useLoaderData<LoaderData>();
	const user = data.user;

	const actionData = useActionData() as ActionData;
	const navigation = useNavigation();

	const isNewRole = !data.role?.roleType;
	const isAdding = Boolean(
		navigation.formData?.get('intent') === 'create'
	);
	const isUpdating = Boolean(
		navigation.formData?.get('intent') === 'update'
	);
	const isDeleting = Boolean(
		navigation.formData?.get('intent') === 'delete'
	);

	return (
		<>
			<main className='form-scroll-main'>
				<div className='form-scroll'>
					<Form
						reloadDocument
						method='post'
						key={data.role?.roleId ?? 'new-role'}
					>
						<p>
							{isNewRole ? 'New' : null}&nbsp;Role from:
							<span className='capitalize'>&nbsp;{user?.username}&nbsp;</span> -
							Email:<span>&nbsp;{user?.email}</span>
						</p>
						<div className='form-content'>
							<div className='form-group'>
								<label htmlFor='roleType'>
									{isNewRole ? 'New' : null}&nbsp;Role:{' '}
									<input
										type='text'
										defaultValue={data.role?.roleType}
										name='roleType'
										aria-errormessage={
											actionData?.fieldErrors?.roleType
												? 'role-error'
												: undefined
										}
									/>
								</label>
								{actionData?.fieldErrors?.roleType ? (
									<p className='error-danger' role='alert' id='role-error'>
										{actionData.fieldErrors.roleType}
									</p>
								) : null}
							</div>
							<div>
								{actionData?.formError ? (
									<p className='error-danger' role='alert'>
										{actionData.formError}
									</p>
								) : null}
								{data.role ? (
									<>
										<div className='form-group inline'>
											<label>
												Created at:&nbsp;
												<input
													type='text'
													id='createdAt'
													name='createdAt'
													defaultValue={new Date(
														data.role.createdAt
													).toLocaleString('en-us', {
														month: '2-digit',
														day: '2-digit',
														year: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false
													})}
												/>
											</label>
											<label>
												Updated at:&nbsp;
												<input
													type='text'
													id='updatedAt'
													name='updatedAt'
													defaultValue={new Date(
														data.role.updatedAt
													).toLocaleString('en-us', {
														month: '2-digit',
														day: '2-digit',
														year: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false
													})}
												/>
											</label>
										</div>
									</>
								) : null}
								<div className='inline'>
									<button
										type='submit'
										name='intent'
										value={isNewRole ? 'create' : 'update'}
										className='btn form-btn'
										disabled={isAdding || isUpdating}
									>
										{isNewRole ? (isAdding ? 'Adding...' : 'Add') : null}
										{isNewRole ? null : isUpdating ? 'Updating...' : 'Update'}
									</button>
									{isNewRole ? null : (
										<Link to='/board/admin/roles/new-role'>
											<button className='btn form-btn'>Back to New Role</button>
										</Link>
									)}
									{isNewRole ? null : (
										<button
											type='submit'
											name='intent'
											value='delete'
											className='btn form-btn btn-danger'
											disabled={isDeleting}
										>
											{isDeleting ? 'isDeleting...' : 'Delete'}
										</button>
									)}
								</div>
							</div>
						</div>
					</Form>
				</div>
			</main>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	if (isRouteErrorResponse(error)) {
		if (error.status === 401) {
			return (
				<div className='error-container'>
					<div className='form-container form-content'>
						<p>
							You must be logged in with administrator rights to create a role.
						</p>
						<Link to='/login?redirectTo=/board/admin/roles/new-role'>
							<button className='btn form-btn'>Login</button>
						</Link>
					</div>
				</div>
			);
		} else {
			return (
				<div className='error-container'>
					<div className='form-container form-container-message form-content'>
						Something unexpected went wrong. Sorry about that.
					</div>
					<p>Status: {error.status}</p>
					<p>{error.data.message}</p>
				</div>
			);
		}
	}
}
