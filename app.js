const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const titles={dashboard:["Geral / Início","Início"],agenda:["Gestão / Agenda","Agenda institucional"],access:["Administração / Segurança","Gestão de acessos"],holidays:["Configuração / Calendário","Feriados e datas imprensadas"],teachers:["Acadêmico / Cadastros","Professores"],integrations:["Integrações / AZ & Lex","Usuários da plataforma educacional"],search:["Geral / Pesquisa","Pesquisa global"],students:["Secretaria / Cadastros","Alunos"],guardians:["Secretaria / Cadastros","Responsáveis"],enrollments:["Secretaria / Matrículas","Matrículas"],documents:["Secretaria / Documentos","Documentos"],classes:["Acadêmico / Estrutura","Turmas & Grade"],diary:["Acadêmico / Diário","Diário de Classe"],attendance:["Acadêmico / Diário","Frequência"],grades:["Acadêmico / Avaliações","Notas & Avaliações"],reportcards:["Acadêmico / Boletins","Central de Boletins"],finance:["Gestão / Financeiro","Financeiro"],communication:["Gestão / Comunicação","Comunicação"],portal:["Gestão / Portais","Portal & App"]};

let students=[];
const guardians=[];
const grades=[];
const attendance=[];

function switchView(id){
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  $$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===id));
  $("#crumb").textContent=titles[id][0]; $("#pageTitle").textContent=titles[id][1];
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-view]").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$("[data-jump]").forEach(b=>b.onclick=()=>switchView(b.dataset.jump));

function statusLabel(s){return s==="active"?"Ativo":"Pendente"}
function renderStudents(query=""){
  if(window.DaegonPhotos?.renderStudentRows){
    window.DaegonPhotos.renderStudentRows(query);
    return;
  }
  $("#studentRows").innerHTML='<tr><td colspan="8">Nenhum aluno cadastrado.</td></tr>';
}
$("#studentSearch").oninput=e=>renderStudents(e.target.value);

$("#guardianRows").innerHTML='<tr><td colspan="6">Nenhum responsável cadastrado.</td></tr>';

const enrollLanes=[];
$("#enrollmentPipeline").innerHTML='<div class="agenda-empty"><b>Nenhuma matrícula cadastrada</b><small>As matrículas reais aparecerão aqui.</small></div>';

const classes=[];
$("#classGrid").innerHTML='<div class="agenda-empty"><b>Nenhuma turma cadastrada</b><small>As turmas reais aparecerão aqui.</small></div>';

