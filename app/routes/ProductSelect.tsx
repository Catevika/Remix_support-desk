import type { Product } from '~/utils/products.server';
import { getProducts } from '~/utils/products.server';
import type { LoaderFunction } from 'remix';
import { useLoaderData, useFetcher, useSearchParams } from 'remix';

export type LoaderData = {
	products: Awaited<ReturnType<typeof getProducts>>;
};

export const loader: LoaderFunction = async () => {
	return getProducts();
};

export default function ProductSelect() {
	const products = useLoaderData<Product[]>();
	const fetcher = useFetcher();
	const [searchParams] = useSearchParams();

	function handleSelect(selectedValue: string) {
		fetcher.submit(
			{ selected: selectedValue },
			{ method: 'post', action: '/tickets/new-ticket' }
		);
	}
	return (
		<main className='form-container'>
			<div className='form-content'>
				<fetcher.Form reloadDocument method='post' className='form'>
					<input
						type='hidden'
						name='redirectTo'
						defaultValue={searchParams.get('redirectTo') ?? undefined}
					/>
					<div className='form-group'>
						<label htmlFor='product'>Product: </label>
						{products.length ? (
							<select
								name='product'
								id='product'
								defaultValue='-- Please select a product --'
								onSelect={(e) => handleSelect}
								className='form-select'
								autoFocus
							>
								<option
									defaultValue='-- Please select a product --'
									disabled
									className='form-option-disabled'
								>
									-- Please select a product --
								</option>
								{products.map((product: Product) => (
									<option
										key={product.productId}
										value={product.device}
										className='form-option'
									>
										{product.device}
									</option>
								))}
							</select>
						) : (
							<p className='error-danger'>'No product available'</p>
						)}
					</div>
				</fetcher.Form>
			</div>
		</main>
	);
}
