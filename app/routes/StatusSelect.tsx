import type { Status } from '@prisma/client';
import type { LoaderFunction } from 'remix';
import { useLoaderData, useFetcher, useSearchParams } from 'remix';
import { getStatuses } from '~/utils/status.server';

export type LoaderData = {
	statuses: Awaited<ReturnType<typeof getStatuses>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	return getStatuses();
};

export default function ProductSelect() {
	const statuses = useLoaderData<Status[]>();

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
						<label htmlFor='status'>Status: </label>
						{statuses.length ? (
							<select
								name='status'
								id='status'
								defaultValue='-- Please select a status --'
								onSelect={(e) => handleSelect}
								className='form-select'
							>
								<option
									defaultValue='-- Please select a status --'
									disabled
									className='form-option-disabled'
								>
									-- Please select a status --
								</option>
								{statuses.map((status: Status) => (
									<option
										key={status.statusId}
										value={status.type}
										className='form-option'
									>
										{status.type}
									</option>
								))}
							</select>
						) : (
							<p className='error-danger'>'No status available'</p>
						)}
					</div>
				</fetcher.Form>
			</div>
		</main>
	);
}
