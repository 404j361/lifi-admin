import type { PageServerLoad } from './$types';
import { adminSupabase } from '$lib/adminSupabase';

type GrowthPoint = {
	label: string;
	count: number;
};

type SourcePoint = {
	source: string;
	count: number;
};

type MetricPoint = {
	label: string;
	count: number;
};

type CreatedAtRow = {
	created_at: string | null;
};

type ProfileSourceRow = {
	hearus: string | null;
};

type ProfileMetricsRow = {
	hearus: string | null;
	gender: string | null;
	goal: string | null;
	age: number | null;
};

type SubscriptionMetricsRow = {
	status: string | null;
	platform: string | null;
	created_at: string | null;
};

type SubscriptionEventRow = {
	event_type: string | null;
};

const sourceLabelMap: Record<string, string> = {
	tiktok: 'TikTok',
	'tik tok': 'TikTok',
	facebook: 'Facebook',
	instagram: 'Instagram',
	youtube: 'YouTube',
	twitter: 'Twitter',
	x: 'X',
	linkedin: 'LinkedIn',
	google: 'Google',
	reddit: 'Reddit',
	snapchat: 'Snapchat',
	'word of mouth': 'Word Of Mouth'
};

const ageBuckets = ['<18', '18-24', '25-34', '35-44', '45-54', '55+', 'Unknown'] as const;

function getDayKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getYearKey(date: Date) {
	return String(date.getFullYear());
}

