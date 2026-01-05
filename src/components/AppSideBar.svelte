<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Users, LogOut, Sun, ChartColumnBig, TrophyIcon } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
</script>

<Sidebar.Root class="border-r">
	<!-- CONTENT -->
	<Sidebar.Content class="px-2">
		<Sidebar.Group>
			<Sidebar.GroupLabel class="mb-4 text-2xl font-extrabold">LiFi Admin</Sidebar.GroupLabel>

			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<a href="/">
							<Sidebar.MenuButton>
								<ChartColumnBig class="h-4 w-4" />
								<span>Daily Report</span>
							</Sidebar.MenuButton>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a href="/users-management">
							<Sidebar.MenuButton>
								<Users class="h-4 w-4" />
								<span>User Management</span>
							</Sidebar.MenuButton>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a href="/subscriptions">
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
