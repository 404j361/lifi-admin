import type { PageServerLoad, Actions } from './$types';
import { adminSupabase } from '$lib/adminSupabase';
import { fail } from '@sveltejs/kit';

type Plan = 'weekly' | 'monthly' | 'yearly';

export const load: PageServerLoad = async () => {
	const { data: subs } = await adminSupabase
		.from('subscriptions')
		.select(
			`
			id, product_id, platform, status, current_period_end,
			profiles(name,email)
		`
		)
		.order('created_at', { ascending: false });

	return { subs };
};

function addMonths(date: Date, months: number) {
	const d = new Date(date);
	d.setMonth(d.getMonth() + months);
	return d;
}

function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function parsePlan(value: FormDataEntryValue | null): Plan | null {
	if (value === 'weekly' || value === 'monthly' || value === 'yearly') return value;
	return null;
}

function addPlanDuration(date: Date, plan: Plan) {
	if (plan === 'weekly') return addDays(date, 7);
	if (plan === 'yearly') return addMonths(date, 12);
	return addMonths(date, 1);
}

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email'));
		const plan = parsePlan(form.get('plan'));
		const platform = String(form.get('platform'));
		if (!plan) return fail(400, { message: 'Invalid plan' });

		const { data: user } = await adminSupabase
			.from('profiles')
			.select('id')
			.eq('email', email)
			.single();

		if (!user) return fail(400, { message: 'User not found' });

		const { data: existing } = await adminSupabase
			.from('subscriptions')
			.select('*')
			.eq('user_id', user.id)
			.order('current_period_end', { ascending: false })
			.limit(1)
			.maybeSingle();

		const now = new Date();

		if (existing) {
			const base =
				new Date(existing.current_period_end) > now ? new Date(existing.current_period_end) : now;

			const newEnd = addPlanDuration(base, plan);

			await adminSupabase
				.from('subscriptions')
				.update({
					product_id: plan,
					current_period_end: newEnd,
					status: 'active'
				})
				.eq('id', existing.id);

			return { success: true, renewed: true };
		}

		const end = addPlanDuration(now, plan);

		await adminSupabase.from('subscriptions').insert({
			user_id: user.id,
			provider: 'manual',
			platform,
			product_id: plan,
			status: 'active',
			current_period_start: now,
			current_period_end: end,
			auto_renew: false
		});

		return { success: true, created: true };
	},

	expire: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id'));

		await adminSupabase
			.from('subscriptions')
			.update({
				status: 'expired'
			})
			.eq('id', id);

		return { success: true };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id'));
		const plan = parsePlan(form.get('plan'));
		const platform = String(form.get('platform'));
		if (!plan) return fail(400, { message: 'Invalid plan' });

		const { data: sub } = await adminSupabase
			.from('subscriptions')
			.select('*')
			.eq('id', id)
			.single();

		if (!sub) return fail(404, { message: 'Subscription not found' });

		const now = new Date();
		const base = new Date(sub.current_period_end) > now ? new Date(sub.current_period_end) : now;

		const newEnd = addPlanDuration(base, plan);

		await adminSupabase
			.from('subscriptions')
			.update({
				product_id: plan,
				platform,
				current_period_end: newEnd,
				status: 'active'
			})
			.eq('id', id);

		return { success: true };
	}
};
