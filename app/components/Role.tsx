import { Form } from 'remix';

export default function RoleDisplay({
	roleType,
	isOwner,
	canDelete = true
}: {
	roleType: string;
	isOwner: boolean;
	canDelete?: boolean;
}) {
	return (
		<>
			<p>{roleType}</p>
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