const diaryTabs={
lessons:`<div class="agenda-empty"><b>Nenhuma aula registrada</b><small>Os registros reais do diário aparecerão aqui.</small></div>`,
attendance:`<div class="agenda-empty"><b>Nenhuma frequência registrada</b><small>Cadastre alunos e turmas antes de lançar frequência.</small></div>`,
content:`<div class="agenda-empty"><b>Nenhum conteúdo registrado</b><small>Os conteúdos ministrados aparecerão aqui.</small></div>`,
confirm:`<div class="agenda-empty"><b>Nenhum diário disponível para confirmação</b><small>Não há dados acadêmicos cadastrados.</small></div>`
};
function renderDiary(tab="lessons"){$("#diaryContent").innerHTML=diaryTabs[tab];$("[data-go-attendance]")?.addEventListener("click",()=>switchView("attendance"))}
$$("[data-diary-tab]").forEach(b=>b.onclick=()=>{$$("[data-diary-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderDiary(b.dataset.diaryTab)});

function renderAttendance(){
 if(!attendance.length){$("#attendanceRows").innerHTML='<tr><td colspan="4">Nenhum aluno disponível para lançamento de frequência.</td></tr>';return}
 $("#attendanceRows").innerHTML=attendance.map((a,i)=>`<tr><td>${a.name}</td><td><div class="attendance-toggle"><button class="present ${a.state==="present"?"active":""}" data-att="${i}" data-state="present">P</button><button class="absent ${a.state==="absent"?"active":""}" data-att="${i}" data-state="absent">F</button></div></td><td><input class="grade-input" placeholder="—"></td><td><input class="grade-input" style="width:180px" placeholder="Observação"></td></tr>`).join("");
 $("[data-att]").forEach(b=>b.onclick=()=>{attendance[+b.dataset.att].state=b.dataset.state;renderAttendance()});
}
$("#markAllPresent").onclick=()=>{if(!attendance.length){toast("Nenhum aluno cadastrado");return}attendance.forEach(a=>a.state="present");renderAttendance();toast("Todos marcados como presentes")};

function renderGrades(){
 if(!grades.length){$("#gradeRows").innerHTML='<tr><td colspan="7">Nenhum aluno ou avaliação disponível para lançamento de notas.</td></tr>';return}
 $("#gradeRows").innerHTML=grades.map((r,ri)=>{const avg=(r.scores.reduce((a,b)=>a+b,0)/r.scores.length).toFixed(1);return `<tr><td>${r.name}</td>${r.scores.map((g,gi)=>'<td><input class="grade-input" data-ri="'+ri+'" data-gi="'+gi+'" type="number" min="0" max="10" step=".1" value="'+g+'"></td>').join("")}<td><b>${avg}</b></td><td>${r.abs}</td><td class="${avg>=7?"approved":"attention"}">${avg>=7?"Aprovado":"Recuperação"}</td></tr>`}).join("");
 $(".grade-input[data-ri]").forEach(i=>i.onchange=()=>{grades[+i.dataset.ri].scores[+i.dataset.gi]=Math.max(0,Math.min(10,+i.value));renderGrades()});
}
$("#applyGradeBtn").onclick=()=>{if(!grades.length){toast("Nenhum aluno ou avaliação cadastrada");return}const v=prompt("Nota para aplicar em todos os alunos:");if(v!==null&&!isNaN(v)){grades.forEach(g=>g.scores[2]=Math.max(0,Math.min(10,+v)));renderGrades();toast("Nota aplicada em lote")}};
$("#confirmGradesBtn").onclick=()=>toast(grades.length?"Notas confirmadas e bloqueadas para edição":"Nenhuma nota cadastrada");
$("#publishReportsBtn")?.addEventListener("click",()=>toast("Nenhum boletim disponível para publicação"));

const finance=[];

const studentModal=$("#studentModal"), enrollmentModal=$("#enrollmentModal");
function openModal(m){m.classList.add("open")} function closeModal(m){m.classList.remove("open")}
$("#newStudentBtn").onclick=()=>openModal(studentModal); $("#quickBtn").onclick=()=>openModal(studentModal); $("#newEnrollmentBtn").onclick=()=>openModal(enrollmentModal);
$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.closest(".modal"))); $$(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)closeModal(m)});
$("#studentForm").onsubmit=e=>{e.preventDefault();toast("O cadastro real será conectado ao banco no passo correspondente")};
$("#enrollmentForm").onsubmit=e=>{e.preventDefault();toast("A matrícula real será habilitada no passo correspondente")};


const AGENDA_STORAGE_KEY="daegonEducaAgendaV1";
const agendaForm=$("#agendaForm");

