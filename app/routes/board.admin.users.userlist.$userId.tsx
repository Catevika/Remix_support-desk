import {
	LoaderFunction,
	ActionFunction,
	MetaFunction,
	redirect
} from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	Link,
	useLoaderData,
	useParams,
	useActionData,
	useSearchParams,
	useFetcher,
	useRouteError,
	isRouteErrorResponse
} from '@remix-run/react';
import {
	createUserSession,
	deleteUserById,
	updateUser
} from '~/utils/session.server';
import { getUserById } from '~/models/users.server';
import { FaTools } from 'react-icons/fa';
import { getServices } from '~/models/services.server';
import {
	safeRedirect,
	validateEmail,
	validatePassword,
	validateService,
	validateUsername
} from '~/utils/functions';
import LogoutButton from '~/components/LogoutButton';

type LoaderData = {
	user: Awaited<ReturnType<typeof getUserById>>;
	services: Awaited<ReturnType<typeof getServices>>;
};

export const loader: LoaderFunction = async ({ params }) => {
	const userId = params.userId;

	if (!userId) {
		throw new Response('User Not Found.', {
			status: 404
		});
	}

	const user = await getUserById(userId);

	if (!user) {
		throw new Response('User Not Found.', {
			status: 404
		});
	}

	const services = await getServices();

	return json<LoaderData>({ user, services });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [{ title: 'No user' }];
	}
	return [{ title: 'Support Desk | User' }];
};

type ActionData = {
	formError?: string;
	fieldErrors?: {
		username: string | undefined;
		email: string | undefined;
		password: string | undefined;
		service: string | undefined;
	};
	fields?: {
		username: string;
		email: string;
		password: string;
		service: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request, params }) => {
	const form = await request.formData();
	if (!params || !params.userId) {
		return null;
	}
	const user = await getUserById(params.userId);

	const username = form.get('username');
	const email = form.get('email');
	const password = form.get('password');
	const service = form.get('service');

	let redirectTo = safeRedirect(
		form.get('redirectTo') || `/board/admin/users/userlist/index`
	);

	if (!user || (!username && !email && !password && !service)) {
		return null;
	}

	if (
		typeof username !== 'string' ||
		typeof email !== 'string' ||
		typeof password !== 'string' ||
		typeof service !== 'string' ||
		typeof redirectTo !== 'string'
	) {
		return badRequest({ formError: 'Form not submitted correctly.' });
	}

	const fieldErrors = {
		username: validateUsername(username),
		email: validateEmail(email),
		password: validatePassword(password),
		service: validateService(service)
	};

	const fields = { username, email, password, service };

	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const userId = params.userId;
	if (!userId) {
		throw new Response('User Not Found.', {
			status: 404
		});
	}

	if (form.get('intent') !== 'update' && form.get('intent') !== 'delete') {
		throw new Response(`The intent ${form.get('intent')} is not supported`, {
			status: 403
		});
	}

	if (form.get('intent') === 'update') {
		await updateUser({ id: userId, username, email, password, service });
		return createUserSession(userId, redirectTo);
	}

	if (form.get('intent') === 'delete') {
		await deleteUserById(request, userId);
		return redirect('/');
	}
};

