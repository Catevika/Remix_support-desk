import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	Form,
	Link,
	useLoaderData,
	useLocation,
	useSearchParams
} from '@remix-run/react';
import { FaSearch, FaTools } from 'react-icons/fa';
import AdminNavBar from '~/components/AdminNavBar';
import LogoutButton from '~/components/LogoutButton';
import { RiUserSearchLine } from 'react-icons/ri';

import { getUsers, getUsersBySearchTerm } from '~/models/users.server';
import { useEffect, useRef } from 'react';

type LoaderData = {
	users: Awaited<ReturnType<typeof getUsers>>;
	getUsersBySearchTerm: Awaited<ReturnType<typeof getUsersBySearchTerm>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url);
	const query = url.searchParams.get('query'.toLowerCase());
	const users = query ? await getUsersBySearchTerm(query) : await getUsers();
	return json({ users });
};

export default function adminUserListRoute() {
	const { users } = useLoaderData<LoaderData>();
	const [params] = useSearchParams();
	const location = useLocation();
	const query = params.get('query'.toLowerCase());

	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (query) {
			formRef.current?.reset();
		}
	}, [query]);

	return (
		<>
			<header className='container header'>
				<Link to='/board/admin' className='icon-header'>
					<FaTools className='icon-size icon-shadow' />
					Back to Board
				</Link>
				<AdminNavBar />
				<div className='header-flex'>
					<h1>Users</h1>
					<LogoutButton />
				</div>
			</header>
			<main className='container'>
				<p className='inline-left'>
					<RiUserSearchLine className='icon-size icon-container' />
					<span>{users.length}</span>&nbsp;users
				</p>
				<span className='flex-container'>
					Search user by username, email or service
				</span>
				<Form
					ref={formRef}
					method='get'
					action='/board/admin/users/userlist'
					className='search-container form-group'
				>
					<label htmlFor='query' className='label-search'>
						Search:
					</label>
					<input
						type='search'
						name='query'
						id='query'
						placeholder='?'
						aria-label='Search user by username, email or service'
						defaultValue={query ?? undefined}
						className='search-input'
					/>
					<button title="Search" type='submit' className='btn btn-search'>
						<FaSearch className='search-icon' />
					</button>
				</Form>
				<Link to='/board/admin/users/userlist' className='flex-container'>
					Back to complete user list
				</Link>
				{users.length && typeof users !== 'string' ? (
					<div className='flex-container'>
						{users.map((user) => (
							<ul key={user.id} className='card flex-container-card'>
								<li className='inline-between border-bottom'>
									Username:&nbsp;
									<Link
										to={{
											pathname: `/board/admin/users/userlist/${user.id}`,
											search: location.search
										}}
									>
										<span>{user.username}</span>
									</Link>
									<Link
										to={{
											pathname: `/board/admin/users/userlist/${user.id}`,
											search: location.search
										}}
										className='view'
									>
										View
									</Link>
								</li>
								<li>
									Email:&nbsp;<span>{user.email}</span>
								</li>
								<li>
									Service:&nbsp;<span>{user.service}</span>
								</li>
								<li>
									Created at:&nbsp;
									<span>
										{new Date(user.createdAt).toLocaleString('en-us', {
											month: '2-digit',
											day: '2-digit',
											year: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
											hour12: false
										})}
									</span>
								</li>
								<li>
									Updated at:&nbsp;
									<span>
										{new Date(user.updatedAt).toLocaleString('en-us', {
											month: '2-digit',
											day: '2-digit',
											year: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
											hour12: false
										})}
									</span>
								</li>
							</ul>
						))}
					</div>
				) : (
					<p className='form-container form-content'>No user available yet</p>
				)}
			</main>
		</>
	);
}
