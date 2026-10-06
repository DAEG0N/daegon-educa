const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const titles={dashboard:["Geral / Início","Início"],search:["Geral / Pesquisa","Pesquisa global"],students:["Secretaria / Cadastros","Alunos"],guardians:["Secretaria / Cadastros","Responsáveis"],enrollments:["Secretaria / Matrículas","Matrículas"],documents:["Secretaria / Documentos","Documentos"],classes:["Acadêmico / Estrutura","Turmas & Grade"],diary:["Acadêmico / Diário","Diário de Classe"],attendance:["Acadêmico / Diário","Frequência"],grades:["Acadêmico / Avaliações","Notas & Avaliações"],reportcards:["Acadêmico / Boletins","Central de Boletins"],finance:["Gestão / Financeiro","Financeiro"],communication:["Gestão / Comunicação","Comunicação"],portal:["Gestão / Portais","Portal & App"]};

let students=[
{name:"Gabriel Santos",reg:"2026-0712",class:"7º A",status:"active",guardian:"Juliana Santos",phone:"(79) 99111-2200"},
{name:"Mariana Alves",reg:"2026-0818",class:"8º A",status:"active",guardian:"Ricardo Alves",phone:"(79) 99821-4432"},
{name:"Lucas Ferreira",reg:"2026-0634",class:"6º A",status:"active",guardian:"Ana Ferreira",phone:"(79) 98712-7311"},
{name:"Beatriz Lima",reg:"2026-0902",class:"9º A",status:"pending",guardian:"Carla Lima",phone:"(79) 99920-1147"},
{name:"Pedro Rocha",reg:"2026-0827",class:"8º A",status:"active",guardian:"Márcio Rocha",phone:"(79) 98741-5580"}
];

const guardians=[
["Juliana Santos","Gabriel Santos","Mãe","(79) 99111-2200","juliana@email.com","Ativo"],
["Ricardo Alves","Mariana Alves","Pai","(79) 99821-4432","ricardo@email.com","Ativo"],
["Ana Ferreira","Lucas Ferreira","Mãe","(79) 98712-7311","ana@email.com","Ativo"],
["Carla Lima","Beatriz Lima","Mãe","(79) 99920-1147","carla@email.com","Pendente"]
];

const grades=[
{name:"Mariana Alves",scores:[8.5,9,8.7],abs:2},
{name:"Pedro Rocha",scores:[6.5,7.2,7.0],abs:5},
{name:"Ana Clara",scores:[9.2,8.8,9.5],abs:1},
{name:"João Victor",scores:[5.8,6.3,6.0],abs:8},
{name:"Sofia Martins",scores:[7.8,8.1,8.4],abs:3}
];

const attendance=[
{name:"Mariana Alves",state:"present"},{name:"Pedro Rocha",state:"present"},{name:"Ana Clara",state:"present"},{name:"João Victor",state:"absent"},{name:"Sofia Martins",state:"present"}
];

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
  $("#studentRows").innerHTML=students.filter(s=>!q||[s.name,s.reg,s.class,s.guardian].join(" ").toLowerCase().includes(q)).map(s=>`<tr><td>${s.name}</td><td>${s.reg}</td><td>${s.class}</td><td><span class="status ${s.status}">${statusLabel(s.status)}</span></td><td>${s.guardian}</td><td>${s.phone}</td><td>•••</td></tr>`).join("");
}
$("#studentSearch").oninput=e=>renderStudents(e.target.value);

$("#guardianRows").innerHTML=guardians.map(g=>`<tr><td>${g[0]}</td><td>${g[1]}</td><td>${g[2]}</td><td>${g[3]}</td><td>${g[4]}</td><td><span class="status active">${g[5]}</span></td></tr>`).join("");

const enrollLanes=[["Pré-cadastro",["Lívia Souza","Arthur Nunes"]],["Documentação",["Beatriz Lima","Helena Costa"]],["Contrato",["Daniel Rocha","Miguel Melo"]],["Pronta p/ efetivar",["Laura Mendes","Caio Nunes"]]];
$("#enrollmentPipeline").innerHTML=enrollLanes.map(l=>`<div class="lane"><h3>${l[0]} · ${l[1].length}</h3>${l[1].map(n=>'<div class="enroll-card"><b>'+n+'</b><span>2026 · Fundamental II</span></div>').join("")}</div>`).join("");

const docs=[["DEC","Declaração de matrícula","Emissão imediata"],["HIS","Histórico escolar","Com notas e carga horária"],["BOL","Boletim escolar","Por período ou anual"],["ATE","Atestado de frequência","Com percentual de presença"],["TRA","Transferência","Documentação de saída"],["CER","Certificado","Conclusão de etapa"]];
$("#documentGrid").innerHTML=docs.map(d=>`<article class="module-card"><span>${d[0]}</span><h3>${d[1]}</h3><p>${d[2]}</p><button class="secondary">Emitir documento</button></article>`).join("");

const classes=[["6º A","28 alunos","Matutino",["Português · 5 aulas","Matemática · 5 aulas","Ciências · 3 aulas"]],["7º A","25 alunos","Matutino",["Português · 5 aulas","Matemática · 5 aulas","História · 3 aulas"]],["8º A","30 alunos","Matutino",["Português · 5 aulas","Matemática · 5 aulas","Geografia · 3 aulas"]],["9º A","27 alunos","Matutino",["Português · 5 aulas","Matemática · 5 aulas","Inglês · 2 aulas"]]];
$("#classGrid").innerHTML=classes.map(c=>`<article class="class-card"><header><div><h3>${c[0]}</h3><small>${c[1]} · ${c[2]}</small></div><button class="secondary">Abrir</button></header><ul>${c[3].map(x=>'<li><span>'+x.split(" · ")[0]+'</span><b>'+x.split(" · ")[1]+'</b></li>').join("")}</ul></article>`).join("");

