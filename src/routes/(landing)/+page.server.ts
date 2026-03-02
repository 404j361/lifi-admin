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

type ProfileSourceRow = {
	hearus: string | null;
};

type ProfileMetricsRow = {
	hearus: string | null;
	gender: string | null;
	goal: string | null;
	age: number | null;
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
type CountRange = {
	start: Date;
	end: Date;
	label: string;
};

function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
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
	if (cleaned === 'other' || cleaned === 'non binary' || cleaned === 'non-binary') return 'Other';
	return toTitleCase(cleaned);
}

function toTitleCase(value: string): string {
	return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildRollingRanges(days: number, todayStart: Date): CountRange[] {
	return Array.from({ length: days }, (_, index) => {
		const start = addDays(todayStart, index - (days - 1));
		return {
			start,
			end: addDays(start, 1),
			label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
		};
	});
}

async function fetchCreatedAtCounts(table: 'profiles', ranges: CountRange[]) {
	const results = await Promise.all(
		ranges.map((range) =>
			adminSupabase
				.from(table)
				.select('id', { count: 'exact', head: true })
				.gte('created_at', range.start.toISOString())
				.lt('created_at', range.end.toISOString())
		)
	);

	return results.map(({ count }) => count ?? 0);
}

async function buildProfileRollingDailyStats(days: number, todayStart: Date): Promise<GrowthPoint[]> {
	const ranges = buildRollingRanges(days, todayStart);
	const counts = await fetchCreatedAtCounts('profiles', ranges);
	return ranges.map((range, index) => ({ label: range.label, count: counts[index] ?? 0 }));
}

async function buildProfileYearlyStats(todayStart: Date): Promise<GrowthPoint[]> {
	const currentYear = todayStart.getFullYear();

	const { data: oldestProfile } = await adminSupabase
		.from('profiles')
		.select('created_at')
		.not('created_at', 'is', null)
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();

	let minYear = currentYear;
	if (oldestProfile?.created_at) {
		const oldestDate = new Date(oldestProfile.created_at);
		if (!Number.isNaN(oldestDate.getTime())) minYear = oldestDate.getFullYear();
	}

	const ranges: CountRange[] = Array.from({ length: currentYear - minYear + 1 }, (_, index) => {
		const year = minYear + index;
		return {
			start: new Date(year, 0, 1),
			end: new Date(year + 1, 0, 1),
			label: String(year)
		};
	});

	const counts = await fetchCreatedAtCounts('profiles', ranges);
	return ranges.map((range, index) => ({ label: range.label, count: counts[index] ?? 0 }));
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

export const load: PageServerLoad = async () => {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const tomorrowStart = addDays(todayStart, 1);
	const monthlyGrowthPromise = buildProfileRollingDailyStats(30, todayStart);
	const yearlyGrowthPromise = buildProfileYearlyStats(todayStart);

	const [
		monthlyGrowth,
		yearlyGrowth,
		{ count: todayCount },
		{ count: totalUsers },
		{ data: todaySourceRows },
		{ data: profileMetricsRows }
	] = await Promise.all([
		monthlyGrowthPromise,
		yearlyGrowthPromise,
		adminSupabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', todayStart.toISOString())
			.lt('created_at', tomorrowStart.toISOString()),
		adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
		adminSupabase
			.from('profiles')
			.select('hearus')
			.gte('created_at', todayStart.toISOString())
			.lt('created_at', tomorrowStart.toISOString()),
		adminSupabase.from('profiles').select('hearus, gender, goal, age')
	]);

	const safeTodaySourceRows: ProfileSourceRow[] = (todaySourceRows ?? []) as ProfileSourceRow[];
	const safeProfileMetricsRows: ProfileMetricsRow[] = (profileMetricsRows ?? []) as ProfileMetricsRow[];

	return {
		todayCount: todayCount || 0,
		totalUsers: totalUsers || 0,
		sourceStats: buildSourceStats(
			safeProfileMetricsRows.map((row) => ({ hearus: row.hearus }) as ProfileSourceRow)
		),
		todaySourceStats: buildSourceStats(safeTodaySourceRows),
		growthStats: {
			yearly: yearlyGrowth,
			weekly: monthlyGrowth.slice(-7),
			monthly: monthlyGrowth
		},
		genderStats: countByLabel(safeProfileMetricsRows.map((row) => normalizeGender(row.gender))),
		goalStats: buildGoalStats(safeProfileMetricsRows),
		ageBucketStats: buildAgeBucketStats(safeProfileMetricsRows)
	};
};
