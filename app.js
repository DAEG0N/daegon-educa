const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const titles={dashboard:["Geral / Início","Início"],agenda:["Gestão / Agenda","Agenda institucional"],search:["Geral / Pesquisa","Pesquisa global"],students:["Secretaria / Cadastros","Alunos"],guardians:["Secretaria / Cadastros","Responsáveis"],enrollments:["Secretaria / Matrículas","Matrículas"],documents:["Secretaria / Documentos","Documentos"],classes:["Acadêmico / Estrutura","Turmas & Grade"],diary:["Acadêmico / Diário","Diário de Classe"],attendance:["Acadêmico / Diário","Frequência"],grades:["Acadêmico / Avaliações","Notas & Avaliações"],reportcards:["Acadêmico / Boletins","Central de Boletins"],finance:["Gestão / Financeiro","Financeiro"],communication:["Gestão / Comunicação","Comunicação"],portal:["Gestão / Portais","Portal & App"]};

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
  const q=query.toLowerCase();
  const rows=students.filter(s=>!q||[s.name,s.reg,s.class,s.guardian].join(" ").toLowerCase().includes(q));
  $("#studentRows").innerHTML=rows.length?rows.map(s=>`<tr><td>${s.name}</td><td>${s.reg}</td><td>${s.class}</td><td><span class="status ${s.status}">${statusLabel(s.status)}</span></td><td>${s.guardian}</td><td>${s.phone}</td><td>•••</td></tr>`).join(""):'<tr><td colspan="7">Nenhum aluno cadastrado.</td></tr>';
}
$("#studentSearch").oninput=e=>renderStudents(e.target.value);

$("#guardianRows").innerHTML='<tr><td colspan="6">Nenhum responsável cadastrado.</td></tr>';

const enrollLanes=[];
$("#enrollmentPipeline").innerHTML='<div class="agenda-empty"><b>Nenhuma matrícula cadastrada</b><small>As matrículas reais aparecerão aqui.</small></div>';

const docs=[["DEC","Declaração de matrícula","Emissão imediata"],["HIS","Histórico escolar","Com notas e carga horária"],["BOL","Boletim escolar","Por período ou anual"],["ATE","Atestado de frequência","Com percentual de presença"],["TRA","Transferência","Documentação de saída"],["CER","Certificado","Conclusão de etapa"]];
$("#documentGrid").innerHTML=docs.map(d=>`<article class="module-card"><span>${d[0]}</span><h3>${d[1]}</h3><p>${d[2]}</p><button class="secondary">Emitir documento</button></article>`).join("");

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