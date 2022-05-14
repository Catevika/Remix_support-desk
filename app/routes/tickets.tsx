import type { LoaderFunction } from 'remix';
import type { Ticket } from '@prisma/client';
import { Outlet, useLoaderData, Link, useCatch } from 'remix';
import { getTickets } from '~/utils/tickets.server';
import { MdMiscellaneousServices } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

export const loader: LoaderFunction = async () => {
	return getTickets();
};

/* TODO: change the Link to='/boards when Model Board created with authorId referred link */
/* TODO: Add a pagination to role list  */
/* TODO: Voir si j'ajoute le user comme dans products  */
// TODO: Add a search field to product list

export default function TicketsRoute() {
	const tickets = useLoaderData<Ticket[]>();
	return (
		<>
			<header className='container header'>
				<Link to='/boards' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Boards
				</Link>
				<h1>Create New Ticket</h1>
			</header>
			<main className='grid-container'>
				{tickets.length ? (
					<>
						<div className='form-content'>
							<MdMiscellaneousServices className='icon-size icon-container' />
							<p>Available tickets:</p>
							<ul>
								{tickets.map((ticket) => (
									<li key={ticket.ticketId}>
										<Link to={ticket.ticketId} prefetch='intent'>
											{ticket.ticketId} - {ticket.description}
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
					<p>You must be logged in to create a ticket.</p>
					<Link to='/login?redirectTo=/tickets/new-ticket'>
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
