import { Form } from 'remix';

export default function ProductDisplay({
	device,
	isOwner,
	canDelete = true
}: {
	device: string;
	isOwner: boolean;
	canDelete?: boolean;
}) {
	return (
		<>
			<p>{device}</p>
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
		</>
	);
}
