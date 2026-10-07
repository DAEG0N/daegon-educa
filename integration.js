var lexUsers=[];
var lexProfiles=[];
var lexLinks=[];
var lexGuardians=[];
var lexUnits=[];
var lexClasses=[];
var lexCurrentGuardian=null;

function lexMessage(text,kind){
  var el=$("#lexMessage"); if(!el)return;
  el.textContent=text||"";
  el.className="access-message "+(kind||"");
}
function lexAllowed(){
  var p=DaegonAuth.state.profile;
  return !!p&&p.active&&["administrator","secretary","academic"].includes(p.role);
}
function lexTypeLabel(type){
  return ({student:"Aluno",guardian:"Responsável",teacher:"Professor"})[type]||type;
}
function lexAge(date){
  if(!date)return null;
  var b=new Date(date+"T12:00:00"),now=new Date();
  var age=now.getFullYear()-b.getFullYear();
  var m=now.getMonth()-b.getMonth();
  if(m<0||(m===0&&now.getDate()<b.getDate()))age--;
  return age;
}
function lexNeedsAdultFields(){
  var type=$("#lexPersonType").value;
  var age=lexAge($("#lexBirthDate").value);
  return type!=="student" || (age!==null&&age>=18);
}
function lexApplyRules(){
  var type=$("#lexPersonType").value;
  var saved=!!$("#lexUserId").value;
  var student=type==="student";
  var classable=type==="student"||type==="teacher";
  $("#lexGuardianNotStudent").hidden=student;
  $("#lexGuardianManager").hidden=!student;
  $("#lexClassNotApplicable").hidden=classable;
  $("#lexClassManager").hidden=!classable||!saved;
  if(classable&&!saved){
    $("#lexClassNotApplicable").hidden=false;
    $("#lexClassNotApplicable").innerHTML='<b>Salve o usuário primeiro</b><small>Depois vincule Unidade, Turma e Perfil.</small>';
  }else if(!classable){
    $("#lexClassNotApplicable").innerHTML='<b>Somente aluno e professor</b><small>Responsáveis não recebem vínculo de turma neste procedimento.</small>';
  }
  var adult=lexNeedsAdultFields();
  $("#lexCpf").required=adult;
  $("#lexEmail").required=adult;
  $("#lexAgeRule").querySelector("span").textContent=adult
    ?"CPF e e-mail são obrigatórios para este cadastro."
    :"Aluno menor de idade pode ser cadastrado sem CPF e sem e-mail.";
}
function lexClear(){
  if($("#lexForm"))$("#lexForm").reset();
  $("#lexUserId").value="";
  $("#lexPersonType").value="guardian";
  $("#lexActive").value="yes";
  $("#lexEyebrow").textContent="NOVO USUÁRIO";
  $("#lexTitle").textContent="Usuário";
  $("#lexStatusBadge").textContent="Ativo";
  $("#lexStatusBadge").className="status active";
  $("#lexProfiles").innerHTML="";
  $("#lexProfileName").value="";
  $("#lexCurrentGuardian").innerHTML="";
  $("#lexGuardianSelect").value="";
  $("#lexClassRows").innerHTML='<tr><td colspan="5">Nenhuma turma vinculada.</td></tr>';
  lexProfiles=[];lexLinks=[];lexCurrentGuardian=null;
  $("#lexNeedsSaveProfiles").hidden=false;
  $("#lexProfilesManager").hidden=false;
  lexApplyRules();
  lexMessage("");
}
function lexOpenNew(){
  $("#lexLocked").hidden=true;
  $("#lexEditor").hidden=false;
  lexClear();
  loadLexGuardians();
}
function renderLexList(query){
  var q=(query||"").trim().toLowerCase();
  var rows=lexUsers.filter(function(u){
    return !q||[u.full_name,u.cpf,u.email,u.external_id].join(" ").toLowerCase().includes(q);
  });
  var el=$("#lexUserList"); if(!el)return;
  if(!rows.length){
    el.innerHTML='<div class="agenda-empty"><b>Nenhum usuário cadastrado</b><small>Os registros reais aparecerão aqui.</small></div>';
    return;
  }
  el.innerHTML=rows.map(function(u){
    return '<button class="lex-user-item" type="button" data-id="'+safeText(u.id)+'"><span><b>'+safeText(u.full_name)+'</b><small>'+safeText(lexTypeLabel(u.person_type))+(u.email?' · '+safeText(u.email):'')+'</small></span><em class="status '+(u.active?'active':'pending')+'">'+(u.active?'Ativo':'Inativo')+'</em></button>';
  }).join("");
  $$(".lex-user-item").forEach(function(btn){btn.onclick=function(){loadLexUser(btn.dataset.id);};});
}
async function loadLexUsers(){
  lexUsers=await DaegonAuth.listLearningPlatformUsers();
  renderLexList($("#lexSearch")?$("#lexSearch").value:"");
}
async function loadLexGuardians(){
  lexGuardians=await DaegonAuth.listLearningGuardians();
  var sel=$("#lexGuardianSelect");
  if(!sel)return;
  var current=sel.value;
  sel.innerHTML='<option value="">Selecione o responsável</option>'+lexGuardians.map(function(g){
    return '<option value="'+safeText(g.id)+'">'+safeText(g.full_name)+(g.cpf?' · '+safeText(g.cpf):'')+'</option>';
  }).join("");
  if(lexGuardians.some(function(g){return g.id===current;}))sel.value=current;
}
function renderLexProfiles(){
  var el=$("#lexProfiles");
  if(!lexProfiles.length){el.innerHTML='<span class="lex-empty-inline">Nenhum perfil vinculado.</span>';return;}
  el.innerHTML=lexProfiles.map(function(p){
    return '<span class="lex-chip">'+safeText(p.profile_name)+' <button type="button" data-profile-id="'+safeText(p.id)+'">×</button></span>';
  }).join("");
  $$("#lexProfiles button").forEach(function(btn){btn.onclick=async function(){
    try{await DaegonAuth.removeLearningProfile(btn.dataset.profileId);await loadLexProfiles();lexMessage("Perfil removido.","ok");}
    catch(e){lexMessage("Não foi possível remover o perfil: "+(e.message||"erro"),"error");}
  };});
}
async function loadLexProfiles(){
  var id=$("#lexUserId").value;if(!id)return;
  lexProfiles=await DaegonAuth.listLearningProfiles(id);
  renderLexProfiles();
  $("#lexNeedsSaveProfiles").hidden=true;
}
async function loadLexGuardianLink(){
  var id=$("#lexUserId").value;
  if(!id||$("#lexPersonType").value!=="student"){lexCurrentGuardian=null;$("#lexCurrentGuardian").innerHTML="";return;}
  lexCurrentGuardian=await DaegonAuth.getLearningGuardianLink(id);
  if(lexCurrentGuardian){
    $("#lexGuardianSelect").value=lexCurrentGuardian.guardian_platform_user_id;
    $("#lexCurrentGuardian").innerHTML='<b>Responsável vinculado:</b> '+safeText(lexCurrentGuardian.guardian&&lexCurrentGuardian.guardian.full_name||"—");
  }else $("#lexCurrentGuardian").innerHTML='<span>Nenhum responsável vinculado.</span>';
}
async function loadLexUnitsClasses(){
  var results=await Promise.all([DaegonAuth.listUnits(),DaegonAuth.listClasses(null)]);
  lexUnits=results[0];lexClasses=results[1];
  $("#lexUnit").innerHTML='<option value="">Selecione</option>'+lexUnits.map(function(u){return '<option value="'+safeText(u.id)+'">'+safeText(u.name)+'</option>';}).join("");
  renderLexClassOptions();
}
function renderLexClassOptions(){
  var unit=$("#lexUnit").value;
  var rows=lexClasses.filter(function(c){return !unit||c.unit_id===unit;});
  $("#lexClass").innerHTML='<option value="">Selecione</option>'+rows.map(function(c){return '<option value="'+safeText(c.id)+'">'+safeText(c.name)+'</option>';}).join("");
}
function renderLexClassLinks(){
  var el=$("#lexClassRows");
  if(!lexLinks.length){el.innerHTML='<tr><td colspan="5">Nenhuma turma vinculada.</td></tr>';return;}
  el.innerHTML=lexLinks.map(function(l){
    var status=({active:"Ativo",inactive:"Inativo",advanced:"Avançado"})[l.status]||l.status;
    return '<tr><td>'+safeText(l.units&&l.units.name||"—")+'</td><td>'+safeText(l.classes&&l.classes.name||"—")+'</td><td>'+safeText(l.profile_name)+'</td><td>'+safeText(status)+'</td><td><button class="secondary lex-unlink-class" type="button" data-id="'+safeText(l.id)+'">Remover</button></td></tr>';
  }).join("");
  $$(".lex-unlink-class").forEach(function(btn){btn.onclick=async function(){
    try{await DaegonAuth.removeLearningClassLink(btn.dataset.id);await loadLexClassLinks();lexMessage("Vínculo removido.","ok");}
    catch(e){lexMessage("Não foi possível remover: "+(e.message||"erro"),"error");}
  };});
}
async function loadLexClassLinks(){
  var id=$("#lexUserId").value;if(!id)return;
  lexLinks=await DaegonAuth.listLearningClassLinks(id);renderLexClassLinks();
}
async function loadLexUser(id){
  try{
    var u=await DaegonAuth.getLearningPlatformUser(id);
    $("#lexLocked").hidden=true;$("#lexEditor").hidden=false;
    $("#lexUserId").value=u.id;
    $("#lexPersonType").value=u.person_type;
    $("#lexExternalId").value=u.external_id||"";
    $("#lexFullName").value=u.full_name||"";
    $("#lexBirthDate").value=u.birth_date||"";
    $("#lexCpf").value=u.cpf||"";
    $("#lexRg").value=u.rg||"";
    $("#lexPhone").value=u.phone||"";
    $("#lexEmail").value=u.email||"";
    $("#lexAcademicEmail").value=u.academic_email||"";
    $("#lexActive").value=u.active?"yes":"no";
    $("#lexEyebrow").textContent="USUÁRIO AZ / LEX";
    $("#lexTitle").textContent=u.full_name;
    $("#lexStatusBadge").textContent=u.active?"Ativo":"Inativo";
    $("#lexStatusBadge").className="status "+(u.active?"active":"pending");
    lexApplyRules();
    await Promise.all([loadLexProfiles(),loadLexGuardians(),loadLexGuardianLink(),loadLexUnitsClasses()]);
    if(u.person_type==="student"||u.person_type==="teacher")await loadLexClassLinks();
    lexMessage("");
  }catch(e){lexMessage("Não foi possível carregar o usuário: "+(e.message||"erro"),"error");}
}
async function renderLexSession(){
  var allowed=lexAllowed();
  $("#newLexUserBtn").disabled=!allowed;
  if(!allowed){$("#lexLocked").hidden=false;$("#lexEditor").hidden=true;return;}
  $("#lexLocked").hidden=true;
  await loadLexUsers();
}
$("#newLexUserBtn")&&$("#newLexUserBtn").addEventListener("click",function(){
  if(!lexAllowed()){switchView("access");return;}lexOpenNew();
});
$("#lexCancelBtn")&&$("#lexCancelBtn").addEventListener("click",function(){$("#lexEditor").hidden=true;$("#lexLocked").hidden=!lexAllowed();lexClear();});
$("#lexSearch")&&$("#lexSearch").addEventListener("input",function(e){renderLexList(e.target.value);});
$("#lexPersonType")&&$("#lexPersonType").addEventListener("change",async function(){lexApplyRules();await loadLexGuardians();});
$("#lexBirthDate")&&$("#lexBirthDate").addEventListener("change",lexApplyRules);
$("#lexUnit")&&$("#lexUnit").addEventListener("change",renderLexClassOptions);

