<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Chart } from 'chart.js/auto';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type {
		SalesReportFilters,
		SalesReportPoint,
		SalesReportPreset,
		SalesReportResponse
	} from '$lib/sales-report';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	export let data: PageData;

	const emptyReport: SalesReportResponse = {
		filters: data.initialFilters,
		subscriptionKpis: {
			total: 0,
			active: 0,
			usersInRange: 0,
			conversionRate: 0,
			giveawayCount: 0,
			paidCount: 0
		},
		subscriptionStatusStats: [],
		platformStats: [],
		subscriptionTrendStats: [],
		eventTypeStats: []
	};

	let report: SalesReportResponse | null = null;
	let loading = false;
	let loadError: string | null = null;
	let hasLoaded = false;
	let activePreset: SalesReportPreset = data.initialFilters.preset;
	let startDate = data.initialFilters.startInput;
	let endDate = data.initialFilters.endInput;
	let activeRequest: AbortController | null = null;
	let statusChart: Chart<'pie', number[], string> | null = null;
	let platformChart: Chart<'bar', number[], string> | null = null;
	let trendChart: Chart<'line', number[], string> | null = null;
	let eventChart: Chart<'bar', number[], string> | null = null;

	const chartPalette = [
		'#3B82F6',
		'#10B981',
		'#F59E0B',
		'#EF4444',
		'#8B5CF6',
		'#F472B6',
		'#22D3EE',
		'#84CC16'
	];

	$: reportData = report ?? emptyReport;

	function getMetricPoints(points: SalesReportPoint[] | undefined): SalesReportPoint[] {
		return points ?? [];
	}

	function getColors(size: number): string[] {
		return Array.from({ length: size }, (_, index) => chartPalette[index % chartPalette.length]);
	}

	function syncFilterState(filters: SalesReportFilters) {
		activePreset = filters.preset;
		startDate = filters.startInput;
		endDate = filters.endInput;
	}

	function syncUrl(params: SvelteURLSearchParams) {
		const query = params.toString();
		const url = query ? `${resolve('/sales-report')}?${query}` : resolve('/sales-report');
		window.history.replaceState({}, '', url);
	}

	function buildRequestUrl(params: SvelteURLSearchParams) {
		const query = params.toString();
		return query ? `${resolve('/sales-report/data')}?${query}` : resolve('/sales-report/data');
	}

	async function fetchReport(params: SvelteURLSearchParams) {
		activeRequest?.abort();
		const controller = new AbortController();
		activeRequest = controller;
		loading = true;
		loadError = null;
		syncUrl(params);

		try {
			const response = await fetch(buildRequestUrl(params), { signal: controller.signal });
			if (!response.ok) throw new Error('Failed to load sales report');

			const payload = (await response.json()) as SalesReportResponse;
			if (controller.signal.aborted) return;

			report = payload;
			hasLoaded = true;
			syncFilterState(payload.filters);
		} catch (error) {
			if (controller.signal.aborted) return;
			loadError = error instanceof Error ? error.message : 'Failed to load sales report';
		} finally {
			if (activeRequest === controller) {
				loading = false;
			}
		}
	}

	function applyPreset(preset: Exclude<SalesReportPreset, 'custom'>) {
		const params = new SvelteURLSearchParams();
		params.set('preset', preset);
		void fetchReport(params);
	}

	function applyCustomRange() {
		if (!startDate || !endDate) {
			loadError = 'Select both start and end dates.';
			return;
		}

		if (startDate > endDate) {
			loadError = 'Start date must be before or equal to end date.';
			return;
		}

		const params = new SvelteURLSearchParams();
		params.set('start', startDate);
		params.set('end', endDate);
		void fetchReport(params);
	}

	function retryLoad() {
		const params = new SvelteURLSearchParams(window.location.search);
		if (!params.has('preset') && !params.has('start') && !params.has('end')) {
			params.set('preset', 'month');
		}
		void fetchReport(params);
	}

	onMount(() => {
		const params = new SvelteURLSearchParams(window.location.search);
		if (!params.has('preset') && !params.has('start') && !params.has('end')) {
			params.set('preset', 'month');
		}

		void fetchReport(params);

		const statusCanvas = document.getElementById('statusChart') as HTMLCanvasElement | null;
		const platformCanvas = document.getElementById('platformChart') as HTMLCanvasElement | null;
		const trendCanvas = document.getElementById(
			'subscriptionTrendChart'
		) as HTMLCanvasElement | null;
		const eventCanvas = document.getElementById('eventChart') as HTMLCanvasElement | null;

		if (statusCanvas) {
			statusChart = new Chart(statusCanvas, {
				type: 'pie',
				data: {
					labels: [],
					datasets: [{ data: [], backgroundColor: [] }]
				},
				options: { responsive: true, maintainAspectRatio: false }
			});
		}

		if (platformCanvas) {
			platformChart = new Chart(platformCanvas, {
				type: 'bar',
				data: {
					labels: [],
					datasets: [{ label: 'Subscriptions', data: [] }]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: { y: { beginAtZero: true } }
				}
			});
		}

		if (trendCanvas) {
			trendChart = new Chart(trendCanvas, {
				type: 'line',
				data: {
					labels: [],
					datasets: [
						{
							label: 'New Subscriptions',
							data: [],
							borderColor: '#10B981',
							backgroundColor: 'rgba(16, 185, 129, 0.25)',
							fill: true,
							tension: 0.3
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: { y: { beginAtZero: true } }
				}
			});
		}

		if (eventCanvas) {
			eventChart = new Chart(eventCanvas, {
				type: 'bar',
				data: {
					labels: [],
					datasets: [{ label: 'Events', data: [] }]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					indexAxis: 'y',
					scales: { x: { beginAtZero: true } }
				}
			});
		}

		return () => {
			activeRequest?.abort();
			statusChart?.destroy();
			platformChart?.destroy();
			trendChart?.destroy();
			eventChart?.destroy();
		};
	});

	$: if (statusChart) {
		const points = getMetricPoints(reportData.subscriptionStatusStats);
		statusChart.data.labels = points.map((point) => point.label);
		statusChart.data.datasets[0].data = points.map((point) => point.count);
		statusChart.data.datasets[0].backgroundColor = getColors(points.length);
		statusChart.update();
	}

	$: if (platformChart) {
		const points = getMetricPoints(reportData.platformStats);
		platformChart.data.labels = points.map((point) => point.label);
		platformChart.data.datasets[0].data = points.map((point) => point.count);
		platformChart.update();
	}

	$: if (trendChart) {
		const points = getMetricPoints(reportData.subscriptionTrendStats);
		trendChart.data.labels = points.map((point) => point.label);
		trendChart.data.datasets[0].data = points.map((point) => point.count);
		trendChart.update();
	}

	$: if (eventChart) {
		const points = getMetricPoints(reportData.eventTypeStats);
		eventChart.data.labels = points.map((point) => point.label);
		eventChart.data.datasets[0].data = points.map((point) => point.count);
		eventChart.update();
	}
</script>

<h1 class="mb-6 text-2xl font-semibold">Sales Report</h1>

<section class="mb-6 space-y-4">
	<div class="flex flex-wrap gap-2">
		<Button
			type="button"
			variant={activePreset === 'today' ? 'default' : 'outline'}
			onclick={() => applyPreset('today')}>Today</Button
		>
		<Button
			type="button"
			variant={activePreset === 'week' ? 'default' : 'outline'}
			onclick={() => applyPreset('week')}>This Week</Button
		>
		<Button
			type="button"
			variant={activePreset === 'month' ? 'default' : 'outline'}
			onclick={() => applyPreset('month')}>This Month</Button
		>
		<Button
			type="button"
			variant={activePreset === 'year' ? 'default' : 'outline'}
			onclick={() => applyPreset('year')}>Year</Button
		>
	</div>

	<form
		class="flex flex-wrap items-end gap-3"
		onsubmit={(event) => {
			event.preventDefault();
			applyCustomRange();
		}}
	>
		<div class="space-y-1">
			<label class="text-sm font-medium" for="sales-report-start">Start Date</label>
			<Input id="sales-report-start" type="date" bind:value={startDate} />
		</div>

		<div class="space-y-1">
			<label class="text-sm font-medium" for="sales-report-end">End Date</label>
			<Input id="sales-report-end" type="date" bind:value={endDate} />
		</div>

		<Button type="submit" disabled={loading}>Apply Range</Button>
	</form>

	<div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
		<p>Showing data for {reportData.filters.label}</p>
		{#if loading}
			<p>{hasLoaded ? 'Refreshing report...' : 'Loading report...'}</p>
		{/if}
	</div>

	{#if loadError}
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
		>
			<p class="text-sm text-destructive">{loadError}</p>
			<Button type="button" variant="outline" onclick={retryLoad}>Retry</Button>
		</div>
	{/if}
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Active Subs</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading && !hasLoaded}
				<Skeleton class="h-10 w-20" />
			{:else}
				<h2 class="text-3xl font-bold text-card-foreground">
					{reportData.subscriptionKpis.active}
				</h2>
			{/if}
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Total Subs</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading && !hasLoaded}
				<Skeleton class="h-10 w-20" />
			{:else}
				<h2 class="text-3xl font-bold text-card-foreground">{reportData.subscriptionKpis.total}</h2>
			{/if}
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Users In Range</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading && !hasLoaded}
				<Skeleton class="h-10 w-20" />
			{:else}
				<h2 class="text-3xl font-bold text-card-foreground">
					{reportData.subscriptionKpis.usersInRange}
				</h2>
			{/if}
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Conversion Rate</CardTitle>
			<CardDescription>Active subscriptions vs users in the selected range</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading && !hasLoaded}
				<Skeleton class="h-10 w-24" />
			{:else}
				<h2 class="text-3xl font-bold text-card-foreground">
					{reportData.subscriptionKpis.conversionRate}%
				</h2>
			{/if}
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Giveaway Subs</CardTitle>
			<CardDescription>`giveway` / `giveaway` in the selected period</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading && !hasLoaded}
				<Skeleton class="h-10 w-20" />
			{:else}
				<h2 class="text-3xl font-bold text-card-foreground">
					{reportData.subscriptionKpis.giveawayCount}
				</h2>
			{/if}
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Paid Subs</CardTitle>
			<CardDescription>`subscription` in the selected period</CardDescription>
		</CardHeader>
		<CardContent>
			{#if loading && !hasLoaded}
				<Skeleton class="h-10 w-20" />
			{:else}
				<h2 class="text-3xl font-bold text-card-foreground">
					{reportData.subscriptionKpis.paidCount}
				</h2>
			{/if}
		</CardContent>
	</Card>
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Status</CardTitle>
			<CardDescription>Breakdown for the selected range</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="statusChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Platform</CardTitle>
			<CardDescription>Platform mix for the selected range</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="platformChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>New Subscriptions</CardTitle>
			<CardDescription>Daily trend for the selected range</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="subscriptionTrendChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Events</CardTitle>
			<CardDescription>Event counts for the selected range</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="eventChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>
</section>
