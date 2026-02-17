import type { Aluno } from '../types'
import { mascaraCPF, mascaraTelefone } from './validacao'
import { escapeHtml } from './escapeHtml'

export type TipoDeclaracao = 'LGPD' | 'DIRETO_IMAGEM' | 'DECLARACAO_RESPONSAVEL'

export interface DadosDeclaracao {
  alunoNome: string
  alunoCpf?: string
  alunoDataNascimento?: string
  responsavelNome?: string
  responsavelCpf?: string
  telefoneResponsavel?: string
  dataExtenso: string
  dataDDMMAAAA: string
  nomeAssinatura: string
}

export const menorDeIdade = (dataNascimento: string | undefined): boolean =>
  !dataNascimento ? false
    : ((d: Date) => Number.isNaN(d.getTime()) ? false
      : ((hoje: Date) => ((idade: number) => ((m: number) => (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) ? idade - 1 < 18 : idade < 18)(hoje.getMonth() - d.getMonth()))(hoje.getFullYear() - d.getFullYear()))(new Date()))(new Date(dataNascimento + 'T12:00:00'))

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const dataPorExtenso = (): string =>
  ((d: Date) => `${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`)(new Date())

const dataDDMMAAAA = (): string => new Date().toLocaleDateString('pt-BR')

const trechoCpfAluno = (dados: DadosDeclaracao): string =>
  dados.responsavelNome ? ',' : `, CPF ${dados.alunoCpf || '_______________'},`

/** Só para menor de idade: trecho ", nascido(a) em DD/MM/AAAA"; para maior fica vazio. */
const trechoNascimento = (dados: DadosDeclaracao): string =>
  dados.responsavelNome && dados.alunoDataNascimento ? `, nascido(a) em ${dados.alunoDataNascimento}` : ''

export const preencher = (texto: string, dados: DadosDeclaracao): string =>
  texto
    .replace(/\[ALUNO_NOME\]/g, dados.alunoNome || '_______________')
    .replace(/\[TRECHO_CPF_ALUNO\]/g, trechoCpfAluno(dados))
    .replace(/\[ALUNO_CPF\]/g, dados.alunoCpf || '_______________')
    .replace(/\[TRECHO_NASCIMENTO\]/g, trechoNascimento(dados))
    .replace(/\[ALUNO_DATA_NASCIMENTO\]/g, dados.alunoDataNascimento || '_______________')
    .replace(/\[RESPONSAVEL_NOME\]/g, dados.responsavelNome || '_______________')
    .replace(/\[RESPONSAVEL_CPF\]/g, dados.responsavelCpf || '_______________')
    .replace(/\[TELEFONE_RESPONSAVEL\]/g, dados.telefoneResponsavel || '_______________')
    .replace(/\[LINHA_RESPONSAVEL\]/g, dados.responsavelNome ? `Responsável legal: ${dados.responsavelNome}.` : '')
    .replace(/\[DATA\]/g, dados.dataExtenso)
    .replace(/\[DATA_DDMMAAAA\]/g, dados.dataDDMMAAAA)

const TEXTO_LGPD = `DECLARAÇÃO DE CONSENTIMENTO – LGPD (Lei Geral de Proteção de Dados)

Declaro que estou ciente de que a NEW MUSIC ESCOLA DE MÚSICA, no exercício de suas atividades, realiza o tratamento dos dados pessoais do(a) aluno(a) [ALUNO_NOME][TRECHO_NASCIMENTO][TRECHO_CPF_ALUNO] em conformidade com a Lei nº 13.709/2018 (LGPD), para as finalidades de matrícula, gestão acadêmica, financeira e de comunicação.

Autorizo o armazenamento e o uso desses dados exclusivamente para os fins informados, bem como o compartilhamento quando necessário com órgãos competentes, nos termos da legislação vigente.

[LINHA_RESPONSAVEL]

Data: [DATA]`

const TEXTO_DIRETO_IMAGEM = `TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

Declaro que autorizo a NEW MUSIC ESCOLA DE MÚSICA a utilizar imagens (fotos e/ou vídeos) do(a) aluno(a) [ALUNO_NOME][TRECHO_NASCIMENTO][TRECHO_CPF_ALUNO] em materiais de divulgação da escola (redes sociais, site, impressos e eventos), desde que não haja fins comerciais que envolvam a exploração direta da imagem do(a) menor/maior.

A referida autorização é válida pelo período de vigência do vínculo com a escola e pode ser revogada a qualquer momento, mediante comunicação por escrito.

[LINHA_RESPONSAVEL]

Data: [DATA]`

const TEXTO_DECLARACAO_RESPONSAVEL = `DECLARAÇÃO DE RESPONSÁVEL LEGAL

Declaro, para os devidos fins, que eu, [RESPONSAVEL_NOME], portador(a) do CPF [RESPONSAVEL_CPF], telefone [TELEFONE_RESPONSAVEL], sou responsável legal pelo(a) menor [ALUNO_NOME][TRECHO_NASCIMENTO], e que assumo total responsabilidade por suas obrigações junto à NEW MUSIC ESCOLA DE MÚSICA, incluindo matrícula, frequência e pagamento das mensalidades.

As informações de curso(s), valor das mensalidades e quantidade de parcelas constam do termo de matrícula. Em caso de pagamento após o vencimento, será aplicada multa de 10% sobre o valor da parcela e juros de 1% ao dia até a data do pagamento.

Data: [DATA]`

