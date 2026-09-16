import * as XLSX from 'xlsx'

/**
 * Exporta uma lista de turmas para .xlsx.
 *
 * Import estático, igual ao exportarAlunosExcel.ts e ao importarExcel.ts.
 * Import dinâmico da lib já quebrou em produção neste projeto com
 * `XLSX.utils` undefined — e não economiza peso, porque o importarExcel
 * importa a lib estaticamente e ela já está no bundle principal.
 *
 * Sem o `limpar()` do molde de alunos: aquele troca '—' por vazio porque a
 * listagem de AlunosAdmin normaliza os campos com '—' de placeholder.
 * TurmasAdmin guarda o retorno cru de GET /turmas, então '—' não ocorre —
 * o que aparece é null, e `?? ''` já resolve.
 *
 * Sem dataBR() e sem CPF-como-texto: nenhuma das 3 colunas é data ou CPF.
 */

export async function exportarTurmasExcel(turmas: any[], nomeArquivo: string) {
  const linhas = turmas.map(t => ({
    'Nome da turma': t.nome        ?? '',
    Setor:           t.setor       ?? '',
    'Responsável':   t.responsavel ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(linhas)
  ws['!cols'] = [
    { wch: 32 }, { wch: 24 }, { wch: 26 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Turmas')
  XLSX.writeFile(wb, nomeArquivo)
}

/** turmas_edeconsil_2026-09-16.xlsx — a data evita (1), (2) na pasta de downloads. */
export const nomeArquivoTurmas = () =>
  `turmas_edeconsil_${new Date().toISOString().slice(0, 10)}.xlsx`
