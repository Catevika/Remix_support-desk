import type { Ticket } from '@prisma/client';
import type { Product } from '~/utils/products.server';
import type { Status } from '~/utils/status.server';
import DeleteButton from './DeleteButton';

// TODO: Add notes modal

export function TicketDisplay({
	ticket,
	product,
	status,
	isOwner,
	canDelete = true
}: {
	ticket: Ticket;
	product: Product;
	status: Status;
	isOwner: boolean;
	canDelete?: boolean;
}) {
	return (
		<>
			{ticket ? (
				<ul className='main container'>
					<li>
						Ticket Id: {ticket.ticketId}
						<span
							className={
								ticket.ticketStatusId
									? `status status-${status.type}`
									: undefined
							}
						>
							{status.type}
						</span>
					</li>
					<li>Product:&nbsp;{product.device}</li>
					<li>Description of Issue:&nbsp;{ticket.description}</li>
					<li>Date Submitted: {new Date(ticket.createdAt).toLocaleString()}</li>
					<li>Date Updated: {new Date(ticket.updatedAt).toLocaleString()}</li>
					{/* {ticket.status === 'Closed' || notes.length === 0 ? null : (
						<h2>Notes</h2>
					)} */}
					{/* {ticket.status !== 'Closed' && (
					<button onClick={openModal} className='btn'>
						<FaPlus /> Add Note
					</button>
				)}
				<Modal
					isOpen={modalIsOpen}
					onRequestClose={closeModal}
					style={customStyles}
					contentLabel='Add Note'
				>
					<h2>Add Note</h2>
					<button className='btn-close' onClick={closeModal}>
						X
					</button>
					<form onSubmit={onNoteSubmit}>
						<div className='form-group'>
							<textarea
								name='noteText'
								id='noteText'
								className='form-control'
								placeholder='Note text'
								value={noteText}
								onChange={(e) => setNoteText(e.target.value)}
							></textarea>
						</div>
						<div className='form-group'>
							<button className='btn' type='submit'>
								Submit
							</button>
						</div>
					</form>
				</Modal>
				{notes.map((note) => {
					return <NoteItem key={note._id} note={note} />;
				})} */}

					{ticket.ticketStatusId && status.type !== 'Closed' && (
						<button
							className='btn btn-block btn-danger' /* onClick={onTicketClose} */
						>
							Close Ticket
						</button>
					)}
					{isOwner ? (
						<DeleteButton isOwner={isOwner} canDelete={canDelete} />
					) : null}
				</ul>
			) : null}
		</>
	);
}
