import type { PageServerLoad, Actions } from './$types';
import { adminSupabase } from '$lib/adminSupabase';
import { fail } from '@sveltejs/kit';

const DEFAULT_PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || `${DEFAULT_PAGE_SIZE}`);
	const search = url.searchParams.get('search') || '';

	const { count } = await adminSupabase
		.from('profiles')
		.select('id', { count: 'exact', head: true })
		.ilike('name', `%${search}%`);

	const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
	const safePage = Math.min(Math.max(page, 1), totalPages);

	const from = (safePage - 1) * pageSize;
	const to = from + pageSize - 1;

	const { data: profiles, error } = await adminSupabase
		.from('profiles')
		.select('id, name, email, age, gender, goal, isSpecial, created_at')
		.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
		.range(from, to)
		.order('created_at', { ascending: false });

	if (error) return { profiles: [], count: 0, page: 1, pageSize, search };

	return { profiles, count: count ?? 0, page: safePage, pageSize, search };
};

export const actions: Actions = {
	editUser: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) return fail(401);

		const { data: adminProfile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (adminProfile?.role !== 'admin') return fail(403);

		const form = await request.formData();
		const id = form.get('id') as string;

		const updates = {
			name: form.get('name'),
			email: form.get('email'),
			age: Number(form.get('age')),
			gender: form.get('gender'),
			goal: form.get('goal'),
			isSpecial: form.get('isSpecial') === 'true'
		};

		const { error } = await adminSupabase.from('profiles').update(updates).eq('id', id);
		if (error) return fail(500, { message: error.message });

		return { success: true };
	},

	deleteUser: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		await adminSupabase.from('profiles').delete().eq('id', id);
		return { success: true };
	}
};
