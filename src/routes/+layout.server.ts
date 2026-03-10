import { canAccessBackoffice } from '$lib/access';
import { getCurrentUserProfile } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow login & verify routes without auth
	const { user, profile } = await getCurrentUserProfile(locals);

	if (!user && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/verify')) {
		throw redirect(302, '/login');
	}

	if (!user) return { user: null, profile: null };
	if (!canAccessBackoffice(profile?.role)) {
		await locals.supabase.auth.signOut();
		throw redirect(302, '/login');
	}

	return { user, profile };
};
