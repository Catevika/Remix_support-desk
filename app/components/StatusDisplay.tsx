import DeleteButton from './DeleteButton';

export default function ProductDisplay({
	type,
	isOwner,
	canDelete = true
}: {
	type: string;
	isOwner: boolean;
	canDelete?: boolean;
}) {
	return (
		<>
			<p>{type}</p>
			{isOwner ? (
				<DeleteButton isOwner={isOwner} canDelete={canDelete} />
			) : null}
		</>
	);
}
