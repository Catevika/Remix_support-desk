import type { LoaderFunction } from 'remix';
import { useLoaderData, Link, json, Form, useCatch } from 'remix';
import { getUser } from '~/utils/session.server';
import { FaTools, FaQuestionCircle, FaTicketAlt } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';

// TODO: Insert Meta to describe what's going on in this file through the page tab

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
				<p className='main-text'>
					<span className='capitalize'>
						{data?.user?.username ? data.user.username : null}
					</span>
					, what do you need help with?
				</p>
			</main>
			{data.user ? (
				<nav className='nav'>
					<ul>
						<li>
							<Link
								to='/tickets/new-ticket'
								className='btn btn-reverse btn-block nav-links'
							>
								<FaQuestionCircle className='icon-size icon-space' />
								&nbsp;Create New Ticket
							</Link>
						</li>
						<li>
							<Link to='/tickets' className='btn btn-block nav-links'>
								<FaTicketAlt className='icon-size icon-space' />
								&nbsp;View my Tickets
							</Link>
						</li>
						<li>
							<Link
								to={`/users/${data.user.id}`}
								className='btn btn-block nav-links'
							>
								<CgProfile className='icon-size icon-space' />
								&nbsp;View my Profile
							</Link>
						</li>
					</ul>
				</nav>
			) : null}
		</>
	);
}

export function CatchBoundary() {
	const caught = useCatch();

	if (caught.status === 401) {
		return (
			<div className='error-container'>
				<div className='form-container form-content'>
					<p>You must be logged in to access this board.</p>
					<Link to='/login?redirectTo=/boards/employee'>
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
