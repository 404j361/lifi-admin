import type { PageServerLoad } from './$types';
import { adminSupabase } from '$lib/adminSupabase';

type MetricPoint = {
	label: string;
	count: number;
};

type GrowthPoint = {
	label: string;
	count: number;
};

type CreatedAtRow = {
	created_at: string | null;
};

type SubscriptionMetricsRow = {
	status: string | null;
	platform: string | null;
	created_at: string | null;
};

type SubscriptionEventRow = {
	event_type: string | null;
};

function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function getDayKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function toTitleCase(value: string): string {
	return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLabel(raw: string | null): string {
	const cleaned = raw?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
	if (!cleaned) return 'Unknown';
	return toTitleCase(cleaned);
}

function countByLabel(values: string[]): MetricPoint[] {
	const counts = new Map<string, number>();

	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count);
}

function buildRollingDailyStats(rows: CreatedAtRow[], days: number): GrowthPoint[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const points = Array.from({ length: days }, (_, index) => {
		const date = addDays(today, index - (days - 1));
		return {
			key: getDayKey(date),
			label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			count: 0
		};
	});

	const countMap = new Map(points.map((point) => [point.key, point]));

	for (const row of rows) {
		if (!row.created_at) continue;

		const createdAt = new Date(row.created_at);
		if (Number.isNaN(createdAt.getTime())) continue;

		const key = getDayKey(createdAt);
		const point = countMap.get(key);
		if (point) point.count += 1;
	}

	return points.map(({ label, count }) => ({ label, count }));
}

function buildSubscriptionStatusStats(rows: SubscriptionMetricsRow[]): MetricPoint[] {
	return countByLabel(rows.map((row) => normalizeLabel(row.status)));
}

function buildPlatformStats(rows: SubscriptionMetricsRow[]): MetricPoint[] {
	return countByLabel(rows.map((row) => normalizeLabel(row.platform)));
}

function buildSubscriptionTrend30(rows: SubscriptionMetricsRow[]): GrowthPoint[] {
	const createdRows: CreatedAtRow[] = rows.map((row) => ({ created_at: row.created_at }));
	return buildRollingDailyStats(createdRows, 30);
}

function buildEventTypeStats(rows: SubscriptionEventRow[], limit = 8): MetricPoint[] {
	const points = countByLabel(rows.map((row) => normalizeLabel(row.event_type))).filter(
		(point) => point.label !== 'Unknown'
	);
	return points.slice(0, limit);
}

function countTodaySubscriptions(
	rows: SubscriptionMetricsRow[],
	todayStart: Date,
	tomorrowStart: Date
) {
	let count = 0;

	for (const row of rows) {
		if (!row.created_at) continue;
		const createdAt = new Date(row.created_at);
		if (Number.isNaN(createdAt.getTime())) continue;
		if (createdAt >= todayStart && createdAt < tomorrowStart) count += 1;
	}

	return count;
}

export const load: PageServerLoad = async () => {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const tomorrowStart = addDays(todayStart, 1);
	const yearlyStart = new Date(todayStart.getFullYear(), todayStart.getMonth() - 11, 1);

	const [{ count: totalUsers }, { data: subscriptionRows }, { data: subscriptionEventRows }] =
		await Promise.all([
			adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
			adminSupabase.from('subscriptions').select('status, platform, created_at'),
			adminSupabase
				.from('subscription_events')
				.select('event_type')
				.gte('created_at', yearlyStart.toISOString())
		]);

	const safeSubscriptionRows: SubscriptionMetricsRow[] = (subscriptionRows ??
		[]) as SubscriptionMetricsRow[];
	const safeSubscriptionEventRows: SubscriptionEventRow[] = (subscriptionEventRows ??
		[]) as SubscriptionEventRow[];

	const activeSubscriptions = safeSubscriptionRows.filter(
		(row) => normalizeLabel(row.status) === 'Active'
	).length;
	const totalSubscriptions = safeSubscriptionRows.length;

	return {
		subscriptionKpis: {
			total: totalSubscriptions,
			active: activeSubscriptions,
			todayNew: countTodaySubscriptions(safeSubscriptionRows, todayStart, tomorrowStart),
			conversionRate: totalUsers ? Number(((activeSubscriptions / totalUsers) * 100).toFixed(1)) : 0
		},
		subscriptionStatusStats: buildSubscriptionStatusStats(safeSubscriptionRows),
		platformStats: buildPlatformStats(safeSubscriptionRows),
		subscriptionTrendStats: buildSubscriptionTrend30(safeSubscriptionRows),
		eventTypeStats: buildEventTypeStats(safeSubscriptionEventRows)
	};
};
