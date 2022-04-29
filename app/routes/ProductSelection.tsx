import type { ActionFunction } from 'remix';
import { Form } from 'remix';

import {
	json,
	useActionData,
	useSearchParams,
	useTransition,
	redirect
} from 'remix';
import { requireUserId } from '~/utils/session.server';
import { db } from '~/utils/db.server';
import ProductSelect from '~/routes/ProductSelect';
import StatusSelect from '~/routes/StatusSelect';

function validateProduct(product: unknown) {
	if (product === '-- Please select a product --') {
		return 'A product must be selected';
	}
}

function validateDescription(description: unknown) {
	if (typeof description !== 'string' || description.length < 10) {
		return 'descriptions must be at least 10 characters long';
	}
}

function validateStatus(type: unknown) {
	if (type === '-- Please select a status --') {
		return 'A status must be selected';
	}
}

type ActionData = {
	formError?: string;
	fieldErrors?: {
		product: string | undefined;
		description: string | undefined;
		type: string | undefined;
	};
	fields?: {
		product: string;
		description: string;
		type: string;
	};
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const userId = await requireUserId(request);

	const form = await request.formData();

	let { ...values } = Object.fromEntries(form);
	const { username, email, product, description, type } = values;

	const redirectTo = form.get('redirectTo') || '/';
	if (!username && !email && !product && !description && !type) {
		return null;
	} else if (
		typeof username !== 'string' ||
		typeof email !== 'string' ||
		typeof product !== 'string' ||
		typeof description !== 'string' ||
		typeof type !== 'string' ||
		typeof redirectTo !== 'string'
	) {
		return badRequest({ formError: 'Form not submitted correctly.' });
	}

	const fieldErrors = {
		product: validateProduct(product),
		description: validateDescription(description),
		type: validateStatus(type)
	};

	const fields = { product, description, type };
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({ fieldErrors, fields });
	}

	const ticketProduct = await db.product.findUnique({
		where: { device: product }
	});

	if (!ticketProduct) {
		return badRequest({ formError: 'Product not found' });
	}

	const ticketProductId = ticketProduct.productId;

	const ticketStatus = await db.status.findUnique({ where: { type: type } });

	if (!ticketStatus) {
		return badRequest({ formError: 'Status not found' });
	}

	const ticketStatusId = ticketStatus.type;

	await db.ticket.create({
		data: {
			description,
			authorId: userId,
			ticketProductId,
			ticketStatusId
		}
	});
	return redirect(`/new-ticket`);
};

export default function ProductSelectionRoute() {
	const actionData = useActionData<ActionData>();
	const [searchParams] = useSearchParams();
	const transition = useTransition();

	return (
		<main className='form-container'>
			<div className='form-content'>
				<ProductSelect />
				{actionData?.fieldErrors?.product ? (
					<p className='form-validation-error' role='alert' id='product-error'>
						{actionData.fieldErrors.product}
					</p>
				) : null}
				<StatusSelect />
				{actionData?.fieldErrors?.type ? (
					<p className='form-validation-error' role='alert' id='type-error'>
						{actionData.fieldErrors.type}
					</p>
				) : null}
				<Form>
					<input
						type='hidden'
						name='redirectTo'
						defaultValue={searchParams.get('redirectTo') ?? undefined}
					/>
					<div className='form-group'>
						<label htmlFor='description'>Issue Description: </label>
						<textarea
							name='description'
							id='description'
							className='form-textarea'
						/>
					</div>
					{transition.submission ? (
						<button type='submit' className='btn form-btn' disabled>
							Submitting...
						</button>
					) : (
						<button type='submit' className='btn form-btn'>
							Submit
						</button>
					)}
				</Form>
			</div>
		</main>
	);
}
