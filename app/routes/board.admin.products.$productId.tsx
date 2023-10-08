import type {
	MetaFunction,
	LoaderFunction,
	ActionFunction
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	Form,
	Link,
	useLoaderData,
	useActionData,
	useNavigation,
	useRouteError,
	isRouteErrorResponse
} from '@remix-run/react';

import { requireUserId, getUser } from '~/utils/session.server';
import { prisma } from '~/utils/db.server';
import { validateProduct } from '~/utils/functions';
import { getProduct, deleteProduct } from '~/models/products.server';

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
	product: Awaited<ReturnType<typeof getProduct>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const user = await getUser(request);

	if (!user || user.service !== 'Information Technology') {
		throw new Response('Unauthorized', { status: 401 });
	}

	if (params.productId === 'new-product') {
		const data: LoaderData = {
			user,
			product: null
		};

		return data;
	} else {
		const product = await getProduct(params.productId);

		const data: LoaderData = {
			user,
			product
		};

		return data;
	}
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) {
		return [{ title: 'No product' }];
	} else {
		return [{ title: 'Support Desk | Products' }];
	}
};

type ActionData = {
	formError?: string;
	fieldErrors?: {
		device: string | undefined;
	};
	fields?: {
		device: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request, params }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();
	const device = form.get('device');

	if (typeof device !== 'string') {
		return badRequest({
			formError: `Product must be an at least 3 characters long string`
		});
	}

	const intent = form.get('intent');

	if (intent === 'delete') {
		await deleteProduct(params.productId);
		return redirect('/board/admin/products/new-product');
	}

	const fieldErrors = {
		device: validateProduct(device)
	};

	const fields = { device };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const productExists = await prisma.product.findUnique({
		where: { device }
	});

	if (productExists) {
		return badRequest({
			fields,
			formError: `Product '${device}' already exists`
		});
	}

	if (params.productId === 'new-product') {
		await prisma.product.create({
			data: { device, authorId: userId }
		});
	} else {
		await prisma.product.update({
			data: { device },
			where: { productId: params.productId }
		});
	}

	return redirect('/board/admin/products/new-product');
};

export default function adminProductRoute() {
	const data = useLoaderData<LoaderData>();

	const user = data.user;

	const actionData = useActionData() as ActionData;
	const navigation = useNavigation();

	const isNewProduct = !data.product?.device;
	const isAdding = Boolean(
		navigation.formData?.get('intent') === 'create'
	);
	const isUpdating = Boolean(
		navigation.formData?.get('intent') === 'update'
	);
	const isDeleting = Boolean(
		navigation.formData?.get('intent') === 'delete'
	);

	return (
		<main className='form-scroll-main'>
			<div className='form-scroll'>
				<Form
					reloadDocument
					method='post'
					key={data.product?.productId ?? 'new-product'}
				>
					<p>
						{isNewProduct ? 'New' : null}&nbsp;Product from:
						<span className='capitalize'>&nbsp;{user?.username}&nbsp;</span> -
						Email:<span>&nbsp;{user?.email}</span>
					</p>
					<div className='form-content'>
						<div className='form-group'>
							<label htmlFor='device'>
								{isNewProduct ? 'New' : null}&nbsp;Product:{' '}
								<input
									type='text'
									defaultValue={data.product?.device}
									name='device'
									aria-errormessage={
										actionData?.fieldErrors?.device
											? 'product-error'
											: undefined
									}
								/>
							</label>
							{actionData?.fieldErrors?.device ? (
								<p className='error-danger' role='alert' id='product-error'>
									{actionData.fieldErrors.device}
								</p>
							) : null}
						</div>
						<div>
							{actionData?.formError ? (
								<p className='error-danger' role='alert'>
									{actionData.formError}
								</p>
							) : null}
							{data.product ? (
								<div className='form-group inline'>
									<label>
										Created at:&nbsp;
										<input
											type='text'
											id='createdAt'
											name='createdAt'
											defaultValue={new Date(
												data.product.createdAt
											).toLocaleString('en-us', {
												month: '2-digit',
												day: '2-digit',
												year: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
												hour12: false
											})}
										/>
									</label>
									<label>
										Updated at:&nbsp;
										<input
											type='text'
											id='updatedAt'
											name='updatedAt'
											defaultValue={new Date(
												data.product.updatedAt
											).toLocaleString('en-us', {
												month: '2-digit',
												day: '2-digit',
												year: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
												hour12: false
											})}
										/>
									</label>
								</div>
							) : null}
						</div>
						<div className='inline'>
							<button
								type='submit'
								name='intent'
								value={isNewProduct ? 'create' : 'update'}
								className='btn form-btn'
								disabled={isAdding || isUpdating}
							>
								{isNewProduct ? (isAdding ? 'Adding...' : 'Add') : null}
								{isNewProduct ? null : isUpdating ? 'Updating...' : 'Update'}
							</button>
							{isNewProduct ? null : (
								<Link to='/board/admin/products/new-product'>
									<button className='btn form-btn'>Back to New Product</button>
								</Link>
							)}
							{isNewProduct ? null : (
								<button
									type='submit'
									name='intent'
									value='delete'
									className='btn form-btn btn-danger'
									disabled={isDeleting}
								>
									{isDeleting ? 'isDeleting...' : 'Delete'}
								</button>
							)}
						</div>
					</div>
				</Form>
			</div>
		</main>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	if (isRouteErrorResponse(error)) {
		if (error.status === 401) {
			return (
				<div className='error-container'>
					<div className='form-container form-content'>
						<p>
							You must be logged in with administrator rights to add a new
							product.
						</p>
						<Link to='/login?redirectTo=/board/admin/products/new-product'>
							<button className='btn form-btn'>Login</button>
						</Link>
					</div>
				</div>
			);
		} else {
			return (
				<div className='error-container'>
					<div className='form-container form-container-message form-content'>
						Something unexpected went wrong. Sorry about that.
					</div>
					<p>Status: {error.status}</p>
					<p>{error.data.message}</p>
				</div>
			);
		}
	}
}
