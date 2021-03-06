import type { LoaderFunction } from 'remix';
import type { Role } from '@prisma/client';
import { Outlet, useLoaderData, Link, useCatch } from 'remix';
import { getRoles } from '~/utils/roles.server';
import { MdMiscellaneousServices } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

export const loader: LoaderFunction = async () => {
	return getRoles();
};

/* TODO: change the Link to='/boards when Model Board created with authorId referred link */
/* TODO: Add a pagination to role list  */
/* TODO: Voir si j'ajoute le user comme dans products  */
// TODO: Add a search field to role list

export default function RolesRoute() {
	const roles = useLoaderData<Role[]>();
	return (
		<>
			<header className='container header'>
				<Link to='/boards' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Boards
				</Link>
				<h1>Create New Role</h1>
			</header>
			<main className='grid-container'>
				{roles.length ? (
					<>
						<div className='form-content'>
							<MdMiscellaneousServices className='icon-size icon-container' />
							<p>Available roles:&nbsp;<span>{roles.length}</span></p>
							<ul>
								{roles.map((role) => (
									<li key={role.roleId}>
										<Link to={role.roleId} prefetch='intent'>
											{role.roleType}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</>
				) : "No roles available yet."}
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
					<p>You must be logged in to create a role.</p>
					<Link to='/login?redirectTo=/roles/new-role'>
						<button className='btn form-btn'>Login</button>
					</Link>
				</div>
			</div>
		);
	}
	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error; }) {
	console.error(error);
	return (
		<div className='error-container'>
			<div className='form-container form-content'>
				Something unexpected went wrong. Sorry about that.
			</div>
		</div>
	);
}
