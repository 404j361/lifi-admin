import { adminSupabase } from '$lib/adminSupabase';
import type {
	SalesReportFilters,
	SalesReportPreset,
	SalesReportPoint,
	SalesReportResponse
} from '$lib/sales-report';

type CreatedAtRow = {
	created_at: string | null;
};

type SubscriptionMetricsRow = {
	status: string | null;
	platform: string | null;
	created_at: string | null;
	subscription_type: string | null;
};

type SubscriptionEventRow = {
	event_type: string | null;
};

type FilterRange = {
	preset: SalesReportPreset;
	start: Date;
	endExclusive: Date;
	startInput: string;
	endInput: string;
	label: string;
};

function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function startOfDay(date: Date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function startOfWeek(date: Date) {
	const day = date.getDay();
	const offset = day === 0 ? -6 : 1 - day;
	return startOfDay(addDays(date, offset));
}

function formatDateInput(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatRangeLabel(start: Date, endExclusive: Date) {
	const endInclusive = addDays(endExclusive, -1);
	const startLabel = start.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	const endLabel = endInclusive.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});

	if (startLabel === endLabel) return startLabel;
	return `${startLabel} - ${endLabel}`;
}

function parseDateInput(value: string | null) {
	if (!value) return null;

	const parsed = new Date(`${value}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return null;

	return startOfDay(parsed);
}

export function resolveSalesReportFilters(searchParams: URLSearchParams): FilterRange {
	const todayStart = startOfDay(new Date());
	const tomorrowStart = addDays(todayStart, 1);
	const startInput = parseDateInput(searchParams.get('start'));
	const endInput = parseDateInput(searchParams.get('end'));

	if (startInput && endInput && endInput >= startInput) {
		const endExclusive = addDays(endInput, 1);

		return {
			preset: 'custom',
			start: startInput,
			endExclusive,
			startInput: formatDateInput(startInput),
			endInput: formatDateInput(endInput),
			label: formatRangeLabel(startInput, endExclusive)
		};
	}

	const presetParam = searchParams.get('preset');
	const preset: Exclude<SalesReportPreset, 'custom'> =
		presetParam === 'today' || presetParam === 'week' || presetParam === 'year'
			? presetParam
			: 'month';

	let start = todayStart;
	if (preset === 'week') start = startOfWeek(todayStart);
	else if (preset === 'month') start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
	else if (preset === 'year') start = new Date(todayStart.getFullYear(), 0, 1);

	return {
		preset,
		start,
		endExclusive: tomorrowStart,
		startInput: formatDateInput(start),
		endInput: formatDateInput(addDays(tomorrowStart, -1)),
		label: formatRangeLabel(start, tomorrowStart)
	};
}

export function serializeSalesReportFilters(filters: FilterRange): SalesReportFilters {
	return {
		preset: filters.preset,
		startInput: filters.startInput,
		endInput: filters.endInput,
		label: filters.label
	};
}

function getDayKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function toTitleCase(value: string) {
	return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLabel(raw: string | null): string {
	const cleaned = raw?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
	if (!cleaned) return 'Unknown';
	return toTitleCase(cleaned);
}

function normalizeSubscriptionType(raw: string | null) {
	const cleaned = raw?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
	if (cleaned === 'giveway' || cleaned === 'giveaway') return 'giveaway';
	if (cleaned === 'subscription') return 'subscription';
	return cleaned;
}

function countByLabel(values: string[]): SalesReportPoint[] {
	const counts = new Map<string, number>();

	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count);
}

function buildRangeDailyStats(
	rows: CreatedAtRow[],
	start: Date,
	endExclusive: Date
): SalesReportPoint[] {
	const points: { key: string; label: string; count: number }[] = [];

	for (let cursor = new Date(start); cursor < endExclusive; cursor = addDays(cursor, 1)) {
		points.push({
			key: getDayKey(cursor),
			label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			count: 0
		});
	}

	const countMap = new Map(points.map((point) => [point.key, point]));

	for (const row of rows) {
		if (!row.created_at) continue;

		const createdAt = new Date(row.created_at);
		if (Number.isNaN(createdAt.getTime())) continue;

		const point = countMap.get(getDayKey(createdAt));
		if (point) point.count += 1;
	}

	return points.map(({ label, count }) => ({ label, count }));
}

function buildSubscriptionStatusStats(rows: SubscriptionMetricsRow[]): SalesReportPoint[] {
	return countByLabel(rows.map((row) => normalizeLabel(row.status)));
}

function buildPlatformStats(rows: SubscriptionMetricsRow[]): SalesReportPoint[] {
	return countByLabel(rows.map((row) => normalizeLabel(row.platform)));
}

function buildEventTypeStats(rows: SubscriptionEventRow[], limit = 8): SalesReportPoint[] {
	const points = countByLabel(rows.map((row) => normalizeLabel(row.event_type))).filter(
		(point) => point.label !== 'Unknown'
	);
	return points.slice(0, limit);
}

export async function loadSalesReport(searchParams: URLSearchParams): Promise<SalesReportResponse> {
	const filters = resolveSalesReportFilters(searchParams);

	const [{ count: usersInRange }, { data: subscriptionRows }, { data: subscriptionEventRows }] =
		await Promise.all([
			adminSupabase
				.from('profiles')
				.select('id', { count: 'exact', head: true })
				.gte('created_at', filters.start.toISOString())
				.lt('created_at', filters.endExclusive.toISOString()),
			adminSupabase
				.from('subscriptions')
				.select('status, platform, created_at, subscription_type')
				.gte('created_at', filters.start.toISOString())
				.lt('created_at', filters.endExclusive.toISOString()),
			adminSupabase
				.from('subscription_events')
				.select('event_type')
				.gte('created_at', filters.start.toISOString())
				.lt('created_at', filters.endExclusive.toISOString())
		]);

	const safeSubscriptionRows: SubscriptionMetricsRow[] = (subscriptionRows ??
		[]) as SubscriptionMetricsRow[];
	const safeSubscriptionEventRows: SubscriptionEventRow[] = (subscriptionEventRows ??
		[]) as SubscriptionEventRow[];

	const activeSubscriptions = safeSubscriptionRows.filter(
		(row) => normalizeLabel(row.status) === 'Active'
	).length;
	const totalSubscriptions = safeSubscriptionRows.length;
	const giveawayCount = safeSubscriptionRows.filter(
		(row) => normalizeSubscriptionType(row.subscription_type) === 'giveaway'
	).length;
	const paidCount = safeSubscriptionRows.filter(
		(row) => normalizeSubscriptionType(row.subscription_type) === 'subscription'
	).length;

	return {
		filters: serializeSalesReportFilters(filters),
		subscriptionKpis: {
			total: totalSubscriptions,
			active: activeSubscriptions,
			usersInRange: usersInRange ?? 0,
			conversionRate: usersInRange
				? Number(((activeSubscriptions / usersInRange) * 100).toFixed(1))
				: 0,
			giveawayCount,
			paidCount
		},
		subscriptionStatusStats: buildSubscriptionStatusStats(safeSubscriptionRows),
		platformStats: buildPlatformStats(safeSubscriptionRows),
		subscriptionTrendStats: buildRangeDailyStats(
			safeSubscriptionRows,
			filters.start,
			filters.endExclusive
		),
		eventTypeStats: buildEventTypeStats(safeSubscriptionEventRows)
	};
}
