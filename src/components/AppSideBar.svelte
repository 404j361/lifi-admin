<script lang="ts">
	import { resolve } from '$app/paths';
	import { isAdminRole } from '$lib/access';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Users, LogOut, ChartColumnBig, TrophyIcon, DollarSign, Handshake } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';

	type Profile = {
		role?: string | null;
	};

	let { profile = null }: { profile?: Profile | null } = $props();
</script>

<Sidebar.Root class="border-r">
	<!-- CONTENT -->
	<Sidebar.Content class="px-2">
		<Sidebar.Group>
			<Sidebar.GroupLabel class="mb-4 text-2xl font-extrabold">LiFi Admin</Sidebar.GroupLabel>

			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<a href={resolve('/')}>
							<Sidebar.MenuButton>
								<ChartColumnBig class="h-4 w-4" />
								<span>User Report</span>
							</Sidebar.MenuButton>
						</a>
					</Sidebar.MenuItem>

					{#if isAdminRole(profile?.role)}
						<Sidebar.MenuItem>
							<a href={resolve('/sales-report')}>
								<Sidebar.MenuButton>
									<DollarSign class="h-4 w-4" />
									<span>Sales Report</span>
								</Sidebar.MenuButton>
							</a>
						</Sidebar.MenuItem>

						<Sidebar.MenuItem>
							<a href={resolve('/sales-team')}>
								<Sidebar.MenuButton>
									<Handshake class="h-4 w-4" />
									<span>Sales Team</span>
								</Sidebar.MenuButton>
							</a>
						</Sidebar.MenuItem>
					{/if}

					<Sidebar.MenuItem>
						<a href={resolve('/users-management')}>
							<Sidebar.MenuButton>
								<Users class="h-4 w-4" />
								<span>User Management</span>
							</Sidebar.MenuButton>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a href={resolve('/subscriptions')}>
							<Sidebar.MenuButton>
								<TrophyIcon class="h-4 w-4" />
								<span>Subscriptions</span>
							</Sidebar.MenuButton>
						</a>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<!-- FOOTER -->
	<Sidebar.Footer class="border-t p-4">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					onclick={async () => {
						await supabase.auth.signOut();
						location.reload();
					}}
				>
					<LogOut class="h-4 w-4" />
					<span>Logout</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
