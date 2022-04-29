import type { LoaderFunction } from 'remix';
import type { Product } from '@prisma/client';

import { Form, Outlet, useLoaderData, Link, useCatch } from 'remix';
import { getProducts } from '~/utils/products.server';
import { MdOutlineDevicesOther } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

export const loader: LoaderFunction = async () => {
	return getProducts();
};

/* TODO: change the Link to='/boards when Model Board created with authorId referred link */
/* TODO: Add a pagination to product list  */
// TODO: Add a search field to product list

export default function ProductsRoute() {
	const products = useLoaderData<Product[]>();
	return (
		<>
			<header className='container header'>
				<Link to='/boards/products' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Products board
				</Link>
				<h1>Create New Product</h1>
			</header>
			<main className='grid-container'>
				{products.length ? (
					<>
						<div className='form-content'>
							<MdOutlineDevicesOther className='icon-size icon-container' />
							<p>Available products:</p>
							<ul>
								{products.map((product) => (
									<li key={product.productId}>
										<Link to={product.productId} prefetch='intent'>
											{product.device}
										</Link>
										<Form method='post'></Form>
									</li>
								))}
							</ul>
						</div>
					</>
				) : null}
				<div>
					<div>
						<Outlet />
					</div>
				</div>
			</main>
		</>
	);
}

export function CatchBoundary() {
	const caught = useCatch();

	if (caught.status === 401) {
		return (
			<div className='error-container'>
				<div className='form-container form-content'>
					<p>You must be logged in to add a new product.</p>
					<Link to='/login?redirectTo=/products/new-product'>
						<button className='btn form-btn'>Login</button>
					</Link>
				</div>
			</div>
		);
	}
	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	return (
		<div className='error-container'>
			<div className='form-container form-content'>
				Something unexpected went wrong. Sorry about that.
			</div>
		</div>
	);
}