const diaryTabs={
lessons:`<div class="diary-entry"><time>06/10 · 1ª aula</time><div><p>Equações do 1º grau</p><small>Exercícios 1 a 12 · Livro pág. 148</small></div><button class="secondary">Editar</button></div><div class="diary-entry"><time>03/10 · 2ª aula</time><div><p>Revisão de expressões algébricas</p><small>Lista de revisão entregue em sala</small></div><button class="secondary">Editar</button></div><button class="primary">+ Registrar aula</button>`,
attendance:`<p>Frequência da turma vinculada aos registros de aula.</p><button class="primary" data-go-attendance>Abrir frequência em lote</button>`,
content:`<div class="diary-entry"><time>06/10</time><div><p>Equações do 1º grau e resolução de problemas.</p><small>Conteúdo confirmado</small></div><button class="secondary">Editar</button></div>`,
confirm:`<h3>Confirmar diário do 4º bimestre</h3><p>Para confirmar o diário, verifique se todas as aulas e frequências foram preenchidas.</p><div class="notice"><span>●</span><div><b>2 pendências encontradas</b><small>Frequência ausente em 2 datas</small></div></div><button class="primary">Confirmar diário</button>`
};
function renderDiary(tab="lessons"){$("#diaryContent").innerHTML=diaryTabs[tab];$("[data-go-attendance]")?.addEventListener("click",()=>switchView("attendance"))}
$$("[data-diary-tab]").forEach(b=>b.onclick=()=>{$$("[data-diary-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderDiary(b.dataset.diaryTab)});

function renderAttendance(){
 $("#attendanceRows").innerHTML=attendance.map((a,i)=>`<tr><td>${a.name}</td><td><div class="attendance-toggle"><button class="present ${a.state==="present"?"active":""}" data-att="${i}" data-state="present">P</button><button class="absent ${a.state==="absent"?"active":""}" data-att="${i}" data-state="absent">F</button></div></td><td><input class="grade-input" placeholder="—"></td><td><input class="grade-input" style="width:180px" placeholder="Observação"></td></tr>`).join("");
 $$("[data-att]").forEach(b=>b.onclick=()=>{attendance[+b.dataset.att].state=b.dataset.state;renderAttendance()});
}
$("#markAllPresent").onclick=()=>{attendance.forEach(a=>a.state="present");renderAttendance();toast("Todos marcados como presentes")};

function renderGrades(){
 $("#gradeRows").innerHTML=grades.map((r,ri)=>{const avg=(r.scores.reduce((a,b)=>a+b,0)/r.scores.length).toFixed(1);return `<tr><td>${r.name}</td>${r.scores.map((g,gi)=>'<td><input class="grade-input" data-ri="'+ri+'" data-gi="'+gi+'" type="number" min="0" max="10" step=".1" value="'+g+'"></td>').join("")}<td><b>${avg}</b></td><td>${r.abs}</td><td class="${avg>=7?"approved":"attention"}">${avg>=7?"Aprovado":"Recuperação"}</td></tr>`}).join("");
 $$(".grade-input[data-ri]").forEach(i=>i.onchange=()=>{grades[+i.dataset.ri].scores[+i.dataset.gi]=Math.max(0,Math.min(10,+i.value));renderGrades()});
}
$("#applyGradeBtn").onclick=()=>{const v=prompt("Nota para aplicar em todos os alunos:");if(v!==null&&!isNaN(v)){grades.forEach(g=>g.scores[2]=Math.max(0,Math.min(10,+v)));renderGrades();toast("Nota aplicada em lote")}};
$("#confirmGradesBtn").onclick=()=>toast("Notas confirmadas e bloqueadas para edição");
$("#publishReportsBtn").onclick=()=>{if(confirm("Publicar notas para alunos e responsáveis?")){$("#pendingReports").textContent="0";toast("Notas publicadas no portal")}};

const finance=[["Juliana Santos","Gabriel Santos","10/10/2026","R$ 820,00","Pago","PIX"],["Ricardo Alves","Mariana Alves","10/10/2026","R$ 820,00","Pago","Boleto"],["Ana Ferreira","Lucas Ferreira","10/10/2026","R$ 820,00","Em aberto","Boleto"],["Carla Lima","Beatriz Lima","10/10/2026","R$ 820,00","Atrasado","Boleto"]];
$("#financeRows").innerHTML=finance.map(f=>`<tr><td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td><td><span class="status ${f[4]==="Pago"?"active":"pending"}">${f[4]}</span></td><td>${f[5]}</td></tr>`).join("");

const studentModal=$("#studentModal"), enrollmentModal=$("#enrollmentModal");
function openModal(m){m.classList.add("open")} function closeModal(m){m.classList.remove("open")}
$("#newStudentBtn").onclick=()=>openModal(studentModal); $("#quickBtn").onclick=()=>openModal(studentModal); $("#newEnrollmentBtn").onclick=()=>openModal(enrollmentModal);
$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.closest(".modal"))); $$(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)closeModal(m)});
$("#studentForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);students.unshift({name:f.get("name"),reg:"2026-"+String(Math.floor(Math.random()*9000+1000)),class:f.get("class"),status:f.get("status"),guardian:f.get("guardian"),phone:f.get("phone")||"—"});renderStudents();e.currentTarget.reset();closeModal(studentModal);toast("Aluno cadastrado")};
$("#enrollmentForm").onsubmit=e=>{e.preventDefault();e.currentTarget.reset();closeModal(enrollmentModal);toast("Matrícula iniciada")};

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