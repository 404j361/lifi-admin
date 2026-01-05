import { supabaseServer } from '$lib/supabaseServer';

export const handle = async ({ event, resolve }) => {
	event.locals.supabase = supabaseServer(event);
	return resolve(event);
};
