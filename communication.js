var broadcastLists=[];
var broadcastCurrentList=null;
var broadcastContacts=[];
var broadcastImports=[];
var broadcastParsed=null;

function broadcastAllowed(){
  var p=DaegonAuth.state.profile;
  return !!p&&p.active&&["administrator","secretary","communication"].includes(p.role);
}
function broadcastMessage(target,text,kind){
  var el=$(target); if(!el)return;
  el.textContent=text||"";
  el.className="access-message "+(kind||"");
}
function broadcastDateTime(value){
  if(!value)return "—";
  var d=new Date(value);
  return Number.isNaN(d.getTime())?"—":d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
}
function normalizeHeader(value){
  return String(value||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
function parseCsvLine(line,delimiter){
  var cells=[],cell="",quoted=false;
  for(var i=0;i<line.length;i++){
    var ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(ch===delimiter&&!quoted){
      cells.push(cell.trim());cell="";
    }else cell+=ch;
  }
  cells.push(cell.trim());
  return cells;
}
function detectCsvDelimiter(line){
  var commas=0,semis=0,quoted=false;
  for(var i=0;i<line.length;i++){
    var ch=line[i];
    if(ch==='"')quoted=!quoted;
    else if(!quoted&&ch===",")commas++;
    else if(!quoted&&ch===";")semis++;
  }
  return semis>commas?";":",";
}
function parseBroadcastCsv(text){
  var normalized=String(text||"").replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n");
  var lines=normalized.split("\n").filter(function(line){return line.trim()!=="";});
  if(!lines.length)throw new Error("O arquivo CSV está vazio.");
  var delimiter=detectCsvDelimiter(lines[0]);
  var first=parseCsvLine(lines[0],delimiter);
  var h1=normalizeHeader(first[0]),h2=normalizeHeader(first[1]);
  var hasHeader=(h1.includes("nome")||h1.includes("contato"))&&(h2.includes("telefone")||h2.includes("celular")||h2.includes("fone"));
  var dataLines=hasHeader?lines.slice(1):lines;
  var contacts=[],issues=[];
  dataLines.forEach(function(line,index){
    var rowNumber=(hasHeader?index+2:index+1);
    var cells=parseCsvLine(line,delimiter);
    var name=String(cells[0]||"").trim();
    var phone=String(cells[1]||"").trim();
    var extra=cells.slice(2).filter(function(x){return String(x||"").trim()!=="";});
    var digits=phone.replace(/\D/g,"");
    if(!name||!phone){
      issues.push({row:rowNumber,reason:"Nome ou telefone ausente"});return;
    }
    if(extra.length){
      issues.push({row:rowNumber,reason:"Mais de duas colunas preenchidas"});return;
    }
    if(digits.length<10||digits.length>13){
      issues.push({row:rowNumber,reason:"Telefone inválido"});return;
    }
    contacts.push({contact_name:name,phone:phone,source_row:rowNumber});
  });
  return {
    delimiter:delimiter,
    hasHeader:hasHeader,
    sourceRows:dataLines.length,
    validRows:contacts.length,
    localInvalidRows:issues.length,
    contacts:contacts,
    issues:issues
  };
}
function resetBroadcastCsv(){
  broadcastParsed=null;
  $("#broadcastCsvFile").value="";
  $("#broadcastImportBtn").disabled=true;
  $("#broadcastCsvPreview").innerHTML="<span>Nenhum arquivo selecionado.</span>";
  $("#broadcastSourceRows").textContent="—";
  $("#broadcastImportedRows").textContent="—";
  $("#broadcastSkippedRows").textContent="—";
  $("#broadcastCheckStatus").innerHTML="<b>Aguardando importação</b><small>Depois do carregamento, confira se a quantidade importada corresponde à planilha.</small>";
  broadcastMessage("#broadcastImportMessage","");
}
function renderBroadcastListRows(){
  var el=$("#broadcastListRows");
  var totalContacts=broadcastLists.reduce(function(sum,l){return sum+(l.contact_count||0);},0);
  $("#broadcastListCount").textContent=broadcastLists.length;
  $("#broadcastContactCount").textContent=totalContacts;
  if(!broadcastLists.length){
    el.innerHTML='<tr><td colspan="4">Nenhuma lista cadastrada.</td></tr>';
    return;
  }
  el.innerHTML=broadcastLists.map(function(l){
    return '<tr><td>'+safeText(l.name)+'</td><td>'+safeText(l.contact_count||0)+' contatos</td><td><span class="status '+(l.active?"active":"pending")+'">'+(l.active?"Ativa":"Inativa")+'</span></td><td><button class="secondary broadcast-edit-btn" data-list-id="'+safeText(l.id)+'" type="button">Editar</button></td></tr>';
  }).join("");
  $$(".broadcast-edit-btn").forEach(function(btn){
    btn.onclick=function(){openBroadcastList(btn.dataset.listId);};
  });
}
async function loadBroadcastLists(){
  broadcastLists=await DaegonAuth.listBroadcastLists();
  renderBroadcastListRows();
}
function renderBroadcastContacts(){
  $("#broadcastDetailCount").textContent=broadcastContacts.length+" "+(broadcastContacts.length===1?"contato":"contatos");
  if(!broadcastContacts.length){
    $("#broadcastContactRows").innerHTML='<tr><td colspan="3">Nenhum contato importado.</td></tr>';
    return;
  }
  $("#broadcastContactRows").innerHTML=broadcastContacts.map(function(c){
    return '<tr><td>'+safeText(c.contact_name)+'</td><td>'+safeText(c.phone)+'</td><td>'+safeText(c.source_row||"—")+'</td></tr>';
  }).join("");
}
function renderBroadcastImports(){
  var el=$("#broadcastImportHistory");
  if(!broadcastImports.length){
    el.innerHTML="<span>Nenhuma importação registrada.</span>";return;
  }
  el.innerHTML=broadcastImports.map(function(x){
    var ok=x.source_rows===x.imported_rows;
    return '<div class="broadcast-history-item"><div><b>'+safeText(x.file_name||"CSV")+'</b><small>'+safeText(broadcastDateTime(x.created_at))+'</small></div><div><strong>'+safeText(x.imported_rows)+'/'+safeText(x.source_rows)+'</strong><span class="status '+(ok?"active":"pending")+'">'+(ok?"Conferido":safeText(x.skipped_rows)+" ignorados")+'</span></div></div>';
  }).join("");
}
async function openBroadcastList(id){
  var list=broadcastLists.find(function(x){return x.id===id;});
  if(!list)return;
  broadcastCurrentList=list;
  $("#broadcastListView").hidden=true;
  $("#broadcastDetailView").hidden=false;
  $("#broadcastDetailTitle").textContent=list.name;
  resetBroadcastCsv();
  $("#broadcastContactRows").innerHTML='<tr><td colspan="3">Carregando...</td></tr>';
  try{
    var results=await Promise.all([
      DaegonAuth.listBroadcastContacts(id),
      DaegonAuth.listBroadcastImports(id)
    ]);
    broadcastContacts=results[0];
    broadcastImports=results[1];
    renderBroadcastContacts();
    renderBroadcastImports();
    if(broadcastImports.length){
      var latest=broadcastImports[0];
      $("#broadcastSourceRows").textContent=latest.source_rows;
      $("#broadcastImportedRows").textContent=latest.imported_rows;
      $("#broadcastSkippedRows").textContent=latest.skipped_rows;
      var ok=latest.source_rows===latest.imported_rows;
      $("#broadcastCheckStatus").innerHTML=ok
        ?'<b>Quantidade conferida</b><small>A quantidade importada corresponde à planilha registrada.</small>'
        :'<b>Conferência necessária</b><small>'+safeText(latest.skipped_rows)+' linha(s) não foram importadas. Revise a planilha.</small>';
    }
  }catch(e){
    $("#broadcastContactRows").innerHTML='<tr><td colspan="3">Não foi possível carregar esta lista.</td></tr>';
  }
}
function openBroadcastListModal(list){
  $("#broadcastListId").value=list?.id||"";
  $("#broadcastListName").value=list?.name||"";
  $("#broadcastListModalTitle").textContent=list?"Editar lista":"Nova lista";
  broadcastMessage("#broadcastListMessage","");
  $("#broadcastListModal").classList.add("open");
}
function closeBroadcastListModal(){
  $("#broadcastListModal").classList.remove("open");
  $("#broadcastListForm").reset();
  $("#broadcastListId").value="";
  broadcastMessage("#broadcastListMessage","");
}
function renderCsvPreview(parsed,fileName){
  var issues=parsed.issues.slice(0,5);
  var issueHtml=issues.length
    ?'<div class="broadcast-preview-issues"><b>Linhas inválidas encontradas</b>'+issues.map(function(x){return '<span>Linha '+safeText(x.row)+': '+safeText(x.reason)+'</span>';}).join("")+(parsed.issues.length>5?'<span>… e mais '+safeText(parsed.issues.length-5)+'</span>':"")+'</div>'
    :"";
  $("#broadcastCsvPreview").innerHTML=
    '<div><b>'+safeText(fileName)+'</b><small>Separador detectado: '+(parsed.delimiter===";"?"ponto e vírgula":"vírgula")+(parsed.hasHeader?" · cabeçalho identificado":" · sem cabeçalho")+'</small></div>'+
    '<div class="broadcast-preview-counts"><span>'+safeText(parsed.sourceRows)+' linhas de dados</span><span>'+safeText(parsed.validRows)+' válidas antes de duplicidades</span></div>'+issueHtml;
  $("#broadcastSourceRows").textContent=parsed.sourceRows;
  $("#broadcastImportedRows").textContent="—";
  $("#broadcastSkippedRows").textContent=parsed.localInvalidRows||0;
  $("#broadcastCheckStatus").innerHTML=parsed.localInvalidRows
    ?'<b>Arquivo precisa de conferência</b><small>Há linhas inválidas; elas serão contabilizadas como ignoradas.</small>'
    :'<b>Arquivo pronto para importação</b><small>Após importar, compare o total da planilha com o total efetivamente gravado.</small>';
}
async function initBroadcastModule(){
  var allowed=broadcastAllowed();
  $("#broadcastLocked").hidden=allowed;
  $("#broadcastManager").hidden=!allowed;
  if(!allowed)return;
  try{await loadBroadcastLists();}
  catch(e){
    $("#broadcastListRows").innerHTML='<tr><td colspan="4">Não foi possível carregar as listas.</td></tr>';
  }
}

$$("[data-communication-tab]").forEach(function(btn){
  btn.onclick=function(){
    $$("[data-communication-tab]").forEach(function(x){x.classList.toggle("active",x===btn);});
    $$("[data-communication-panel]").forEach(function(p){p.classList.toggle("active",p.dataset.communicationPanel===btn.dataset.communicationTab);});
  };
});
$("#newBroadcastListBtn")&&$("#newBroadcastListBtn").addEventListener("click",function(){openBroadcastListModal(null);});
$("#broadcastRenameBtn")&&$("#broadcastRenameBtn").addEventListener("click",function(){if(broadcastCurrentList)openBroadcastListModal(broadcastCurrentList);});
$("#broadcastListClose")&&$("#broadcastListClose").addEventListener("click",closeBroadcastListModal);
$("#broadcastListCancel")&&$("#broadcastListCancel").addEventListener("click",closeBroadcastListModal);
$("#broadcastBackBtn")&&$("#broadcastBackBtn").addEventListener("click",async function(){
  $("#broadcastDetailView").hidden=true;
  $("#broadcastListView").hidden=false;
  broadcastCurrentList=null;broadcastContacts=[];broadcastImports=[];resetBroadcastCsv();
  await loadBroadcastLists();
});
$("#broadcastListForm")&&$("#broadcastListForm").addEventListener("submit",async function(e){
  e.preventDefault();
  var id=$("#broadcastListId").value;
  var name=$("#broadcastListName").value.trim();
  if(!name){broadcastMessage("#broadcastListMessage","Informe o nome da lista.","error");return;}
  var submit=e.currentTarget.querySelector('button[type="submit"]');submit.disabled=true;
  broadcastMessage("#broadcastListMessage","Salvando...");
  try{
    var saved=id?await DaegonAuth.updateBroadcastList(id,{name:name}):await DaegonAuth.createBroadcastList(name);
    closeBroadcastListModal();
    await loadBroadcastLists();
    if(id&&broadcastCurrentList&&broadcastCurrentList.id===id){
      broadcastCurrentList={...broadcastCurrentList,...saved};
      $("#broadcastDetailTitle").textContent=saved.name;
    }else if(!id){
      await openBroadcastList(saved.id);
    }
  }catch(err){
    broadcastMessage("#broadcastListMessage",err&&err.code==="23505"?"Já existe uma lista com este nome.":"Não foi possível salvar: "+(err.message||"erro"),"error");
  }finally{submit.disabled=false;}
});
$("#broadcastCsvFile")&&$("#broadcastCsvFile").addEventListener("change",async function(e){
  var file=e.target.files&&e.target.files[0];
  if(!file){resetBroadcastCsv();return;}
  if(!/\.csv$/i.test(file.name)){
    resetBroadcastCsv();broadcastMessage("#broadcastImportMessage","Selecione um arquivo .csv.","error");return;
  }
  try{
    var text=await file.text();
    broadcastParsed=parseBroadcastCsv(text);
    broadcastParsed.fileName=file.name;
    renderCsvPreview(broadcastParsed,file.name);
    $("#broadcastImportBtn").disabled=broadcastParsed.sourceRows===0;
    broadcastMessage("#broadcastImportMessage","");
  }catch(err){
    broadcastParsed=null;
    $("#broadcastImportBtn").disabled=true;
    broadcastMessage("#broadcastImportMessage",err.message||"Não foi possível ler o CSV.","error");
  }
});
$("#broadcastImportBtn")&&$("#broadcastImportBtn").addEventListener("click",async function(){
  if(!broadcastCurrentList||!broadcastParsed)return;
  if(!confirm("Importar este CSV e substituir os contatos atuais da lista “"+broadcastCurrentList.name+"”?"))return;
  this.disabled=true;
  broadcastMessage("#broadcastImportMessage","Importando contatos...");
  try{
    var result=await DaegonAuth.replaceBroadcastContacts(
      broadcastCurrentList.id,
      broadcastParsed.contacts,
      broadcastParsed.fileName,
      broadcastParsed.sourceRows
    );
    var imported=Number(result?.imported_rows||0),skipped=Number(result?.skipped_rows||0);
    $("#broadcastImportedRows").textContent=imported;
    $("#broadcastSkippedRows").textContent=skipped;
    var ok=imported===broadcastParsed.sourceRows;
    $("#broadcastCheckStatus").innerHTML=ok
      ?'<b>Quantidade conferida</b><small>'+safeText(imported)+' contatos importados para '+safeText(broadcastParsed.sourceRows)+' linhas da planilha.</small>'
      :'<b>Conferência necessária</b><small>'+safeText(imported)+' importados de '+safeText(broadcastParsed.sourceRows)+' linhas; '+safeText(skipped)+' foram ignoradas por dados inválidos ou telefone duplicado.</small>';
    broadcastMessage("#broadcastImportMessage",ok?"Importação concluída e conferida.":"Importação concluída com divergências. Revise a planilha.",ok?"ok":"error");
    var results=await Promise.all([
      DaegonAuth.listBroadcastContacts(broadcastCurrentList.id),
      DaegonAuth.listBroadcastImports(broadcastCurrentList.id)
    ]);
    broadcastContacts=results[0];broadcastImports=results[1];
    renderBroadcastContacts();renderBroadcastImports();
    await loadBroadcastLists();
  }catch(err){
    broadcastMessage("#broadcastImportMessage","Não foi possível importar: "+(err.message||"erro"),"error");
  }finally{this.disabled=false;}
});
var communicationNav=document.querySelector('[data-view="communication"]');
communicationNav&&communicationNav.addEventListener("click",function(){if(DaegonAuth.state.profile)initBroadcastModule();});
window.addEventListener("daegon-auth",function(){
  if(document.querySelector("#communication.view.active"))initBroadcastModule();
});
window.DaegonCommunication={showLists:function(){
  switchView("communication");
  var btn=document.querySelector('[data-communication-tab="lists"]');if(btn)btn.click();
  if(DaegonAuth.state.profile)initBroadcastModule();
}};