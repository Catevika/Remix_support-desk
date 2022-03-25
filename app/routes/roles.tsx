import type { LoaderFunction } from 'remix';
import { Outlet, useLoaderData, Link, json } from 'remix';
import { db } from '~/utils/db.server';
import { getUser } from '~/utils/session.server';
import { MdMiscellaneousServices } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	roleListItems: Array<{ roleId: string; roleType: string }>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);

	const roleListItems = user
		? await db.role.findMany({
				take: 10,
				select: { roleId: true, roleType: true },
				orderBy: { roleType: 'desc' }
		  })
		: [];

	const data: LoaderData = {
		roleListItems,
		user
	};

	return json(data);
};

/* TODO: change the Link to='/boards when Model Board created with authorId referred link */
/* TODO: Add a pagination to service list  */
/* TODO: Voir comment faire tri desc alphabetic order  */

export default function RolesRoute() {
	const data = useLoaderData<LoaderData>();
	return (
		<>
			<header className='container header'>
				<Link to='/boards' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Boards
				</Link>
				<h1>Create New Role</h1>
			</header>
			<main className='grid-container'>
				{data.roleListItems.length ? (
					<>
						<div className='form-content'>
							<MdMiscellaneousServices className='icon-size icon-container' />
							<p>Available roles:</p>
							<ul>
								{data.roleListItems.map(({ roleId, roleType }) => (
									<li key={roleId}>
										<Link to={roleId} prefetch='intent'>
											{roleType}
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
