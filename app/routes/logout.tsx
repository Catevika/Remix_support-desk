import type { ActionFunction, LoaderFunction, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { logout } from '~/utils/session.server';

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const meta: MetaFunction<typeof loader> = () => {
	return [{ title: 'Support-Desk | Logout' }];
};

export const action: ActionFunction = async ({ request }) => {
	return logout(request);
};
