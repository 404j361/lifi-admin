<script lang="ts">
	import { supabase } from '$lib/supabase';

	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';

	let email = '';
	let token = '';
	let error = '';
	let loading = false;

	const verify = async () => {
		loading = true;
		error = '';
		const { error: e } = await supabase.auth.verifyOtp({
			email,
			token,
			type: 'email'
		});
		if (e) error = e.message;
		else goto('/');
		loading = false;
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-muted/40 px-4">
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle>Verify your login</CardTitle>
			<CardDescription>Enter the 6-digit code sent to your email</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<div class="space-y-1">
				<Label>Email</Label>
				<Input placeholder="name@company.com" bind:value={email} />
			</div>

			<div class="space-y-1">
				<Label>Verification code</Label>
				<Input placeholder="123456" bind:value={token} />
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}

			<Button onclick={verify} disabled={loading} class="w-full">
				{loading ? 'Verifying…' : 'Verify & Sign In'}
			</Button>
		</CardContent>
	</Card>
</div>
