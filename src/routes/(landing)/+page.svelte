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

	onMount(() => {
		// Last 7 Days Growth - Bar Chart
		new Chart(document.getElementById('dailyChart') as HTMLCanvasElement, {
			type: 'bar',
			data: {
				labels: data.dailyStats.map((d: { day: string; count: number }) => d.day),
				datasets: [
					{
						label: 'New Users',
						data: data.dailyStats.map((d: { day: string; count: number }) => d.count),
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

		// Acquisition Sources Pie Chart
		new Chart(document.getElementById('sourceChart') as HTMLCanvasElement, {
			type: 'pie',
			data: {
				labels: data.sourceStats.map(
					(s: { hearus?: string; count: number }) => s.hearus || 'Unknown'
				),
				datasets: [
					{
						data: data.sourceStats.map((s: { hearus?: string; count: number }) => s.count),
						backgroundColor: [
							'#3B82F6',
							'#10B981',
							'#F59E0B',
							'#EF4444',
							'#8B5CF6',
							'#F472B6',
							'#22D3EE'
						]
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: true } }
			}
		});
	});
</script>

<!-- KPI Cards -->
<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>New Users Today</CardTitle>
			<CardDescription>Number of users joined today</CardDescription>
		</CardHeader>
		<CardContent>
			<h2 class="text-4xl font-bold text-card-foreground">{data.todayCount}</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Total Users</CardTitle>
			<CardDescription>All-time registered users</CardDescription>
		</CardHeader>
		<CardContent>
			<h2 class="text-4xl font-bold text-card-foreground">{data.totalUsers}</h2>
		</CardContent>
	</Card>
</section>

<!-- Charts Section -->
<section class="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
	<!-- Bar chart -->
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Last 7 Days Growth</CardTitle>
			<CardDescription>Daily new signups</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="dailyChart" style="width: 100%; height: 400px;"></canvas>
		</CardContent>
	</Card>

	<!-- Pie chart -->
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Acquisition Sources</CardTitle>
			<CardDescription>Where users came from</CardDescription>
		</CardHeader>
		<CardContent>
			<canvas id="sourceChart" style="width: 100%; height: 400px;"></canvas>
		</CardContent>
	</Card>
</section>

<!-- Source Breakdown Table -->
<section class="mb-8 w-full">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Source Breakdown</CardTitle>
			<CardDescription>User counts by acquisition source</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="overflow-x-auto">
				<table class="w-full table-auto border-collapse">
					<thead>
						<tr class="bg-muted text-left">
							<th class="p-3 text-card-foreground">Source</th>
							<th class="p-3 text-card-foreground">Users</th>
						</tr>
					</thead>
					<tbody>
						{#each data.sourceStats as s}
							<tr class="hover:bg-muted/50">
								<td class="p-3 text-card-foreground">{s.hearus || 'Unknown'}</td>
								<td class="p-3 text-card-foreground">{s.count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</section>
