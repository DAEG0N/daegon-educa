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

  async function listUnits() {
    if (!state.profile) return [];
    const { data, error } = await sb
      .from("units")
      .select("id,name,active")
      .eq("institution_id", state.profile.institution_id)
      .eq("active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function listHolidays() {
    if (!state.profile) return [];
    const { data, error } = await sb
      .from("holidays")
      .select("id,unit_id,holiday_date,name,affects_finance,affects_library,active,units(name)")
      .eq("institution_id", state.profile.institution_id)
      .order("holiday_date", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function saveHoliday(input) {
    if (!state.profile) throw new Error("authentication_required");
    const payload = {
      institution_id: state.profile.institution_id,
      unit_id: input.unit_id || null,
      holiday_date: input.holiday_date,
      name: input.name,
      affects_finance: !!input.affects_finance,
      affects_library: !!input.affects_library,
      active: !!input.active
    };

    if (input.id) {
      const { data, error } = await sb
        .from("holidays")
        .update(payload)
        .eq("id", input.id)
        .select("id,unit_id,holiday_date,name,affects_finance,affects_library,active")
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await sb
      .from("holidays")
      .insert(payload)
      .select("id,unit_id,holiday_date,name,kind,affects_finance,active")
      .single();
    if (error) throw error;
    return data;
  }

  sb.auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.DaegonAuth = { sb, state, refresh, signIn, signOut, bootstrap, accessSearch, resetPassword, listUnits, listHolidays, saveHoliday };
})();