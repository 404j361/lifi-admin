<script lang="ts">
	import { resolve } from '$app/paths';
	import { ADMIN_ROLE, SALE_ROLE, USER_ROLE } from '$lib/access';
	import type { PageData } from './$types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
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

	type UserRow = PageData['profiles'][number];

	export let data: PageData;

	let searchTerm = data.search || '';
	let editingUser: UserRow | null = null;
	let editOpen = false;
	let saving = false;
	let editError: string | null = null;
	let editSuccess = false;
	let deletingUser: UserRow | null = null;
	let deleteOpen = false;
	let deleting = false;
	let deleteError: string | null = null;

	const MAX_BUTTONS = 7;
	const roleOptions = [USER_ROLE, SALE_ROLE, ADMIN_ROLE] as const;

	$: searchTerm = data.search || '';
	$: totalPages = Math.ceil(data.count / data.pageSize);
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

	function openEdit(user: UserRow) {
		editingUser = { ...user };
		editOpen = true;
		editError = null;
		editSuccess = false;
	}

	function closeEdit() {
		editOpen = false;
		editingUser = null;
	}

	function openDelete(user: UserRow) {
		deletingUser = user;
		deleteOpen = true;
		deleteError = null;
	}

	function closeDelete() {
		deleteOpen = false;
		deletingUser = null;
	}

	function buildPageHref(p: number) {
		const params = new SvelteURLSearchParams();
		params.set('page', String(p));
		params.set('pageSize', String(data.pageSize));

		if (data.search) params.set('search', data.search);

		const query = params.toString();
		return query ? `${resolve('/users-management')}?${query}` : resolve('/users-management');
	}

	async function submitEdit() {
		if (!editingUser) return;

		saving = true;
		editError = null;
		editSuccess = false;

		const form = new FormData();
		form.append('id', editingUser.id);
		form.append('name', editingUser.name ?? '');
		form.append('email', editingUser.email ?? '');
		form.append('age', String(editingUser.age ?? ''));
		form.append('gender', editingUser.gender ?? '');
		form.append('goal', editingUser.goal ?? '');
		form.append('role', editingUser.role ?? USER_ROLE);
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
			location.reload();
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
		location.reload();
	}
</script>

<form method="GET" action={resolve('/users-management')} class="my-2 flex gap-2">
	<Input name="search" bind:value={searchTerm} placeholder="Search users" />
	<input type="hidden" name="page" value="1" />
	<input type="hidden" name="pageSize" value={data.pageSize} />
	<Button type="submit">Search</Button>
</form>

<table class="w-full border-collapse">
	<thead>
		<tr class="bg-muted">
			<th class="p-3 text-left">Name</th>
			<th class="p-3 text-left">Email</th>
			<th class="p-3 text-left">Age</th>
			<th class="p-3 text-left">Gender</th>
			<th class="p-3 text-left">Goal</th>
			<th class="p-3 text-left">Role</th>
			<th class="p-3 text-left">Special</th>
			<th class="p-3 text-left">Created</th>
			{#if data.canManageUsers}
				<th class="p-3 text-left">Actions</th>
			{/if}
		</tr>
	</thead>
	<tbody>
		{#each data.profiles as user (user.id)}
			<tr class="hover:bg-muted/50">
				<td class="p-3">{user.name}</td>
				<td class="p-3">{user.email}</td>
				<td class="p-3">{user.age}</td>
				<td class="p-3">{user.gender}</td>
				<td class="p-3">{user.goal}</td>
				<td class="p-3 capitalize">{user.role}</td>
				<td class="p-3">{user.isSpecial ? 'Yes' : 'No'}</td>
				<td class="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
				{#if data.canManageUsers}
					<td class="flex gap-2 p-3">
						<Button size="sm" variant="outline" onclick={() => openEdit(user)}>Edit</Button>
						<Button size="sm" variant="destructive" onclick={() => openDelete(user)}>Delete</Button>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

<div class="flex gap-2 py-2">
	{#each paginationPages as p, index (`${p}-${index}`)}
		{#if p === '...'}<span class="px-3 py-1">...</span>
		{:else}
			<Button
				href={buildPageHref(p as number)}
				size="sm"
				variant={p === data.page ? 'default' : 'outline'}>{p}</Button
			>
		{/if}
	{/each}
</div>

{#if data.canManageUsers && editOpen && editingUser}
	<Dialog open onOpenChange={(v) => !v && closeEdit()}>
		<DialogContent>
			<DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>

			<Input bind:value={editingUser.name} placeholder="Name" />
			<Input bind:value={editingUser.email} placeholder="Email" />
			<Input type="number" bind:value={editingUser.age} placeholder="Age" />

			<Select.Root
				type="single"
				value={editingUser?.gender ?? ''}
				onValueChange={(value) => {
					if (editingUser) editingUser.gender = value;
				}}
			>
				<Select.Trigger class="w-full">
					{editingUser?.gender}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="male">Male</Select.Item>
					<Select.Item value="female">Female</Select.Item>
					<Select.Item value="other">Other</Select.Item>
				</Select.Content>
			</Select.Root>

			<Input bind:value={editingUser.goal} placeholder="Goal" />

			<Select.Root
				type="single"
				value={editingUser?.role ?? USER_ROLE}
				onValueChange={(value) => {
					if (editingUser) editingUser.role = value;
				}}
			>
				<Select.Trigger class="w-full">
					{editingUser?.role ?? 'Role'}
				</Select.Trigger>
				<Select.Content>
					{#each roleOptions as roleOption (roleOption)}
						<Select.Item value={roleOption}>{roleOption}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<label class="mt-2 flex items-center gap-2">
				<input type="checkbox" bind:checked={editingUser.isSpecial} /> Special User
			</label>

			{#if editError}<p class="text-sm text-red-500">{editError}</p>{/if}
			{#if editSuccess}<p class="text-sm text-green-500">Saved ✓</p>{/if}

			<DialogFooter>
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}

{#if data.canManageUsers && deleteOpen && deletingUser}
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
					{deleting ? 'Deleting...' : 'Yes, Delete'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
