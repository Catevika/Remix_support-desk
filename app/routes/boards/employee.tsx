import type { LoaderFunction } from 'remix';
import { useLoaderData, Link, json, Form } from 'remix';
import { getUser } from '~/utils/session.server';
import { FaTools, FaQuestionCircle, FaTicketAlt } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';

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

export default function Employee() {
	const data = useLoaderData<LoaderData>();
	return (
		<>
			<header className='container header'>
				<Link to='/' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Board Access
				</Link>
				<Form action='/logout' method='post'>
					<button type='submit' className='btn'>
						Logout
					</button>
				</Form>
			</header>
			<main>
				<p className='header-text'>
					<span>
						{data?.user?.username
							? `${
									data.user.username.charAt(0).toUpperCase() +
									data.user.username.slice(1)
							  }`
							: null}
					</span>
					, what do you need help with?
				</p>
			</main>
			<nav className='nav container'>
				<Link
					to='/tickets/new-ticket'
					className='btn btn-reverse btn-block nav-links'
				>
					<FaQuestionCircle className='icon-size icon-space' />
					&nbsp;Create New Ticket
				</Link>
				<Link to='/tickets' className='btn btn-block nav-links'>
					<FaTicketAlt className='icon-size icon-space' />
					&nbsp;View my Tickets
				</Link>
				<Link to='/users/me' className='btn btn-block nav-links'>
					<CgProfile className='icon-size icon-space' />
					&nbsp;View my Profile
				</Link>
			</nav>
		</>
	);
}
