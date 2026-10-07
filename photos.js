var photoState={
  personType:null,
  id:null,
  name:"",
  path:null,
  blob:null,
  objectUrl:null
};
var studentPhotoRows=[];
var studentPhotoUrls=new Map();
var teacherPhotoPath=null;
var teacherPhotoSignedUrl=null;

function photoAllowed(){
  var p=DaegonAuth.state.profile;
  return !!p&&p.active&&["administrator","secretary","academic"].includes(p.role);
}
function photoInitials(name){
  var parts=String(name||"").trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return "—";
  return parts.slice(0,2).map(function(x){return x.charAt(0).toUpperCase();}).join("");
}
function photoMessage(text,kind){
  var el=$("#profilePhotoMessage"); if(!el)return;
  el.textContent=text||"";
  el.className="access-message "+(kind||"");
}
function closePhotoModal(){
  $("#profilePhotoModal").classList.remove("open");
  if(photoState.objectUrl){URL.revokeObjectURL(photoState.objectUrl);photoState.objectUrl=null;}
  photoState.blob=null;
  $("#profilePhotoFile").value="";
  photoMessage("");
}
function setPhotoPreview(url,name){
  var img=$("#profilePhotoPreview"),fallback=$("#profilePhotoPreviewFallback");
  if(url){
    img.src=url;img.hidden=false;fallback.hidden=true;
  }else{
    img.hidden=true;img.removeAttribute("src");fallback.hidden=false;
    fallback.textContent=photoInitials(name);
  }
}
function canvasBlob(canvas,quality){
  return new Promise(function(resolve,reject){
    canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error("Não foi possível processar a imagem."));},"image/jpeg",quality);
  });
}
function loadBrowserImage(file){
  return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(file);
    var img=new Image();
    img.onload=function(){URL.revokeObjectURL(url);resolve(img);};
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error("Arquivo de imagem inválido."));};
    img.src=url;
  });
}
async function processProfilePhoto(file){
  if(!file)return null;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Use uma imagem JPG, PNG ou WEBP.");
  if(file.size>20*1024*1024)throw new Error("A imagem original não pode ultrapassar 20 MB.");
  var img=await loadBrowserImage(file);
  var source=Math.min(img.naturalWidth,img.naturalHeight);
  var sx=Math.floor((img.naturalWidth-source)/2);
  var sy=Math.floor((img.naturalHeight-source)/2);
  var qualities=[0.9,0.82,0.74,0.66,0.58,0.5];
  var sizes=[480,420,360];
  var best=null;

  for(var si=0;si<sizes.length;si++){
    var side=Math.min(sizes[si],source);
    var canvas=document.createElement("canvas");
    canvas.width=side;canvas.height=side;
    var ctx=canvas.getContext("2d");
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";
    ctx.drawImage(img,sx,sy,source,source,0,0,side,side);
    for(var qi=0;qi<qualities.length;qi++){
      var blob=await canvasBlob(canvas,qualities[qi]);
      best=blob;
      if(blob.size<=100*1024)return blob;
    }
  }
  return best;
}
function humanBytes(value){
  if(value<1024)return value+" B";
  if(value<1024*1024)return (value/1024).toFixed(1)+" KB";
  return (value/1024/1024).toFixed(1)+" MB";
}
async function openPhotoModal(personType,id,name,path,signedUrl){
  if(!photoAllowed()){switchView("access");return;}
  if(!id){toast("Salve a pessoa antes de enviar a foto");return;}
  photoState.personType=personType;
  photoState.id=id;
  photoState.name=name||"";
  photoState.path=path||null;
  photoState.blob=null;
  if(photoState.objectUrl){URL.revokeObjectURL(photoState.objectUrl);photoState.objectUrl=null;}
  $("#profilePhotoTitle").textContent=(personType==="teachers"?"Professor / colaborador · ":"Aluno · ")+(name||"");
  $("#profilePhotoFile").value="";
  $("#profilePhotoConfirm").disabled=true;
  $("#profilePhotoRemove").disabled=!path;
  $("#profilePhotoMeta").textContent=path?"Foto atual cadastrada.":"Nenhuma foto cadastrada.";
  setPhotoPreview(signedUrl||null,name);
  photoMessage("");
  $("#profilePhotoModal").classList.add("open");
}
async function renderTeacherPhoto(teacher){
  var btn=$("#teacherPhotoBtn");if(!btn)return;
  teacherPhotoPath=teacher?.photo_path||null;
  teacherPhotoSignedUrl=null;
  btn.disabled=!teacher?.id||!photoAllowed();
  $("#teacherPhotoFallback").textContent=photoInitials(teacher?.full_name);
  $("#teacherPhotoAction").textContent=teacherPhotoPath?"Alterar foto":"Enviar foto";
  if(!teacherPhotoPath){
    $("#teacherPhotoImg").hidden=true;
    $("#teacherPhotoImg").removeAttribute("src");
    $("#teacherPhotoFallback").hidden=false;
    return;
  }
  try{
    var url=await DaegonAuth.signedProfilePhotoUrl(teacherPhotoPath);
    if($("#teacherId").value!==teacher.id)return;
    teacherPhotoSignedUrl=url;
    $("#teacherPhotoImg").src=url;
    $("#teacherPhotoImg").hidden=false;
    $("#teacherPhotoFallback").hidden=true;
  }catch(e){
    $("#teacherPhotoImg").hidden=true;
    $("#teacherPhotoFallback").hidden=false;
  }
}
async function loadStudentPhotoRows(){
  if(!DaegonAuth.state.profile){
    studentPhotoRows=[];studentPhotoUrls.clear();renderStudentRows("");return;
  }
  try{
    studentPhotoRows=await DaegonAuth.listStudentsForPhotos();
    studentPhotoUrls.clear();
    await Promise.all(studentPhotoRows.map(async function(row){
      if(!row.photo_path)return;
      try{
        var url=await DaegonAuth.signedProfilePhotoUrl(row.photo_path);
        if(url)studentPhotoUrls.set(row.id,url);
      }catch(e){}
    }));
    renderStudentRows($("#studentSearch")?$("#studentSearch").value:"");
  }catch(e){
    $("#studentRows").innerHTML='<tr><td colspan="8">Não foi possível carregar os alunos.</td></tr>';
  }
}
function renderStudentRows(query){
  var el=$("#studentRows");if(!el)return;
  if(!DaegonAuth.state.profile){
    el.innerHTML='<tr><td colspan="8">Entre para visualizar os alunos cadastrados.</td></tr>';return;
  }
  var q=String(query||"").trim().toLowerCase();
  var rows=studentPhotoRows.filter(function(s){
    return !q||[s.name,s.reg,s.class,s.guardian,s.phone].join(" ").toLowerCase().includes(q);
  });
  if(!rows.length){
    el.innerHTML='<tr><td colspan="8">Nenhum aluno cadastrado.</td></tr>';return;
  }
  el.innerHTML=rows.map(function(s){
    var url=studentPhotoUrls.get(s.id);
    var photo=url
      ?'<img class="student-photo-thumb" src="'+safeText(url)+'" alt="">'
      :'<span class="student-photo-fallback">'+safeText(photoInitials(s.name))+'</span>';
    return '<tr>'+
      '<td><span class="student-photo-cell">'+photo+'</span></td>'+
      '<td>'+safeText(s.name)+'</td>'+
      '<td>'+safeText(s.reg)+'</td>'+
      '<td>'+safeText(s.class)+'</td>'+
      '<td><span class="status '+safeText(s.status)+'">'+(s.status==="active"?"Ativo":"Pendente")+'</span></td>'+
      '<td>'+safeText(s.guardian)+'</td>'+
      '<td>'+safeText(s.phone)+'</td>'+
      '<td><button class="secondary student-photo-action" type="button" data-student-id="'+safeText(s.id)+'">'+(s.photo_path?"Alterar foto":"Enviar foto")+'</button></td>'+
    '</tr>';
  }).join("");
  $$(".student-photo-action").forEach(function(btn){btn.onclick=function(){
    var row=studentPhotoRows.find(function(x){return x.id===btn.dataset.studentId;});
    if(row)openPhotoModal("students",row.id,row.name,row.photo_path,studentPhotoUrls.get(row.id)||null);
  };});
}