function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function formatTimestampNoTimezone(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hour = String(date.getHours()).padStart(2, '0');
	const minute = String(date.getMinutes()).padStart(2, '0');
	const second = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function normalizeSource(raw: string | null): string {
	const cleaned = raw?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
	if (!cleaned) return 'Unknown';
	return sourceLabelMap[cleaned] ?? toTitleCase(cleaned);
}

function normalizeLabel(raw: string | null): string {
	const cleaned = raw?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
	if (!cleaned) return 'Unknown';
	return toTitleCase(cleaned);
}

function normalizeGender(raw: string | null): string {
	const cleaned = raw?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
	if (!cleaned) return 'Unknown';
	if (cleaned === 'm' || cleaned === 'male') return 'Male';
	if (cleaned === 'f' || cleaned === 'female') return 'Female';
	if (cleaned === 'other' || cleaned === 'non binary' || cleaned === 'non-binary')
		return 'Other';
	return toTitleCase(cleaned);
}

function toTitleCase(value: string): string {
	return value.replace(/\b\w/g, (char) => char.toUpperCase());
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

function buildYearlyStats(rows: CreatedAtRow[]): GrowthPoint[] {
	const currentYear = new Date().getFullYear();
	let minYear = currentYear;

	for (const row of rows) {
		if (!row.created_at) continue;
		const createdAt = new Date(row.created_at);
		if (Number.isNaN(createdAt.getTime())) continue;
		minYear = Math.min(minYear, createdAt.getFullYear());
	}

	const points = Array.from({ length: currentYear - minYear + 1 }, (_, index) => {
		const year = minYear + index;
		return {
			key: String(year),
			label: String(year),
			count: 0
		};
	});

	const countMap = new Map(points.map((point) => [point.key, point]));

	for (const row of rows) {
		if (!row.created_at) continue;

		const createdAt = new Date(row.created_at);
		if (Number.isNaN(createdAt.getTime())) continue;

		const key = getYearKey(createdAt);
		const point = countMap.get(key);
		if (point) point.count += 1;
	}

	return points.map(({ label, count }) => ({ label, count }));
}

function buildSourceStats(rows: ProfileSourceRow[]): SourcePoint[] {
	const counts = new Map<string, number>();

	for (const row of rows) {
		const source = normalizeSource(row.hearus);
		counts.set(source, (counts.get(source) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([source, count]) => ({ source, count }))
		.sort((a, b) => b.count - a.count);
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

function buildAgeBucketStats(rows: ProfileMetricsRow[]): MetricPoint[] {
	const counts = new Map<string, number>(ageBuckets.map((bucket) => [bucket, 0]));

	for (const row of rows) {
		const age = row.age;

		if (age == null || Number.isNaN(age)) {
			counts.set('Unknown', (counts.get('Unknown') ?? 0) + 1);
			continue;
		}

		if (age < 18) counts.set('<18', (counts.get('<18') ?? 0) + 1);
		else if (age < 25) counts.set('18-24', (counts.get('18-24') ?? 0) + 1);
		else if (age < 35) counts.set('25-34', (counts.get('25-34') ?? 0) + 1);
		else if (age < 45) counts.set('35-44', (counts.get('35-44') ?? 0) + 1);
		else if (age < 55) counts.set('45-54', (counts.get('45-54') ?? 0) + 1);
		else counts.set('55+', (counts.get('55+') ?? 0) + 1);
	}

	return ageBuckets.map((label) => ({ label, count: counts.get(label) ?? 0 }));
}

function buildGoalStats(rows: ProfileMetricsRow[], limit = 8): MetricPoint[] {
	const points = countByLabel(rows.map((row) => normalizeLabel(row.goal))).filter(
		(point) => point.label !== 'Unknown'
	);
	return points.slice(0, limit);
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

function countTodaySubscriptions(rows: SubscriptionMetricsRow[], todayStart: Date, tomorrowStart: Date) {
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

	const [
		{ count: todayCount },
		{ count: totalUsers },
		{ data: growthRows },
		{ data: todaySourceRows },
		{ data: profileMetricsRows },
		{ data: subscriptionRows },
		{ data: subscriptionEventRows }
	] = await Promise.all([
		adminSupabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', formatTimestampNoTimezone(todayStart))
			.lt('created_at', formatTimestampNoTimezone(tomorrowStart)),
		adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
		adminSupabase.from('profiles').select('created_at'),
		adminSupabase
			.from('profiles')
			.select('hearus')
			.gte('created_at', formatTimestampNoTimezone(todayStart))
			.lt('created_at', formatTimestampNoTimezone(tomorrowStart)),
		adminSupabase.from('profiles').select('hearus, gender, goal, age'),
		adminSupabase.from('subscriptions').select('status, platform, created_at'),
		adminSupabase
			.from('subscription_events')
			.select('event_type')
			.gte('created_at', yearlyStart.toISOString())
	]);

	const safeGrowthRows: CreatedAtRow[] = (growthRows ?? []) as CreatedAtRow[];
	const safeTodaySourceRows: ProfileSourceRow[] = (todaySourceRows ?? []) as ProfileSourceRow[];
	const safeProfileMetricsRows: ProfileMetricsRow[] = (profileMetricsRows ?? []) as ProfileMetricsRow[];
	const safeSubscriptionRows: SubscriptionMetricsRow[] =
		(subscriptionRows ?? []) as SubscriptionMetricsRow[];
	const safeSubscriptionEventRows: SubscriptionEventRow[] =
		(subscriptionEventRows ?? []) as SubscriptionEventRow[];

	const activeSubscriptions = safeSubscriptionRows.filter(
		(row) => normalizeLabel(row.status) === 'Active'
	).length;
	const totalSubscriptions = safeSubscriptionRows.length;

	return {
		todayCount: todayCount || 0,
		totalUsers: totalUsers || 0,
		sourceStats: buildSourceStats(
			safeProfileMetricsRows.map((row) => ({ hearus: row.hearus }) as ProfileSourceRow)
		),
		todaySourceStats: buildSourceStats(safeTodaySourceRows),
		growthStats: {
			yearly: buildYearlyStats(safeGrowthRows),
			weekly: buildRollingDailyStats(safeGrowthRows, 7),
			monthly: buildRollingDailyStats(safeGrowthRows, 30)
		},
		subscriptionKpis: {
			total: totalSubscriptions,
			active: activeSubscriptions,
			todayNew: countTodaySubscriptions(safeSubscriptionRows, todayStart, tomorrowStart),
			conversionRate: totalUsers ? Number(((activeSubscriptions / totalUsers) * 100).toFixed(1)) : 0
		},
		genderStats: countByLabel(safeProfileMetricsRows.map((row) => normalizeGender(row.gender))),
		goalStats: buildGoalStats(safeProfileMetricsRows),
		ageBucketStats: buildAgeBucketStats(safeProfileMetricsRows),
		subscriptionStatusStats: buildSubscriptionStatusStats(safeSubscriptionRows),
		platformStats: buildPlatformStats(safeSubscriptionRows),
		subscriptionTrendStats: buildSubscriptionTrend30(safeSubscriptionRows),
		eventTypeStats: buildEventTypeStats(safeSubscriptionEventRows)
	};
};
