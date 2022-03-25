import type { LoaderFunction, LinksFunction } from 'remix';
import { Form, Link, json, useLoaderData } from 'remix';
import { getUser } from '~/utils/session.server';
import { RiDashboardLine } from 'react-icons/ri';
import { FaTools } from 'react-icons/fa';
import styles from '~/styles/index.css';
import url from '~/assets/wave.svg';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: styles }];
};

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);

	const data: LoaderData = {
		user
	};

	return json(data);
};

/* TODO: Remplacer par un dashboard outlet quand model Board created */

export default function Welcome() {
	const data = useLoaderData<LoaderData>();
	return (
		<>
			{data.user ? (
				<>
					<header className='container header'>
						<FaTools className='icon-size icon-shadow' />
						<Form action='/logout' method='post'>
							<button type='submit' className='btn'>
								Logout
							</button>
						</Form>
					</header>
					<main>
						<p className='header-text'>
							Hi{' '}
							<span>{`${
								data.user.username.charAt(0).toUpperCase() +
								data.user.username.slice(1)
							}`}</span>
						</p>
					</main>
					<nav className='nav container'>
						<RiDashboardLine className='icon-container' />
						<h1 className='uppercase'>Board access</h1>
						<ul className='nav-links'>
							<div className='links'>
								<Link to='/boards/admin'>
									<li>
										Administrator<em>&nbsp;restricted</em>
									</li>
								</Link>
								<Link to='/boards/tech'>
									<li>
										Technician<em>&nbsp;restricted</em>
									</li>
								</Link>
								<Link to='/boards/employee'>
									<li>Employee</li>
								</Link>
							</div>
						</ul>
					</nav>
				</>
			) : (
				<>
					<header className='container header header-left'>
						<h1>Welcome to your Support-Desk!</h1>
					</header>
					<main className='main'>
						<img src={url} alt='' className='background-image' />
						<Form action='/login' method='post' className='form container'>
							<p>
								Already have an account:&nbsp;
								<button type='submit' className='btn'>
									Login
								</button>
							</p>
						</Form>
						<FaTools className='icon-large' />
						<Form action='/register' method='post' className='form container'>
							<p>
								Else, create a new account:&nbsp;
								<button type='submit' className='btn'>
									Register
								</button>
							</p>
						</Form>
					</main>
				</>
			)}
		</>
	);
}
