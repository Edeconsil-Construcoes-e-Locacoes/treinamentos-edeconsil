import { useState, useEffect } from 'react'
import apiRequest, { cursosAPI } from '../services/api'
import { getUsuario } from '../services/authStorage'

export interface CursoReal {
  id: string
  slug: string
  titulo: string
  cor: string | null
  icone: string | null
  total_aulas: number
  /** Contagem real de aulas (COUNT no banco). cursos.total_aulas é coluna morta — usar esta. */
  total_aulas_real: number
  aulas_concluidas: number
  progresso_usuario: number
  nota_obtida?: number | null
  aprovado?: boolean | null
  nota_minima?: number
  instrutor?: string | null
  carga_horaria?: string | null
}

export interface AulaProgresso {
  id: string
  titulo: string
  progresso: number
  concluida: boolean
  cor: string
  icone: string
  cursoTitulo: string
  cursoSlug: string
  moduloId: number
}

export interface InstrutorTurma {
  nome: string
  email: string | null
  especialidade: string | null
}

export interface DadosAluno {
  cursos: CursoReal[]
  totalCursos: number
  cursosAtivos: number
  cursosConcluidos: number
  totalAulas: number
  aulasConcluidas: number
  percentual: number
  percentualProgresso: number
  horasEstudadas: number
  carregando: boolean
  aulasEmAndamento: AulaProgresso[]
  instrutorTurma: InstrutorTurma | null
}

export function useDadosReaisAluno(): DadosAluno {
  const [cursos, setCursos] = useState<CursoReal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aulasEmAndamento, setAulasEmAndamento] = useState<AulaProgresso[]>([])
  const [instrutorTurma, setInstrutorTurma] = useState<InstrutorTurma | null>(null)

  useEffect(() => {
    async function carregarDados() {
      try {
        const data = await cursosAPI.meusCursos()
        const cursosNorm = (data as any[]).map((c: any) => ({
          id:                c.id,
          slug:              c.slug ?? String(c.id),
          titulo:            c.titulo,
          cor:               c.cor           ?? '#1a56ff',
          icone:             c.icone         ?? '📚',
          instrutor:         c.instrutor     ?? null,
          carga_horaria:     c.carga_horaria ?? null,
          nota_minima:       c.nota_minima   ?? 70,
          total_aulas:       c.total_aulas      ?? 0,
          // COUNT/ROUND do Postgres chegam como STRING no node-pg — sem Number() as somas concatenam
          total_aulas_real:  Number(c.total_aulas_real ?? c.total_aulas ?? 0),
          aulas_concluidas:  Number(c.aulas_concluidas ?? 0),
          progresso_usuario: Number(c.progresso_usuario ?? c.progresso ?? 0),
          nota_obtida:       c.nota_obtida ?? null,
          aprovado:          c.aprovado    ?? null,
          status:            c.status,
        }))
        setCursos(cursosNorm as CursoReal[])

        const cursosFiltrados = cursosNorm.filter((c: CursoReal) => c.progresso_usuario < 100).slice(0, 2)
        const aulasColetadas: AulaProgresso[] = []

        for (const curso of cursosFiltrados) {
          if (aulasColetadas.length >= 3) break
          try {
            const modulos = await cursosAPI.aulas(curso.slug) as any[]
            if (!Array.isArray(modulos)) continue
            for (const modulo of modulos) {
              if (aulasColetadas.length >= 3) break
              for (const aula of (modulo.aulas ?? [])) {
                if (aulasColetadas.length >= 3) break
                aulasColetadas.push({
                  id:          String(aula.id),
                  titulo:      aula.titulo,
                  progresso:   aula.progresso?.percentual ?? 0,
                  concluida:   aula.progresso?.concluida  ?? false,
                  cor:         curso.cor ?? '#1a56ff',
                  icone:       curso.icone ?? '📚',
                  cursoTitulo: curso.titulo,
                  cursoSlug:   curso.slug,
                  moduloId:    modulo.id,
                })
              }
            }
          } catch { /* continua para o próximo curso */ }
        }

        if (aulasColetadas.length === 0) {
          cursosNorm.filter((c: CursoReal) => c.progresso_usuario < 100).slice(0, 3).forEach((curso: CursoReal) => {
            aulasColetadas.push({
              id:          curso.id,
              titulo:      `${curso.titulo} — Aula 1`,
              progresso:   0,
              concluida:   false,
              cor:         curso.cor ?? '#1a56ff',
              icone:       curso.icone ?? '📚',
              cursoTitulo: curso.titulo,
              cursoSlug:   curso.slug,
              moduloId:    0,
            })
          })
        }

        setAulasEmAndamento(aulasColetadas)

        // Buscar instrutor da turma do aluno
        try {
          const usuario = getUsuario<{ turma_id?: string | null }>()
          if (usuario?.turma_id) {
            const turmasData = await apiRequest<any[]>('/turmas')
            const minhaTurma = turmasData?.find((t: any) => t.id === usuario.turma_id)
            if (minhaTurma?.instrutor_nome) {
              setInstrutorTurma({
                nome:          minhaTurma.instrutor_nome,
                email:         minhaTurma.instrutor_email ?? null,
                especialidade: minhaTurma.instrutor_especialidade ?? null,
              })
            }
          }
        } catch { /* turma sem instrutor ou erro de rede */ }
      } catch {
        setCursos([])
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  const totalCursos      = cursos.length
  const cursosConcluidos = cursos.filter(c => c.progresso_usuario >= 100).length
  const cursosAtivos     = totalCursos - cursosConcluidos

  const totalAulas      = cursos.reduce((s, c) => s + (c.total_aulas_real || 0), 0)
  const aulasConcluidas = cursos.reduce((s, c) => s + (c.aulas_concluidas  || 0), 0)

  // Ponderado por aula (não média por curso): bate com o card do curso
  const percentual = totalAulas > 0
    ? Math.round(aulasConcluidas / totalAulas * 100)
    : 0

  const horasEstudadas = Math.round((aulasConcluidas * 30) / 60)

  return {
    cursos,
    totalCursos,
    cursosAtivos,
    cursosConcluidos,
    totalAulas,
    aulasConcluidas,
    percentual,
    percentualProgresso: percentual,
    horasEstudadas,
    carregando,
    aulasEmAndamento,
    instrutorTurma,
  }
}
