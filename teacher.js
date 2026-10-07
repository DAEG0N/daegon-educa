
var teacherCache=[];
var teacherSubjectCache=[];
var teacherAssignmentCache=[];
var teacherAccessCache=null;

function teacherMessage(text,kind){
  var el=$("#teacherMessage"); if(!el)return;
  el.textContent=text||"";
  el.className="access-message "+(kind||"");
}
function teacherAllowed(){
  var p=DaegonAuth.state.profile;
  return !!p&&p.active&&["administrator","secretary","academic"].includes(p.role);
}
function teacherFormData(){
  return {
    id:$("#teacherId").value||null,
    unit_id:null,
    full_name:$("#teacherName").value.trim(),
    status:$("#teacherStatus").value,
    gender:$("#teacherGender").value.trim(),
    marital_status:$("#teacherMaritalStatus").value.trim(),
    birth_date:$("#teacherBirthDate").value||null,
    race_color:$("#teacherRaceColor").value.trim(),
    phone:$("#teacherPhone").value.trim(),
    cpf:$("#teacherCpf").value.trim(),
    rg:$("#teacherRg").value.trim(),
    rg_issuer:$("#teacherRgIssuer").value.trim(),
    rg_issue_date:$("#teacherRgIssueDate").value||null,
    father_name:$("#teacherFather").value.trim(),
    mother_name:$("#teacherMother").value.trim(),
    nickname:$("#teacherNickname").value.trim(),
    email:$("#teacherEmail").value.trim(),
    address:$("#teacherAddress").value.trim(),
    registration_number:$("#teacherRegistration").value.trim(),
    inep_id:$("#teacherInep").value.trim(),
    admission_date:$("#teacherAdmissionDate").value||null,
    folder_number:$("#teacherFolderNumber").value.trim(),
    religion:$("#teacherReligion").value.trim(),
    birthplace:$("#teacherBirthplace").value.trim(),
    nationality:$("#teacherNationality").value.trim(),
    passport_number:$("#teacherPassport").value.trim(),
    birth_record_number:$("#teacherBirthRecordNumber").value.trim(),
    birth_record_book:$("#teacherBirthRecordBook").value.trim(),
    birth_record_page:$("#teacherBirthRecordPage").value.trim(),
    birth_record_office:$("#teacherBirthRecordOffice").value.trim(),
    birth_record_date:$("#teacherBirthRecordDate").value||null,
    turnstile_identifier:$("#teacherTurnstileId").value.trim(),
    fingerprint_registered:$("#teacherFingerprint").value==="yes"
  };
}
function clearTeacherForm(){
  if($("#teacherForm"))$("#teacherForm").reset();
  $("#teacherId").value="";
  $("#teacherStatus").value="active";
  $("#teacherFingerprint").value="no";
  $("#teacherPasswordStatus").value="Não cadastrada";
  $("#teacherWebLogin").value="";
  $("#teacherWebLogin").readOnly=false;
  $("#teacherEditorEyebrow").textContent="NOVO PROFESSOR";
  $("#teacherEditorTitle").textContent="Cadastro de professor";
  $("#teacherStatusBadge").textContent="Ativo";
  $("#teacherStatusBadge").className="status active";
  $("#teacherCreateAccessBtn").hidden=false;
  $("#teacherResetAccessBtn").hidden=true;
  teacherSubjectCache=[]; teacherAssignmentCache=[]; teacherAccessCache=null;
  $("#teacherNeedsSaveSubjects").hidden=false;
  $("#teacherSubjectsManager").hidden=true;
  $("#teacherNeedsSaveAllocation").hidden=false;
  $("#teacherAllocationManager").hidden=true;
  teacherMessage("");
}
function openTeacherEditor(){
  $("#teacherEmpty").hidden=true;
  $("#teacherEditorContent").hidden=false;
}
function closeTeacherEditor(){
  clearTeacherForm();
  $("#teacherEditorContent").hidden=true;
  $("#teacherEmpty").hidden=false;
}
function fillTeacherForm(t){
  openTeacherEditor();
  $("#teacherId").value=t.id||"";
  $("#teacherName").value=t.full_name||"";
  $("#teacherStatus").value=t.status||"active";
  $("#teacherGender").value=t.gender||"";
  $("#teacherMaritalStatus").value=t.marital_status||"";
  $("#teacherBirthDate").value=t.birth_date||"";
  $("#teacherRaceColor").value=t.race_color||"";
  $("#teacherPhone").value=t.phone||"";
  $("#teacherCpf").value=t.cpf||"";
  $("#teacherRg").value=t.rg||"";
  $("#teacherRgIssuer").value=t.rg_issuer||"";
  $("#teacherRgIssueDate").value=t.rg_issue_date||"";
  $("#teacherFather").value=t.father_name||"";
  $("#teacherMother").value=t.mother_name||"";
  $("#teacherNickname").value=t.nickname||"";
  $("#teacherEmail").value=t.email||"";
  $("#teacherAddress").value=t.address||"";
  $("#teacherRegistration").value=t.registration_number||"";
  $("#teacherInep").value=t.inep_id||"";
  $("#teacherAdmissionDate").value=t.admission_date||"";
  $("#teacherFolderNumber").value=t.folder_number||"";
  $("#teacherReligion").value=t.religion||"";
  $("#teacherBirthplace").value=t.birthplace||"";
  $("#teacherNationality").value=t.nationality||"";
  $("#teacherPassport").value=t.passport_number||"";
  $("#teacherBirthRecordNumber").value=t.birth_record_number||"";
  $("#teacherBirthRecordBook").value=t.birth_record_book||"";
  $("#teacherBirthRecordPage").value=t.birth_record_page||"";
  $("#teacherBirthRecordOffice").value=t.birth_record_office||"";
  $("#teacherBirthRecordDate").value=t.birth_record_date||"";
  $("#teacherTurnstileId").value=t.turnstile_identifier||"";
  $("#teacherFingerprint").value=t.fingerprint_registered?"yes":"no";
  $("#teacherEditorEyebrow").textContent="PROFESSOR";
  $("#teacherEditorTitle").textContent=t.full_name||"Cadastro de professor";
  $("#teacherStatusBadge").textContent=t.status==="active"?"Ativo":"Inativo";
  $("#teacherStatusBadge").className="status "+(t.status==="active"?"active":"pending");
  $("#teacherNeedsSaveSubjects").hidden=true;
  $("#teacherSubjectsManager").hidden=false;
  $("#teacherNeedsSaveAllocation").hidden=true;
  $("#teacherAllocationManager").hidden=false;
}
function renderTeacherList(query){
  var q=(query||"").toLowerCase().trim();
  var rows=teacherCache.filter(function(t){
    return !q||[t.full_name,t.registration_number,t.email,t.cpf].join(" ").toLowerCase().includes(q);
  });
  var el=$("#teacherList"); if(!el)return;
  if(!rows.length){
    el.innerHTML='<div class="agenda-empty"><b>Nenhum professor cadastrado</b><small>Os professores reais aparecerão aqui.</small></div>';
    return;
  }
  el.innerHTML=rows.map(function(t){
    return '<button type="button" class="teacher-list-item" data-teacher-id="'+safeText(t.id)+'">'+
      '<span><b>'+safeText(t.full_name)+'</b><small>'+safeText(t.registration_number||t.email||"Sem matrícula")+'</small></span>'+
      '<em class="status '+(t.status==="active"?"active":"pending")+'">'+(t.status==="active"?"Ativo":"Inativo")+'</em></button>';
  }).join("");
  $$(".teacher-list-item").forEach(function(btn){btn.onclick=function(){loadTeacher(btn.dataset.teacherId);};});
}
async function loadTeachers(){
  teacherCache=await DaegonAuth.listTeachers();
  renderTeacherList($("#teacherSearchInput")?$("#teacherSearchInput").value:"");
}
function subjectLabel(s){
  if(!s)return "—";
  return s.code?s.name+" ("+s.code+")":s.name;
}
async function loadTeacherSubjects(){
  var teacherId=$("#teacherId").value;
  if(!teacherId)return;
  var results=await Promise.all([DaegonAuth.listSubjects(),DaegonAuth.listTeacherSubjects(teacherId)]);
  var all=results[0],selected=results[1];
  teacherSubjectCache=selected;
  var selectedIds=new Set(selected.map(function(x){return x.subject_id;}));
  var available=all.filter(function(s){return !selectedIds.has(s.id);});
  $("#teacherAvailableSubjects").innerHTML=available.length?available.map(function(s){
    return '<option value="'+safeText(s.id)+'">'+safeText(subjectLabel(s))+'</option>';
  }).join(""):'<option disabled>Nenhuma disciplina disponível</option>';
  $("#teacherSelectedSubjects").innerHTML=selected.length?selected.map(function(x){
    return '<option value="'+safeText(x.id)+'" data-subject-id="'+safeText(x.subject_id)+'">'+safeText(subjectLabel(x.subjects))+'</option>';
  }).join(""):'<option disabled>Nenhuma disciplina adicionada</option>';
  refreshAllocationSubjectOptions();
}
function refreshAllocationSubjectOptions(){
  $("#teacherAllocationSubject").innerHTML=teacherSubjectCache.length?teacherSubjectCache.map(function(x){
    return '<option value="'+safeText(x.subject_id)+'">'+safeText(subjectLabel(x.subjects))+'</option>';
  }).join(""):'<option value="">Nenhuma disciplina adicionada</option>';
}
async function loadTeacherPeriods(){
  var periods=await DaegonAuth.listPeriods();
  $("#teacherPeriod").innerHTML=periods.length?periods.map(function(p){
    return '<option value="'+safeText(p.id)+'">'+safeText(String(p.year)+" · "+p.name)+'</option>';
  }).join(""):'<option value="">Nenhum período cadastrado</option>';
  await loadTeacherClasses();
}
async function loadTeacherClasses(){
  var periodId=$("#teacherPeriod").value;
  var classes=await DaegonAuth.listClasses(periodId||null);
  $("#teacherClass").innerHTML=classes.length?classes.map(function(cl){
    return '<option value="'+safeText(cl.id)+'">'+safeText(cl.name)+'</option>';
  }).join(""):'<option value="">Nenhuma turma cadastrada</option>';
  await loadTeacherAssignments();
}
async function loadTeacherAssignments(){
  var teacherId=$("#teacherId").value;
  if(!teacherId)return;
  var periodId=$("#teacherPeriod").value||null;
  teacherAssignmentCache=await DaegonAuth.listTeacherAssignments(teacherId,periodId);
  var el=$("#teacherAssignmentRows");
  if(!teacherAssignmentCache.length){
    el.innerHTML='<tr><td colspan="4">Nenhuma alocação cadastrada.</td></tr>';
    return;
  }
  el.innerHTML=teacherAssignmentCache.map(function(a){
    return '<tr><td>'+safeText(a.classes&&a.classes.name||"—")+'</td>'+
      '<td>'+safeText(a.subjects&&a.subjects.name||"—")+'</td>'+
      '<td>'+safeText(a.workload_hours==null?"—":a.workload_hours)+'</td>'+
      '<td><button type="button" class="secondary teacher-unassign" data-assignment-id="'+safeText(a.id)+'">Desalocar</button></td></tr>';
  }).join("");
  $$(".teacher-unassign").forEach(function(btn){btn.onclick=async function(){
    try{await DaegonAuth.removeTeacherAssignment(btn.dataset.assignmentId);await loadTeacherAssignments();teacherMessage("Professor desalocado.","ok");}
    catch(e){teacherMessage("Não foi possível desalocar: "+(e.message||"erro"),"error");}
  };});
}
async function loadTeacherAccess(){
  var teacherId=$("#teacherId").value;
  if(!teacherId)return;
  var role=DaegonAuth.state.profile&&DaegonAuth.state.profile.role;
  if(!["administrator","secretary"].includes(role)){
    teacherAccessCache=null;
    $("#teacherWebLogin").value="";
    $("#teacherWebLogin").readOnly=true;
    $("#teacherPasswordStatus").value="Somente Adm/Secretaria";
    $("#teacherCreateAccessBtn").hidden=true;
    $("#teacherResetAccessBtn").hidden=true;
    return;
  }
  teacherAccessCache=await DaegonAuth.getTeacherAccess(teacherId);
  if(teacherAccessCache){
    $("#teacherWebLogin").value=teacherAccessCache.login||"";
    $("#teacherWebLogin").readOnly=true;
    $("#teacherPasswordStatus").value="Cadastrada";
    $("#teacherCreateAccessBtn").hidden=true;
    $("#teacherResetAccessBtn").hidden=false;
  }else{
    $("#teacherWebLogin").readOnly=false;
    $("#teacherPasswordStatus").value="Não cadastrada";
    $("#teacherCreateAccessBtn").hidden=false;
    $("#teacherResetAccessBtn").hidden=true;
  }
}
async function loadTeacher(id){
  try{
    teacherMessage("Carregando...");
    var teacher=await DaegonAuth.getTeacher(id);
    fillTeacherForm(teacher);
    await Promise.all([loadTeacherSubjects(),loadTeacherPeriods(),loadTeacherAccess()]);
    teacherMessage("");
  }catch(e){teacherMessage("Não foi possível carregar o professor: "+(e.message||"erro"),"error");}
}
async function renderTeacherSession(){
  var allowed=teacherAllowed();
  $("#teacherLocked").hidden=allowed;
  $("#teacherManager").hidden=!allowed;
  if(allowed){
    try{await loadTeachers();}
    catch(e){teacherMessage("Não foi possível carregar os professores.","error");}
  }
}
$("#newTeacherBtn")&&$("#newTeacherBtn").addEventListener("click",function(){
  if(!teacherAllowed()){switchView("access");return;}
  clearTeacherForm();openTeacherEditor();
});
$("#teacherCancelBtn")&&$("#teacherCancelBtn").addEventListener("click",closeTeacherEditor);
$("#teacherSearchInput")&&$("#teacherSearchInput").addEventListener("input",function(e){renderTeacherList(e.target.value);});
$$("[data-teacher-tab]").forEach(function(btn){btn.onclick=function(){
  $$("[data-teacher-tab]").forEach(function(b){b.classList.toggle("active",b===btn);});
  $$("[data-teacher-panel]").forEach(function(p){p.classList.toggle("active",p.dataset.teacherPanel===btn.dataset.teacherTab);});
};});
$("#teacherForm")&&$("#teacherForm").addEventListener("submit",async function(e){
  e.preventDefault();
  var data=teacherFormData();
  if(!data.full_name){teacherMessage("Informe o nome do professor.","error");return;}
  var submit=e.currentTarget.querySelector('button[type="submit"]');
  submit.disabled=true;teacherMessage("Gravando...");
  try{
    var saved=await DaegonAuth.saveTeacher(data);
    fillTeacherForm(saved);
    await loadTeachers();
    await Promise.all([loadTeacherSubjects(),loadTeacherPeriods(),loadTeacherAccess()]);
    teacherMessage("Professor gravado com sucesso.","ok");
  }catch(err){
    teacherMessage(err&&err.code==="23505"?"Já existe professor com esta matrícula ou CPF.":"Não foi possível gravar: "+(err.message||"erro"),"error");
  }finally{submit.disabled=false;}
});
$("#teacherAddSubjectBtn")&&$("#teacherAddSubjectBtn").addEventListener("click",async function(){
  var teacherId=$("#teacherId").value,subjectId=$("#teacherAvailableSubjects").value;
  if(!teacherId||!subjectId)return;
  try{await DaegonAuth.addTeacherSubject(teacherId,subjectId);await loadTeacherSubjects();teacherMessage("Disciplina adicionada.","ok");}
  catch(e){teacherMessage("Não foi possível adicionar a disciplina: "+(e.message||"erro"),"error");}
});
$("#teacherRemoveSubjectBtn")&&$("#teacherRemoveSubjectBtn").addEventListener("click",async function(){
  var id=$("#teacherSelectedSubjects").value;
  if(!id)return;
  try{await DaegonAuth.removeTeacherSubject(id);await loadTeacherSubjects();teacherMessage("Disciplina removida.","ok");}
  catch(e){teacherMessage("Não foi possível remover a disciplina: "+(e.message||"erro"),"error");}
});
$("#teacherPeriod")&&$("#teacherPeriod").addEventListener("change",loadTeacherClasses);
$("#teacherAllocateBtn")&&$("#teacherAllocateBtn").addEventListener("click",async function(){
  var teacherId=$("#teacherId").value,classId=$("#teacherClass").value,subjectId=$("#teacherAllocationSubject").value;
  if(!teacherId||!classId||!subjectId){teacherMessage("Selecione período, turma e disciplina.","error");return;}
  try{
    await DaegonAuth.addTeacherAssignment(teacherId,classId,subjectId,$("#teacherWorkload").value||null);
    $("#teacherWorkload").value="";
    await loadTeacherAssignments();
    teacherMessage("Professor alocado na turma.","ok");
  }catch(e){
    teacherMessage(e&&e.code==="23505"?"Esta alocação já existe.":"Não foi possível alocar: "+(e.message||"erro"),"error");
  }
});
$("#teacherCreateAccessBtn")&&$("#teacherCreateAccessBtn").addEventListener("click",async function(){
  var teacherId=$("#teacherId").value,login=$("#teacherWebLogin").value.trim();
  if(!teacherId){teacherMessage("Grave o professor primeiro.","error");return;}
  if(!login){teacherMessage("Informe o login do módulo web.","error");return;}
  try{
    var result=await DaegonAuth.createTeacherAccess(teacherId,login);
    showTemporaryPassword(result.login,result.temporary_password);
    await loadTeacherAccess();
    teacherMessage("Acesso do professor criado.","ok");
  }catch(e){teacherMessage("Não foi possível criar o acesso: "+(e.message||"erro"),"error");}
});
$("#teacherResetAccessBtn")&&$("#teacherResetAccessBtn").addEventListener("click",async function(){
  if(!teacherAccessCache||!teacherAccessCache.id)return;
  if(!confirm("Alterar a senha deste professor?"))return;
  try{
    var result=await DaegonAuth.resetPassword(teacherAccessCache.id);
    showTemporaryPassword(result.login,result.temporary_password);
    await loadTeacherAccess();
    teacherMessage("Senha alterada.","ok");
  }catch(e){teacherMessage("Não foi possível alterar a senha: "+(e.message||"erro"),"error");}
});
var teacherNav=document.querySelector('[data-view="teachers"]');
teacherNav&&teacherNav.addEventListener("click",function(){if(DaegonAuth.state.profile)renderTeacherSession();});
window.addEventListener("daegon-auth",renderTeacherSession);
