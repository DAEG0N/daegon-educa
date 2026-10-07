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
      .select("id,registration_number,full_name,email,phone,status,cpf,unit_id,photo_path")
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
      .select("id,name,unit_id,course_id,grade_level,academic_period_id,active")
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


  async function listLearningPlatformUsers() {
    if (!state.profile) return [];
    const { data, error } = await sb.from("learning_platform_users")
      .select("id,person_type,external_id,full_name,birth_date,cpf,rg,phone,email,academic_email,active")
      .eq("institution_id", state.profile.institution_id)
      .eq("platform","az_lex")
      .order("full_name");
    if (error) throw error;
    return data || [];
  }

  async function getLearningPlatformUser(id) {
    const { data, error } = await sb.from("learning_platform_users").select("*").eq("id",id).single();
    if (error) throw error;
    return data;
  }

  async function saveLearningPlatformUser(input) {
    if (!state.profile) throw new Error("authentication_required");
    const payload={
      institution_id:state.profile.institution_id,
      platform:"az_lex",
      person_type:input.person_type,
      external_id:input.external_id||null,
      full_name:input.full_name,
      birth_date:input.birth_date||null,
      cpf:input.cpf||null,
      rg:input.rg||null,
      phone:input.phone||null,
      email:input.email||null,
      academic_email:input.academic_email||null,
      active:!!input.active
    };
    if(input.id){
      const {data,error}=await sb.from("learning_platform_users").update(payload).eq("id",input.id).select("*").single();
      if(error) throw error; return data;
    }
    const {data,error}=await sb.from("learning_platform_users").insert(payload).select("*").single();
    if(error) throw error; return data;
  }

  async function listLearningProfiles(userId){
    const {data,error}=await sb.from("learning_platform_user_profiles").select("id,profile_name").eq("platform_user_id",userId).order("profile_name");
    if(error) throw error; return data||[];
  }
  async function addLearningProfile(userId,profileName){
    if(!state.profile) throw new Error("authentication_required");
    const {data,error}=await sb.from("learning_platform_user_profiles").insert({
      institution_id:state.profile.institution_id,platform_user_id:userId,profile_name:profileName
    }).select("id,profile_name").single();
    if(error) throw error; return data;
  }
  async function removeLearningProfile(id){
    const {error}=await sb.from("learning_platform_user_profiles").delete().eq("id",id);
    if(error) throw error;
  }

  async function listLearningGuardians(){
    if(!state.profile) return [];
    const {data,error}=await sb.from("learning_platform_users")
      .select("id,full_name,cpf,email,active")
      .eq("institution_id",state.profile.institution_id)
      .eq("platform","az_lex")
      .eq("person_type","guardian")
      .eq("active",true)
      .order("full_name");
    if(error) throw error; return data||[];
  }
  async function getLearningGuardianLink(studentUserId){
    const {data,error}=await sb.from("learning_platform_user_guardians")
      .select("id,guardian_platform_user_id")
      .eq("student_platform_user_id",studentUserId).maybeSingle();
    if(error) throw error;
    if(!data) return null;
    const {data:guardian,error:gError}=await sb.from("learning_platform_users")
      .select("id,full_name").eq("id",data.guardian_platform_user_id).single();
    if(gError) throw gError;
    return {...data, guardian};
  }
  async function setLearningGuardian(studentUserId,guardianUserId){
    if(!state.profile) throw new Error("authentication_required");
    const {data:old,error:oldError}=await sb.from("learning_platform_user_guardians").select("id").eq("student_platform_user_id",studentUserId);
    if(oldError) throw oldError;
    if(old&&old.length){const {error}=await sb.from("learning_platform_user_guardians").delete().eq("student_platform_user_id",studentUserId); if(error) throw error;}
    if(!guardianUserId) return null;
    const {data,error}=await sb.from("learning_platform_user_guardians").insert({
      institution_id:state.profile.institution_id,student_platform_user_id:studentUserId,guardian_platform_user_id:guardianUserId
    }).select("id,guardian_platform_user_id").single();
    if(error) throw error; return data;
  }

  async function listLearningClassLinks(userId){
    const {data,error}=await sb.from("learning_platform_class_links")
      .select("id,unit_id,class_id,profile_name,status,units(name),classes(name)")
      .eq("platform_user_id",userId).order("created_at");
    if(error) throw error; return data||[];
  }
  async function addLearningClassLink(userId,unitId,classId,profileName){
    if(!state.profile) throw new Error("authentication_required");
    const {data,error}=await sb.from("learning_platform_class_links").insert({
      institution_id:state.profile.institution_id,platform_user_id:userId,unit_id:unitId,class_id:classId,profile_name:profileName,status:"active"
    }).select("id").single();
    if(error) throw error; return data;
  }
  async function removeLearningClassLink(id){
    const {error}=await sb.from("learning_platform_class_links").delete().eq("id",id);
    if(error) throw error;
  }


  async function listAcademicCourses() {
    if (!state.profile) return [];
    const { data, error } = await sb.from("academic_courses")
      .select("id,name,code,active")
      .eq("institution_id", state.profile.institution_id)
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return data || [];
  }

  async function listDocumentTypes() {
    if (!state.profile) return [];
    const { data, error } = await sb.from("document_types")
      .select("id,name,code,default_due_days,active")
      .eq("institution_id", state.profile.institution_id)
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return data || [];
  }

  async function listDocumentPendencies() {
    if (!state.profile) return [];
    const institutionId = state.profile.institution_id;
    const { data: docs, error: docsError } = await sb.from("student_documents")
      .select("id,student_id,enrollment_id,document_type_id,status,due_date,created_at,updated_at")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: true });
    if (docsError) throw docsError;
    if (!docs?.length) return [];

    const uniq = values => [...new Set(values.filter(Boolean))];
    const studentIds = uniq(docs.map(x => x.student_id));
    const enrollmentIds = uniq(docs.map(x => x.enrollment_id));
    const typeIds = uniq(docs.map(x => x.document_type_id));

    const [studentsRes, enrollmentsRes, typesRes, reminderRes, guardianLinksRes] = await Promise.all([
      sb.from("students").select("id,full_name,registration_number").in("id", studentIds),
      enrollmentIds.length ? sb.from("enrollments").select("id,student_id,class_id,academic_period_id,status,enrolled_on,financial_guardian_id").in("id", enrollmentIds) : Promise.resolve({data:[],error:null}),
      sb.from("document_types").select("id,name,code,default_due_days").in("id", typeIds),
      sb.from("document_reminders").select("id,student_document_id,guardian_id,status,prepared_at,sent_at").in("student_document_id", docs.map(x=>x.id)).order("prepared_at",{ascending:false}),
      sb.from("student_guardians").select("student_id,guardian_id,is_primary,is_financial").in("student_id", studentIds)
    ]);
    for (const res of [studentsRes,enrollmentsRes,typesRes,reminderRes,guardianLinksRes]) if (res.error) throw res.error;

    const enrollments = enrollmentsRes.data || [];
    const classIds = uniq(enrollments.map(x=>x.class_id));
    const periodIds = uniq(enrollments.map(x=>x.academic_period_id));
    const financialGuardianIds = uniq(enrollments.map(x=>x.financial_guardian_id));
    const guardianLinkIds = uniq((guardianLinksRes.data||[]).map(x=>x.guardian_id));
    const guardianIds = uniq([...financialGuardianIds,...guardianLinkIds]);

    const [classesRes,periodsRes,coursesRes,guardiansRes] = await Promise.all([
      classIds.length ? sb.from("classes").select("id,name,grade_level,course_id,academic_period_id,unit_id").in("id",classIds) : Promise.resolve({data:[],error:null}),
      periodIds.length ? sb.from("academic_periods").select("id,name,year,status").in("id",periodIds) : Promise.resolve({data:[],error:null}),
      sb.from("academic_courses").select("id,name,code").eq("institution_id",institutionId),
      guardianIds.length ? sb.from("guardians").select("id,full_name,phone,email").in("id",guardianIds) : Promise.resolve({data:[],error:null})
    ]);
    for (const res of [classesRes,periodsRes,coursesRes,guardiansRes]) if (res.error) throw res.error;

    const map = arr => new Map((arr||[]).map(x=>[x.id,x]));
    const students=map(studentsRes.data), enrollmentMap=map(enrollments), types=map(typesRes.data),
      classes=map(classesRes.data), periods=map(periodsRes.data), courses=map(coursesRes.data), guardians=map(guardiansRes.data);
    const guardianLinks=guardianLinksRes.data||[];
    const reminders=reminderRes.data||[];

    const addDays=(value,days)=>{
      if(!value)return null;
      const d=new Date(value); if(Number.isNaN(d.getTime()))return null;
      d.setDate(d.getDate()+days); return d.toISOString().slice(0,10);
    };

    return docs.map(doc=>{
      const student=students.get(doc.student_id)||null;
      const enrollment=enrollmentMap.get(doc.enrollment_id)||null;
      const type=types.get(doc.document_type_id)||null;
      const classRow=enrollment?classes.get(enrollment.class_id)||null:null;
      const period=enrollment?periods.get(enrollment.academic_period_id)||null:null;
      const course=classRow?.course_id?courses.get(classRow.course_id)||null:null;
      const links=guardianLinks.filter(x=>x.student_id===doc.student_id);
      const financialLink=links.find(x=>x.is_financial)||links.find(x=>x.is_primary)||links[0]||null;
      const guardianId=enrollment?.financial_guardian_id||financialLink?.guardian_id||null;
      const guardian=guardianId?guardians.get(guardianId)||null:null;
      const latest=reminders.find(x=>x.student_document_id===doc.id)||null;
      const dueDays=type?.default_due_days??30;
      const deadline=doc.due_date||addDays(doc.created_at,dueDays);
      return { ...doc, student, enrollment, document_type:type, class_row:classRow, period, course, guardian, latest_reminder:latest, deadline, due_days:dueDays };
    });
  }

  async function prepareDocumentReminder(row, message) {
    if (!state.profile) throw new Error("authentication_required");
    const { data, error } = await sb.from("document_reminders").insert({
      institution_id: state.profile.institution_id,
      student_document_id: row.id,
      student_id: row.student_id,
      guardian_id: row.guardian?.id || null,
      channel: "whatsapp",
      message,
      status: "prepared",
      created_by: state.profile.id
    }).select("id,status,prepared_at").single();
    if (error) throw error;
    return data;
  }

  async function markDocumentReminderSent(id) {
    const { data, error } = await sb.from("document_reminders")
      .update({ status:"sent", sent_at:new Date().toISOString() })
      .eq("id", id)
      .select("id,status,sent_at")
      .single();
    if (error) throw error;
    return data;
  }


  async function listStudentsForPhotos() {
    if (!state.profile) return [];
    const institutionId = state.profile.institution_id;
    const { data: studentRows, error: studentError } = await sb.from("students")
      .select("id,registration_number,full_name,status,phone,photo_path")
      .eq("institution_id", institutionId)
      .order("full_name");
    if (studentError) throw studentError;
    if (!studentRows?.length) return [];

    const ids = studentRows.map(x => x.id);
    const [enrollRes, linkRes] = await Promise.all([
      sb.from("enrollments")
        .select("student_id,class_id,status,updated_at")
        .eq("institution_id", institutionId)
        .in("student_id", ids),
      sb.from("student_guardians")
        .select("student_id,guardian_id,is_primary,is_financial")
        .eq("institution_id", institutionId)
        .in("student_id", ids)
    ]);
    if (enrollRes.error) throw enrollRes.error;
    if (linkRes.error) throw linkRes.error;

    const enrollments = enrollRes.data || [];
    const links = linkRes.data || [];
    const classIds = [...new Set(enrollments.map(x=>x.class_id).filter(Boolean))];
    const guardianIds = [...new Set(links.map(x=>x.guardian_id).filter(Boolean))];

    const [classRes, guardianRes] = await Promise.all([
      classIds.length ? sb.from("classes").select("id,name").in("id",classIds) : Promise.resolve({data:[],error:null}),
      guardianIds.length ? sb.from("guardians").select("id,full_name,phone").in("id",guardianIds) : Promise.resolve({data:[],error:null})
    ]);
    if (classRes.error) throw classRes.error;
    if (guardianRes.error) throw guardianRes.error;

    const classMap = new Map((classRes.data||[]).map(x=>[x.id,x]));
    const guardianMap = new Map((guardianRes.data||[]).map(x=>[x.id,x]));

    return studentRows.map(s=>{
      const studentEnrollments=enrollments.filter(x=>x.student_id===s.id)
        .sort((a,b)=>String(b.updated_at||"").localeCompare(String(a.updated_at||"")));
      const enrollment=studentEnrollments.find(x=>["active","ready","documents","contract","draft"].includes(x.status))||studentEnrollments[0]||null;
      const studentLinks=links.filter(x=>x.student_id===s.id);
      const link=studentLinks.find(x=>x.is_primary)||studentLinks.find(x=>x.is_financial)||studentLinks[0]||null;
      const guardian=link?guardianMap.get(link.guardian_id)||null:null;
      return {
        id:s.id,
        name:s.full_name,
        reg:s.registration_number||"—",
        class:enrollment?classMap.get(enrollment.class_id)?.name||"—":"—",
        status:s.status==="active"?"active":"pending",
        guardian:guardian?.full_name||"—",
        phone:s.phone||guardian?.phone||"—",
        photo_path:s.photo_path||null
      };
    });
  }

  async function signedProfilePhotoUrl(path, expiresIn=3600) {
    if (!path) return null;
    const { data, error } = await sb.storage.from("school-files").createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data?.signedUrl || null;
  }

  async function uploadProfilePhoto(personType, personId, blob) {
    if (!state.profile) throw new Error("authentication_required");
    if (!["students","teachers"].includes(personType)) throw new Error("invalid_person_type");
    const path = state.profile.institution_id + "/people/" + personType + "/" + personId + "/profile.jpg";
    const { error: uploadError } = await sb.storage.from("school-files").upload(path, blob, {
      contentType:"image/jpeg",
      cacheControl:"3600",
      upsert:true
    });
    if (uploadError) throw uploadError;

    const { data, error: updateError } = await sb.from(personType)
      .update({ photo_path:path })
      .eq("id",personId)
      .select("id,photo_path")
      .single();
    if (updateError) {
      await sb.storage.from("school-files").remove([path]);
      throw updateError;
    }
    return data;
  }

  async function removeProfilePhoto(personType, personId, path) {
    if (!state.profile) throw new Error("authentication_required");
    if (!["students","teachers"].includes(personType)) throw new Error("invalid_person_type");
    if (path) {
      const { error: removeError } = await sb.storage.from("school-files").remove([path]);
      if (removeError && !String(removeError.message||"").toLowerCase().includes("not found")) throw removeError;
    }
    const { data, error } = await sb.from(personType)
      .update({ photo_path:null })
      .eq("id",personId)
      .select("id,photo_path")
      .single();
    if (error) throw error;
    return data;
  }


  async function getYearStartRoutine(periodId) {
    if (!state.profile || !periodId) return null;
    const { data: routine, error } = await sb.from("annual_routines")
      .select("id,academic_period_id,status,started_at,completed_at,created_at")
      .eq("institution_id", state.profile.institution_id)
      .eq("academic_period_id", periodId)
      .eq("routine_type", "year_start")
      .maybeSingle();
    if (error) throw error;
    if (!routine) return null;

    const { data: items, error: itemsError } = await sb.from("annual_routine_items")
      .select("id,item_key,sequence,title,source_step,target_view,target_tab,dependency_note,status,notes,completed_at,completed_by")
      .eq("routine_id", routine.id)
      .order("sequence");
    if (itemsError) throw itemsError;
    return { ...routine, items: items || [] };
  }

  async function createYearStartRoutine(periodId) {
    const { data, error } = await sb.rpc("create_year_start_routine", {
      p_academic_period_id: periodId
    });
    if (error) throw error;
    return data;
  }

  async function updateYearRoutineItem(itemId, status, notes) {
    const payload = {
      status,
      notes: notes || null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      completed_by: status === "completed" ? state.profile?.id || null : null
    };
    const { data, error } = await sb.from("annual_routine_items")
      .update(payload)
      .eq("id", itemId)
      .select("id,status,notes,completed_at,completed_by")
      .single();
    if (error) throw error;
    return data;
  }


  async function listBroadcastLists() {
    if (!state.profile) return [];
    const { data: lists, error } = await sb.from("broadcast_lists")
      .select("id,name,active,created_at,updated_at")
      .eq("institution_id", state.profile.institution_id)
      .order("name");
    if (error) throw error;
    if (!lists?.length) return [];

    const ids=lists.map(x=>x.id);
    const { data: contacts, error: contactError } = await sb.from("broadcast_list_contacts")
      .select("list_id")
      .in("list_id",ids);
    if (contactError) throw contactError;

    const counts=new Map();
    (contacts||[]).forEach(x=>counts.set(x.list_id,(counts.get(x.list_id)||0)+1));
    return lists.map(x=>({...x,contact_count:counts.get(x.id)||0}));
  }

  async function createBroadcastList(name) {
    if (!state.profile) throw new Error("authentication_required");
    const { data, error } = await sb.from("broadcast_lists").insert({
      institution_id:state.profile.institution_id,
      name:name.trim(),
      active:true,
      created_by:state.profile.id
    }).select("id,name,active,created_at,updated_at").single();
    if (error) throw error;
    return data;
  }

  async function updateBroadcastList(id, values) {
    const payload={};
    if (values.name !== undefined) payload.name=String(values.name).trim();
    if (values.active !== undefined) payload.active=!!values.active;
    const { data, error } = await sb.from("broadcast_lists")
      .update(payload)
      .eq("id",id)
      .select("id,name,active,created_at,updated_at")
      .single();
    if (error) throw error;
    return data;
  }

  async function listBroadcastContacts(listId) {
    const { data, error } = await sb.from("broadcast_list_contacts")
      .select("id,contact_name,phone,normalized_phone,source_row,created_at")
      .eq("list_id",listId)
      .order("contact_name");
    if (error) throw error;
    return data || [];
  }

  async function listBroadcastImports(listId) {
    const { data, error } = await sb.from("broadcast_list_imports")
      .select("id,file_name,source_rows,imported_rows,skipped_rows,created_at")
      .eq("list_id",listId)
      .order("created_at",{ascending:false})
      .limit(10);
    if (error) throw error;
    return data || [];
  }

  async function replaceBroadcastContacts(listId, contacts, fileName, sourceRows) {
    const { data, error } = await sb.rpc("replace_broadcast_list_contacts",{
      p_list_id:listId,
      p_contacts:contacts,
      p_file_name:fileName||null,
      p_source_rows:sourceRows
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] || {imported_rows:0,skipped_rows:sourceRows||0} : data;
  }

  sb.auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.DaegonAuth = {
    sb, state, refresh, signIn, signOut, bootstrap, accessSearch, resetPassword,
    listUnits, listHolidays, saveHoliday,
    listTeachers, getTeacher, saveTeacher, listSubjects, listPeriods, listClasses,
    listTeacherSubjects, addTeacherSubject, removeTeacherSubject,
    listTeacherAssignments, addTeacherAssignment, removeTeacherAssignment,
    getTeacherAccess, createTeacherAccess,
    listLearningPlatformUsers, getLearningPlatformUser, saveLearningPlatformUser,
    listLearningProfiles, addLearningProfile, removeLearningProfile,
    listLearningGuardians, getLearningGuardianLink, setLearningGuardian,
    listLearningClassLinks, addLearningClassLink, removeLearningClassLink,
    listAcademicCourses, listDocumentTypes, listDocumentPendencies,
    prepareDocumentReminder, markDocumentReminderSent,
    listStudentsForPhotos, signedProfilePhotoUrl, uploadProfilePhoto, removeProfilePhoto,
    getYearStartRoutine, createYearStartRoutine, updateYearRoutineItem,
    listBroadcastLists, createBroadcastList, updateBroadcastList,
    listBroadcastContacts, listBroadcastImports, replaceBroadcastContacts
  };
})();