$("#lexForm")&&$("#lexForm").addEventListener("submit",async function(e){
  e.preventDefault();
  var type=$("#lexPersonType").value;
  var name=$("#lexFullName").value.trim();
  var birth=$("#lexBirthDate").value;
  var cpf=$("#lexCpf").value.trim();
  var email=$("#lexEmail").value.trim();
  if(!name||!birth){lexMessage("Informe nome completo e data de nascimento.","error");return;}
  if(lexNeedsAdultFields()&&(!cpf||!email)){lexMessage("CPF e e-mail são obrigatórios para maiores de idade.","error");return;}
  var guardianId=$("#lexGuardianSelect").value;
  if(type==="student"&&!guardianId){lexMessage("Cadastre e selecione o responsável antes de salvar o aluno.","error");return;}
  var profileTyped=$("#lexProfileName").value.trim();
  if(!$("#lexUserId").value&&!profileTyped){lexMessage("Selecione ou digite pelo menos um perfil.","error");return;}
  var submit=e.currentTarget.querySelector('button[type="submit"]');submit.disabled=true;lexMessage("Salvando...");
  try{
    var saved=await DaegonAuth.saveLearningPlatformUser({
      id:$("#lexUserId").value||null,person_type:type,external_id:$("#lexExternalId").value.trim(),
      full_name:name,birth_date:birth,cpf:cpf,rg:$("#lexRg").value.trim(),phone:$("#lexPhone").value.trim(),
      email:email,academic_email:$("#lexAcademicEmail").value.trim(),active:$("#lexActive").value==="yes"
    });
    $("#lexUserId").value=saved.id;
    if(profileTyped&&!lexProfiles.some(function(p){return p.profile_name.toLowerCase()===profileTyped.toLowerCase();})){
      await DaegonAuth.addLearningProfile(saved.id,profileTyped);
      $("#lexProfileName").value="";
    }
    if(type==="student")await DaegonAuth.setLearningGuardian(saved.id,guardianId);
    await loadLexUsers();
    await Promise.all([loadLexProfiles(),loadLexGuardians(),loadLexGuardianLink(),loadLexUnitsClasses()]);
    lexApplyRules();
    if(type==="student"||type==="teacher")await loadLexClassLinks();
    $("#lexEyebrow").textContent="USUÁRIO AZ / LEX";$("#lexTitle").textContent=saved.full_name;
    lexMessage("Usuário salvo com sucesso.","ok");
  }catch(err){
    lexMessage(err&&err.code==="23505"?"Já existe usuário com este CPF ou ID externo.":"Não foi possível salvar: "+(err.message||"erro"),"error");
  }finally{submit.disabled=false;}
});
$("#lexAddProfileBtn")&&$("#lexAddProfileBtn").addEventListener("click",async function(){
  var id=$("#lexUserId").value,name=$("#lexProfileName").value.trim();
  if(!id){lexMessage("Salve o usuário primeiro. O perfil digitado será vinculado ao salvar.","error");return;}
  if(!name){lexMessage("Informe o perfil.","error");return;}
  try{await DaegonAuth.addLearningProfile(id,name);$("#lexProfileName").value="";await loadLexProfiles();lexMessage("Perfil vinculado.","ok");}
  catch(e){lexMessage("Não foi possível vincular o perfil: "+(e.message||"erro"),"error");}
});
$("#lexSetGuardianBtn")&&$("#lexSetGuardianBtn").addEventListener("click",async function(){
  var id=$("#lexUserId").value,g=$("#lexGuardianSelect").value;
  if(!id){lexMessage("Salve o aluno primeiro.","error");return;}
  if(!g){lexMessage("Selecione o responsável.","error");return;}
  try{await DaegonAuth.setLearningGuardian(id,g);await loadLexGuardianLink();lexMessage("Responsável vinculado.","ok");}
  catch(e){lexMessage("Não foi possível vincular o responsável: "+(e.message||"erro"),"error");}
});
$("#lexLinkClassBtn")&&$("#lexLinkClassBtn").addEventListener("click",async function(){
  var id=$("#lexUserId").value,unit=$("#lexUnit").value,cl=$("#lexClass").value,profile=$("#lexClassProfile").value.trim();
  if(!id||!unit||!cl||!profile){lexMessage("Selecione Unidade, Turma e Perfil.","error");return;}
  try{await DaegonAuth.addLearningClassLink(id,unit,cl,profile);$("#lexClassProfile").value="";await loadLexClassLinks();lexMessage("Turma vinculada.","ok");}
  catch(e){lexMessage(e&&e.code==="23505"?"Este vínculo já existe.":"Não foi possível vincular a turma: "+(e.message||"erro"),"error");}
});
var lexNav=document.querySelector('[data-view="integrations"]');
lexNav&&lexNav.addEventListener("click",function(){if(DaegonAuth.state.profile)renderLexSession();});
window.addEventListener("daegon-auth",renderLexSession);
