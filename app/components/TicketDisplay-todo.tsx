import DeleteButton from './DeleteButton';

// TODO: Add notes
/* TODO Replace with form to get an editable ticket */

export function TicketDisplay({
	ticket,
	product,
	status,
	isOwner,
	canDelete = true
}: {
	ticket: string;
	status: string;
	product: string;
	isOwner: boolean;
	canDelete?: boolean;
}) {
	return (
		<div className='ticket-page'>
			<header className='ticket-header'>
				<Link to='/tickets'>Back to Tickets</Link>
				<h2>
					Ticket Id: {ticket.ticketId}
					<span
						className={
							ticket.ticketId === status.statusTicketId
								? `status status-${status}`
								: undefined
						}
					>
						{status}
					</span>
				</h2>
				<hr />
				<h3>
					Date Submitted: {new Date(ticket.createdAt).toLocaleString('en-US')}
				</h3>

				<div className='ticket-desc'>
					<h3>Product</h3>
					<p>{product.device}</p>
				</div>
				<div className='ticket-desc'>
					<h3>Description of Issue</h3>
					<p>{ticket.description}</p>
				</div>
				{/* {ticket.status === 'Closed' || notes.length === 0 ? null : (
					<h2>Notes</h2>
				)} */}
			</header>
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

			{ticket.ticketId === status.statusTicketId &&
				status.type !== 'Closed' && (
					<button
						className='btn btn-block btn-danger' /* onClick={onTicketClose} */
					>
						Close Ticket
					</button>
				)}
			{isOwner ? (
				<Form method='post'>
					<input type='hidden' name='_method' value='delete' />
					<button
						type='submit'
						className='btn form-btn btn-danger'
						disabled={!canDelete}
					>
						Delete
					</button>
				</Form>
			) : null}
		</div>
	);
}