function agendaToday(){
  const d=new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function agendaStamp(date,time){
  return (date+"T"+time+":00").replace(/[-:]/g,"");
}
function agendaEscapeIcs(value=""){
  return String(value).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
}
function agendaGuests(){
  return $("#agendaGuests").value.split(/[;,\n]/).map(x=>x.trim()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
}
function agendaData(){
  return {
    title:$("#agendaTitle").value.trim(),
    date:$("#agendaDate").value,
    start:$("#agendaStart").value,
    end:$("#agendaEnd").value,
    calendar:$("#agendaCalendar").value.trim()||"Agenda institucional",
    guests:agendaGuests(),
    reminder:+$("#agendaReminder").value,
    notifyDisplay:$("#agendaNotifyDisplay").checked,
    notifyEmail:$("#agendaNotifyEmail").checked,
    location:$("#agendaLocation").value.trim(),
    description:$("#agendaDescription").value.trim()
  };
}
function validateAgendaEvent(e){
  if(!e.title||!e.date||!e.start||!e.end){toast("Preencha nome, data e horários");return false}
  if(e.end<=e.start){toast("O término precisa ser depois do início");return false}
  return true;
}
function googleAgendaUrl(e){
  const url=new URL("https://calendar.google.com/calendar/r/eventedit");
  url.searchParams.set("action","TEMPLATE");
  url.searchParams.set("text",e.title);
  url.searchParams.set("dates",agendaStamp(e.date,e.start)+"/"+agendaStamp(e.date,e.end));
  url.searchParams.set("stz","America/Maceio");
  url.searchParams.set("etz","America/Maceio");
  const reminderLabel=e.reminder>=1440?(e.reminder/1440)+" dia(s)":e.reminder>=60?(e.reminder/60)+" hora(s)":e.reminder+" min";
  const channels=[e.notifyDisplay?"área de trabalho":"",e.notifyEmail?"e-mail":""].filter(Boolean).join(" + ");
  const extras=[
    e.description,
    e.calendar?"Agenda: "+e.calendar:"",
    channels?"Lembrete solicitado: "+reminderLabel+" antes · "+channels:"",
    e.guests.length?"Convidados: "+e.guests.join(", "):""
  ].filter(Boolean).join("\n\n");
  if(extras)url.searchParams.set("details",extras);
  if(e.location)url.searchParams.set("location",e.location);
  e.guests.forEach(email=>url.searchParams.append("add",email));
  return url.toString();
}
function agendaIcs(e){
  const mins=Math.max(1,e.reminder||30);
  const uid="daegon-"+Date.now()+"-"+Math.random().toString(36).slice(2)+"@daegon-educa";
  const now=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const lines=[
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Daegon Educa//Agenda//PT-BR",
    "CALSCALE:GREGORIAN","METHOD:REQUEST","BEGIN:VEVENT",
    "UID:"+uid,"DTSTAMP:"+now,
    "DTSTART;TZID=America/Maceio:"+agendaStamp(e.date,e.start),
    "DTEND;TZID=America/Maceio:"+agendaStamp(e.date,e.end),
    "SUMMARY:"+agendaEscapeIcs(e.title)
  ];
  if(e.description)lines.push("DESCRIPTION:"+agendaEscapeIcs(e.description));
  if(e.location)lines.push("LOCATION:"+agendaEscapeIcs(e.location));
  e.guests.forEach(email=>lines.push("ATTENDEE;RSVP=TRUE:mailto:"+agendaEscapeIcs(email)));
  if(e.notifyDisplay){
    lines.push("BEGIN:VALARM","TRIGGER:-PT"+mins+"M","ACTION:DISPLAY","DESCRIPTION:"+agendaEscapeIcs("Lembrete: "+e.title),"END:VALARM");
  }
  if(e.notifyEmail){
    lines.push("BEGIN:VALARM","TRIGGER:-PT"+mins+"M","ACTION:EMAIL","DESCRIPTION:"+agendaEscapeIcs(e.title),"SUMMARY:"+agendaEscapeIcs("Lembrete: "+e.title),"END:VALARM");
  }
  lines.push("END:VEVENT","END:VCALENDAR");
  return lines.join("\r\n");
}
function agendaHistoryItems(){
  try{return JSON.parse(localStorage.getItem(AGENDA_STORAGE_KEY)||"[]")}catch{return []}
}
function saveAgendaHistory(e){
  const items=agendaHistoryItems();
  items.unshift({...e,createdAt:new Date().toISOString()});
  localStorage.setItem(AGENDA_STORAGE_KEY,JSON.stringify(items.slice(0,8)));
  renderAgendaHistory();
}
function renderAgendaHistory(){
  const el=$("#agendaHistory"); if(!el)return;
  const items=agendaHistoryItems();
  el.innerHTML=items.length?items.map((e,i)=>`
    <div class="agenda-history-item">
      <div class="agenda-datebox"><b>${e.date.slice(8,10)}</b><span>${new Date(e.date+"T12:00:00").toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}</span></div>
      <div><b>${e.title}</b><small>${e.start}–${e.end} · ${e.calendar||"Agenda institucional"}</small></div>
      <button type="button" class="secondary agenda-reopen" data-agenda-index="${i}">Abrir</button>
    </div>`).join(""):'<div class="agenda-empty"><b>Nenhum agendamento ainda</b><small>Os eventos criados pelo Daegon Educa aparecerão aqui.</small></div>';
  $(".agenda-reopen").forEach(b=>b.onclick=()=>window.open(googleAgendaUrl(items[+b.dataset.agendaIndex]),"_blank","noopener"));
}
function resetAgendaForm(){
  agendaForm.reset();
  $("#agendaDate").value=agendaToday();
  $("#agendaStart").value="09:00";
  $("#agendaEnd").value="10:00";
  $("#agendaCalendar").value="Agenda institucional";
  $("#agendaReminder").value="30";
  $("#agendaNotifyDisplay").checked=true;
  $("#agendaNotifyEmail").checked=true;
}
agendaForm?.addEventListener("submit",ev=>{
  ev.preventDefault();
  const data=agendaData();
  if(!validateAgendaEvent(data))return;
  saveAgendaHistory(data);
  window.open(googleAgendaUrl(data),"_blank","noopener");
  toast("Evento preparado no Google Agenda");
});
$("#downloadAgendaIcs")?.addEventListener("click",()=>{
  const data=agendaData();
  if(!validateAgendaEvent(data))return;
  const blob=new Blob([agendaIcs(data)],{type:"text/calendar;charset=utf-8"});
  const href=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=href;a.download=(data.title||"agendamento").replace(/[^a-z0-9à-ú_-]+/gi,"-")+".ics";
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(href);
  saveAgendaHistory(data);
  toast("Convite .ics gerado");
});
$("#clearAgendaForm")?.addEventListener("click",resetAgendaForm);
resetAgendaForm();
renderAgendaHistory();



const accessRoleLabels={administrator:"Administrador",secretary:"Secretaria",academic:"Acadêmico",teacher:"Professor",finance:"Financeiro",communication:"Comunicação",viewer:"Consulta"};
const accessTypeLabels={student:"Aluno",guardian:"Responsável",teacher:"Professor",staff:"Funcionário"};

function safeText(value=""){
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}
function accessMessage(text="",kind=""){
  const el=$("#accessAuthMessage"); if(!el)return;
  el.textContent=text; el.className="access-message "+kind;
}
function showTemporaryPassword(login,password){
  $("#temporaryLogin").value=login||"";
  $("#temporaryPassword").value=password||"";
  $("#temporaryPasswordModal").classList.add("open");
}
function accessDate(value){
  if(!value)return "Nunca";
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"—":d.toLocaleString("pt-BR");
}
function renderAccessRows(accounts){
  const el=$("#accessRows"); if(!el)return;
  if(!accounts.length){
    el.innerHTML='<tr><td colspan="7">Nenhuma conta cadastrada.</td></tr>';
    return;
  }
  el.innerHTML=accounts.map(a=>`<tr>
    <td>${safeText(a.display_name||"—")}</td>
    <td>${safeText(accessTypeLabels[a.person_type]||a.person_type||"—")}</td>
    <td><code>${safeText(a.login||"—")}</code></td>
    <td>${safeText(a.email||"—")}</td>
    <td><span class="status ${a.active?"active":"pending"}">${a.active?"Ativo":"Inativo"}</span></td>
    <td>${safeText(accessDate(a.last_password_reset_at))}</td>
    <td><button class="secondary access-reset-btn" data-account-id="${safeText(a.id)}" ${!a.auth_user_id||!a.active?"disabled":""}>Redefinir senha</button></td>
  </tr>`).join("");
  $(".access-reset-btn").forEach(btn=>btn.onclick=async()=>{
    const id=btn.dataset.accountId;
    const row=accounts.find(a=>a.id===id);
    if(!row)return;
    if(!confirm("Redefinir a senha de "+(row.display_name||row.login)+"?"))return;
    btn.disabled=true;
    try{
      const result=await DaegonAuth.resetPassword(id);
      showTemporaryPassword(result.login,result.temporary_password);
      accessMessage("Senha redefinida com sucesso.","ok");
      await loadAccessAccounts($("#accessSearchInput").value);
    }catch(e){
      accessMessage("Não foi possível redefinir a senha: "+(e.message||"erro"),"error");
    }finally{btn.disabled=false}
  });
}
async function loadAccessAccounts(query=""){
  if(!DaegonAuth.state.profile)return;
  const profile=DaegonAuth.state.profile;
  if(!["administrator","secretary"].includes(profile.role))return;
  const el=$("#accessRows");
  if(el)el.innerHTML='<tr><td colspan="7">Carregando...</td></tr>';
  try{
    const accounts=await DaegonAuth.accessSearch(query);
    renderAccessRows(accounts);
  }catch(e){
    if(el)el.innerHTML='<tr><td colspan="7">Não foi possível carregar as contas.</td></tr>';
    accessMessage("Erro ao consultar acessos: "+(e.message||"erro"),"error");
  }
}
function renderAccessSession(){
  const {session,profile}=DaegonAuth.state;
  const signedOut=$("#accessSignedOut"),signedIn=$("#accessSignedIn"),locked=$("#accessLocked"),manager=$("#accessManager");
  if(session){
    signedOut.hidden=true; signedIn.hidden=false;
    $("#accessCurrentName").textContent=profile?.full_name||session.user.email||"Conta autenticada";
    $("#accessCurrentRole").textContent=profile?accessRoleLabels[profile.role]||profile.role:"Sem perfil administrativo";
    $("#userName").textContent=profile?.full_name||session.user.email||"Conta";
    $("#userRole").textContent=profile?accessRoleLabels[profile.role]||profile.role:"Sem perfil";
    $("#userAvatar").textContent=(profile?.full_name||session.user.email||"DE").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
    const allowed=!!profile&&profile.active&&["administrator","secretary"].includes(profile.role);
    locked.hidden=allowed; manager.hidden=!allowed;
    if(allowed)loadAccessAccounts($("#accessSearchInput")?.value||"");
    else accessMessage("Esta conta não possui permissão para administrar acessos.","error");
  }else{
    signedOut.hidden=false; signedIn.hidden=true; locked.hidden=false; manager.hidden=true;
    $("#userName").textContent="Entrar"; $("#userRole").textContent="Não autenticado"; $("#userAvatar").textContent="DE";
  }
}
$("#userPill")?.addEventListener("click",()=>switchView("access"));
$("#userPill")?.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();switchView("access")}});
$("#accessLoginForm")?.addEventListener("submit",async e=>{
  e.preventDefault(); accessMessage("Entrando...");
  try{
    await DaegonAuth.signIn($("#accessLoginEmail").value.trim(),$("#accessLoginPassword").value);
    $("#accessLoginPassword").value="";
    accessMessage("Acesso realizado.","ok");
  }catch(err){accessMessage("Não foi possível entrar: "+(err.message||"erro"),"error")}
});
$("#bootstrapForm")?.addEventListener("submit",async e=>{
  e.preventDefault(); accessMessage("Ativando primeiro administrador...");
  try{
    const result=await DaegonAuth.bootstrap($("#bootstrapEmail").value.trim(),$("#bootstrapFullName").value.trim(),$("#bootstrapCode").value);
    showTemporaryPassword(result.login,result.temporary_password);
    await DaegonAuth.signIn(result.login,result.temporary_password);
    $("#bootstrapCode").value="";
    accessMessage("Administrador ativado. Troque a senha temporária em “Alterar minha senha”.","ok");
  }catch(err){accessMessage("Não foi possível ativar: "+(err.message||"erro"),"error")}
});
$("#accessSignOutBtn")?.addEventListener("click",async()=>{
  try{await DaegonAuth.signOut();accessMessage("Sessão encerrada.","ok")}catch(e){accessMessage("Erro ao sair.","error")}
});
$("#myPasswordForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const p=$("#myNewPassword").value,c=$("#myNewPasswordConfirm").value;
  if(p!==c){accessMessage("As senhas não coincidem.","error");return}
  if(p.length<8){accessMessage("Use pelo menos 8 caracteres.","error");return}
  try{
    const {error}=await DaegonAuth.sb.auth.updateUser({password:p});
    if(error)throw error;
    e.currentTarget.reset();
    accessMessage("Sua senha foi alterada.","ok");
  }catch(err){accessMessage("Não foi possível alterar sua senha: "+(err.message||"erro"),"error")}
});
$("#accessSearchBtn")?.addEventListener("click",()=>loadAccessAccounts($("#accessSearchInput").value));
$("#accessSearchInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")loadAccessAccounts(e.currentTarget.value)});
$("#closeTemporaryPassword")?.addEventListener("click",()=>$("#temporaryPasswordModal").classList.remove("open"));
$("#copyTemporaryPassword")?.addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($("#temporaryPassword").value);toast("Senha temporária copiada")}catch{toast("Não foi possível copiar")}
});
window.addEventListener("daegon-auth",renderAccessSession);
DaegonAuth.refresh().then(renderAccessSession).catch(()=>accessMessage("Não foi possível iniciar a autenticação.","error"));



