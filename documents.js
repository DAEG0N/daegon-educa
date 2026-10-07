var docAllRows=[];
var docFilteredRows=[];
var docPeriods=[];
var docCourses=[];
var docClasses=[];
var docTypes=[];
var docReminderRow=null;
var docPreparedReminderId=null;

function docAllowed(){
  var p=DaegonAuth.state.profile;
  return !!p&&p.active&&["administrator","secretary","academic"].includes(p.role);
}
function docMessage(text,kind){
  var el=$("#docReminderMessage"); if(!el)return;
  el.textContent=text||"";
  el.className="access-message "+(kind||"");
}
function docStatusLabel(status){
  return ({received:"Entregue",pending:"Aguardando",waived:"Dispensado",undefined:"Indefinido"})[status]||status||"—";
}
function docEnrollmentLabel(status){
  return ({active:"Cursando",completed:"Aprovado",draft:"Rascunho",documents:"Documentação",contract:"Contrato",ready:"Pronto",cancelled:"Cancelado",transferred:"Transferido"})[status]||status||"—";
}
function docDate(value){
  if(!value)return "—";
  var d=new Date(value+"T12:00:00");
  return Number.isNaN(d.getTime())?"—":d.toLocaleDateString("pt-BR");
}
function docDateTime(value){
  if(!value)return "Nunca";
  var d=new Date(value);
  return Number.isNaN(d.getTime())?"Nunca":d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
}
function docIsOverdue(row){
  if(!row.deadline)return false;
  return row.deadline < new Date().toISOString().slice(0,10);
}
function docDaysSince(value){
  if(!value)return Infinity;
  var d=new Date(value),now=new Date();
  if(Number.isNaN(d.getTime()))return Infinity;
  return Math.floor((now-d)/86400000);
}
function docStatusClass(status){
  if(status==="received")return "active";
  if(status==="pending")return "pending";
  return "";
}
function docSafe(value){return safeText(value==null?"—":String(value));}

function populateDocBaseFilters(){
  $("#docPeriod").innerHTML='<option value="">Todos</option>'+docPeriods.map(function(p){
    return '<option value="'+docSafe(p.id)+'">'+docSafe(String(p.year)+" · "+p.name)+'</option>';
  }).join("");
  $("#docCourse").innerHTML='<option value="">Todos</option>'+docCourses.map(function(c){
    return '<option value="'+docSafe(c.id)+'">'+docSafe(c.name)+'</option>';
  }).join("");
  $("#docType").innerHTML='<option value="">Todos</option>'+docTypes.map(function(t){
    return '<option value="'+docSafe(t.id)+'">'+docSafe(t.name)+'</option>';
  }).join("");
  refreshDocHierarchyFilters();
}
function refreshDocHierarchyFilters(){
  var periodId=$("#docPeriod").value;
  var courseId=$("#docCourse").value;
  var currentGrade=$("#docGrade").value;
  var currentClass=$("#docClass").value;

  var classes=docClasses.filter(function(c){
    return (!periodId||c.academic_period_id===periodId)&&(!courseId||c.course_id===courseId);
  });
  var grades=[...new Set(classes.map(function(c){return c.grade_level;}).filter(Boolean))].sort(function(a,b){return String(a).localeCompare(String(b),"pt-BR",{numeric:true});});
  $("#docGrade").innerHTML='<option value="">Todas</option>'+grades.map(function(g){return '<option value="'+docSafe(g)+'">'+docSafe(g)+'</option>';}).join("");
  if(grades.includes(currentGrade))$("#docGrade").value=currentGrade;

  var grade=$("#docGrade").value;
  var classRows=classes.filter(function(c){return !grade||c.grade_level===grade;});
  $("#docClass").innerHTML='<option value="">Todas</option>'+classRows.map(function(c){return '<option value="'+docSafe(c.id)+'">'+docSafe(c.name)+'</option>';}).join("");
  if(classRows.some(function(c){return c.id===currentClass;}))$("#docClass").value=currentClass;
}

