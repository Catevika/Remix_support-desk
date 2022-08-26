import type { LinksFunction, MetaFunction } from '@remix-run/node';
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch
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

export const meta: MetaFunction = () => ({
	title: 'New Remix App',
	viewport: 'width=device-width,initial-scale=1'
});

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

export function CatchBoundary() {
	const caught = useCatch();

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
						<p style={{ fontSize: '3.5rem' }}>{caught.status}</p>
						<p style={{ fontSize: '3.5rem' }}>{caught.statusText}</p>
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
