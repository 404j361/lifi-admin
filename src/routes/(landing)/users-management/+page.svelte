<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';

	export let data;

	$: searchTerm = data.search || '';
	$: pageSize = data.pageSize;
	$: totalPages = Math.ceil(data.count / pageSize);

	/* EDIT STATE */
	let editingUser: any = null;
	let editOpen = false;
	let saving = false;
	let editError: string | null = null;
	let editSuccess = false;

	/* DELETE STATE */
	let deletingUser: any = null;
	let deleteOpen = false;
	let deleting = false;
	let deleteError: string | null = null;

	const MAX_BUTTONS = 7;

	function openEdit(user: any) {
		editingUser = { ...user };
		editOpen = true;
		editError = null;
		editSuccess = false;
	}

	function closeEdit() {
		editOpen = false;
		editingUser = null;
	}

	function openDelete(user: any) {
		deletingUser = user;
		deleteOpen = true;
		deleteError = null;
	}

	function closeDelete() {
		deleteOpen = false;
		deletingUser = null;
	}

	$: paginationPages = (() => {
		const pages: (number | string)[] = [];
		const current = data.page;
		if (totalPages <= MAX_BUTTONS) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			const start = Math.max(current - 2, 2);
			const end = Math.min(current + 2, totalPages - 1);
			if (start > 2) pages.push('...');
			for (let i = start; i <= end; i++) pages.push(i);
			if (end < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	})();

	function goToPage(p: number) {
		const q = new URLSearchParams(window.location.search);
		q.set('page', String(p));
		searchTerm ? q.set('search', searchTerm) : q.delete('search');
		goto(`?${q}`);
	}

	async function submitEdit() {
		if (!editingUser) return;

		saving = true;
		editError = null;
		editSuccess = false;

		const form = new FormData();
		for (const k of ['id', 'name', 'email', 'age', 'gender', 'goal'])
			form.append(k, editingUser[k]);
		form.append('isSpecial', editingUser.isSpecial ? 'true' : 'false');

		const res = await fetch('?/editUser', { method: 'POST', body: form });
		saving = false;

		if (!res.ok) {
			editError = 'Failed to save changes.';
			return;
		}

		editSuccess = true;
		setTimeout(() => {
			closeEdit();
			goto(window.location.href, { invalidateAll: true });
		}, 700);
	}

	async function confirmDelete() {
		if (!deletingUser) return;

		deleting = true;
		deleteError = null;

		const form = new FormData();
		form.append('id', deletingUser.id);

		const res = await fetch('?/deleteUser', { method: 'POST', body: form });
		deleting = false;

		if (!res.ok) {
			deleteError = 'Failed to delete user.';
			return;
		}

		closeDelete();
		goto(window.location.href, { invalidateAll: true });
	}
</script>

<!-- SEARCH -->
<div class="my-2 flex gap-2">
	<Input
		bind:value={searchTerm}
		placeholder="Search users"
		onkeydown={(e) => e.key === 'Enter' && goToPage(1)}
	/>
	<Button onclick={() => goToPage(1)}>Search</Button>
</div>

<!-- TABLE -->
<table class="w-full border-collapse">
	<thead>
		<tr class="bg-muted">
			<th class="p-3 text-left">Name</th>
			<th class="p-3 text-left">Email</th>
			<th class="p-3 text-left">Age</th>
			<th class="p-3 text-left">Gender</th>
			<th class="p-3 text-left">Goal</th>
			<th class="p-3 text-left">Special</th>
			<th class="p-3 text-left">Created</th>
			<th class="p-3 text-left">Actions</th>
		</tr>
	</thead>
	<tbody>
		{#each data.profiles as user}
			<tr class="hover:bg-muted/50">
				<td class="p-3">{user.name}</td>
				<td class="p-3">{user.email}</td>
				<td class="p-3">{user.age}</td>
				<td class="p-3">{user.gender}</td>
				<td class="p-3">{user.goal}</td>
				<td class="p-3">{user.isSpecial ? 'Yes' : 'No'}</td>
				<td class="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
				<td class="flex gap-2 p-3">
					<Button size="sm" variant="outline" onclick={() => openEdit(user)}>Edit</Button>
					<Button size="sm" variant="destructive" onclick={() => openDelete(user)}>Delete</Button>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- PAGINATION -->
<div class="flex gap-2 py-2">
	{#each paginationPages as p}
		{#if p === '...'}<span class="px-3 py-1">…</span>
		{:else}
			<Button
				size="sm"
				variant={p === data.page ? 'default' : 'outline'}
				onclick={() => goToPage(p as number)}>{p}</Button
			>
		{/if}
	{/each}
</div>

<!-- EDIT MODAL -->
{#if editOpen && editingUser}
	<Dialog open onOpenChange={(v) => !v && closeEdit()}>
		<DialogContent>
			<DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>

			<Input bind:value={editingUser.name} placeholder="Name" />
			<Input bind:value={editingUser.email} placeholder="Email" />
			<Input type="number" bind:value={editingUser.age} placeholder="Age" />

			<Select.Root
				type="single"
				value={editingUser.gender}
				onValueChange={(v) => (editingUser.gender = v)}
			>
				<Select.Trigger class="w-full">
					{editingUser.gender}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="male">Male</Select.Item>
					<Select.Item value="female">Female</Select.Item>
					<Select.Item value="other">Other</Select.Item>
				</Select.Content>
			</Select.Root>

			<Input bind:value={editingUser.goal} placeholder="Goal" />

			<label class="mt-2 flex items-center gap-2">
				<input type="checkbox" bind:checked={editingUser.isSpecial} /> Special User
			</label>

			{#if editError}<p class="text-sm text-red-500">{editError}</p>{/if}
			{#if editSuccess}<p class="text-sm text-green-500">Saved ✓</p>{/if}

			<DialogFooter>
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}

<!-- DELETE MODAL -->
{#if deleteOpen && deletingUser}
	<Dialog open onOpenChange={(v) => !v && closeDelete()}>
		<DialogContent class="max-w-md">
			<DialogHeader><DialogTitle class="text-red-600">Delete User</DialogTitle></DialogHeader>

			<p class="text-sm">
				Delete <strong>{deletingUser.name}</strong>?
				<span class="block text-muted-foreground">{deletingUser.email}</span>
			</p>

			{#if deleteError}<p class="text-sm text-red-500">{deleteError}</p>{/if}

			<DialogFooter>
				<Button variant="outline" onclick={closeDelete} disabled={deleting}>Cancel</Button>
				<Button variant="destructive" onclick={confirmDelete} disabled={deleting}>
					{deleting ? 'Deleting…' : 'Yes, Delete'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
