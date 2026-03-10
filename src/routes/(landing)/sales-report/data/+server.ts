import { isAdminRole } from '$lib/access';
import { getCurrentUserProfile } from '$lib/server/auth';
import { loadSalesReport } from '$lib/server/sales-report';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { profile } = await getCurrentUserProfile(locals);
	if (!isAdminRole(profile?.role)) {
		return json({ error: 'Not authorized' }, { status: 403 });
	}

	const report = await loadSalesReport(url.searchParams);
	return json(report);
};
