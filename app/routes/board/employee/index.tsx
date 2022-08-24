import type { MetaFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, NavLink } from '@remix-run/react';
import { requireUser } from '~/utils/session.server';
import { getTicketListingByUserId } from '~/models/tickets.server';
import LogoutButton from '~/components/LogoutButton';
import { CgProfile } from 'react-icons/cg';
import { FaTools, FaQuestionCircle, FaTicketAlt } from 'react-icons/fa';

export const meta: MetaFunction = () => {
  return {
    title: 'Support-Desk | Employee Board'
  };
};

type LoaderData = {
  user: Awaited<ReturnType<typeof requireUser>>;
  tickets: Awaited<ReturnType<typeof getTicketListingByUserId>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const tickets = await getTicketListingByUserId(user.id);
  
  return json<LoaderData>({ user, tickets });
}

export default function employeeUserBoardRoute() {
  const { user, tickets } = useLoaderData<LoaderData>();
  const lastTicket = tickets ? tickets[0] : null;

  return (
    <>
      <header className='container header'>
        <FaTools className='icon-size icon-shadow' />
        <p>Main Board</p>
        <LogoutButton />
      </header>
      <main>
        <p className='main-text'>
          Hi <span className='capitalize'>{user?.username ? user.username : null}</span>,
          <br />what do you need help with?
        </p>
      </main>
      {user ? (
        <nav className='nav'>
          <ul>
            <li>
              <NavLink
                to='/board/employee/tickets/new-ticket'
                className='btn btn-reverse btn-block nav-links'
              >
                <FaQuestionCircle className='icon-size icon-space' />
                &nbsp;New Ticket
              </NavLink>
            </li>
            <li>
            <NavLink to={(lastTicket && typeof lastTicket !== 'string') ? (`/board/employee/tickets/${lastTicket.ticketId}`) : ('/board/employee/tickets/new-ticket')} className='btn btn-block nav-links'>
            <FaTicketAlt className='icon-size icon-space' />
                &nbsp;View Tickets
            </NavLink>
            </li>
            <li>
              <NavLink
                to={`/board/employee/users/${user.id}`}
                className='btn btn-block nav-links'
              >
                <CgProfile className='icon-size icon-space' />
                &nbsp;View Profile
              </NavLink>
            </li>
          </ul>
        </nav>
      ) : null}
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error; }) {
  console.error(error);
  return (
    <div className='error-container'>
			<div className='form-container form-container-message form-content'>
				Something unexpected went wrong. Sorry about that.
			</div>
		</div>
  );
}
