<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart } from 'chart.js/auto';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	export let data: PageData;

	type GrowthTab = 'yearly' | 'monthly' | 'weekly';
	type GrowthPoint = { label: string; count: number };
	type SourcePoint = { source: string; count: number };
	type MetricPoint = { label: string; count: number };

	let growthTab: GrowthTab = 'weekly';
	let growthChart: Chart<'bar', number[], string> | null = null;
	let sourceChart: Chart<'pie', number[], string> | null = null;
	const extraCharts: Chart[] = [];

	const growthTabLabel: Record<GrowthTab, string> = {
		yearly: 'Yearly',
		weekly: 'Weekly',
		monthly: 'Monthly'
	};

	const growthDescription: Record<GrowthTab, string> = {
		yearly: 'Yearly new signups (all time)',
		weekly: 'Daily new signups in the last 7 days',
		monthly: 'Daily new signups in the last 30 days'
	};

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

	function getGrowthPoints(tab: GrowthTab): GrowthPoint[] {
		console.log(data.growthStats);
		return (data.growthStats?.[tab] ?? []) as GrowthPoint[];
	}

	function getSourcePoints(): SourcePoint[] {
		return (data.sourceStats ?? []) as SourcePoint[];
	}

	function getTodaySourcePoints(): SourcePoint[] {
		return (data.todaySourceStats ?? []) as SourcePoint[];
	}

	function getMetricPoints(points: MetricPoint[] | undefined): MetricPoint[] {
		return points ?? [];
	}

	function getColors(size: number): string[] {
		return Array.from({ length: size }, (_, index) => chartPalette[index % chartPalette.length]);
	}

	onMount(() => {
		const growthCanvas = document.getElementById('growthChart') as HTMLCanvasElement | null;
		const sourceCanvas = document.getElementById('sourceChart') as HTMLCanvasElement | null;

		if (growthCanvas) {
			const points = getGrowthPoints(growthTab);
			growthChart = new Chart(growthCanvas, {
				type: 'bar',
				data: {
					labels: points.map((point) => point.label),
					datasets: [
						{
							label: `${growthTabLabel[growthTab]} New Users`,
							data: points.map((point) => point.count),
							backgroundColor: 'rgba(59, 130, 246, 0.8)',
							borderColor: 'rgba(59, 130, 246, 1)',
							borderWidth: 1
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: true } },
					scales: { y: { beginAtZero: true } }
				}
			});
		}

		if (sourceCanvas) {
			const points = getSourcePoints();
			sourceChart = new Chart(sourceCanvas, {
				type: 'pie',
				data: {
					labels: points.map((point) => point.source),
					datasets: [
						{
							data: points.map((point) => point.count),
							backgroundColor: getColors(points.length)
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: true } }
				}
			});
		}

		const genderCanvas = document.getElementById('genderChart') as HTMLCanvasElement | null;
		if (genderCanvas) {
			const points = getMetricPoints(data.genderStats);
			extraCharts.push(
				new Chart(genderCanvas, {
					type: 'doughnut',
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

		const goalCanvas = document.getElementById('goalChart') as HTMLCanvasElement | null;
		if (goalCanvas) {
			const points = getMetricPoints(data.goalStats);
			extraCharts.push(
				new Chart(goalCanvas, {
					type: 'bar',
					data: {
						labels: points.map((point) => point.label),
						datasets: [{ label: 'Users', data: points.map((point) => point.count) }]
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

		const ageCanvas = document.getElementById('ageChart') as HTMLCanvasElement | null;
		if (ageCanvas) {
			const points = getMetricPoints(data.ageBucketStats);
			extraCharts.push(
				new Chart(ageCanvas, {
					type: 'bar',
					data: {
						labels: points.map((point) => point.label),
						datasets: [{ label: 'Users', data: points.map((point) => point.count) }]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: { y: { beginAtZero: true } }
					}
				})
			);
		}

		const subTrendCanvas = document.getElementById(
			'subscriptionTrendChart'
		) as HTMLCanvasElement | null;
		if (subTrendCanvas) {
			const points = getMetricPoints(data.subscriptionTrendStats);
			extraCharts.push(
				new Chart(subTrendCanvas, {
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

		return () => {
			growthChart?.destroy();
			sourceChart?.destroy();
			extraCharts.forEach((chart) => chart.destroy());
		};
	});

	$: if (growthChart) {
		const points = getGrowthPoints(growthTab);
		growthChart.data.labels = points.map((point) => point.label);
		growthChart.data.datasets[0].data = points.map((point) => point.count);
		growthChart.data.datasets[0].label = `${growthTabLabel[growthTab]} New Users`;
		growthChart.update();
	}
</script>

<section class="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>New Users Today</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">{data.todayCount}</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Total Users</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">{data.totalUsers}</h2>
		</CardContent>
	</Card>

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
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<CardTitle>Growth</CardTitle>
					<CardDescription>{growthDescription[growthTab]}</CardDescription>
				</div>
				<div class="flex gap-2">
					<Button
						size="sm"
						variant={growthTab === 'yearly' ? 'default' : 'outline'}
						onclick={() => (growthTab = 'yearly')}>Yearly</Button
					>
					<Button
						size="sm"
						variant={growthTab === 'monthly' ? 'default' : 'outline'}
						onclick={() => (growthTab = 'monthly')}>Monthly</Button
					>
					<Button
						size="sm"
						variant={growthTab === 'weekly' ? 'default' : 'outline'}
						onclick={() => (growthTab = 'weekly')}>Weekly</Button
					>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<canvas id="growthChart" style="width: 100%; height: 360px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Acquisition Sources (All Time)</CardTitle>
			<CardDescription>Where users came from overall</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="sourceChart" style="width: 100%; height: 360px;"></canvas>
		</CardContent>
	</Card>
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Gender Distribution</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="genderChart" style="width: 100%; height: 300px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Status</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="statusChart" style="width: 100%; height: 300px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Subscription Platform</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="platformChart" style="width: 100%; height: 300px;"></canvas>
		</CardContent>
	</Card>
</section>

<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Top Goals</CardTitle>
			<CardDescription>Most common user goals</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="goalChart" style="width: 100%; height: 360px;"></canvas>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Age Buckets</CardTitle>
		</CardHeader>
		<CardContent>
			<canvas id="ageChart" style="width: 100%; height: 360px;"></canvas>
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

<section class="mb-8 w-full">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Today&apos;s Source Breakdown</CardTitle>
			<CardDescription>Daily source list (separate from all-time pie chart)</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="overflow-x-auto">
				<table class="w-full table-auto border-collapse">
					<thead>
						<tr class="bg-muted text-left">
							<th class="p-3 text-card-foreground">Source</th>
							<th class="p-3 text-card-foreground">Users Today</th>
						</tr>
					</thead>
					<tbody>
						{#if getTodaySourcePoints().length === 0}
							<tr>
								<td class="p-3 text-card-foreground" colspan="2">No new users yet today.</td>
							</tr>
						{:else}
							{#each getTodaySourcePoints() as s, index (`${s.source}-${index}`)}
								<tr class="hover:bg-muted/50">
									<td class="p-3 text-card-foreground">{s.source}</td>
									<td class="p-3 text-card-foreground">{s.count}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</section>