let holidayCache=[];

function holidayMessage(text="",kind=""){
  const el=$("#holidayMessage"); if(!el)return;
  el.textContent=text;
  el.className="access-message "+kind;
}
function formatHolidayDate(value){
  if(!value)return "—";
  const parts=value.split("-");
  return parts.length===3?parts.reverse().join("/"):value;
}
function holidayYearOptions(rows=[]){
  const select=$("#holidayYear"); if(!select)return;
  const current=select.value;
  const years=[...new Set(rows.map(h=>String(h.holiday_date||"").slice(0,4)).filter(Boolean))].sort().reverse();
  const thisYear=String(new Date().getFullYear());
  if(!years.includes(thisYear))years.unshift(thisYear);
  select.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join("");
  select.value=years.includes(current)?current:years[0];
}
function resetHolidayForm(){
  $("#holidayId").value="";
  $("#holidayDate").value="";
  $("#holidayName").value="";
  $("#holidayUnit").value="";
  $("#holidayActive").checked=true;
  $("#holidayFinance").value="yes";
  $("#holidayLibrary").value="yes";
  $("#holidayFormEyebrow").textContent="NOVO CADASTRO";
  $("#holidayFormTitle").textContent="Cadastrar feriado";
  $("#holidayCancelEdit").hidden=true;
  holidayMessage("");
}
async function loadHolidayUnits(){
  const select=$("#holidayUnit");
  if(!select)return;
  const current=select.value;
  const units=await DaegonAuth.listUnits();
  select.innerHTML='<option value="">Sem unidade específica</option>'+units.map(u=>`<option value="${safeText(u.id)}">${safeText(u.name)}</option>`).join("");
  if([...select.options].some(o=>o.value===current))select.value=current;
}
function renderHolidayRows(){
  const el=$("#holidayRows"); if(!el)return;
  const year=$("#holidayYear")?.value;
  const rows=holidayCache.filter(h=>!year||String(h.holiday_date||"").startsWith(year+"-"));
  if(!rows.length){
    el.innerHTML='<tr><td colspan="5">Nenhum feriado cadastrado para este ano.</td></tr>';
    return;
  }
  el.innerHTML=rows.map(h=>`<tr>
    <td>${safeText(formatHolidayDate(h.holiday_date))}</td>
    <td>${safeText(h.name)}</td>
    <td>${h.affects_finance?"Sim":"Não"}</td>
    <td>${h.affects_library?"Sim":"Não"}</td>
    <td><button class="secondary holiday-edit-btn" type="button" data-holiday-id="${safeText(h.id)}">Editar</button></td>
  </tr>`).join("");

  $$(".holiday-edit-btn").forEach(btn=>btn.onclick=()=>{
    const h=holidayCache.find(x=>x.id===btn.dataset.holidayId);
    if(!h)return;
    $("#holidayId").value=h.id;
    $("#holidayDate").value=h.holiday_date||"";
    $("#holidayName").value=h.name||"";
    $("#holidayUnit").value=h.unit_id||"";
    $("#holidayActive").checked=!!h.active;
    $("#holidayFinance").value=h.affects_finance?"yes":"no";
    $("#holidayLibrary").value=h.affects_library?"yes":"no";
    $("#holidayFormEyebrow").textContent="EDITAR CADASTRO";
    $("#holidayFormTitle").textContent=h.name||"Editar feriado";
    $("#holidayCancelEdit").hidden=false;
    holidayMessage("");
    $("#holidayForm").scrollIntoView({behavior:"smooth",block:"start"});
  });
}
async function loadHolidays(){
  const el=$("#holidayRows");
  if(el)el.innerHTML='<tr><td colspan="5">Carregando...</td></tr>';
  try{
    holidayCache=await DaegonAuth.listHolidays();
    holidayYearOptions(holidayCache);
    renderHolidayRows();
  }catch(e){
    if(el)el.innerHTML='<tr><td colspan="5">Não foi possível carregar os feriados.</td></tr>';
    holidayMessage("Erro ao consultar feriados: "+(e.message||"erro"),"error");
  }
}
async function renderHolidaySession(){
  const profile=DaegonAuth.state.profile;
  const allowed=!!profile&&profile.active&&["administrator","secretary","academic"].includes(profile.role);
  const locked=$("#holidayLocked"),manager=$("#holidayManager");
  if(!locked||!manager)return;
  locked.hidden=allowed;
  manager.hidden=!allowed;
  if(allowed){
    try{
      await loadHolidayUnits();
      await loadHolidays();
    }catch(e){
      holidayMessage("Não foi possível iniciar o cadastro de feriados: "+(e.message||"erro"),"error");
    }
  }
}
$("#holidayForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const data={
    id:$("#holidayId").value||null,
    holiday_date:$("#holidayDate").value,
    name:$("#holidayName").value.trim(),
    unit_id:$("#holidayUnit").value||null,
    active:$("#holidayActive").checked,
    affects_finance:$("#holidayFinance").value==="yes",
    affects_library:$("#holidayLibrary").value==="yes"
  };
  if(!data.holiday_date||!data.name){
    holidayMessage("Informe a data e o nome do feriado.","error");
    return;
  }
  const submit=e.currentTarget.querySelector('button[type="submit"]');
  submit.disabled=true;
  holidayMessage("Salvando...");
  try{
    await DaegonAuth.saveHoliday(data);
    const savedYear=data.holiday_date.slice(0,4);
    resetHolidayForm();
    await loadHolidays();
    if([...$("#holidayYear").options].some(o=>o.value===savedYear)){
      $("#holidayYear").value=savedYear;
      renderHolidayRows();
    }
    holidayMessage("Feriado salvo com sucesso.","ok");
  }catch(err){
    const duplicate=err?.code==="23505"||String(err?.message||"").toLowerCase().includes("duplicate");
    holidayMessage(duplicate?"Já existe um feriado cadastrado nessa data para esta unidade.":"Não foi possível salvar: "+(err.message||"erro"),"error");
  }finally{
    submit.disabled=false;
  }
});
$("#holidayCancelEdit")?.addEventListener("click",resetHolidayForm);
$("#holidayYear")?.addEventListener("change",renderHolidayRows);
document.querySelector('[data-view="holidays"]')?.addEventListener("click",()=>{
  if(DaegonAuth.state.profile)renderHolidaySession();
});
window.addEventListener("daegon-auth",renderHolidaySession);

