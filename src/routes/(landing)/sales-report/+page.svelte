<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart } from 'chart.js/auto';
	import type { PageData } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	export let data: PageData;

	type MetricPoint = { label: string; count: number };

	const extraCharts: Chart[] = [];

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

	function getMetricPoints(points: MetricPoint[] | undefined): MetricPoint[] {
		return points ?? [];
	}

	function getColors(size: number): string[] {
		return Array.from({ length: size }, (_, index) => chartPalette[index % chartPalette.length]);
	}

	onMount(() => {
		const statusCanvas = document.getElementById('statusChart') as HTMLCanvasElement | null;
		if (statusCanvas) {
			const points = getMetricPoints(data.subscriptionStatusStats);
			extraCharts.push(
				new Chart(statusCanvas, {
					type: 'pie',
					data: {
						labels: points.map((point) => point.label),
						datasets: [
							{
								data: points.map((point) => point.count),
								backgroundColor: getColors(points.length)
							}
						]
					},
					options: { responsive: true, maintainAspectRatio: false }
				})
			);
		}

		const platformCanvas = document.getElementById('platformChart') as HTMLCanvasElement | null;
		if (platformCanvas) {
			const points = getMetricPoints(data.platformStats);
			extraCharts.push(
				new Chart(platformCanvas, {
					type: 'bar',
					data: {
						labels: points.map((point) => point.label),
						datasets: [{ label: 'Subscriptions', data: points.map((point) => point.count) }]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: { y: { beginAtZero: true } }
					}
				})
			);
		}

		const trendCanvas = document.getElementById('subscriptionTrendChart') as HTMLCanvasElement | null;
		if (trendCanvas) {
			const points = getMetricPoints(data.subscriptionTrendStats);
			extraCharts.push(
				new Chart(trendCanvas, {
					type: 'line',
					data: {
						labels: points.map((point) => point.label),
						datasets: [
							{
								label: 'New Subscriptions',
								data: points.map((point) => point.count),
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
				})
			);
		}

		const eventCanvas = document.getElementById('eventChart') as HTMLCanvasElement | null;
		if (eventCanvas) {
			const points = getMetricPoints(data.eventTypeStats);
			extraCharts.push(
				new Chart(eventCanvas, {
					type: 'bar',
					data: {
						labels: points.map((point) => point.label),
						datasets: [{ label: 'Events', data: points.map((point) => point.count) }]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'y',
						scales: { x: { beginAtZero: true } }
					}
				})
			);
		}

		return () => extraCharts.forEach((chart) => chart.destroy());
	});
</script>

<h1 class="mb-6 text-2xl font-semibold">Sales Report</h1>

<section class="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Active Subs</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">{data.subscriptionKpis.active}</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Total Subs</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">{data.subscriptionKpis.total}</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>New Subs Today</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">{data.subscriptionKpis.todayNew}</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Conversion Rate</CardTitle>
			<CardDescription>Active subscriptions vs total users</CardDescription>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">
				{data.subscriptionKpis.conversionRate}%
			</h2>
		</CardContent>
	</Card>
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Status</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="statusChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Platform</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="platformChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>New Subscriptions (30 Days)</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="subscriptionTrendChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Events (12 Months)</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="eventChart" style="width: 100%; height: 320px;"></canvas>
		</CardContent>
	</Card>
</section>
