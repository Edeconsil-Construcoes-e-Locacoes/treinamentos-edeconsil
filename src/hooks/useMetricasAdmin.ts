import { useState, useEffect } from 'react'
import { cursosAPI } from '../services/api'

export interface MetricasAdmin {
  cursos:              { total: number; ativos: number }
  alunos:              { total: number; ativos: number }
  turmas:              { total: number }
  matriculas:          { total: number; ativas: number }
  certificados:        { total: number }
  taxaConclusao:       number
  conclusao?:          { atribuidos: number; concluidos: number }
  progressoMedio:      number
  cursosRecentes:      any[]
  alunosRecentes:      any[]
  cursosMaisAcessados: any[]
  variacao?:           { alunos: number; matriculas: number }
  distribuicaoTurmas?: { nome: string; total: number; cor: string }[]
  carregando:          boolean
  erro:                string
}

const INICIAL: MetricasAdmin = {
  cursos:              { total: 0, ativos: 0 },
  alunos:              { total: 0, ativos: 0 },
  turmas:              { total: 0 },
  matriculas:          { total: 0, ativas: 0 },
  certificados:        { total: 0 },
  taxaConclusao:       0,
  progressoMedio:      0,
  cursosRecentes:      [],
  alunosRecentes:      [],
  cursosMaisAcessados: [],
  carregando:          true,
  erro:                '',
}

export function useMetricasAdmin(): MetricasAdmin {
  const [metricas, setMetricas] = useState<MetricasAdmin>(INICIAL)

  useEffect(() => {
    ;(cursosAPI as any).metricas()
      .then((data: any) => {
        setMetricas({ ...data, carregando: false, erro: '' })
      })
      .catch((err: any) => {
        console.error('Erro métricas admin:', err)
        setMetricas(prev => ({
          ...prev, carregando: false,
          erro: err.message ?? 'Erro ao carregar métricas',
        }))
      })
  }, [])

  return metricas
}
