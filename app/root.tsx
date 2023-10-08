import type { LinksFunction, MetaFunction } from '@remix-run/node';
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
	isRouteErrorResponse
} from '@remix-run/react';

import url from '~/assets/catevika.png';

import appStyles from '~/styles/app.css';
import formStyles from '~/styles/form.css';

export const links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: appStyles },
		{ rel: 'stylesheet', href: formStyles }
	];
};

export const meta: MetaFunction = () => {
	return [
		{ title: 'New Remix App' },
		{ viewport: 'width=device-width,initial-scale=1' }];
};

export default function App() {
	return (
		<html lang='en'>
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	// when true, this is what used to go to `CatchBoundary`
	if (isRouteErrorResponse(error)) {
		return (
			<html>
				<head>
					<title>Oops!</title>
					<Meta />
					<Links />
				</head>
				<body>
					<div className='form-group'>
						<div className='container'>
							<p style={{ fontSize: '3.5rem' }}>Ooops!</p>
							<p style={{ fontSize: '3.5rem' }}>Status: {error.status}</p>
							<p style={{ fontSize: '3.5rem' }}>{error.data.message}</p>
							<img src={url} alt='' style={{ maxWidth: '320px' }} />
						</div>
						<div className='container'>
							<Link to='/'>
								<button type='button' className='btn form-btn'>Back Home</button>
							</Link>
						</div>
					</div>
					<Scripts />
				</body>
			</html>
		);
	}
}

