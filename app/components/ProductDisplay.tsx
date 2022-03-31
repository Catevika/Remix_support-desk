import DeleteButton from './DeleteButton';

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
				<DeleteButton isOwner={isOwner} canDelete={canDelete} />
			) : null}
		</>
	);
}
