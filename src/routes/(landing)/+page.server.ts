import type { PageServerLoad } from './$types';
import { adminSupabase } from '$lib/adminSupabase';

export const load: PageServerLoad = async () => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// New users today
	const { count: todayCount } = await adminSupabase
		.from('profiles')
		.select('*', { count: 'exact', head: true })
		.gte('created_at', today.toISOString());

	// Total users
	const { count: totalUsers } = await adminSupabase
		.from('profiles')
		.select('*', { count: 'exact', head: true });

	// Source stats via RPC
	const { data: sourceStats } = await adminSupabase.rpc('source_stats');

	// Daily chart
	const { data: dailyStats } = await adminSupabase.rpc('daily_signup_stats');

	return {
		todayCount: todayCount || 0,
		totalUsers: totalUsers || 0,
		sourceStats: sourceStats || [],
		dailyStats: dailyStats || []
	};
};
