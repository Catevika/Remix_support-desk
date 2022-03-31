import { User } from '@prisma/client';
import { Link } from 'remix';

/* TODO replace Link with the back button that comes back to the previous route */
/* TODO add the loader for role when register fixed */
/* TODO - replace the Form with the DeleteButton component */

// FIXME

export function UserDisplay(user: User) {
	return (
		<main className='ticket-page'>
			<Link to='/'>Back</Link>
			<h2>User Id: {user.id}</h2>
			<hr />
			<h3>Date Registered: {user.createdAt.toLocaleString()}</h3>

			<div className='ticket-desc'>
				<h3>Name</h3>
				<p>{user.username}</p>
			</div>
			<div className='ticket-desc'>
				<h3>Email</h3>
				<p>{user.email}</p>
			</div>
			<div className='ticket-desc'>
				<h3>Service</h3>
				<p>{user.service}</p>
			</div>
		</main>
	);
}
