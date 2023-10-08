import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData, Link, NavLink, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import { getStatuses } from '~/models/status.server';
import AdminNavBar from '~/components/AdminNavBar';
import LogoutButton from '~/components/LogoutButton';
import { SiStatuspage } from 'react-icons/si';
import { FaTools } from 'react-icons/fa';

type LoaderData = {
	statuses: Awaited<ReturnType<typeof getStatuses>>;
};

export const loader: LoaderFunction = async () => {
	const statuses = await getStatuses();
	return json<LoaderData>({ statuses });
};

export const meta: MetaFunction<typeof loader> = () => {
	return [{ title: 'Support-Desk | Status' }];
};

export default function adminStatusRoute() {
	const { statuses } = useLoaderData<LoaderData>();
	return (
		<>
			<header className='container header'>
				<Link to='/board/admin/index' className='icon-header'>
					<FaTools className='icon-size icon-shadow' />
					Back to Board
				</Link>
				<AdminNavBar />
				<div className='header-flex'>
					<h1>Status</h1>
					<LogoutButton />
				</div>
			</header>
			<main className='flex-container-2-col'>
				{statuses.length ? (
					<div>
						<p className='inline-left'>
							<SiStatuspage className='icon-size icon-container' />
							<span>{statuses.length}</span>&nbsp;status
						</p>
						<nav className='nav-ul-container'>
							<ul className='nav-ul'>
								{statuses.map((status) => (
									<li key={status.statusId} className='inline-between'>
										<NavLink
											to={status.statusId}
											prefetch='intent'
											className={({ isActive }) =>
												isActive ? 'active' : undefined
											}
										>
											<span>{status.type}</span>
										</NavLink>
										&nbsp;
										<Link
											to={`/board/admin/status/${status.statusId}`}
											className='view'
										>
											View
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</div>
				) : (
					<p className='form-container form-content'>No status available yet</p>
				)}
				<div>
					<Outlet />
				</div>
			</main>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	if (isRouteErrorResponse(error)) {
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