const TEXTO_DECLARACAO_RESPONSABILIDADE_MAIOR = `DECLARAÇÃO DE RESPONSABILIDADE

Declaro, para os devidos fins, que eu, [ALUNO_NOME], portador(a) do CPF [ALUNO_CPF][TRECHO_NASCIMENTO], assumo total responsabilidade por minhas obrigações junto à NEW MUSIC ESCOLA DE MÚSICA, incluindo matrícula, frequência e pagamento das mensalidades.

As informações de curso(s), valor das mensalidades e quantidade de parcelas constam do termo de matrícula. Em caso de pagamento após o vencimento, será aplicada multa de 10% sobre o valor da parcela e juros de 1% ao dia até a data do pagamento.

Data: [DATA]`

const TEXTO_POR_TIPO: Record<TipoDeclaracao, string> = {
  LGPD: TEXTO_LGPD,
  DIRETO_IMAGEM: TEXTO_DIRETO_IMAGEM,
  DECLARACAO_RESPONSAVEL: TEXTO_DECLARACAO_RESPONSAVEL
}

export const getTextoDeclaracao = (tipo: TipoDeclaracao, dados?: DadosDeclaracao | null): string =>
  tipo === 'DECLARACAO_RESPONSAVEL' && dados
    ? (dados.responsavelNome ? TEXTO_DECLARACAO_RESPONSAVEL : TEXTO_DECLARACAO_RESPONSABILIDADE_MAIOR)
    : (TEXTO_POR_TIPO[tipo] ?? '')

const TITULO_POR_TIPO: Record<TipoDeclaracao, string> = {
  LGPD: 'Declaração LGPD',
  DIRETO_IMAGEM: 'Direito de Imagem',
  DECLARACAO_RESPONSAVEL: 'Declaração de Responsabilidade'
}

export const getTituloDeclaracao = (tipo: TipoDeclaracao): string => TITULO_POR_TIPO[tipo] ?? 'Declaração'

const formatarData = (s: string | undefined): string =>
  !s ? '' : ((part: string) => /^\d{4}-\d{2}-\d{2}$/.test(part) ? ((p: number[]) => new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('pt-BR'))(part.split('-').map(Number)) : s)(s.trim().slice(0, 10))

export const montarDadosDeclaracao = (aluno: { nome: string; cpf?: string; dataNascimento?: string; responsavelNome?: string; responsavelCpf?: string; telefone?: string }): DadosDeclaracao => ({
  alunoNome: aluno.nome || '',
  alunoCpf: aluno.cpf ? mascaraCPF(aluno.cpf) : '',
  alunoDataNascimento: formatarData(aluno.dataNascimento),
  responsavelNome: aluno.responsavelNome || '',
  responsavelCpf: aluno.responsavelCpf ? mascaraCPF(aluno.responsavelCpf) : '',
  telefoneResponsavel: aluno.telefone ? mascaraTelefone(aluno.telefone) : '',
  dataExtenso: dataPorExtenso(),
  dataDDMMAAAA: dataDDMMAAAA(),
  nomeAssinatura: aluno.responsavelNome || aluno.nome || ''
})

export const abrirDeclaracaoParaImpressao = (tipo: TipoDeclaracao, dados: DadosDeclaracao): void =>
  ((titulo: string, textoPreenchido: string, nomeAssinatura: string) =>
    ((janela: Window | null) => janela ? (janela.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(titulo)} - New Music</title>
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
  <h1>${escapeHtml(titulo)}</h1>
  <div class="texto">${textoPreenchido.split('\n').map((l) => escapeHtml(l)).join('<br />')}</div>
  <p class="assinatura"><span class="linha"></span><br/>${escapeHtml(nomeAssinatura)}</p>
  <p class="no-print" style="margin-top: 2rem; font-size: 0.85rem; color: #666;"><button type="button" onclick="window.close()">Fechar</button></p>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`), janela.document.close()) : undefined)(window.open('', '_blank', 'width=700,height=800,scrollbars=yes')))(getTituloDeclaracao(tipo), preencher(getTextoDeclaracao(tipo, dados), dados), dados.nomeAssinatura || '')

const getAluno = (alunoId: string, alunos: Aluno[]): Aluno | null =>
  alunoId ? alunos.find((x) => x.id === Number(alunoId)) ?? null : null

const buildDados = (a: Aluno | null): DadosDeclaracao | null =>
  a ? montarDadosDeclaracao({ nome: a.nome, cpf: a.cpf, dataNascimento: a.dataNascimento, responsavelNome: a.responsavelNome, responsavelCpf: a.responsavelCpf, telefone: a.telefone }) : null

export interface DeclaracaoState {
  aluno: Aluno | null
  isMenor: boolean
  declaracaoResponsavelSoMenor: boolean
  dados: DadosDeclaracao | null
  textoPreview: string
}

export const computeDeclaracaoState = (alunoId: string, alunos: Aluno[], tipo: TipoDeclaracao): DeclaracaoState =>
  ((a: Aluno | null) => ((dados: DadosDeclaracao | null) => ({
    aluno: a,
    isMenor: a ? menorDeIdade(a.dataNascimento) : false,
    declaracaoResponsavelSoMenor: false,
    dados,
    textoPreview: dados && a ? preencher(getTextoDeclaracao(tipo, dados), dados) : 'Selecione o tipo de declaração e o aluno.'
  }))(buildDados(a)))(getAluno(alunoId, alunos))
