import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	// Allow login & verify routes without auth
	if (!user && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/verify')) {
		throw redirect(302, '/login');
	}

	if (!user) return { user: null, profile: null };

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('name,email,role')
		.eq('id', user.id)
		.single();

	return { user, profile };
};
