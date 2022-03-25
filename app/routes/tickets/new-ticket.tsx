import {
	json,
	LinksFunction,
	LoaderFunction,
	ActionFunction,
	redirect
} from 'remix';
import { Form, Link, useActionData } from 'remix';
import { FaTools } from 'react-icons/fa';

import stylesUrl from '~/styles/form.css';
import { getUser, requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}
	return json({ user });
};

function validateTicket(ticket: string) {
	if (ticket.length < 8) {
		return 'Ticket content must be at least 8 characters long';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		ticket: string | undefined;
	};
	fields?: {
		ticket: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();
	const ticket = form.get('ticket');
	if (typeof ticket !== 'string') {
		return badRequest({ formError: `Form not submitted correctly.` });
	}

	const fieldErrors = {
		ticket: validateTicket(ticket)
	};

	const fields = { ticket };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const newTicket = await db.ticket.create({
		data: { ticket, authorId: userId, ticketProductId: productId }
	});
	return redirect(`/tickets/${newTicket}?redirectTo=/tickets/new-ticket`);
};

// * replace Link with the back button that comes back to the previous route

export default function NewTicketRoute() {
	const actionData = useActionData<ActionData>();
	return (
		<>
			<header className='Heading'>
				<Link to='/'>
					<FaTools className='icon-size icon-shadow icon-linked' />
				</Link>
				<h1>Create New Ticket</h1>
			</header>
			<main className='main container'>
				<div className='form-group'>
					<label htmlFor='name'>Username</label>
					<input type='text' value={username} disabled />
				</div>
				<div className='form-group'>
					<label htmlFor='email'>Customer Email</label>
					<input type='email' className='form-control' value={email} disabled />
				</div>
				<Form method='post' className='form'>
					<div className='form-group'>
						<label htmlFor='product'>Product </label>
						{/* NOTES -  replace by combobox */}
						<select
							name='product'
							id='product'
							value={product}
							onChange={(e) => setProduct(e.target.value)}
						>
							<option value='Iphone'>Iphone</option>
							<option value='Macbook Pro'>Macbook Pro</option>
							<option value='Imac'>Imac</option>
							<option value='Ipad'>Ipad</option>
							<option value='Watch'>Watch</option>
							<option value='AirPods'>AirPods</option>
							<option value='TV'>TV</option>
						</select>
					</div>
					<div className='form-group'>
						<label htmlFor='description'>Description of the issue</label>
						<textarea
							name='description'
							id='description'
							className='form-control'
							placeholder='Description'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className='form-group'>
						<button className='btn btn-block'>Submit</button>
					</div>
				</Form>
			</main>
		</>
	);
}
