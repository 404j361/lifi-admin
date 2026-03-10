type CurrentProfile = {
	id: string;
	name: string | null;
	email: string | null;
	role: string | null;
};

export async function getCurrentUserProfile(locals: App.Locals) {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		return { user: null, profile: null as CurrentProfile | null };
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('id,name,email,role')
		.eq('id', user.id)
		.maybeSingle();

	return {
		user,
		profile: (profile ?? null) as CurrentProfile | null
	};
}
