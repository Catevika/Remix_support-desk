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
import ProductDisplay from '~/components/Product';
import styles from '~/styles/form.css';

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
			title: 'No product',
			description: 'No product found'
		};
	}
	return {
		title: `${data.device}`,
		description: `Here ist the "${data.device}"created by ${data?.username}`
	};
};

type LoaderData = {
	id: string;
	username: string;
	device: string;
	isOwner: boolean;
	canDelete: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const userId = await getUserId(request);

	const product = await db.product.findUnique({
		where: { productId: params.productId }
	});

	const users = await db.user.findMany({
		select: { id: true, username: true }
	});

	const user = users.filter((user) => user.id === product?.authorId)[0];

	const { id, username } = user;

	if (!username || !id) {
		throw new Response('User Not Found.', {
			status: 404
		});
	}

	if (!product) {
		throw new Response('Product Not Found.', {
			status: 404
		});
	}

	const data: LoaderData = {
		id,
		username,
		device: product.device,
		isOwner: userId === product.authorId,
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
	const product = await db.product.findUnique({
		where: { productId: params.productId }
	});
	if (!product) {
		throw new Response("Can't delete what does not exist", {
			status: 404
		});
	}
	if (product.authorId !== userId) {
		throw new Response("Can't delete a product that is not yours", {
			status: 401
		});
	}
	await db.product.delete({ where: { productId: params.productId } });
	return redirect('/products/new-product');
};

export default function ProductRoute() {
	const data = useLoaderData<LoaderData>();

	return (
		<>
			<main className='form-container'>
				<p>
					{data.username && (
						<h1>
							Product created by:{' '}
							<span>{`${
								data.username?.charAt(0).toUpperCase() + data.username?.slice(1)
							}`}</span>
						</h1>
					)}
				</p>
				<div className='form-content'>
					<ProductDisplay
						device={data.device}
						isOwner={data.isOwner}
						canDelete={data.canDelete}
					/>
				</div>
				<Link to='/products/new-product'>
					<button className='btn form-btn'>Back to Create Product</button>
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
				<div className='error-container'>
					{params.productId} does not exist.
				</div>
			);
		}
		case 401: {
			return (
				<div className='error-container'>
					Sorry, but {params.productId} is not your product.
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
	const { productId } = useParams();
	return (
		<div className='error-container'>{`There was an error loading the product by the id ${productId}. Sorry.`}</div>
	);
}
