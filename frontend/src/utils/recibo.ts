import { escapeHtml } from './escapeHtml'

const MESES_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

export function formatarDataPorExtenso(date: Date = new Date()): string {
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = MESES_EXTENSO[date.getMonth()]
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1)
  const ano = date.getFullYear()
  return `${dia} de ${mesCapitalizado} de ${ano}`
}

export function obterCidadePorGeolocalizacao(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        fetch(url, {
          headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'NewMusicApp/1.0' }
        })
          .then((res) => res.json())
          .then((data: { address?: Record<string, string> }) => {
            const addr = data?.address
            if (!addr) {
              resolve('')
              return
            }
            const city =
              addr.city ??
              addr.town ??
              addr.village ??
              addr.municipality ??
              addr.county ??
              ''
            resolve(city)
          })
          .catch(() => resolve(''))
      },
      () => resolve(''),
      { timeout: 10000, maximumAge: 300000 }
    )
  })
}

export interface DadosRecibo {
  alunoNome: string
  alunoCpf?: string
  mes: number
  ano: number
  vencimento: string
  dataPagamento: string
  formaPagamento: string
  /** Valor da parcela (original). */
  valor: number
  /** Multa 10% (quando em atraso). */
  valorMulta?: number | null
  /** Juros 1% ao dia (quando em atraso). */
  valorJuros?: number | null
  turmaDescricao?: string
  turmaDiasHorarios?: string
}

function formatarDataBR(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export function abrirReciboParaImpressao(dados: DadosRecibo, cidade: string): void {
  const dataExtenso = formatarDataPorExtenso(new Date())
  const cidadeExibir = cidade.trim() || '_______________'
  const partsTurma = (dados.turmaDescricao ?? '').split(/\s*[—\-]\s*/).map((p) => p.trim()).filter(Boolean)
  const turmaNome = partsTurma[0] ?? ''
  const professorNome = partsTurma[1] ?? ''
  const turmaLinhaTexto = turmaNome + (dados.turmaDiasHorarios?.trim() ? ` — ${dados.turmaDiasHorarios.trim()}` : '')
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Recibo de Pagamento - New Music</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; line-height: 1.5; color: #1a1a1a; max-width: 600px; margin: 2rem auto; padding: 1rem; }
    .logo { max-height: 120px; width: auto; display: block; margin-left: auto; margin-right: auto; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; margin: 0 0 1.5rem; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    td { padding: 0.35rem 0.5rem 0.35rem 0; vertical-align: top; }
    td:first-child { font-weight: 600; color: #555; white-space: nowrap; width: 1%; }
    .assinatura { margin-top: 3.5rem; }
    .assinatura-linha { height: 2.5rem; border-bottom: 1px solid #333; margin-bottom: 0.25rem; }
    .assinatura-label { font-size: 0.8rem; color: #666; }
    .cidade-data { text-align: center; margin-top: 0.5rem; font-size: 0.95rem; }
    @media print { body { margin: 0; padding: 1rem; } }
  </style>
</head>
<body>
  <img src="/Logo%20Preto.png" alt="New Music" class="logo" />
  <h1>Recibo de Pagamento</h1>
  <table>
    <tr><td>Aluno</td><td>${escapeHtml(dados.alunoNome)}</td></tr>
    ${dados.alunoCpf?.trim() ? `<tr><td>CPF</td><td>${escapeHtml(dados.alunoCpf)}</td></tr>` : ''}
    <tr><td>Referência</td><td>Parcela ${dados.mes}/${dados.ano}</td></tr>
    ${turmaLinhaTexto ? `<tr><td>Turma</td><td>${escapeHtml(turmaLinhaTexto)}</td></tr>` : ''}
    ${professorNome ? `<tr><td>Professor</td><td>${escapeHtml(professorNome)}</td></tr>` : ''}
    <tr><td>Data de vencimento</td><td>${formatarDataBR(dados.vencimento)}</td></tr>
    <tr><td>Data de pagamento</td><td>${formatarDataBR(dados.dataPagamento)}</td></tr>
    <tr><td>Forma de pagamento</td><td>${escapeHtml(dados.formaPagamento || '—')}</td></tr>
    ${(dados.valorMulta != null && dados.valorMulta > 0) || (dados.valorJuros != null && dados.valorJuros > 0)
      ? `
    <tr><td>Valor da parcela</td><td>${formatarMoeda(dados.valor)}</td></tr>
    <tr><td>Multa (10%)</td><td>${formatarMoeda(dados.valorMulta ?? 0)}</td></tr>
    <tr><td>Juros (1% ao dia)</td><td>${formatarMoeda(dados.valorJuros ?? 0)}</td></tr>
    <tr><td>Total pago</td><td><strong>${formatarMoeda(dados.valor + (dados.valorMulta ?? 0) + (dados.valorJuros ?? 0))}</strong></td></tr>`
      : `<tr><td>Valor</td><td><strong>${formatarMoeda(dados.valor)}</strong></td></tr>`}
  </table>
  <div class="assinatura">
    <div class="assinatura-linha"></div>
    <div class="assinatura-label">Assinatura</div>
    <p class="cidade-data">${escapeHtml(cidadeExibir)}, ${dataExtenso}.</p>
  </div>
  <p style="margin-top: 2rem; font-size: 0.85rem; color: #666;">
    <button type="button" onclick="window.close()">Fechar</button>
  </p>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
  const janela = window.open('', '_blank', 'width=700,height=800,scrollbars=yes')
  if (!janela) {
    return
  }
  janela.document.write(html)
  janela.document.close()
}
