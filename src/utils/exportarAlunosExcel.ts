/**
 * Exporta uma lista de alunos para .xlsx.
 *
 * A lib xlsx entra por import DINÂMICO de propósito: hoje o projeto só a usa
 * para LER a planilha de importação, e o tree-shaking descarta a metade
 * escritora (~90 KB). Uma chamada estática de writeFile traria esse peso de
 * volta para todo mundo — assim só baixa quem clica em Exportar.
 */

/** A listagem preenche cargo/setor/matrícula com '—'; na planilha isso vira vazio. */
const limpar = (v: any) => (v && v !== '—' ? String(v) : '')

/**
 * "1988-12-30T03:00:00.000Z" → "30/12/1988".
 * Fatia a string em vez de reconstruir um Date: reinterpretar o instante
 * devolve o dia anterior num servidor à frente do UTC.
 */
const dataBR = (v: any) => {
  const iso = v ? String(v).slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export async function exportarAlunosExcel(alunos: any[], nomeArquivo: string) {
  const XLSX = await import('xlsx')

  const linhas = alunos.map(a => ({
    Nome:       a.nome ?? '',
    // String, não number: assim a célula sai como texto (t:'s') e o zero à
    // esquerda do CPF sobrevive — como número, 03890183336 vira 3890183336.
    CPF:        String(a.cpf ?? ''),
    Cargo:      limpar(a.cargo),
    Setor:      limpar(a.setor),
    'Admissão': dataBR(a.data_admissao),
    Nascimento: dataBR(a.data_nascimento),
    Origem:     a.origem ?? 'Empregado',
    Status:     a.status ?? '',
    'Matrícula': limpar(a.matricula),
  }))

  const ws = XLSX.utils.json_to_sheet(linhas)
  ws['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 26 }, { wch: 24 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alunos')
  XLSX.writeFile(wb, nomeArquivo)
}

/** alunos_edeconsil_2026-08-15.xlsx — a data evita (1), (2) na pasta de downloads. */
export const nomeArquivoAlunos = () =>
  `alunos_edeconsil_${new Date().toISOString().slice(0, 10)}.xlsx`
