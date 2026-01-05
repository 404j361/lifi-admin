<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { PageServerData } from './$types';

	export let data: PageServerData;

	let platform = '';
	let plan = '';

	let dialogOpen = false;
	let confirmAction: 'renew' | 'expire' | 'update' | null = null;
	let selected: any = null;
	let editPlan = 'monthly';
</script>

<section class="space-y-6">
	<!-- Grant -->
	<Card>
		<CardHeader><CardTitle>Grant Subscription</CardTitle></CardHeader>
		<CardContent>
			<form method="POST" action="?/create" class="space-y-4">
				<Input name="email" placeholder="User email" required />

				<Select.Root type="single" name="plan" bind:value={plan}>
					<Select.Trigger class="w-full">{plan || 'Plan'}</Select.Trigger>
					<Select.Content>
						<Select.Item value="monthly">Monthly</Select.Item>
						<Select.Item value="yearly">Yearly</Select.Item>
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" name="platform" bind:value={platform}>
					<Select.Trigger class="w-full">{platform || 'Platform'}</Select.Trigger>
					<Select.Content>
						<Select.Item value="web">Web</Select.Item>
						<Select.Item value="ios">iOS</Select.Item>
						<Select.Item value="android">Android</Select.Item>
					</Select.Content>
				</Select.Root>

				<Button type="submit" class="w-full">Grant</Button>
			</form>
		</CardContent>
	</Card>

	<!-- List -->
	<Card>
		<CardHeader><CardTitle>Subscriptions</CardTitle></CardHeader>
		<CardContent>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b">
						<th class="p-3">User</th>
						<th class="p-3">Email</th>
						<th class="p-3">Plan</th>
						<th class="p-3">Platform</th>
						<th class="p-3">Status</th>
						<th class="p-3">Expires</th>
						<th class="p-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.subs as s}
						<tr class="border-b">
							<td class="p-3 text-center">{s.profiles?.name}</td>
							<td class="p-3 text-center">{s.profiles?.email}</td>
							<td class="p-3 text-center capitalize">{s.product_id}</td>
							<td class="p-3 text-center">{s.platform}</td>
							<td class="p-3 text-center">
								<span class={s.status === 'active' ? 'text-green-600' : 'text-red-500'}>
									{s.status}
								</span>
							</td>
							<td class="p-3 text-center">{new Date(s.current_period_end).toLocaleDateString()}</td>
							<td class="space-x-2 p-3 text-center">
								<Button
									size="sm"
									onclick={() => {
										selected = s;
										confirmAction = 'renew';
										dialogOpen = true;
									}}
								>
									Renew
								</Button>

								<Button
									size="sm"
									variant="destructive"
									onclick={() => {
										selected = s;
										confirmAction = 'expire';
										dialogOpen = true;
									}}
								>
									Expire
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</CardContent>
	</Card>

	<!-- Dialog -->
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>
					{confirmAction === 'renew'
						? 'Renew Subscription'
						: confirmAction === 'update'
							? 'Update Plan'
							: 'Expire Subscription'}
				</Dialog.Title>
			</Dialog.Header>

			{#if confirmAction === 'update'}
				<Select.Root type="single" bind:value={editPlan}>
					<Select.Trigger class="mb-4 w-full">{editPlan}</Select.Trigger>
					<Select.Content>
						<Select.Item value="monthly">Monthly</Select.Item>
						<Select.Item value="yearly">Yearly</Select.Item>
					</Select.Content>
				</Select.Root>
			{:else}
				<p class="mb-4 text-sm text-muted-foreground">
					{confirmAction === 'renew'
						? `Extend ${selected?.profiles?.email}'s subscription?`
						: `Expire ${selected?.profiles?.email}'s subscription now?`}
				</p>
			{/if}

			<form
				method="POST"
				action={confirmAction === 'renew'
					? '?/create'
					: confirmAction === 'update'
						? '?/update'
						: '?/expire'}
			>
				<input type="hidden" name="id" value={selected?.id} />
				<input type="hidden" name="email" value={selected?.profiles?.email} />
				<input type="hidden" name="platform" value={selected?.platform} />
				<input
					type="hidden"
					name="plan"
					value={confirmAction === 'update' ? editPlan : selected?.product_id}
				/>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}
						>Cancel</Button
					>
					<Button type="submit" variant={confirmAction === 'expire' ? 'destructive' : 'default'}
						>Confirm</Button
					>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</section>
