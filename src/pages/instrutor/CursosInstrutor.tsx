import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, MoreVertical,
  BookOpen, Users, Clock, TrendingUp,
  Edit, Trash2, Eye,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cursosAPI, instrutorAPI, apiRequest } from '../../services/api'
import { CriarCurso } from '../admin/CriarCurso'
import { useBreakpoint } from '../../hooks/useMobile'
import { BarraProgresso } from '../../components/BarraProgresso'

const statusOpcoes = ['Todos', 'Ativo', 'Rascunho', 'Arquivado']


export function CursosInstrutor({ onNavigate: _onNavigate, onAbrirCurso }: {
  onNavigate: (p: string) => void
  onAbrirCurso: (slug: string) => void
}) {
  const { C } = useTheme()
  const { isMobile, cols } = useBreakpoint()
  const [busca, setBusca] = useState('')
  const [cargoFiltro, setCargoFiltro] = useState('Todos os cargos')
  const [trilhaFiltro, setTrilhaFiltro] = useState('Todas as trilhas')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [menuAberto, setMenuAberto] = useState<number | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  const [cursos, setCursos]               = useState<any[]>([])
  const [carregando, setCarregando]       = useState(true)
  const [modalCriar, setModalCriar]       = useState(false)
  const [cursoEditando, setCursoEditando] = useState<any>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<any>(null)

  // Mesmas opções derivadas do CursosAdmin: a lista fixa anterior tinha
  // cargos que nenhum curso usa, então o filtro nunca casava.
  const cargos = useMemo(() => (
    ['Todos os cargos', ...[...new Set(cursos.map(c => c.cargo).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))]
  ), [cursos])

  const trilhas = useMemo(() => (
    ['Todas as trilhas', ...[...new Set(cursos.map(c => c.trilha).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))]
  ), [cursos])
  const [erroAcao, setErroAcao]           = useState('')
  const [turmaId, setTurmaId]             = useState<string | null>(null)

  useEffect(() => {
    instrutorAPI.minhaTurma().then((t: any) => {
      if (t?.id) setTurmaId(String(t.id))
    }).catch(() => {})
  }, [])

  const carregarCursos = useCallback(async () => {
    if (!turmaId) return
    setCarregando(true)
    try {
      const data = await apiRequest<any[]>(`/turmas/${turmaId}/cursos`)
      setCursos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erro ao carregar cursos:', err)
    } finally {
      setCarregando(false)
    }
  }, [turmaId])

  useEffect(() => { carregarCursos() }, [carregarCursos])

  const alterarStatus = async (curso: any, novoStatus: string) => {
    try {
      await (cursosAPI as any).atualizarStatus(curso.id, novoStatus)
      carregarCursos()
    } catch (err: any) {
      setErroAcao(err.message ?? 'Erro ao alterar status')
    }
  }

  const excluirCurso = async (curso: any) => {
    try {
      await (cursosAPI as any).excluir(curso.id)
      setConfirmExcluir(null)
      carregarCursos()
    } catch (err: any) {
      setErroAcao(err.message ?? 'Erro ao excluir')
      setConfirmExcluir(null)
    }
  }

  const cursosFiltrados = useMemo(() => {
    return cursos.filter(c => {
      const matchBusca = (c.titulo ?? '').toLowerCase().includes(busca.toLowerCase()) ||
                         (c.descricao ?? '').toLowerCase().includes(busca.toLowerCase())
      const matchCargo  = cargoFiltro  === 'Todos os cargos'  || c.cargo  === cargoFiltro
      const matchTrilha = trilhaFiltro === 'Todas as trilhas' || c.trilha === trilhaFiltro
      const normStatus  = (c.status === 'ativo' ? 'Ativo' : c.status === 'rascunho' ? 'Rascunho' : 'Arquivado')
      const matchStatus = statusFiltro === 'Todos'            || normStatus === statusFiltro
      return matchBusca && matchCargo && matchTrilha && matchStatus
    })
  }, [busca, cargoFiltro, trilhaFiltro, statusFiltro, cursos])

  const totalAtivos    = cursos.filter(c => c.status === 'ativo').length
  const totalAlunos    = cursos.reduce((s, c) => s + (parseInt(c.total_alunos_matriculados) || 0), 0)
  const mediaConclusao = (() => {
    const ativos = cursos.filter(c => c.status === 'ativo')
    if (!ativos.length) return 0
    const totalAlm  = ativos.reduce((s, c) => s + (parseInt(c.total_alunos_matriculados) || 0), 0)
    const totalConc = ativos.reduce((s, c) => s + (parseInt(c.total_concluidos) || 0), 0)
    return totalAlm > 0 ? Math.round((totalConc / totalAlm) * 100) : 0
  })()

  const corStatus = (s: string) => ({
    'Ativo':     { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', border: 'rgba(16,185,129,0.25)' },
    'Rascunho':  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    'Arquivado': { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.25)' },
  }[s] ?? { bg: C.surface2, color: C.muted, border: C.border })

  function SelectFiltro({ value, onChange, options }: {
    value: string; onChange: (v: string) => void; options: string[]
  }) {
    return (
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            appearance: 'none',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '8px 32px 8px 12px',
            fontSize: '13px',
            color: C.text,
            cursor: 'pointer',
            outline: 'none',
            minWidth: '180px',
          }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} color={C.muted} style={{
          position: 'absolute', right: '10px', top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
        }} />
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb + busca + toggle */}
      <div style={{
        padding: '12px 24px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: C.surface,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', color: C.muted }}>Dashboard</span>
        <span style={{ fontSize: '12px', color: C.muted }}>›</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>Cursos</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 12px', width: '220px' }}>
            <Search size={13} color={C.muted} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar cursos..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: C.text, flex: 1, width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
            {(['grid', 'lista'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVisualizacao(v)}
                style={{ padding: '6px 12px', background: visualizacao === v ? C.blue : 'none', color: visualizacao === v ? '#fff' : C.muted, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 150ms' }}
              >
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Cursos</h1>
              <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
                {cursosFiltrados.length} de {cursos.length} cursos
              </p>
            </div>
            <button
              onClick={() => setModalCriar(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 150ms' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={15} /> Novo Curso
            </button>
          </div>

          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(2, 2, 4)}, 1fr)`, gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total de Cursos',   valor: cursos.length,        icone: BookOpen,   cor: C.blue    },
              { label: 'Cursos Ativos',     valor: totalAtivos,          icone: TrendingUp, cor: '#10b981' },
              { label: 'Total de Alunos',   valor: totalAlunos,          icone: Users,      cor: '#f59e0b' },
              { label: 'Taxa de Conclusão', valor: `${mediaConclusao}%`, icone: TrendingUp, cor: '#8b5cf6' },
            ].map(m => (
              <div key={m.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${m.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <m.icone size={18} color={m.cor} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: C.text, lineHeight: 1 }}>{m.valor}</div>
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.muted, flexShrink: 0 }}>
              <Filter size={14} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Filtros:</span>
            </div>
            <SelectFiltro value={cargoFiltro}  onChange={setCargoFiltro}  options={cargos}       />
            <SelectFiltro value={trilhaFiltro} onChange={setTrilhaFiltro} options={trilhas}      />
            <SelectFiltro value={statusFiltro} onChange={setStatusFiltro} options={statusOpcoes} />
            {(cargoFiltro !== 'Todos os cargos' || trilhaFiltro !== 'Todas as trilhas' || statusFiltro !== 'Todos') && (
              <button
                onClick={() => { setCargoFiltro('Todos os cargos'); setTrilhaFiltro('Todas as trilhas'); setStatusFiltro('Todos') }}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: C.blue, cursor: 'pointer', fontWeight: 600 }}
              >
                Limpar filtros
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.muted }}>
              {cursosFiltrados.length} resultado{cursosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Grid de cards */}
          {visualizacao === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {carregando && (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', fontSize: '13px', color: C.muted }}>
                  Carregando cursos...
                </div>
              )}
              {!carregando && cursosFiltrados.map(curso => (
                <div
                  key={curso.id}
                  onClick={() => onAbrirCurso(curso.slug ?? curso.id)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'transform 150ms, box-shadow 150ms', position: 'relative', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ height: '4px', background: curso.cor }} />

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${curso.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {curso.icone}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: corStatus(curso.status === 'ativo' ? 'Ativo' : curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado').bg, color: corStatus(curso.status === 'ativo' ? 'Ativo' : curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado').color, border: `0.5px solid ${corStatus(curso.status === 'ativo' ? 'Ativo' : curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado').border}`, borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                          {curso.status === 'ativo' ? 'Ativo' : curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado'}
                        </div>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setMenuAberto(menuAberto === curso.id ? null : curso.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: C.muted, borderRadius: '6px' }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuAberto === curso.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', minWidth: '160px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                            <div onClick={e => { e.stopPropagation(); setMenuAberto(null); onAbrirCurso(curso.slug ?? curso.id) }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', color: C.text, transition: 'background 100ms' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,86,255,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <Eye size={13} /> Visualizar
                            </div>
                            <div onClick={e => { e.stopPropagation(); setMenuAberto(null); setCursoEditando(curso) }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', color: C.text, transition: 'background 100ms' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,86,255,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <Edit size={13} /> Editar
                            </div>
                            <div onClick={e => { e.stopPropagation(); setMenuAberto(null); alterarStatus(curso, curso.status === 'ativo' ? 'rascunho' : 'ativo') }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', color: C.text, transition: 'background 100ms' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,86,255,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <TrendingUp size={13} /> {curso.status === 'ativo' ? 'Despublicar' : 'Publicar'}
                            </div>
                            <div onClick={e => { e.stopPropagation(); setMenuAberto(null); setConfirmExcluir(curso) }}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', color: '#ef4444', transition: 'background 100ms' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <Trash2 size={13} /> Excluir
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 6px', lineHeight: 1.4 }}>
                      {curso.titulo}
                    </p>
                    <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                      {curso.descricao}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: C.blue, background: 'rgba(26,86,255,0.10)', border: '0.5px solid rgba(26,86,255,0.20)', borderRadius: '6px', padding: '2px 8px' }}>
                        {curso.cargo}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.10)', border: '0.5px solid rgba(16,185,129,0.20)', borderRadius: '6px', padding: '2px 8px' }}>
                        {curso.trilha}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                      {[
                        { icon: Clock,    val: curso.carga_horaria ?? '—',                         label: 'Carga'    },
                        { icon: BookOpen, val: `${curso.total_aulas ?? 0} aulas`,                  label: 'Conteúdo' },
                        { icon: Users,    val: parseInt(curso.total_alunos_matriculados) || 0,     label: 'Alunos'   },
                      ].map(s => (
                        <div key={s.label} style={{ background: C.surface2, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{s.val}</div>
                          <div style={{ fontSize: '10px', color: C.muted }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {curso.status === 'ativo' && (() => {
                      const publicoTotal   = Number(curso.publico_total) || 0
                      const iniciaram      = Number(curso.total_iniciaram) || 0
                      const concluintes    = Number(curso.total_concluintes) || 0
                      const progressoMedio = Number(curso.progresso_medio) || 0
                      return (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '10px', color: C.muted, marginBottom: '3px' }}>Progresso da turma</div>
                          {publicoTotal === 0 ? (
                            <div style={{ fontSize: '10px', color: C.muted }}>—</div>
                          ) : iniciaram === 0 ? (
                            <>
                              <BarraProgresso valor={0} />
                              <p style={{ fontSize: '10px', color: C.muted, margin: '4px 0 0' }}>Ninguém iniciou ainda</p>
                            </>
                          ) : (
                            <>
                              <BarraProgresso valor={progressoMedio} mostrarRotulo />
                              <p style={{ fontSize: '10px', color: C.muted, margin: '4px 0 0' }}>
                                {iniciaram} de {publicoTotal} iniciaram · {concluintes} concluíram
                              </p>
                            </>
                          )}
                        </div>
                      )
                    })()}
                    {curso.instrutor && (
                      <p style={{ fontSize: '11px', color: C.muted, margin: '6px 0 0' }}>
                        👤 {curso.instrutor}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Card Novo Curso */}
              <div
                onClick={() => setModalCriar(true)}
                style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px', cursor: 'pointer', transition: 'all 150ms', minHeight: '200px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = 'rgba(26,86,255,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(26,86,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={22} color={C.blue} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: C.blue, margin: '0 0 4px' }}>Criar novo curso</p>
                  <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Clique para adicionar</p>
                </div>
              </div>
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 80px 80px', gap: '12px', padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Curso</span><span>Cargo</span><span>Categoria</span>
                <span style={{ textAlign: 'center' }}>Alunos</span>
                <span style={{ textAlign: 'center' }}>Carga</span>
                <span style={{ textAlign: 'center' }}>Status</span>
              </div>
              {cursosFiltrados.map(curso => (
                <div
                  key={curso.id}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 80px 80px', gap: '12px', alignItems: 'center', transition: 'background 150ms', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,86,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = C.surface}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${curso.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{curso.icone}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{curso.titulo}</p>
                      <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>{curso.carga_horaria ?? '—'} · {curso.total_aulas ?? 0} aulas</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: C.muted2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{curso.cargo ?? '—'}</span>
                  <span style={{ fontSize: '12px', color: C.muted2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{curso.categoria ?? '—'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: C.text, textAlign: 'center' }}>{parseInt(curso.total_alunos_matriculados) || 0}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.blue, textAlign: 'center' }}>{curso.carga_horaria ?? '—'}</span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {(() => {
                      const label = curso.status === 'ativo' ? 'Ativo' : curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado'
                      return (
                        <span style={{ background: corStatus(label).bg, color: corStatus(label).color, border: `0.5px solid ${corStatus(label).border}`, borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                          {label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cursosFiltrados.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
              <span style={{ fontSize: '40px' }}>🔍</span>
              <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: 0 }}>Nenhum curso encontrado</p>
              <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Tente ajustar os filtros de busca</p>
              <button
                onClick={() => { setBusca(''); setCargoFiltro('Todos os cargos'); setTrilhaFiltro('Todas as trilhas'); setStatusFiltro('Todos') }}
                style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
              >
                Limpar filtros
              </button>
            </div>
          )}

      </div>

      {menuAberto !== null && (
        <div onClick={() => setMenuAberto(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      )}

      {modalCriar && (
        <div onClick={() => setModalCriar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: C.surface, zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Novo Curso</h2>
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Preencha os dados do curso</p>
              </div>
              <button onClick={() => setModalCriar(false)}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: C.muted }}>×</button>
            </div>
            <CriarCurso onFechar={() => setModalCriar(false)} onSucesso={() => { setModalCriar(false); carregarCursos() }} />
          </div>
        </div>
      )}

      {cursoEditando && (
        <div onClick={() => setCursoEditando(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: C.surface, zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Editar Curso</h2>
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>{cursoEditando.titulo}</p>
              </div>
              <button onClick={() => setCursoEditando(null)}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: C.muted }}>×</button>
            </div>
            <CriarCurso cursoEditar={cursoEditando} onFechar={() => setCursoEditando(null)} onSucesso={() => { setCursoEditando(null); carregarCursos() }} />
          </div>
        </div>
      )}

      {confirmExcluir && (
        <div onClick={() => setConfirmExcluir(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: '14px', padding: '28px', maxWidth: '420px', width: '100%', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Excluir curso?</h3>
            <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 6px' }}>
              <strong style={{ color: C.text }}>{confirmExcluir.titulo}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#f59e0b', margin: '0 0 20px' }}>
              ⚠️ Cursos com alunos matriculados não podem ser excluídos. Arquive em vez de excluir.
            </p>
            {erroAcao && (
              <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#ef4444', marginBottom: '16px' }}>
                {erroAcao}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => { setConfirmExcluir(null); setErroAcao('') }}
                style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => excluirCurso(confirmExcluir)}
                style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {erroAcao && !confirmExcluir && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 600, zIndex: 3000, boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
          onClick={() => setErroAcao('')}>
          ⚠️ {erroAcao} (clique para fechar)
        </div>
      )}
    </>
  )
}
