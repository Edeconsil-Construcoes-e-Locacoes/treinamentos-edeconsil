export interface ProgressoAluno {
  concluidas: number
  total:      number
  percentual: number
}

/**
 * Progresso geral do aluno (aulas concluídas / total de aulas) somando os cursos.
 * Fonte única do card do menu lateral e do cabeçalho de "Meus Cursos".
 *
 * COUNT/ROUND do Postgres chegam como STRING no node-pg: sem Number() a soma
 * concatena ("0" + "1" + "1" -> "011"). total_aulas é coluna morta — vale
 * total_aulas_real. Ponderado por aula (não média por curso).
 */
export function calcularProgressoAluno(cursos: any[]): ProgressoAluno {
  const total      = cursos.reduce((s, c) => s + (Number(c?.total_aulas_real)  || 0), 0)
  const concluidas = cursos.reduce((s, c) => s + (Number(c?.aulas_concluidas) || 0), 0)
  const percentual = total > 0 ? Math.round(concluidas / total * 100) : 0
  return { concluidas, total, percentual }
}
