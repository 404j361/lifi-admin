<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSideBar from '../../components/AppSideBar.svelte';
	import ThemeToggle from '../../components/ThemeToggle.svelte';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<AppSideBar profile={data.profile} />
	<main class="w-full px-8 py-2">
		<div class="mb-4 flex items-center gap-2">
			<Sidebar.Trigger size="icon-lg" />
			<ThemeToggle />
		</div>
		{@render children?.()}
	</main>
</Sidebar.Provider>