$("#teacherPhotoBtn")&&$("#teacherPhotoBtn").addEventListener("click",function(){
  var id=$("#teacherId").value;
  var name=$("#teacherName").value.trim();
  openPhotoModal("teachers",id,name,teacherPhotoPath,teacherPhotoSignedUrl);
});
$("#profilePhotoClose")&&$("#profilePhotoClose").addEventListener("click",closePhotoModal);
$("#profilePhotoCancel")&&$("#profilePhotoCancel").addEventListener("click",closePhotoModal);
$("#profilePhotoFile")&&$("#profilePhotoFile").addEventListener("change",async function(e){
  var file=e.target.files&&e.target.files[0];
  if(!file)return;
  $("#profilePhotoConfirm").disabled=true;
  photoMessage("Processando imagem...");
  try{
    var blob=await processProfilePhoto(file);
    photoState.blob=blob;
    if(photoState.objectUrl)URL.revokeObjectURL(photoState.objectUrl);
    photoState.objectUrl=URL.createObjectURL(blob);
    setPhotoPreview(photoState.objectUrl,photoState.name);
    $("#profilePhotoMeta").textContent="Original: "+humanBytes(file.size)+" · Ajustada: "+humanBytes(blob.size)+" · JPG quadrado";
    $("#profilePhotoConfirm").disabled=false;
    photoMessage(blob.size<=100*1024?"Imagem ajustada para até 100 KB.":"Imagem ajustada para uso no Web.","ok");
  }catch(err){
    photoState.blob=null;
    photoMessage(err.message||"Não foi possível processar a imagem.","error");
  }
});
$("#profilePhotoConfirm")&&$("#profilePhotoConfirm").addEventListener("click",async function(){
  if(!photoState.blob||!photoState.id)return;
  var btn=$("#profilePhotoConfirm");btn.disabled=true;photoMessage("Enviando foto...");
  try{
    var result=await DaegonAuth.uploadProfilePhoto(photoState.personType,photoState.id,photoState.blob);
    photoState.path=result.photo_path;
    if(photoState.personType==="teachers"){
      teacherPhotoPath=result.photo_path;
      if(typeof loadTeacher==="function")await loadTeacher(photoState.id);
    }else{
      await loadStudentPhotoRows();
    }
    photoMessage("Foto salva com sucesso.","ok");
    setTimeout(closePhotoModal,450);
  }catch(err){
    photoMessage("Não foi possível salvar a foto: "+(err.message||"erro"),"error");
    btn.disabled=false;
  }
});
$("#profilePhotoRemove")&&$("#profilePhotoRemove").addEventListener("click",async function(){
  if(!photoState.id||!photoState.path)return;
  if(!confirm("Remover a foto desta pessoa?"))return;
  var btn=$("#profilePhotoRemove");btn.disabled=true;photoMessage("Removendo foto...");
  try{
    await DaegonAuth.removeProfilePhoto(photoState.personType,photoState.id,photoState.path);
    if(photoState.personType==="teachers"){
      teacherPhotoPath=null;teacherPhotoSignedUrl=null;
      if(typeof loadTeacher==="function")await loadTeacher(photoState.id);
    }else{
      await loadStudentPhotoRows();
    }
    photoState.path=null;
    photoMessage("Foto removida.","ok");
    setTimeout(closePhotoModal,350);
  }catch(err){
    photoMessage("Não foi possível remover a foto: "+(err.message||"erro"),"error");
    btn.disabled=false;
  }
});

var studentNav=document.querySelector('[data-view="students"]');
studentNav&&studentNav.addEventListener("click",function(){if(DaegonAuth.state.profile)loadStudentPhotoRows();});
window.addEventListener("daegon-auth",function(){
  if(DaegonAuth.state.profile)loadStudentPhotoRows();
  else renderStudentRows("");
});
window.DaegonPhotos={renderStudentRows:renderStudentRows,renderTeacherPhoto:renderTeacherPhoto,loadStudentPhotoRows:loadStudentPhotoRows};
if(DaegonAuth.state.profile)loadStudentPhotoRows();