import type { Handle } from '@sveltejs/kit';
import { supabaseServer } from '$lib/supabaseServer';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = supabaseServer(event);
	return resolve(event);
};
