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

  async function listTeachers() {
    if (!state.profile) return [];
    const { data, error } = await sb.from("teachers")
      .select("id,registration_number,full_name,email,phone,status,cpf,unit_id")
      .eq("institution_id", state.profile.institution_id)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function getTeacher(id) {
    const { data, error } = await sb.from("teachers")
      .select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }

  async function saveTeacher(input) {
    if (!state.profile) throw new Error("authentication_required");
    const payload = {
      institution_id: state.profile.institution_id,
      unit_id: input.unit_id || null,
      registration_number: input.registration_number || null,
      full_name: input.full_name,
      gender: input.gender || null,
      marital_status: input.marital_status || null,
      birth_date: input.birth_date || null,
      race_color: input.race_color || null,
      phone: input.phone || null,
      cpf: input.cpf || null,
      rg: input.rg || null,
      rg_issuer: input.rg_issuer || null,
      rg_issue_date: input.rg_issue_date || null,
      father_name: input.father_name || null,
      mother_name: input.mother_name || null,
      nickname: input.nickname || null,
      email: input.email || null,
      address: input.address || null,
      inep_id: input.inep_id || null,
      admission_date: input.admission_date || null,
      folder_number: input.folder_number || null,
      religion: input.religion || null,
      birthplace: input.birthplace || null,
      nationality: input.nationality || null,
      passport_number: input.passport_number || null,
      birth_record_number: input.birth_record_number || null,
      birth_record_book: input.birth_record_book || null,
      birth_record_page: input.birth_record_page || null,
      birth_record_office: input.birth_record_office || null,
      birth_record_date: input.birth_record_date || null,
      turnstile_identifier: input.turnstile_identifier || null,
      fingerprint_registered: !!input.fingerprint_registered,
      status: input.status || "active"
    };
    if (input.id) {
      const { data, error } = await sb.from("teachers").update(payload).eq("id", input.id).select("*").single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from("teachers").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function listSubjects() {
    if (!state.profile) return [];
    const { data, error } = await sb.from("subjects")
      .select("id,name,code,active")
      .eq("institution_id", state.profile.institution_id)
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return data || [];
  }

  async function listPeriods() {
    if (!state.profile) return [];
    const { data, error } = await sb.from("academic_periods")
      .select("id,name,year,status")
      .eq("institution_id", state.profile.institution_id)
      .order("year", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function listClasses(periodId) {
    if (!state.profile) return [];
    let q = sb.from("classes")
      .select("id,name,academic_period_id,active")
      .eq("institution_id", state.profile.institution_id)
      .eq("active", true)
      .order("name");
    if (periodId) q = q.eq("academic_period_id", periodId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function listTeacherSubjects(teacherId) {
    const { data, error } = await sb.from("teacher_subjects")
      .select("id,subject_id,subjects(id,name,code)")
      .eq("teacher_id", teacherId);
    if (error) throw error;
    return data || [];
  }

  async function addTeacherSubject(teacherId, subjectId) {
    if (!state.profile) throw new Error("authentication_required");
    const { data, error } = await sb.from("teacher_subjects")
      .insert({ institution_id: state.profile.institution_id, teacher_id: teacherId, subject_id: subjectId })
      .select("id,subject_id").single();
    if (error) throw error;
    return data;
  }

  async function removeTeacherSubject(id) {
    const { error } = await sb.from("teacher_subjects").delete().eq("id", id);
    if (error) throw error;
  }

  async function listTeacherAssignments(teacherId, periodId) {
    let q = sb.from("teacher_assignments")
      .select("id,class_id,subject_id,workload_hours,classes(id,name,academic_period_id),subjects(id,name,code)")
      .eq("teacher_id", teacherId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = data || [];
    return periodId ? rows.filter(row => row.classes?.academic_period_id === periodId) : rows;
  }

  async function addTeacherAssignment(teacherId, classId, subjectId, workloadHours) {
    if (!state.profile) throw new Error("authentication_required");
    const { data, error } = await sb.from("teacher_assignments")
      .insert({
        institution_id: state.profile.institution_id,
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        workload_hours: workloadHours || null
      }).select("id").single();
    if (error) throw error;
    return data;
  }

  async function removeTeacherAssignment(id) {
    const { error } = await sb.from("teacher_assignments").delete().eq("id", id);
    if (error) throw error;
  }

  async function getTeacherAccess(teacherId) {
    const { data, error } = await sb.from("access_accounts")
      .select("id,login,email,active,last_password_reset_at,auth_user_id")
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function createTeacherAccess(teacherId, login) {
    const { data, error } = await sb.functions.invoke("access-management", {
      body: { action: "create_teacher_access", teacher_id: teacherId, login }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  sb.auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.DaegonAuth = {
    sb, state, refresh, signIn, signOut, bootstrap, accessSearch, resetPassword,
    listUnits, listHolidays, saveHoliday,
    listTeachers, getTeacher, saveTeacher, listSubjects, listPeriods, listClasses,
    listTeacherSubjects, addTeacherSubject, removeTeacherSubject,
    listTeacherAssignments, addTeacherAssignment, removeTeacherAssignment,
    getTeacherAccess, createTeacherAccess
  };
})();