function getDocStatuses(){
  return $$(".doc-status-filter").filter(function(x){return x.checked;}).map(function(x){return x.value;});
}
function applyDocFilters(){
  var period=$("#docPeriod").value,course=$("#docCourse").value,grade=$("#docGrade").value,
      classId=$("#docClass").value,type=$("#docType").value,enrollmentStatus=$("#docEnrollmentStatus").value,
      statuses=getDocStatuses(),overdueOnly=$("#docOverdueOnly").checked;

  docFilteredRows=docAllRows.filter(function(r){
    if(period&&r.period?.id!==period)return false;
    if(course&&r.course?.id!==course)return false;
    if(grade&&r.class_row?.grade_level!==grade)return false;
    if(classId&&r.class_row?.id!==classId)return false;
    if(type&&r.document_type?.id!==type)return false;
    if(enrollmentStatus&&r.enrollment?.status!==enrollmentStatus)return false;
    if(statuses.length&&!statuses.includes(r.status))return false;
    if(overdueOnly&&!docIsOverdue(r))return false;
    return true;
  });

  var display=document.querySelector('input[name="docDisplay"]:checked')?.value||"simple";
  if(display==="class"){
    docFilteredRows.sort(function(a,b){
      return [a.period?.year||0,a.course?.name||"",a.class_row?.grade_level||"",a.class_row?.name||"",a.student?.full_name||""].join("|")
        .localeCompare([b.period?.year||0,b.course?.name||"",b.class_row?.grade_level||"",b.class_row?.name||"",b.student?.full_name||""].join("|"),"pt-BR",{numeric:true});
    });
  }else if(display==="student"){
    docFilteredRows.sort(function(a,b){return (a.student?.full_name||"").localeCompare(b.student?.full_name||"","pt-BR");});
  }else{
    docFilteredRows.sort(function(a,b){return (a.student?.full_name||"").localeCompare(b.student?.full_name||"","pt-BR");});
  }
  renderDocRows(display);
}
function docGroupKey(row,display){
  if(display==="class")return [row.period?.year||"",row.course?.name||"",row.class_row?.grade_level||"",row.class_row?.name||""].join(" · ");
  if(display==="student")return row.student?.full_name||"Aluno";
  return "";
}
function renderDocRows(display){
  var el=$("#docRows");
  $("#docResultCount").textContent=docFilteredRows.length+" "+(docFilteredRows.length===1?"registro":"registros");
  if(!docFilteredRows.length){
    el.innerHTML='<tr><td colspan="12">Nenhuma pendência encontrada com os filtros selecionados.</td></tr>';
    return;
  }
  var html="",lastGroup=null;
  docFilteredRows.forEach(function(r){
    var group=docGroupKey(r,display);
    if(group&&group!==lastGroup){
      html+='<tr class="doc-group-row"><td colspan="12">'+docSafe(group)+'</td></tr>';
      lastGroup=group;
    }
    var last=r.latest_reminder;
    var sentAt=last?.sent_at||null;
    var reminderText=sentAt?docDateTime(sentAt):(last?("Preparada em "+docDateTime(last.prepared_at)):"Nunca");
    var recent=sentAt&&docDaysSince(sentAt)<30;
    html+='<tr>'+
      '<td>'+docSafe(r.student?.full_name)+'</td>'+
      '<td>'+docSafe(r.student?.registration_number)+'</td>'+
      '<td>'+docSafe(r.period?String(r.period.year)+" · "+r.period.name:null)+'</td>'+
      '<td>'+docSafe(r.course?.name)+'</td>'+
      '<td>'+docSafe(r.class_row?.grade_level)+'</td>'+
      '<td>'+docSafe(r.class_row?.name)+'</td>'+
      '<td>'+docSafe(r.document_type?.name)+'</td>'+
      '<td><span class="status '+docStatusClass(r.status)+'">'+docSafe(docStatusLabel(r.status))+'</span></td>'+
      '<td class="'+(docIsOverdue(r)?"doc-overdue":"")+'">'+docSafe(docDate(r.deadline))+'</td>'+
      '<td>'+docSafe(r.guardian?.full_name)+'</td>'+
      '<td>'+docSafe(reminderText)+(recent?'<small class="doc-recent">Cobrado há menos de 30 dias</small>':'')+'</td>'+
      '<td><button class="secondary doc-charge-btn" type="button" data-doc-id="'+docSafe(r.id)+'" '+(r.status!=="pending"?'disabled':'')+'>Cobrar</button></td>'+
    '</tr>';
  });
  el.innerHTML=html;
  $$(".doc-charge-btn").forEach(function(btn){btn.onclick=function(){
    var row=docAllRows.find(function(x){return x.id===btn.dataset.docId;});
    if(row)openDocReminder(row);
  };});
}
function docMessageText(row){
  var guardian=row.guardian?.full_name||"responsável";
  var student=row.student?.full_name||"aluno";
  var name=(row.document_type?.name||"documentação").trim();
  var lower=name.toLocaleLowerCase("pt-BR");
  var article="o documento ";
  if(lower.includes("transfer"))article="a ";
  else if(lower.includes("histórico"))article="o ";
  else if(lower.includes("declara"))article="a ";
  else if(lower.includes("documenta"))article="a ";
  return "Bom dia, "+guardian+"\n\nTudo bem?\n\nAinda não recebi "+article+lower+" do aluno "+student+". Pode me ajudar?\n\nAguardo retorno.\n\nObrigada";
}
function normalizeWhatsapp(phone){
  var digits=String(phone||"").replace(/\D/g,"");
  if((digits.length===10||digits.length===11)&&!digits.startsWith("55"))digits="55"+digits;
  return digits;
}
function openDocReminder(row){
  docReminderRow=row;docPreparedReminderId=null;
  $("#docReminderTitle").textContent=row.student?.full_name||"Cobrar responsável";
  $("#docReminderMeta").innerHTML='<span><b>Documento:</b> '+docSafe(row.document_type?.name)+'</span><span><b>Responsável:</b> '+docSafe(row.guardian?.full_name)+'</span><span><b>Prazo:</b> '+docSafe(docDate(row.deadline))+'</span>';
  $("#docReminderText").value=docMessageText(row);
  $("#docMarkSent").disabled=true;
  $("#docOpenWhatsapp").disabled=!normalizeWhatsapp(row.guardian?.phone);
  docMessage(row.guardian?.phone?"":"O responsável não possui telefone cadastrado.","error");
  $("#docReminderModal").classList.add("open");
}
async function loadDocumentModule(){
  var allowed=docAllowed();
  $("#docLocked").hidden=allowed;
  $("#docManager").hidden=!allowed;
  if(!allowed)return;
  $("#docRows").innerHTML='<tr><td colspan="12">Carregando...</td></tr>';
  try{
    var results=await Promise.all([
      DaegonAuth.listPeriods(),
      DaegonAuth.listAcademicCourses(),
      DaegonAuth.listClasses(null),
      DaegonAuth.listDocumentTypes(),
      DaegonAuth.listDocumentPendencies()
    ]);
    docPeriods=results[0];docCourses=results[1];docClasses=results[2];docTypes=results[3];docAllRows=results[4];
    populateDocBaseFilters();
    applyDocFilters();
  }catch(e){
    $("#docRows").innerHTML='<tr><td colspan="12">Não foi possível carregar as pendências.</td></tr>';
  }
}
$("#docPeriod")&&$("#docPeriod").addEventListener("change",function(){refreshDocHierarchyFilters();});
$("#docCourse")&&$("#docCourse").addEventListener("change",function(){refreshDocHierarchyFilters();});
$("#docGrade")&&$("#docGrade").addEventListener("change",refreshDocHierarchyFilters);
$("#docApplyFilters")&&$("#docApplyFilters").addEventListener("click",applyDocFilters);
$("#docClearFilters")&&$("#docClearFilters").addEventListener("click",function(){
  $("#docPeriod").value="";$("#docCourse").value="";$("#docEnrollmentStatus").value="";$("#docType").value="";
  $$(".doc-status-filter").forEach(function(x){x.checked=x.value==="pending";});
  $("#docOverdueOnly").checked=true;
  var simple=document.querySelector('input[name="docDisplay"][value="simple"]');if(simple)simple.checked=true;
  refreshDocHierarchyFilters();applyDocFilters();
});
document.querySelectorAll('input[name="docDisplay"]').forEach(function(r){r.addEventListener("change",applyDocFilters);});
$("#docReminderClose")&&$("#docReminderClose").addEventListener("click",function(){$("#docReminderModal").classList.remove("open");});
$("#docCopyReminder")&&$("#docCopyReminder").addEventListener("click",async function(){
  try{await navigator.clipboard.writeText($("#docReminderText").value);docMessage("Mensagem copiada.","ok");}
  catch(e){docMessage("Não foi possível copiar a mensagem.","error");}
});
$("#docOpenWhatsapp")&&$("#docOpenWhatsapp").addEventListener("click",async function(){
  if(!docReminderRow)return;
  var phone=normalizeWhatsapp(docReminderRow.guardian?.phone);
  if(!phone){docMessage("O responsável não possui telefone cadastrado.","error");return;}
  var popup=window.open("about:blank","_blank");
  try{
    var prepared=await DaegonAuth.prepareDocumentReminder(docReminderRow,$("#docReminderText").value);
    docPreparedReminderId=prepared.id;
    $("#docMarkSent").disabled=false;
    var url="https://wa.me/"+phone+"?text="+encodeURIComponent($("#docReminderText").value);
    if(popup)popup.location.href=url;else window.location.href=url;
    docMessage("WhatsApp aberto. Depois do envio, clique em “Registrar como enviada”.","ok");
  }catch(e){
    if(popup)popup.close();
    docMessage("Não foi possível preparar a cobrança: "+(e.message||"erro"),"error");
  }
});
$("#docMarkSent")&&$("#docMarkSent").addEventListener("click",async function(){
  if(!docPreparedReminderId)return;
  try{
    await DaegonAuth.markDocumentReminderSent(docPreparedReminderId);
    docMessage("Cobrança registrada como enviada.","ok");
    $("#docMarkSent").disabled=true;
    await loadDocumentModule();
  }catch(e){docMessage("Não foi possível registrar o envio: "+(e.message||"erro"),"error");}
});
$("#docPrintBtn")&&$("#docPrintBtn").addEventListener("click",function(){
  document.body.classList.add("doc-print-mode");
  window.print();
});
window.addEventListener("afterprint",function(){document.body.classList.remove("doc-print-mode");});
var docNav=document.querySelector('[data-view="documents"]');
docNav&&docNav.addEventListener("click",function(){if(DaegonAuth.state.profile)loadDocumentModule();});
window.addEventListener("daegon-auth",function(){if(document.querySelector("#documents.view.active"))loadDocumentModule();});
