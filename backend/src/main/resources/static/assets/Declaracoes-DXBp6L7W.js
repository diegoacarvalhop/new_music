import{r as l,j as o}from"./react-vendor-CQulTfZ0.js";import{u as x,g as M,S as P}from"./index-Cs2E90Ho.js";import{m as I,a as f}from"./validacao-D9FFwnBf.js";import{e as p}from"./escapeHtml-HOWEQ2IU.js";import"./router-MSaW0Gl8.js";import"./axios-D5GkNzM3.js";const h=e=>e?(a=>Number.isNaN(a.getTime())?!1:(r=>(t=>(n=>n<0||n===0&&r.getDate()<a.getDate()?t-1<18:t<18)(r.getMonth()-a.getMonth()))(r.getFullYear()-a.getFullYear()))(new Date))(new Date(e+"T12:00:00")):!1,w=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],y=()=>(e=>`${String(e.getDate()).padStart(2,"0")} de ${w[e.getMonth()]} de ${e.getFullYear()}`)(new Date),j=()=>new Date().toLocaleDateString("pt-BR"),F=e=>e.responsavelNome?",":`, CPF ${e.alunoCpf||"_______________"},`,U=e=>e.responsavelNome&&e.alunoDataNascimento?`, nascido(a) em ${e.alunoDataNascimento}`:"",S=(e,a)=>e.replace(/\[ALUNO_NOME\]/g,a.alunoNome||"_______________").replace(/\[TRECHO_CPF_ALUNO\]/g,F(a)).replace(/\[ALUNO_CPF\]/g,a.alunoCpf||"_______________").replace(/\[TRECHO_NASCIMENTO\]/g,U(a)).replace(/\[ALUNO_DATA_NASCIMENTO\]/g,a.alunoDataNascimento||"_______________").replace(/\[RESPONSAVEL_NOME\]/g,a.responsavelNome||"_______________").replace(/\[RESPONSAVEL_CPF\]/g,a.responsavelCpf||"_______________").replace(/\[TELEFONE_RESPONSAVEL\]/g,a.telefoneResponsavel||"_______________").replace(/\[LINHA_RESPONSAVEL\]/g,a.responsavelNome?`Responsável legal: ${a.responsavelNome}.`:"").replace(/\[DATA\]/g,a.dataExtenso).replace(/\[DATA_DDMMAAAA\]/g,a.dataDDMMAAAA),q=`DECLARAÇÃO DE CONSENTIMENTO – LGPD (Lei Geral de Proteção de Dados)

Declaro que estou ciente de que a NEW MUSIC ESCOLA DE MÚSICA, no exercício de suas atividades, realiza o tratamento dos dados pessoais do(a) aluno(a) [ALUNO_NOME][TRECHO_NASCIMENTO][TRECHO_CPF_ALUNO] em conformidade com a Lei nº 13.709/2018 (LGPD), para as finalidades de matrícula, gestão acadêmica, financeira e de comunicação.

Autorizo o armazenamento e o uso desses dados exclusivamente para os fins informados, bem como o compartilhamento quando necessário com órgãos competentes, nos termos da legislação vigente.

[LINHA_RESPONSAVEL]

Data: [DATA]`,G=`TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

Declaro que autorizo a NEW MUSIC ESCOLA DE MÚSICA a utilizar imagens (fotos e/ou vídeos) do(a) aluno(a) [ALUNO_NOME][TRECHO_NASCIMENTO][TRECHO_CPF_ALUNO] em materiais de divulgação da escola (redes sociais, site, impressos e eventos), desde que não haja fins comerciais que envolvam a exploração direta da imagem do(a) menor/maior.

A referida autorização é válida pelo período de vigência do vínculo com a escola e pode ser revogada a qualquer momento, mediante comunicação por escrito.

[LINHA_RESPONSAVEL]

Data: [DATA]`,v=`DECLARAÇÃO DE RESPONSÁVEL LEGAL

Declaro, para os devidos fins, que eu, [RESPONSAVEL_NOME], portador(a) do CPF [RESPONSAVEL_CPF], telefone [TELEFONE_RESPONSAVEL], sou responsável legal pelo(a) menor [ALUNO_NOME][TRECHO_NASCIMENTO], e que assumo total responsabilidade por suas obrigações junto à NEW MUSIC ESCOLA DE MÚSICA, incluindo matrícula, frequência e pagamento das mensalidades.

As informações de curso(s), valor das mensalidades e quantidade de parcelas constam do termo de matrícula. Em caso de pagamento após o vencimento, será aplicada multa de 10% sobre o valor da parcela e juros de 1% ao dia até a data do pagamento.

Data: [DATA]`,V=`DECLARAÇÃO DE RESPONSABILIDADE

Declaro, para os devidos fins, que eu, [ALUNO_NOME], portador(a) do CPF [ALUNO_CPF][TRECHO_NASCIMENTO], assumo total responsabilidade por minhas obrigações junto à NEW MUSIC ESCOLA DE MÚSICA, incluindo matrícula, frequência e pagamento das mensalidades.

As informações de curso(s), valor das mensalidades e quantidade de parcelas constam do termo de matrícula. Em caso de pagamento após o vencimento, será aplicada multa de 10% sobre o valor da parcela e juros de 1% ao dia até a data do pagamento.

Data: [DATA]`,H={LGPD:q,DIRETO_IMAGEM:G,DECLARACAO_RESPONSAVEL:v},C=(e,a)=>e==="DECLARACAO_RESPONSAVEL"&&a?a.responsavelNome?v:V:H[e]??"",z={LGPD:"Declaração LGPD",DIRETO_IMAGEM:"Direito de Imagem",DECLARACAO_RESPONSAVEL:"Declaração de Responsabilidade"},$=e=>z[e]??"Declaração",k=e=>e?(a=>/^\d{4}-\d{2}-\d{2}$/.test(a)?(r=>new Date(r[0],r[1]-1,r[2]).toLocaleDateString("pt-BR"))(a.split("-").map(Number)):e)(e.trim().slice(0,10)):"",B=e=>({alunoNome:e.nome||"",alunoCpf:e.cpf?f(e.cpf):"",alunoDataNascimento:k(e.dataNascimento),responsavelNome:e.responsavelNome||"",responsavelCpf:e.responsavelCpf?f(e.responsavelCpf):"",telefoneResponsavel:e.telefone?I(e.telefone):"",dataExtenso:y(),dataDDMMAAAA:j(),nomeAssinatura:e.responsavelNome||e.nome||""}),X=(e,a)=>((r,t,n)=>(c=>c?(c.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${p(r)} - New Music</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 2rem auto; padding: 1rem; }
    .logo { max-height: 80px; width: auto; display: block; margin: 0 auto 1.5rem; }
    h1 { font-size: 1.1rem; margin: 0 0 1rem; text-align: center; }
    .texto { white-space: pre-wrap; text-align: justify; }
    .assinatura { margin-top: 2.5rem; text-align: center; }
    .assinatura .linha { display: inline-block; width: 22.5rem; max-width: 100%; border-bottom: 1px solid #000; margin-bottom: 0.25rem; }
    @media print { body { margin: 0; padding: 1rem; } .no-print { display: none; } }
  </style>
</head>
<body>
  <img src="/Logo%20Preto.png" alt="New Music" class="logo" />
  <h1>${p(r)}</h1>
  <div class="texto">${t.split(`
`).map(u=>p(u)).join("<br />")}</div>
  <p class="assinatura"><span class="linha"></span><br/>${p(n)}</p>
  <p class="no-print" style="margin-top: 2rem; font-size: 0.85rem; color: #666;"><button type="button" onclick="window.close()">Fechar</button></p>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`),c.document.close()):void 0)(window.open("","_blank","width=700,height=800,scrollbars=yes")))($(e),S(C(e,a),a),a.nomeAssinatura||""),K=(e,a)=>e?a.find(r=>r.id===Number(e))??null:null,W=e=>e?B({nome:e.nome,cpf:e.cpf,dataNascimento:e.dataNascimento,responsavelNome:e.responsavelNome,responsavelCpf:e.responsavelCpf,telefone:e.telefone}):null,Y=(e,a,r)=>(t=>(n=>({aluno:t,isMenor:t?h(t.dataNascimento):!1,declaracaoResponsavelSoMenor:!1,dados:n,textoPreview:n&&t?S(C(r,n),n):"Selecione o tipo de declaração e o aluno."}))(W(t)))(K(e,a));function se(){var O;const{t:e}=x(),[a,r]=l.useState("LGPD"),[t,n]=l.useState([]),[c,u]=l.useState(""),[_,A]=l.useState(""),[E,d]=l.useState(!1),[L,N]=l.useState(!0),[g,b]=l.useState("");l.useEffect(()=>{N(!0),M().get("/alunos",{params:{page:0,size:500}}).then(s=>{var i;return n(((i=s.data)==null?void 0:i.content)??[])}).catch(()=>b("Erro ao carregar alunos.")).finally(()=>N(!1))},[]);const D=l.useMemo(()=>{const s=_.trim().toLowerCase();return s?t.filter(i=>(i.nome??"").toLowerCase().includes(s)):t},[t,_]),m=l.useMemo(()=>Y(c,t,a),[c,t,a]),R=[{value:"LGPD",labelKey:"declaracoes.lgpd"},{value:"DIRETO_IMAGEM",labelKey:"declaracoes.imageRights"},{value:"DECLARACAO_RESPONSAVEL",labelKey:"declaracoes.responsibility"}],T=()=>{!m.aluno||!m.dados||X(a,m.dados)};return o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"page-header",children:o.jsx("h1",{children:e("declaracoes.title")})}),g&&o.jsx("div",{className:"alert alert-error",children:g}),L?o.jsx("p",{children:e("common.loading")}):o.jsxs("div",{className:"card",children:[o.jsxs("div",{className:"form-group",children:[o.jsx("label",{htmlFor:"declaracao-tipo",children:e("declaracoes.type")}),o.jsx(P,{id:"declaracao-tipo",value:a,onChange:s=>r(s),options:R.map(s=>({value:s.value,label:e(s.labelKey)})),placeholder:e("declaracoes.type"),"aria-label":e("declaracoes.type"),className:"select-search-wrap--compact"})]}),o.jsxs("div",{className:"form-group",children:[o.jsx("label",{htmlFor:"declaracao-aluno",children:e("declaracoes.student")}),o.jsxs("div",{className:"select-search-wrap",children:[o.jsx("input",{id:"declaracao-aluno",type:"text",className:"select-search-input",placeholder:e("declaracoes.searchPlaceholder"),value:E?_:((O=t.find(s=>s.id===Number(c)))==null?void 0:O.nome)??"",onChange:s=>{A(s.target.value),d(!0)},onFocus:()=>d(!0),onBlur:()=>setTimeout(()=>d(!1),200),autoComplete:"off","aria-label":e("common.search")}),E&&o.jsx("ul",{className:"select-search-dropdown",role:"listbox",children:D.length===0?o.jsx("li",{className:"select-search-dropdown-empty",children:e("declaracoes.noStudentsFound")}):D.map(s=>o.jsxs("li",{role:"option",className:"select-search-dropdown-item",onMouseDown:i=>{i.preventDefault(),u(String(s.id)),A(""),d(!1)},children:[s.nome,s.dataNascimento&&h(s.dataNascimento)?" (menor)":""]},s.id))})]})]}),m.aluno&&o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"form-group",children:[o.jsx("label",{children:e("declaracoes.preview")}),o.jsx("div",{className:"declaracao-preview",style:{whiteSpace:"pre-wrap",textAlign:"justify",padding:"1rem",background:"var(--bg-secondary, #f5f5f5)",borderRadius:4,maxHeight:300,overflow:"auto"},children:m.textoPreview})]}),o.jsx("div",{className:"form-actions",children:o.jsx("button",{type:"button",className:"btn btn-primary",onClick:T,children:e("declaracoes.print")})})]})]})]})}export{se as default};
