<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSideBar from '../../components/AppSideBar.svelte';
	import ThemeToggle from '../../components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<Sidebar.Provider>
	<AppSideBar />
	<main class="w-full px-8 py-2">
		<div class="mb-4 flex items-center gap-2">
			<Sidebar.Trigger size="icon-lg" />
			<ThemeToggle />
		</div>
		{@render children?.()}
	</main>
</Sidebar.Provider>
