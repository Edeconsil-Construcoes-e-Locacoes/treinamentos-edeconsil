import * as XLSX from 'xlsx'

/**
 * Exporta a lista da aba "Não iniciados" (Indicadores) para .xlsx.
 *
 * Import estático, igual ao exportarTurmasExcel.ts: import dinâmico da lib já
 * quebrou em produção neste projeto com `XLSX.utils` undefined.
 *
 * Recebe a lista exatamente como está na tela (já filtrada pela busca e
 * ordenada por admissão) — não reordena nem refiltra aqui.
 */

/**
 * "2019-03-04T00:00:00.000Z" → "04/03/2019".
 * Fatia a string em vez de reconstruir um Date: reinterpretar o instante pode
 * devolver o dia anterior conforme o fuso (bug já visto neste projeto).
 */
const dataBR = (v: any) => {
  const iso = v ? String(v).slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export async function exportarNaoIniciadosExcel(alunos: any[], nomeArquivo: string) {
  const linhas = alunos.map(a => ({
    Nome:       a.nome       ?? '',
    Cargo:      a.cargo      ?? '',
    Turma:      a.turma_nome ?? '',
    'Admissão': dataBR(a.data_admissao),
  }))

  const ws = XLSX.utils.json_to_sheet(linhas)
  ws['!cols'] = [
    { wch: 36 }, { wch: 30 }, { wch: 28 }, { wch: 12 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Não iniciados')
  XLSX.writeFile(wb, nomeArquivo)
}

/** nao_iniciados_edeconsil_2026-09-30.xlsx — a data evita (1), (2) na pasta de downloads. */
export const nomeArquivoNaoIniciados = () =>
  `nao_iniciados_edeconsil_${new Date().toISOString().slice(0, 10)}.xlsx`
