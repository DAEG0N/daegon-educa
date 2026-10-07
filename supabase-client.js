(() => {
  const SUPABASE_URL = "https://tomqxxcunalyvxvxvpjq.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VjuE5XWgESLBA4Pe7BcaOA_Bq-TB9kX";

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const state = { session: null, profile: null };

  function emitAuth() {
    window.dispatchEvent(new CustomEvent("daegon-auth-changed", {
      detail: { session: state.session, profile: state.profile }
    }));
  }

  async function loadProfile() {
    if (!state.session?.user) {
      state.profile = null;
      return null;
    }
    const { data, error } = await client
      .from("profiles")
      .select("id,institution_id,unit_id,full_name,role,active")
      .eq("id", state.session.user.id)
      .maybeSingle();
    if (error) throw error;
    state.profile = data || null;
    return state.profile;
  }

  async function init() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    state.session = data.session;
    await loadProfile();
    emitAuth();

    client.auth.onAuthStateChange((_event, session) => {
      setTimeout(async () => {
        state.session = session;
        try { await loadProfile(); } catch (e) { console.error(e); }
        emitAuth();
      }, 0);
    });

    return state;
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.session = data.session;
    await loadProfile();
    emitAuth();
    return { session: state.session, profile: state.profile };
  }

  async function signUp(email, password) {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    state.session = data.session;
    if (state.session) await loadProfile();
    emitAuth();
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    state.session = null;
    state.profile = null;
    emitAuth();
  }

  async function bootstrapAdmin(code, fullName) {
    if (!state.session) throw new Error("Entre na conta antes de ativar o administrador.");
    const { data, error } = await client.rpc("bootstrap_admin", {
      p_code: code,
      p_full_name: fullName
    });
    if (error) throw error;
    await loadProfile();
    emitAuth();
    return data;
  }

  async function loadStudents() {
    if (!state.profile) return [];
    const { data, error } = await client
      .from("students")
      .select(`
        id,registration_number,full_name,status,phone,birth_date,
        enrollments(status,classes(name)),
        student_guardians(is_primary,guardians(full_name,phone))
      `)
      .order("full_name", { ascending: true });
    if (error) throw error;

    return (data || []).map(row => {
      const currentEnrollment = (row.enrollments || []).find(e =>
        ["active","ready","documents","contract","draft"].includes(e.status)
      ) || (row.enrollments || [])[0];
      const primaryLink = (row.student_guardians || []).find(g => g.is_primary) || (row.student_guardians || [])[0];
      return {
        id: row.id,
        name: row.full_name,
        reg: row.registration_number || "—",
        class: currentEnrollment?.classes?.name || "—",
        status: row.status === "active" ? "active" : "pending",
        guardian: primaryLink?.guardians?.full_name || "—",
        phone: row.phone || primaryLink?.guardians?.phone || "—"
      };
    });
  }

  async function createStudent(input) {
    if (!state.profile) throw new Error("Sua conta ainda não está vinculada a uma instituição.");
    const year = new Date().getFullYear();
    const registration = input.registration_number ||
      `${year}-${String(Math.floor(Math.random() * 9000 + 1000))}`;

    const { data: student, error: studentError } = await client
      .from("students")
      .insert({
        institution_id: state.profile.institution_id,
        unit_id: state.profile.unit_id,
        registration_number: registration,
        full_name: input.name,
        birth_date: input.birth || null,
        phone: input.phone || null,
        status: input.status === "active" ? "active" : "pre_enrollment"
      })
      .select()
      .single();
    if (studentError) throw studentError;

    if (input.guardian?.trim()) {
      const { data: guardian, error: guardianError } = await client
        .from("guardians")
        .insert({
          institution_id: state.profile.institution_id,
          full_name: input.guardian.trim(),
          phone: input.phone || null
        })
        .select()
        .single();
      if (guardianError) throw guardianError;

      const { error: linkError } = await client
        .from("student_guardians")
        .insert({
          institution_id: state.profile.institution_id,
          student_id: student.id,
          guardian_id: guardian.id,
          is_primary: true
        });
      if (linkError) throw linkError;
    }

    if (input.className) {
      const { data: classRow } = await client
        .from("classes")
        .select("id,academic_period_id")
        .eq("name", input.className)
        .eq("active", true)
        .maybeSingle();

      if (classRow) {
        const { error: enrollmentError } = await client.from("enrollments").insert({
          institution_id: state.profile.institution_id,
          student_id: student.id,
          class_id: classRow.id,
          academic_period_id: classRow.academic_period_id,
          status: "active",
          enrolled_on: new Date().toISOString().slice(0,10)
        });
        if (enrollmentError) throw enrollmentError;
      }
    }

    return student;
  }

  window.DaegonDB = {
    client,
    state,
    init,
    loadProfile,
    signIn,
    signUp,
    signOut,
    bootstrapAdmin,
    loadStudents,
    createStudent
  };
})();