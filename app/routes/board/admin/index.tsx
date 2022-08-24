import type { MetaFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, NavLink, Outlet } from '@remix-run/react';
import { requireAdminUser } from '~/utils/session.server';
import LogoutButton from '~/components/LogoutButton';
import { FaTools } from 'react-icons/fa';

export const meta: MetaFunction = () => {
	return {
		title: 'Support-Desk | Admin Board'
	};
};

type LoaderData = {
	admin: Awaited<ReturnType<typeof requireAdminUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const admin = await requireAdminUser(request);

	return json<LoaderData>({ admin });
};

export default function adminBoardRoute() {
	const { admin } = useLoaderData<LoaderData>();

	return (
		<>
			<header className='container header'>
				<FaTools className='icon-size icon-shadow' />
				<h1>Main Board</h1>
				<LogoutButton />
			</header>
			<main>
				<p className='main-text'>
					Hi&nbsp;
					<span className='capitalize'>
						{admin?.username ? admin.username : null}
					</span>
					, which database would you like to manage?
				</p>
			</main>
			<nav className='nav'>
				<ul className='nav-ul'>
					<li>
						<NavLink to='/board/admin/users/userlist'>Users</NavLink>
					</li>
					<li>
						<NavLink to='/board/admin/users/ticketlist'>Tickets</NavLink>
					</li>
					<li className='border-bottom'>
						<NavLink to='/board/admin/users/notelist'>Notes</NavLink>
					</li>
					<li>
						<NavLink to={'/board/admin/services/new-service'}>Services</NavLink>
					</li>
					<li>
						<NavLink to={'/board/admin/products/new-product'}>Products</NavLink>
					</li>
					<li>
						<NavLink to={'/board/admin/roles/new-role'}>Roles</NavLink>
					</li>
					<li>
						<NavLink to={'/board/admin/status/new-status'}>Status</NavLink>
					</li>
				</ul>
			</nav>
			<main>
				<div>
					<Outlet />
				</div>
			</main>
		</>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	return (
		<div className='error-container'>
			<div className='form-container form-container-message form-content'>
				Something unexpected went wrong. Sorry about that.
			</div>
		</div>
	);
}
