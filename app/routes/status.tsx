import type { LoaderFunction } from 'remix';
import type { Status } from '~/utils/status.server';
import { Outlet, useLoaderData, Link, useCatch } from 'remix';
import { getStatuses } from '~/utils/status.server';
import { SiStatuspage } from 'react-icons/si';
import { FaTools } from 'react-icons/fa';

export const loader: LoaderFunction = async () => {
	return getStatuses();
};

/* TODO: change the Link to='/boards when Model Board created with authorId referred link */
/* TODO: Add a pagination to status list  */
// TODO: Add a search field to status list

export default function RolesRoute() {
	const statuses = useLoaderData<Status[]>();
	return (
		<>
			<header className='container header'>
				<Link to='/boards' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Boards
				</Link>
				<h1>Create New Status</h1>
			</header>
			<main className='grid-container'>
				{statuses.length ? (
					<>
						<div className='form-content'>
							<SiStatuspage className='icon-size icon-container' />
							<p>Available status:</p>
							<ul>
								{statuses.map((status) => (
									<li key={status.statusId}>
										<Link to={status.statusId} prefetch='intent'>
											{status.type}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</>
				) : null}
				<div>
					<div>
						<Outlet />
					</div>
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
					<Link to='/login?redirectTo=/sratus/new-status'>
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
