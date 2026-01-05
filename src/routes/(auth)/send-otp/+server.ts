import { adminSupabase } from '$lib/adminSupabase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { email } = await request.json();

	// bypasses RLS securely (server only)
	const { data: profile } = await adminSupabase
		.from('profiles')
		.select('role')
		.eq('email', email)
		.single();

	console.log(profile);
	if (!profile || profile.role !== 'admin') {
		return json({ error: 'Not authorized' }, { status: 403 });
	}

	const { error } = await locals.supabase.auth.signInWithOtp({ email });

	if (error) return json({ error: error.message }, { status: 400 });

	return json({ success: true });
};
