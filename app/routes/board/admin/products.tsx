import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link, NavLink, Outlet } from '@remix-run/react';
import { getProducts } from '~/models/products.server';
import AdminNavBar from '~/components/AdminNavBar';
import LogoutButton from '~/components/LogoutButton';
import { MdOutlineDevicesOther } from 'react-icons/md';
import { FaTools } from 'react-icons/fa';

type LoaderData = {
	products: Awaited<ReturnType<typeof getProducts>>;
};

export const loader: LoaderFunction = async () => {
	const products = await getProducts();
	return json<LoaderData>({ products });
};

export default function adminProductRoute() {
	const { products } = useLoaderData<LoaderData>();

	return (
		<>
			<header className='container header'>
				<Link to='/board/admin' className='icon-header'>
					<FaTools className='icon-size icon-shadow' />
					Back to Board
				</Link>
				<AdminNavBar />
				<div className='header-flex'>
					<h1>Products </h1>
					<LogoutButton />
				</div>
			</header>
			<main className='flex-container-2-col'>
				{products.length ? (
					<div>
						<p className='inline-left'>
							<MdOutlineDevicesOther className='icon-size icon-container' />
							<span>{products.length}</span>&nbsp;products
						</p>
						<nav className='nav-ul-container'>
							<ul className='nav-ul'>
								{products.map((product) => (
									<li key={product.productId} className='inline-between'>
										<NavLink
											to={product.productId}
											prefetch='intent'
											className={({ isActive }) =>
												isActive ? 'active' : undefined
											}
										>
											<span>{product.device}</span>
										</NavLink>
										&nbsp;
										<Link
											to={`/board/admin/products/${product.productId}`}
											className='view'
										>
											View
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</div>
				) : (
					<p className='form-container form-content'>
						No product available yet
					</p>
				)}
				<div>
					<Outlet />
				</div>
			</main>
		</>
	);
}
