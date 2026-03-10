import { isAdminRole } from '$lib/access';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolveSalesReportFilters, serializeSalesReportFilters } from '$lib/server/sales-report';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { profile } = await parent();
	if (!isAdminRole(profile?.role)) throw redirect(302, '/');

	const filters = resolveSalesReportFilters(url.searchParams);

	return {
		initialFilters: serializeSalesReportFilters(filters)
	};
};
