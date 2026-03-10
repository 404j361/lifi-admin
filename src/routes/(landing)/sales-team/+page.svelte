<script lang="ts">
	import type { PageData } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	export let data: PageData;
</script>

<h1 class="mb-6 text-2xl font-semibold">Sales Team</h1>

<section class="mb-8 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Sales People</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">{data.summary.totalSalesPeople}</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Total Sold</CardTitle>
			<CardDescription>Subscriptions currently assigned to sales staff</CardDescription>
		</CardHeader>
		<CardContent>
			<h2 class="text-3xl font-bold text-card-foreground">
				{data.summary.totalSubscriptionsSold}
			</h2>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>Top Seller</CardTitle>
		</CardHeader>
		<CardContent>
			<h2 class="text-xl font-semibold text-card-foreground">
				{data.summary.topSeller?.name ?? 'No sales users yet'}
			</h2>
			<p class="text-sm text-muted-foreground">
				{data.summary.topSeller ? `${data.summary.topSeller.totalSold} subscriptions sold` : ''}
			</p>
		</CardContent>
	</Card>
</section>

<section class="w-full">
	<Card class="w-full">
		<CardHeader>
			<CardTitle>Salespeople</CardTitle>
			<CardDescription>Subscription count grouped by `subscriptions.managed_by`</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="overflow-x-auto">
				<table class="w-full table-auto border-collapse">
					<thead>
						<tr class="bg-muted text-left">
							<th class="p-3 text-card-foreground">Name</th>
							<th class="p-3 text-card-foreground">Email</th>
							<th class="p-3 text-card-foreground">Total Sold</th>
							<th class="p-3 text-card-foreground">Active Subscription Count</th>
							<th class="p-3 text-card-foreground">Created</th>
						</tr>
					</thead>
					<tbody>
						{#if data.salesPeople.length === 0}
							<tr>
								<td class="p-3 text-card-foreground" colspan="5">No sale users found.</td>
							</tr>
						{:else}
							{#each data.salesPeople as salePerson (salePerson.id)}
								<tr class="hover:bg-muted/50">
									<td class="p-3 text-card-foreground">{salePerson.name}</td>
									<td class="p-3 text-card-foreground">{salePerson.email}</td>
									<td class="p-3 text-card-foreground">{salePerson.totalSold}</td>
									<td class="p-3 text-card-foreground">{salePerson.activeSubscriptions}</td>
									<td class="p-3 text-card-foreground">
										{salePerson.created_at
											? new Date(salePerson.created_at).toLocaleDateString()
											: '-'}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</section>
