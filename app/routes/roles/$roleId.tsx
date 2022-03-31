import type {
	LinksFunction,
	LoaderFunction,
	ActionFunction,
	MetaFunction
} from 'remix';
import {
	Link,
	json,
	useLoaderData,
	useCatch,
	redirect,
	useParams
} from 'remix';
import { db } from '~/utils/db.server';
import { getUserId, requireUserId } from '~/utils/session.server';
import DeleteButton from '~/components/DeleteButton';
import styles from '~/styles/form.css';

// TODO: Insert Meta to describe what's going on in this file through the page tab

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: styles }];
};

export const meta: MetaFunction = ({
	data
}: {
	data: LoaderData | undefined;
}) => {
	if (!data) {
		return {
			title: 'No role',
			description: 'No role found'
		};
	}
	return {
		title: `${data.roleType}`,
		description: `Here ist the "${data.roleType}" created by ${data?.username}`
	};
};

type LoaderData = {
	id: string;
	username: string;
	roleType: string;
	isOwner: boolean;
	canDelete: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const userId = await getUserId(request);
	const role = await db.role.findUnique({
		where: { roleId: params.roleId }
	});

	const users = await db.user.findMany({
		select: { id: true, username: true }
	});

	const user = users.filter((user) => user.id === role?.authorId)[0];

	const { id, username } = user;

	if (!username || !id) {
		throw new Response('User Not Found.', {
			status: 404
		});
	}

	if (!role) {
		throw new Response('Role Not Found.', {
			status: 404
		});
	}

	const data: LoaderData = {
		id,
		username,
		roleType: role.roleType,
		isOwner: userId === role.authorId,
		canDelete: true
	};
	return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
	const form = await request.formData();
	if (form.get('_method') !== 'delete') {
		throw new Response(`The _method ${form.get('_method')} is not supported`, {
			status: 400
		});
	}
	const userId = await requireUserId(request);
	const role = await db.role.findUnique({
		where: { roleId: params.roleId }
	});
	if (!role) {
		throw new Response("Can't delete what does not exist", {
			status: 404
		});
	}
	if (role.authorId !== userId) {
		throw new Response("Can't delete a role that is not yours", {
			status: 401
		});
	}
	await db.role.delete({ where: { roleId: params.roleId } });
	return redirect('/roles/new-role');
};

export default function RoleRoute() {
	const data = useLoaderData<LoaderData>();

	return (
		<>
			<main className='form-container'>
				<p>
					{data?.username && (
						<>
							Role created by{' '}
							<span className='capitalize'>{data.username}</span>
						</>
					)}
				</p>
				<div className='form-content'>
					<p>{data.roleType}</p>
					<DeleteButton isOwner={data.isOwner} canDelete={data.canDelete} />
				</div>
				<Link to='/roles/new-role'>
					<button className='btn form-btn'>Back to Create Role</button>
				</Link>
			</main>
		</>
	);
}

export function CatchBoundary() {
	const caught = useCatch();
	const params = useParams();
	switch (caught.status) {
		case 400: {
			return (
				<div className='error-container'>
					What you're trying to do is not allowed.
				</div>
			);
		}
		case 404: {
			return (
				<div className='error-container'>{params.roleId} does not exist.</div>
			);
		}
		case 401: {
			return (
				<div className='error-container'>
					Sorry, but {params.roleId} is not your role.
				</div>
			);
		}
		default: {
			throw new Error(`Unhandled error: ${caught.status}`);
		}
	}
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	const { roleId } = useParams();
	return (
		<div className='error-container'>{`There was an error loading the role by the id ${roleId}. Sorry.`}</div>
	);
}
