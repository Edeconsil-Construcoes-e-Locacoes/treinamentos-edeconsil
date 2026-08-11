import { useState, useEffect, useMemo } from 'react'
import { Search, BookOpen, Clock, Check } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { useDadosReaisAluno } from '../hooks/useDadosReaisAluno'
import { cursosAPI } from '../services/api'

interface MeusCursosListaProps {
  onNavigate: (page: string, extra?: Record<string, unknown>) => void
  onLogout: () => void
  onAbrirCurso: (cursoId: string) => void
}

export function MeusCursosLista({ onNavigate, onLogout, onAbrirCurso }: MeusCursosListaProps) {
  const { C } = useTheme()
  const progresso = useDadosReaisAluno()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Em andamento' | 'Concluído' | 'Não iniciado'>('Todos')
  const [cursosApi, setCursosApi] = useState<any[]>([])
  const [loadingApi, setLoadingApi] = useState(true)

  useEffect(() => {
    cursosAPI.meusCursos()
      .then((data: any) => {
        setCursosApi(data)
        setLoadingApi(false)
      })
      .catch((err: Error) => {
        console.warn('API indisponível, usando dados mock:', err.message)
        setLoadingApi(false)
      })
  }, [])

  const fonteDados = cursosApi

  const cursosFiltrados = useMemo(() => {
    return fonteDados.filter((c: any) => {
      const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase()) || c.categoria?.toLowerCase().includes(busca.toLowerCase())
      const matchStatus = filtroStatus === 'Todos'
        || c.status === filtroStatus
        || (filtroStatus === 'Em andamento' && c.status === 'ativo')
        || (filtroStatus === 'Concluído'    && c.status === 'concluido')
      return matchBusca && matchStatus
    })
  }, [busca, filtroStatus, fonteDados])

  const normalizarCurso = (c: any) => {
    const totalAulas      = c.total_aulas_real ?? c.total_aulas ?? c.totalAulas ?? 0
    const aulasConcluidas = c.aulas_concluidas ?? c.aulasConcluidas ?? 0
    // Barra: % assistido (parcial), como o player. O contador "X de Y
    // concluídas" abaixo segue discreto — são medidas diferentes de propósito.
    const progresso       = Number(c.progresso_assistido ?? 0)
    return {
      id:           c.id,
      slug:         c.slug          ?? c.id,
      titulo:       c.titulo,
      subtitulo:    c.subtitulo     ?? '',
      descricao:    c.descricao     ?? '',
      categoria:    c.categoria     ?? '',
      cargo:        c.cargo         ?? '',
      trilha:       c.trilha        ?? '',
      cargaHoraria: c.carga_horaria ?? c.cargaHoraria ?? '—',
      instrutor:    c.instrutor     ?? '—',
      totalAulas,
      aulasConcluidas,
      progresso,
      status: c.status === 'ativo'     ? 'Em andamento'
            : c.status === 'concluido' ? 'Concluído'
            : (c.status               ?? 'Em andamento'),
      cor:   c.cor   ?? '#1a56ff',
      icone: c.icone ?? '📚',
    }
  }

  const cursosNormalizados = cursosFiltrados.map(normalizarCurso)

  // total_aulas é coluna morta (vale 0 em quase todo curso) — o COUNT real
  // vem em total_aulas_real. Sem isso o contador do cabeçalho somava zero.
  const totalAulasReal = cursosApi.reduce((s: number, c: any) => s + (c.total_aulas_real ?? c.total_aulas ?? c.totalAulas ?? 0), 0)
  const aulasConcluídasReal = cursosApi.reduce((s: number, c: any) => {
    const prog  = c.progresso_usuario ?? c.progresso ?? 0
    const total = c.total_aulas_real ?? c.total_aulas ?? c.totalAulas ?? 0
    return s + (c.aulas_concluidas ?? c.aulasConcluidas ?? Math.round((prog / 100) * total))
  }, 0)
  const percentualReal = totalAulasReal > 0 ? Math.round((aulasConcluídasReal / totalAulasReal) * 100) : 0

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar titulo="Meus Cursos" subtitulo="Todos os cursos matriculados" onNavigate={onNavigate} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '3px', background: C.blue, borderRadius: '2px', marginBottom: '10px' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Meus Cursos</h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {cursosFiltrados.length} curso{cursosFiltrados.length !== 1 ? 's' : ''} disponível{cursosFiltrados.length !== 1 ? 'is' : ''}
            </p>
            <p style={{ fontSize: '12px', color: C.muted, margin: '4px 0 0' }}>
              {cursosApi.length > 0
                ? `${aulasConcluídasReal} de ${totalAulasReal} aulas concluídas · ${percentualReal}% do progresso total`
                : `${progresso.aulasConcluidas} de ${progresso.totalAulas} aulas concluídas · ${progresso.percentualProgresso}% do progresso total`
              }
            </p>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', flex: 1, minWidth: '200px' }}>
              <Search size={14} color={C.muted} />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar curso ou categoria..."
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: C.text, flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['Todos', 'Em andamento', 'Concluído', 'Não iniciado'] as const).map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)} style={{
                  padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: filtroStatus === s ? 700 : 400,
                  border: `1.5px solid ${filtroStatus === s ? C.blue : C.border}`,
                  background: filtroStatus === s ? `rgba(26,86,255,0.10)` : C.surface,
                  color: filtroStatus === s ? C.blue : C.muted,
                  cursor: 'pointer', transition: 'all 150ms', fontFamily: "'Inter',sans-serif",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Loading API */}
          {loadingApi && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '14px', color: C.muted }}>Carregando seus cursos...</span>
            </div>
          )}

          {/* Grid de cards */}
          {!loadingApi && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {cursosNormalizados.map(curso => (
              <div
                key={curso.id}
                onClick={() => onAbrirCurso(curso.slug ?? curso.id)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: '12px', overflow: 'hidden',
                  cursor: 'pointer', transition: 'transform 200ms, box-shadow 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Faixa colorida */}
                <div style={{ height: '4px', background: curso.cor }} />

                <div style={{ padding: '16px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${curso.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {curso.icone}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        color: curso.status === 'Concluído' ? '#10b981' : curso.status === 'Em andamento' ? C.blue : C.muted,
                        background: curso.status === 'Concluído' ? 'rgba(16,185,129,0.12)' : curso.status === 'Em andamento' ? 'rgba(26,86,255,0.10)' : C.surface2,
                        border: `0.5px solid ${curso.status === 'Concluído' ? 'rgba(16,185,129,0.25)' : curso.status === 'Em andamento' ? 'rgba(26,86,255,0.25)' : C.border}`,
                        borderRadius: '6px', padding: '2px 8px',
                      }}>
                        {curso.status}
                      </span>
                    </div>
                  </div>

                  {/* Título */}
                  <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.3 }}>
                    {curso.titulo}
                  </p>
                  <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 14px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {curso.descricao}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: C.blue, background: 'rgba(26,86,255,0.10)', border: '0.5px solid rgba(26,86,255,0.20)', borderRadius: '6px', padding: '2px 8px' }}>{curso.cargo}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.10)', border: '0.5px solid rgba(16,185,129,0.20)', borderRadius: '6px', padding: '2px 8px' }}>{curso.trilha}</span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    {[
                      { Icon: Clock,    val: curso.cargaHoraria },
                      { Icon: BookOpen, val: `${curso.totalAulas} aulas` },
                      { Icon: Check,    val: `${curso.aulasConcluidas}/${curso.totalAulas}` },
                    ].map((s, i) => (
                      <div key={i} style={{ background: C.surface2, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Barra de progresso */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: C.muted }}>Progresso</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: curso.progresso >= 70 ? '#10b981' : C.blue }}>{curso.progresso}%</span>
                    </div>
                    <div style={{ background: 'rgba(26,86,255,0.10)', borderRadius: '4px', height: '4px' }}>
                      <div style={{ background: curso.progresso >= 70 ? '#10b981' : C.blue, height: '4px', borderRadius: '4px', width: `${curso.progresso}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>}

          {!loadingApi && cursosApi.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '48px' }}>📚</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>
                Nenhum curso disponível ainda
              </h3>
              <p style={{ fontSize: '13px', color: C.muted, margin: 0, maxWidth: '360px', lineHeight: 1.6 }}>
                Os cursos da sua turma ainda estão sendo preparados.
                Em breve novos conteúdos estarão disponíveis aqui!
              </p>
            </div>
          )}

          {!loadingApi && cursosApi.length > 0 && cursosFiltrados.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
              <span style={{ fontSize: '36px' }}>🔍</span>
              <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: 0 }}>Nenhum curso encontrado</p>
              <button onClick={() => { setBusca(''); setFiltroStatus('Todos') }} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Limpar filtros
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
