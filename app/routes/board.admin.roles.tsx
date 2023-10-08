import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData, Link, NavLink, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import { getRoles } from '~/models/roles.server';
import AdminNavBar from '~/components/AdminNavBar';
import LogoutButton from '~/components/LogoutButton';
import { MdMiscellaneousServices } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

type LoaderData = {
	roles: Awaited<ReturnType<typeof getRoles>>;
};

export const loader: LoaderFunction = async () => {
	const roles = await getRoles();

	return json<LoaderData>({ roles });
};

export const meta: MetaFunction<typeof loader> = () => {
	return [{ title: 'Support-Desk | Roles' }];
};


export default function adminRoleRoute() {
	const { roles } = useLoaderData<LoaderData>();
	return (
		<>
			<header className='container header'>
				<Link to='/board/admin/index' className='icon-header'>
					<FaTools className='icon-size icon-shadow' />
					Back to Board
				</Link>
				<AdminNavBar />
				<div className='header-flex'>
					<h1>Roles</h1>
					<LogoutButton />
				</div>
			</header>
			<main className='flex-container-2-col'>
				{roles.length ? (
					<div>
						<p className='inline-left'>
							<MdMiscellaneousServices className='icon-size icon-container' />
							<span>{roles.length}</span>&nbsp;roles
						</p>
						<nav className='nav-ul-container'>
							<ul className='nav-ul'>
								{roles.map((role) => (
									<li key={role.roleId} className='inline-between'>
										<NavLink
											to={role.roleId}
											prefetch='intent'
											className={({ isActive }) =>
												isActive ? 'active' : undefined
											}
										>
											<span>{role.roleType}</span>
										</NavLink>
										&nbsp;
										<Link
											to={`/board/admin/roles/${role.roleId}`}
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
					<p className='form-container form-content'>No role available yet</p>
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
