import type { LoaderFunction } from 'remix';
import { Outlet, useLoaderData, Link, json } from 'remix';
import { db } from '~/utils/db.server';
import { getUser } from '~/utils/session.server';
import { MdOutlineDevicesOther } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	productListItems: Array<{ productId: string; device: string }>;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);

	const productListItems = user
		? await db.product.findMany({
				take: 10,
				select: { productId: true, device: true },
				orderBy: { device: 'desc' }
		  })
		: [];

	const data: LoaderData = {
		productListItems,
		user
	};

	return json(data);
};

/* TODO: change the Link to='/boards when Model Board created with authorId referred link */
/* TODO: Add a pagination to product list  */
/* TODO: Voir comment faire tri desc alphabetic order  */

export default function ProductsRoute() {
	const data = useLoaderData<LoaderData>();
	return (
		<>
			<header className='container header'>
				<Link to='/boards' className='icon-header'>
					<FaTools className='icon-size icon-shadow' /> Back to Boards
				</Link>
				<h1>Create New Product</h1>
			</header>
			<main className='grid-container'>
				{data.productListItems.length ? (
					<>
						<div className='form-content'>
							<MdOutlineDevicesOther className='icon-size icon-container' />
							<p>Available products:</p>
							<ul>
								{data.productListItems.map(({ productId, device }) => (
									<li key={productId}>
										<Link to={productId} prefetch='intent'>
											{device}
										</Link>
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