function globalMatches(q){
 q=q.toLowerCase().trim(); if(!q)return [];
 const people=students.filter(s=>[s.name,s.reg,s.guardian,s.class].join(" ").toLowerCase().includes(q)).map(s=>({title:s.name,sub:s.reg+" · "+s.class,type:"Aluno",run:()=>switchView("students")}));
 const mods=Object.entries(titles).filter(([id,v])=>v.join(" ").toLowerCase().includes(q)).map(([id,v])=>({title:v[1],sub:v[0],type:"Módulo",run:()=>switchView(id)}));
 return [...people,...mods];
}
function showGlobal(q,target="#globalResults"){const items=globalMatches(q);$(target).innerHTML=items.length?items.map((x,i)=>`<button class="command-item" data-search-index="${i}"><span><b>${x.title}</b><small>${x.sub}</small></span><em>${x.type}</em></button>`).join(""):'<div class="search-result"><b>Nenhum resultado</b><small>Tente outro termo</small></div>';$$("[data-search-index]").forEach(b=>b.onclick=()=>items[+b.dataset.searchIndex].run())}
$("#globalSearchInput").oninput=e=>showGlobal(e.target.value);

const command=$("#command"),cmd=$("#commandInput");
function renderCommand(){const items=cmd.value?globalMatches(cmd.value):Object.entries(titles).map(([id,v])=>({title:v[1],sub:v[0],type:"Módulo",run:()=>switchView(id)}));$("#commandResults").innerHTML=items.map((x,i)=>`<button class="command-item" data-ci="${i}"><span><b>${x.title}</b><small>${x.sub}</small></span><em>${x.type}</em></button>`).join("");$$("[data-ci]").forEach(b=>b.onclick=()=>{items[+b.dataset.ci].run();command.classList.remove("open")})}
$("#searchBtn").onclick=()=>{command.classList.add("open");cmd.value="";renderCommand();setTimeout(()=>cmd.focus(),30)};cmd.oninput=renderCommand;
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();command.classList.add("open");renderCommand();setTimeout(()=>cmd.focus(),30)}if(e.key==="Escape"){command.classList.remove("open");$$(".modal").forEach(closeModal)}});
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1900)}
$("#exportStudents").onclick=()=>toast("Lista de alunos exportada");
renderStudents();renderAttendance();renderGrades();renderDiary();