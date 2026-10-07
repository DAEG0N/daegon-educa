var riaPeriods=[];
var riaRoutine=null;

var riaImplementedSteps=new Set([3,4,5]);

function riaAllowed(){
  var p=DaegonAuth.state.profile;
  return !!p&&p.active&&["administrator","secretary","academic"].includes(p.role);
}
function riaMessage(text,kind){
  var el=$("#riaMessage"); if(!el)return;
  el.textContent=text||"";
  el.className="access-message "+(kind||"");
}
function riaPeriodLabel(p){
  return String(p.year)+" · "+p.name;
}
function populateRiaPeriods(){
  var select=$("#riaPeriod");
  if(!select)return;
  if(!riaPeriods.length){
    select.innerHTML='<option value="">Nenhum período cadastrado</option>';
    return;
  }
  select.innerHTML=riaPeriods.map(function(p){
    return '<option value="'+safeText(p.id)+'">'+safeText(riaPeriodLabel(p))+'</option>';
  }).join("");
}
function riaStatusLabel(status){
  return ({pending:"Pendente",in_progress:"Em andamento",waiting:"Aguardando",completed:"Concluído"})[status]||status;
}
function riaStatusClass(status){
  if(status==="completed")return "active";
  if(status==="waiting")return "attention";
  return "pending";
}
function riaCanOpen(item){
  return item.source_step&&riaImplementedSteps.has(item.source_step);
}
function riaStepNote(item){
  if(item.source_step)return "Passo "+item.source_step;
  return "Dependência externa";
}
function openRiaTarget(item){
  if(!riaCanOpen(item))return;
  switchView(item.target_view);
  if(item.target_view==="teachers"&&item.target_tab){
    setTimeout(function(){
      var tab=document.querySelector('[data-teacher-tab="'+item.target_tab+'"]');
      if(tab)tab.click();
    },0);
  }
}
function renderRia(){
  var noPeriod=$("#riaNoPeriod"),notStarted=$("#riaNotStarted"),board=$("#riaBoard");
  if(!riaPeriods.length){
    noPeriod.hidden=false;notStarted.hidden=true;board.hidden=true;return;
  }
  noPeriod.hidden=true;
  var period=riaPeriods.find(function(p){return p.id===$("#riaPeriod").value;})||riaPeriods[0];
  if(!riaRoutine){
    notStarted.hidden=false;board.hidden=true;
    $("#riaStartPeriodName").textContent=riaPeriodLabel(period);
    return;
  }
  notStarted.hidden=true;board.hidden=false;

  var items=riaRoutine.items||[];
  var done=items.filter(function(x){return x.status==="completed";}).length;
  var total=items.length;
  var pct=total?Math.round(done/total*100):0;
  $("#riaPeriodTitle").textContent=riaPeriodLabel(period);
  $("#riaProgressText").textContent=done+"/"+total;
  $("#riaProgressBar").style.width=pct+"%";
  $("#riaStatusBadge").textContent=riaRoutine.status==="completed"?"Concluído":"Em andamento";
  $("#riaStatusBadge").className="status "+(riaRoutine.status==="completed"?"active":"pending");

  $("#riaItems").innerHTML=items.map(function(item){
    var open=riaCanOpen(item);
    var source=riaStepNote(item);
    var dependency=item.dependency_note
      ?'<div class="ria-dependency"><b>Observação</b><span>'+safeText(item.dependency_note)+'</span></div>'
      :"";
    var openLabel=open?"Abrir função":(item.source_step?"Passo "+item.source_step+" ainda não implementado":"Sem função interna neste momento");
    return '<article class="card ria-item" data-ria-item="'+safeText(item.id)+'">'+
      '<div class="ria-item-order">'+String(item.sequence).padStart(2,"0")+'</div>'+
      '<div class="ria-item-main">'+
        '<div class="ria-item-title-row"><div><span class="ria-source-badge">'+safeText(source)+'</span><h3>'+safeText(item.title)+'</h3></div><span class="status '+riaStatusClass(item.status)+'">'+safeText(riaStatusLabel(item.status))+'</span></div>'+
        dependency+
        '<div class="ria-item-controls">'+
          '<label>Status<select class="ria-item-status">'+
            '<option value="pending" '+(item.status==="pending"?"selected":"")+'>Pendente</option>'+
            '<option value="in_progress" '+(item.status==="in_progress"?"selected":"")+'>Em andamento</option>'+
            '<option value="waiting" '+(item.status==="waiting"?"selected":"")+'>Aguardando</option>'+
            '<option value="completed" '+(item.status==="completed"?"selected":"")+'>Concluído</option>'+
          '</select></label>'+
          '<label class="ria-notes-label">Observação<input class="ria-item-notes" value="'+safeText(item.notes||"")+'" placeholder="Observação opcional"></label>'+
          '<button type="button" class="secondary ria-open-btn" '+(open?'':'disabled')+'>'+safeText(openLabel)+'</button>'+
          '<button type="button" class="primary ria-save-btn">Salvar andamento</button>'+
        '</div>'+
      '</div>'+
    '</article>';
  }).join("");

  $$(".ria-item").forEach(function(card){
    var id=card.dataset.riaItem;
    var item=items.find(function(x){return x.id===id;});
    var openBtn=card.querySelector(".ria-open-btn");
    if(openBtn&&!openBtn.disabled)openBtn.onclick=function(){openRiaTarget(item);};
    card.querySelector(".ria-save-btn").onclick=async function(){
      var status=card.querySelector(".ria-item-status").value;
      var notes=card.querySelector(".ria-item-notes").value.trim();
      var button=this;button.disabled=true;
      riaMessage("Salvando andamento...");
      try{
        await DaegonAuth.updateYearRoutineItem(id,status,notes);
        await loadRiaRoutine();
        riaMessage("Andamento atualizado.","ok");
      }catch(e){
        riaMessage("Não foi possível atualizar: "+(e.message||"erro"),"error");
      }finally{button.disabled=false;}
    };
  });
}
async function loadRiaRoutine(){
  var periodId=$("#riaPeriod").value;
  if(!periodId){riaRoutine=null;renderRia();return;}
  riaRoutine=await DaegonAuth.getYearStartRoutine(periodId);
  renderRia();
}
async function initRia(){
  var allowed=riaAllowed();
  $("#riaLocked").hidden=allowed;
  $("#riaManager").hidden=!allowed;
  if(!allowed)return;
  try{
    riaPeriods=await DaegonAuth.listPeriods();
    populateRiaPeriods();
    await loadRiaRoutine();
  }catch(e){
    riaMessage("Não foi possível carregar o RIA: "+(e.message||"erro"),"error");
  }
}
$("#riaPeriod")&&$("#riaPeriod").addEventListener("change",loadRiaRoutine);
$("#riaStartBtn")&&$("#riaStartBtn").addEventListener("click",async function(){
  var periodId=$("#riaPeriod").value;
  if(!periodId)return;
  this.disabled=true;
  riaMessage("Criando roteiro...");
  try{
    await DaegonAuth.createYearStartRoutine(periodId);
    await loadRiaRoutine();
    riaMessage("Roteiro iniciado.","ok");
  }catch(e){
    riaMessage("Não foi possível iniciar o roteiro: "+(e.message||"erro"),"error");
  }finally{this.disabled=false;}
});
var riaEntry=document.querySelector('[data-view="year-start"]');
riaEntry&&riaEntry.addEventListener("click",function(){if(DaegonAuth.state.profile)initRia();});
window.addEventListener("daegon-auth",function(){
  if(document.querySelector("#year-start.view.active"))initRia();
});
