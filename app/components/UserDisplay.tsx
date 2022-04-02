import { User } from '~/api/users';
import DeleteButton from './DeleteButton';
/* TODO replace Link with the back button that comes back to the previous route */

export default function UserDisplay({
	user,
	isOwner,
	canDelete = true
}: {
	user: User;
	isOwner: boolean;
	canDelete?: boolean;
}) {
	return (
		<>
			{user ? (
				<main className='main container'>
					<p className='list'>
						Name:&nbsp;<span>{user.username}</span>
					</p>
					<p className='list'>
						Email:&nbsp;<span>{user.email}</span>
					</p>
					<p className='list'>
						Service:&nbsp;<span>{user.service}</span>
					</p>
					<p className='list'>
						Date Registered:&nbsp;
						<span>{user.createdAt.toLocaleString()}</span>
					</p>
					<p className='list'>
						Date Updated:&nbsp;<span>{user.updatedAt.toLocaleString()}</span>
					</p>
				</main>
			) : null}
			{isOwner ? (
				<DeleteButton isOwner={isOwner} canDelete={canDelete} />
			) : null}
		</>
	);
}
