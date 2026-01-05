<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { Mail } from 'lucide-svelte';

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

	let email = '';
	let error = '';
	let loading = false;
	let sent = false;

	const sendOtp = async () => {
		loading = true;
		error = '';

		const res = await fetch('/send-otp', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});

		const data = await res.json();
		if (!res.ok) error = data.error;
		else sent = true;

		loading = false;
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-muted/40 px-4">
	<Card class="w-full max-w-sm">
		<CardHeader>
			<CardTitle>{sent ? 'Check your email' : 'Welcome back'}</CardTitle>
			<CardDescription>
				{sent ? 'Enter the 6-digit code we sent you' : 'Sign in using a one-time code'}
			</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			{#if !sent}
				<div class="space-y-1">
					<Label>Email</Label>
					<div class="relative">
						<Mail class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
						<Input class="pl-9" placeholder="name@company.com" bind:value={email} />
					</div>
				</div>

				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}

				<Button onclick={sendOtp} disabled={loading} class="w-full">
					{loading ? 'Sending…' : 'Send Code'}
				</Button>
			{:else}
				<Button href="/verify" class="w-full">Enter verification code</Button>
			{/if}
		</CardContent>
	</Card>
</div>
