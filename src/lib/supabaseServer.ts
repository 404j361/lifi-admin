import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';

export const supabaseServer = (event: Pick<RequestEvent, 'cookies'>) =>
	createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => event.cookies.get(key),
			set: (key, value, opts) => event.cookies.set(key, value, { ...opts, path: '/' }),
			remove: (key, opts) => event.cookies.delete(key, { ...opts, path: '/' })
		}
	});
