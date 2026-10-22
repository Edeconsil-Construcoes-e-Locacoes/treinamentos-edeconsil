import * as XLSX from 'xlsx'
import { formatarHoras } from './formatarHoras'

/**
 * Exporta o indice de horas de treinamento (resposta de
 * GET /admin/indicadores/horas-turma) para .xlsx, uma aba por visao.
 *
 * Import estatico do xlsx, como nos demais exportadores (o dinamico ja quebrou
 * em producao com XLSX.utils undefined).
 *
 * Colunas decimais sao NUMEROS (2 casas) para o Excel conseguir somar; a coluna
 * "Horas" e o texto legivel, pela mesma formatarHoras do card.
 */

interface RespostaHoras {
  turmas: Array<{
    turma_nome: string
    horas_total: number
    colaboradores_com_horas: number
    colaboradores_total: number
    media_por_colaborador: number
  }>
  cursos: Array<{
    curso_titulo: string
    carga_horaria: string | null
    horas_total: number
    colaboradores_com_horas: number
    concluintes: number
  }>
  cursos_sem_carga: string[]
}

const dec = (n: number) => Math.round((Number(n) || 0) * 100) / 100

// Aplica formato 0.00 nas colunas numericas decimais (indices base 0) da aba.
function formatarDecimais(ws: XLSX.WorkSheet, colunas: number[], primeiraLinha: number, ultimaLinha: number) {
  for (const c of colunas) {
    for (let r = primeiraLinha; r <= ultimaLinha; r++) {
      const cel = ws[XLSX.utils.encode_cell({ r, c })]
      if (cel && typeof cel.v === 'number') cel.z = '0.00'
    }
  }
}

export async function exportarHorasTreinamentoExcel(dados: RespostaHoras, nomeArquivo: string) {
  const wb = XLSX.utils.book_new()

  // Aba "Por turma"
  const turmas = dados.turmas ?? []
  const linhasTurma: (string | number)[][] = [
    ['Turma', 'Horas (decimal)', 'Horas', 'Colaboradores com horas', 'Colaboradores na turma', 'Média por colaborador (decimal)'],
    ...turmas.map(t => [
      t.turma_nome ?? '',
      dec(t.horas_total),
      formatarHoras(t.horas_total),
      Number(t.colaboradores_com_horas) || 0,
      Number(t.colaboradores_total) || 0,
      dec(t.media_por_colaborador),
    ]),
  ]
  const somaTurmas = turmas.reduce((s, t) => s + (Number(t.horas_total) || 0), 0)
  linhasTurma.push(['Total', dec(somaTurmas), formatarHoras(somaTurmas), '', '', ''])
  const wsTurma = XLSX.utils.aoa_to_sheet(linhasTurma)
  wsTurma['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 10 }, { wch: 24 }, { wch: 22 }, { wch: 30 }]
  formatarDecimais(wsTurma, [1, 5], 1, linhasTurma.length - 1)
  XLSX.utils.book_append_sheet(wb, wsTurma, 'Por turma')

  // Aba "Por curso"
  const cursos = dados.cursos ?? []
  const linhasCurso: (string | number)[][] = [
    ['Curso', 'Carga horária', 'Horas (decimal)', 'Horas', 'Colaboradores com horas', 'Concluintes'],
    ...cursos.map(c => [
      c.curso_titulo ?? '',
      c.carga_horaria ?? '',
      dec(c.horas_total),
      formatarHoras(c.horas_total),
      Number(c.colaboradores_com_horas) || 0,
      Number(c.concluintes) || 0,
    ]),
  ]
  const somaCursos = cursos.reduce((s, c) => s + (Number(c.horas_total) || 0), 0)
  linhasCurso.push(['Total', '', dec(somaCursos), formatarHoras(somaCursos), '', ''])
  const ultimaDados = linhasCurso.length - 1
  if ((dados.cursos_sem_carga ?? []).length > 0) {
    linhasCurso.push([])
    linhasCurso.push(['Fora da conta (sem carga horária):'])
    for (const titulo of dados.cursos_sem_carga) linhasCurso.push([titulo])
  }
  const wsCurso = XLSX.utils.aoa_to_sheet(linhasCurso)
  wsCurso['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 24 }, { wch: 14 }]
  formatarDecimais(wsCurso, [2], 1, ultimaDados)
  XLSX.utils.book_append_sheet(wb, wsCurso, 'Por curso')

  XLSX.writeFile(wb, nomeArquivo)
}

/** horas_treinamento_edeconsil_2026-10-22.xlsx — a data evita (1), (2) na pasta de downloads. */
export const nomeArquivoHorasTreinamento = () =>
  `horas_treinamento_edeconsil_${new Date().toISOString().slice(0, 10)}.xlsx`
