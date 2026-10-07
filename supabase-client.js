(() => {
  const URL = "https://tomqxxcunalyvxvxvpjq.supabase.co";
  const KEY = "sb_publishable_VjuE5XWgESLBA4Pe7BcaOA_Bq-TB9kX";
  const sb = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const state = { session: null, profile: null };

  async function refresh() {
    const { data } = await sb.auth.getSession();
    state.session = data.session || null;
    state.profile = null;
    if (state.session?.user) {
      const { data: profile } = await sb.from("profiles")
        .select("id,institution_id,full_name,role,active")
        .eq("id", state.session.user.id)
        .maybeSingle();
      state.profile = profile || null;
    }
    window.dispatchEvent(new CustomEvent("daegon-auth", { detail: { ...state } }));
    return state;
  }

  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refresh();
    return data;
  }

  async function signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    await refresh();
  }

  async function bootstrap(email, fullName, code) {
    const { data, error } = await sb.functions.invoke("bootstrap-admin", {
      body: { email, full_name: fullName, code }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function accessSearch(query="") {
    const { data, error } = await sb.functions.invoke("access-management", {
      body: { action: "search", query }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.accounts || [];
  }

  async function resetPassword(accountId) {
    const { data, error } = await sb.functions.invoke("access-management", {
      body: { action: "reset_password", account_id: accountId }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  sb.auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.DaegonAuth = { sb, state, refresh, signIn, signOut, bootstrap, accessSearch, resetPassword };
})();