export default function adminUserIdRoute() {
	const { user, services } = useLoaderData<LoaderData>();
	const actionData = useActionData() as ActionData;
	const [searchParams] = useSearchParams();
	const fetcher = useFetcher();

	function handleSelect(selectedValue: string) {
		fetcher.submit(
			{ selected: selectedValue },
			{ method: 'post', action: '/update' }
		);
	}

	const isUpdating = Boolean(
		fetcher.formData?.get('intent') === 'update'
	);
	const isDeleting = Boolean(
		fetcher.formData?.get('intent') === 'delete'
	);

	const subject = 'URGENT - Password Reset';

	const body =
		'Your password has been reset to 123456 following modifications of your user profile data. Please customize it as soon as possible.   Your support desk technician.';

	return (
		<>
			<header className='container header'>
				<Link to='/board/admin/users/userlist/index' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Users
				</Link>
				<div className='header-flex'>
					<p>User Profile</p>
					<LogoutButton />
				</div>
			</header>
			{user ? (
				<main className='form-container-center'>
					<div className='form-content'>
						<fetcher.Form
							method='post'
							className='form'
							key={user?.id}
						>
							<input
								type='hidden'
								name='redirectTo'
								value={searchParams.get('redirectTo') ?? undefined}
							/>
							<div className='form-group'>
								<label htmlFor='username-input'>
									Username
									<input
										type='text'
										id='username-input'
										name='username'
										autoComplete='name'
										defaultValue={user.username}
										aria-errormessage={
											actionData?.fieldErrors?.username
												? 'username-error'
												: undefined
										}
										autoFocus
									/>
								</label>
								{actionData?.fieldErrors?.username ? (
									<p className='error-danger' role='alert' id='username-error'>
										{actionData.fieldErrors.username}
									</p>
								) : null}
							</div>
							<div className='form-group'>
								<label htmlFor='email-input'>
									Email
									<input
										type='email'
										id='email-input'
										name='email'
										autoComplete='email'
										defaultValue={user.email}
										aria-errormessage={
											actionData?.fieldErrors?.email ? 'email-error' : undefined
										}
									/>
								</label>
								{actionData?.fieldErrors?.email ? (
									<p className='error-danger' role='alert' id='email-error'>
										{actionData.fieldErrors.email}
									</p>
								) : null}
							</div>
							<div className='form-group'>
								<label htmlFor='password-input'>
									Password
									<input
										type='password'
										id='password-input'
										name='password'
										defaultValue={''}
										autoComplete='new-password'
										aria-errormessage={
											actionData?.fieldErrors?.password
												? 'password-error'
												: undefined
										}
									/>
								</label>
								{actionData?.fieldErrors?.password ? (
									<p className='error-danger' role='alert' id='password-error'>
										{actionData.fieldErrors.password}
									</p>
								) : null}
							</div>
							<div className='form-group'>
								<label htmlFor='service-select'>
									Service
									{services.length ? (
										<select
											name='service'
											id='service-select'
											defaultValue={user.service}
											onSelect={(e) => handleSelect}
											className='form-select'
										>
											<option
												defaultValue='- Select your service -'
												disabled
												className='form-option-disabled'
											>
												- Select your service -
											</option>
											{services.map((service) => (
												<option
													key={service.serviceId}
													value={service.name}
													className='form-option'
												>
													{service.name}
												</option>
											))}
										</select>
									) : (
										'No service available'
									)}
								</label>
								{actionData?.fieldErrors?.service ? (
									<p className='error-danger' role='alert' id='service-error'>
										{actionData.fieldErrors.service}
									</p>
								) : null}
							</div>
							<div id='form-error-message'>
								{actionData?.formError ? (
									<p className='error-danger' role='alert'>
										{actionData.formError}
									</p>
								) : null}
							</div>
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
								<Link to='/board/admin/users/userlist/index'>
									<button className='btn'>Back to User List</button>
								</Link>
								<button
									type='submit'
									name='intent'
									value='delete'
									className='btn  btn-danger'
									disabled={isDeleting}
								>
									{isDeleting ? 'isDeleting...' : 'Delete'}
								</button>
							</div>
						</fetcher.Form>
						<div className='form-group'>
							<ul className='danger'>
								<li>If you update these user profile data:</li>
								<li>
									change the password to <span>123456</span> and
								</li>
								<li>
									send this{' '}
									<a
										href={`mailto:${user.email}?subject=${subject}&body=${body}`}
									>
										<span>email</span>
									</a>{' '}
									to the user.
								</li>
							</ul>
						</div>
					</div>
				</main>
			) : null}
		</>
	);
}

export function ErrorBoundary() {
	const { userId } = useParams();
	const error = useRouteError();
	if (isRouteErrorResponse(error)) {
		switch (error.status) {
			case 403: {
				return (
					<div className='error-container' style={{ fontSize: '1.5rem' }}>
						<div className='form-container form-container-message form-content'>
							<p>This action is not supported</p>
							<Link to={`/board/admin/users/userlist/${userId}`}>
								<button className='btn form-btn'>Back to Profile</button>
							</Link>
						</div>
					</div>
				);
			}

			case 404: {
				return (
					<div className='error-container'>
						<div className='form-container form-content'>
							{userId} does not exist.
						</div>
					</div>
				);
			}
			default: {
				return (
					<div className='error-container' style={{ fontSize: '1.5rem' }}>
						<div className='form-container form-container-message form-content'>
							<p>
								To{' '}
								<span className='error-danger error-danger-big'>
									delete an Account:
								</span>
							</p>
							<p>first delete its tickets and their associated notes,</p>
							<p>then come back to the user profile</p>
							<p>and click the delete button.</p>
							<p>OR</p>
							<p>delete the user via the database.</p>
							<p>
								<span className='error-danger error-danger-big'>
									These actions are permanent.
								</span>
							</p>
							<Link to='/board/admin/users/userlist/index'>
								<button className='btn form-btn'>Back to User List</button>
							</Link>
						</div>
						<p>Status: {error.status}</p>
						<p>{error.data.message}</p>
					</div>
				);
			}
		}
	}
}
