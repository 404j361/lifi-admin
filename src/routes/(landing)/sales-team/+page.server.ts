import { isAdminRole } from '$lib/access';
import { adminSupabase } from '$lib/adminSupabase';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type SaleProfileRow = {
	id: string;
	name: string;
	email: string;
	created_at: string | null;
};

type ManagedSubscriptionRow = {
	managed_by: string | null;
	status: string | null;
};

export const load: PageServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	if (!isAdminRole(profile?.role)) throw redirect(302, '/');

	const [{ data: saleProfiles }, { data: managedSubscriptions }] = await Promise.all([
		adminSupabase
			.from('profiles')
			.select('id,name,email,created_at')
			.eq('role', 'sale')
			.order('created_at', { ascending: false }),
		adminSupabase.from('subscriptions').select('managed_by,status').not('managed_by', 'is', null)
	]);

	const soldCountByManager = new Map<string, { totalSold: number; activeSubscriptions: number }>();

	for (const subscription of (managedSubscriptions ?? []) as ManagedSubscriptionRow[]) {
		if (!subscription.managed_by) continue;

		const current = soldCountByManager.get(subscription.managed_by) ?? {
			totalSold: 0,
			activeSubscriptions: 0
		};

		current.totalSold += 1;
		if (subscription.status === 'active') current.activeSubscriptions += 1;
		soldCountByManager.set(subscription.managed_by, current);
	}

	const salesPeople = ((saleProfiles ?? []) as SaleProfileRow[])
		.map((salePerson) => {
			const counts = soldCountByManager.get(salePerson.id);

			return {
				...salePerson,
				totalSold: counts?.totalSold ?? 0,
				activeSubscriptions: counts?.activeSubscriptions ?? 0
			};
		})
		.sort((left, right) => right.totalSold - left.totalSold || left.name.localeCompare(right.name));

	return {
		salesPeople,
		summary: {
			totalSalesPeople: salesPeople.length,
			totalSubscriptionsSold: salesPeople.reduce(
				(sum, salePerson) => sum + salePerson.totalSold,
				0
			),
			topSeller: salesPeople[0] ?? null
		}
	};
};
