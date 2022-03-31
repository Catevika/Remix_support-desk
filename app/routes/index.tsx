import type { LoaderFunction } from 'remix';
import { Form, Link, json, useLoaderData } from 'remix';
import { getUser } from '~/utils/session.server';
import { RiDashboardLine } from 'react-icons/ri';
import { FaTools } from 'react-icons/fa';
import url from '~/assets/wave.svg';

// TODO: Insert Meta to describe what's going on in this file through the page tab

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
						<p className='main-text'>
							Hi <span className='capitalize'>{data.user.username}</span>
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
						<Form action='/register' method='post' className='form container'>
							<p>
								<button type='submit' className='btn'>
									Register
								</button>
								&nbsp; for free to get your access
							</p>
						</Form>
						<div className='icon-large-container'>
							<FaTools className='icon-large' />
						</div>
						<Form action='/login' method='post' className='form container'>
							<p>
								<button type='submit' className='btn'>
									Login
								</button>
								&nbsp; with email and password
							</p>
						</Form>
					</main>
				</>
			)}
		</>
	);
}
