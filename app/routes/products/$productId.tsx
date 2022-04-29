import type { LoaderFunction, ActionFunction, MetaFunction } from 'remix';
import {
	Link,
	json,
	useLoaderData,
	useCatch,
	redirect,
	useParams
} from 'remix';
import { db } from '~/utils/db.server';
import { requireUserId } from '~/utils/session.server';
import ProductDisplay from '~/components/ProductDisplay';

// TODO: Insérer le goTo Login ici

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
		description: `Here ist the "${data.device}"created by ${data.username}`
	};
};

type LoaderData = {
	id: string;
	username: string;
	device: string;
	isOwner: boolean;
	canDelete: boolean;
};

export const loader: LoaderFunction = async ({ params }) => {
	const product = await db.product.findUnique({
		where: { productId: params.productId }
	});

	if (!product) {
		throw new Response('Product Not Found.', {
			status: 404
		});
	}

	const user = await db.user.findUnique({
		where: { id: product.authorId },
		select: { id: true, username: true }
	});

	if (!user) {
		throw new Response('User Not Found.', {
			status: 404
		});
	}

	const data: LoaderData = {
		id: user.id,
		username: user.username,
		device: product.device,
		isOwner: user.id === product.authorId,
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
				{data.username && (
					<p>
						Device created by{' '}
						<span className='capitalize'>{data.username}</span>
					</p>
				)}
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
					<div className='form-container form-content'>
						What you're trying to do is not allowed.
					</div>
				</div>
			);
		}
		case 404: {
			return (
				<div className='error-container'>
					<div className='form-container form-content'>
						{params.productId} does not exist.
					</div>
				</div>
			);
		}
		case 401: {
			return (
				<div className='error-container'>
					<div className='form-container form-content'>
						Sorry, but {params.productId} is not your product.
					</div>
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
		<div className='error-container'>
			<div className='form-container form-content'>
				There was an error loading the product by the id:{' '}
				<p>
					{' '}
					<span>{`${productId}.`}</span>
				</p>
				<p>Sorry.</p>
			</div>
		</div>
	);
}
