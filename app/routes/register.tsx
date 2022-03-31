import type { ActionFunction, LinksFunction, MetaFunction } from 'remix';
import {
	useActionData,
	json,
	useSearchParams,
	useTransition,
	Link,
	useFetcher
} from 'remix';

import { db } from '~/utils/db.server';
import { createUserSession, register } from '~/utils/session.server';
import { FaTools } from 'react-icons/fa';
import styles from '~/styles/form.css';
import serviceList from '~/data/serviceList.json';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: styles }];
};

export const meta: MetaFunction = () => {
	return {
		title: 'Remix Support-Desk | Register',
		description: 'Register to receive support!'
	};
};

function validateUsername(username: unknown) {
	if (typeof username !== 'string' || username.length < 3) {
		return 'Username must be at least 3 characters long';
	}
}

function validateEmail(email: unknown) {
	if (typeof email !== 'string') {
		return 'Email address is not valid';
	}
	const mailformat =
		/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
	if (email.match(mailformat) === null) {
		return 'Email address is not valid';
	}
}

function validatePassword(password: unknown) {
	if (typeof password !== 'string' || password.length < 6) {
		return 'Passwords must be at least 6 characters long';
	}
}

function validateService(service: unknown) {
	if (typeof service !== 'string' || service.length < 2) {
		return 'Service must be at least 2 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		email: string | undefined;
		username: string | undefined;
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

export const action: ActionFunction = async ({ request }) => {
	const form = await request.formData();

	let { ...values } = Object.fromEntries(form);
	const { username, email, password, service } = values;

	const redirectTo = form.get('redirectTo') || '/';
	if (!username && !email && !password && !service) {
		return null;
	} else if (
		typeof username !== 'string' ||
		typeof email !== 'string' ||
		typeof password !== 'string' ||
		typeof service !== 'string' ||
		typeof redirectTo !== 'string'
	) {
		return badRequest({ formError: 'Form not submitted correctly.' });
	}

	const fields = { username, email, password, service };
	const fieldErrors = {
		username: validateUsername(username),
		email: validateEmail(email),
		password: validatePassword(password),
		service: validateService(service)
	};
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}
	const userExists = await db.user.findUnique({
		where: { email }
	});
	if (userExists) {
		return badRequest({
			fields,
			formError: `User with email '${email}' already exists`
		});
	}
	const user = await register({
		username,
		email,
		password,
		service
	});
	if (!user || !user.id) {
		return badRequest({
			fields,
			formError: 'Something went wrong trying to create a new user.'
		});
	}
	return createUserSession(user.id, redirectTo);
};

export default function Register() {
	const fetcher = useFetcher();

	function handleSelect(selectedValue: string) {
		fetcher.submit(
			{ selected: selectedValue },
			{ method: 'post', action: '/register' }
		);
	}

	const actionData = useActionData<ActionData>();
	const [searchParams] = useSearchParams();
	const transition = useTransition();
	return (
		<>
			<header className='container header'>
				<Link to='/'>
					<FaTools className='icon-size icon-shadow icon-linked icon-header' />
				</Link>
				<h1>Welcome to your Support-Desk!</h1>
			</header>
			<div className='form-container'>
				<div className='form-content'>
					<fetcher.Form method='post' className='form'>
						<input
							type='hidden'
							name='redirectTo'
							value={searchParams.get('redirectTo') ?? undefined}
						/>
						<h2>Register</h2>
						<div className='form-group'>
							<label htmlFor='username-input'>Username</label>
							<input
								type='text'
								id='name-input'
								name='username'
								autoComplete='name'
								defaultValue={actionData?.fields?.username}
								aria-invalid={Boolean(actionData?.fieldErrors?.username)}
								aria-errormessage={
									actionData?.fieldErrors?.username
										? 'username-error'
										: undefined
								}
								autoFocus
							/>
							{actionData?.fieldErrors?.username ? (
								<p
									className='form-validation-error'
									role='alert'
									id='username-error'
								>
									{actionData.fieldErrors.username}
								</p>
							) : null}
						</div>
						<div className='form-group'>
							<label htmlFor='email-input'>Email</label>
							<input
								type='email'
								id='email-input'
								name='email'
								autoComplete='email'
								defaultValue={actionData?.fields?.email}
								aria-invalid={Boolean(actionData?.fieldErrors?.email)}
								aria-errormessage={
									actionData?.fieldErrors?.email ? 'email-error' : undefined
								}
							/>
							{actionData?.fieldErrors?.email ? (
								<p
									className='form-validation-error'
									role='alert'
									id='email-error'
								>
									{actionData.fieldErrors.email}
								</p>
							) : null}
						</div>
						<div className='form-group'>
							<label htmlFor='password-input'>Password</label>
							<input
								id='password-input'
								name='password'
								autoComplete='current-password'
								defaultValue={actionData?.fields?.password}
								type='password'
								aria-invalid={Boolean(actionData?.fieldErrors?.password)}
								aria-errormessage={
									actionData?.fieldErrors?.password
										? 'password-error'
										: undefined
								}
							/>
							{actionData?.fieldErrors?.password ? (
								<p
									className='form-validation-error'
									role='alert'
									id='password-error'
								>
									{actionData.fieldErrors.password}
								</p>
							) : null}
						</div>
						<div id='form-error-message'>
							{actionData?.formError ? (
								<p className='form-validation-error' role='alert'>
									{actionData.formError}
								</p>
							) : null}
						</div>
						<div className='form-group'>
							<label htmlFor='service'>Service </label>
							{serviceList.services.length ? (
								<select
									name='service'
									id='service'
									defaultValue='-- Please select your service --'
									onSelect={(e) => handleSelect}
									className='form-select'
								>
									<option
										defaultValue='-- Please select your service --'
										disabled
										className='form-option-disabled'
									>
										-- Please select your service --
									</option>
									{serviceList.services.map((service) => (
										<option
											key={service.id}
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
							{actionData?.fieldErrors?.service ? (
								<p
									className='form-validation-error'
									role='alert'
									id='service-error'
								>
									{actionData.fieldErrors.service}
								</p>
							) : null}
						</div>
						{transition.submission ? (
							<button type='submit' className='btn form-btn' disabled>
								Registering...
							</button>
						) : (
							<button type='submit' className='btn form-btn'>
								Register
							</button>
						)}
					</fetcher.Form>
				</div>
			</div>
		</>
	);
}
