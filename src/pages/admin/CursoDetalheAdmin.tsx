import { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronUp,
  BookOpen, Users, Clock, ArrowLeft,
  Play, Edit, Check, TrendingUp, Pencil, Trash2, Plus,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { cursosAPI, questoesAPI, modulosAPI, aulasAPI } from '../../services/api'
import { isYoutube } from '../../utils/youtube'

const lblStyle = {
  display: 'block', fontSize: '12px',
  fontWeight: 600, color: '#475569',
  marginBottom: '5px', marginTop: '10px',
} as const
const inpStyle = {
  width: '100%', padding: '9px 12px',
  borderRadius: '8px', border: '1px solid #cbd5e1',
  fontSize: '13px', boxSizing: 'border-box',
} as const

interface CursoDetalheAdminProps {
  cursoId: string
  onNavigate: (page: string) => void
  onLogout: () => void
  onVoltar: () => void
}

export function CursoDetalheAdmin({ cursoId, onNavigate, onLogout, onVoltar }: CursoDetalheAdminProps) {
  const { C } = useTheme()
  const [curso, setCurso] = useState<any>(null)
  const [modulosAbertos, setModulosAbertos] = useState<Set<number>>(new Set([0]))
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [questaoEditando, setQuestaoEditando] = useState<null | {
    id: string
    enunciado: string
    alternativas: { A: string; B: string; C: string; D: string }
    gabarito: string
    explicacao: string
  }>(null)
  const [salvandoQuestao, setSalvandoQuestao] = useState(false)

  const [modalNovaQuestao, setModalNovaQuestao] = useState(false)
  const [novaQuestao, setNovaQuestao] = useState({
    enunciado: '', alternativas: { A: '', B: '', C: '', D: '' }, gabarito: 'A', explicacao: '',
  })
  const [modalNovoModulo, setModalNovoModulo] = useState(false)
  const [novoModuloTitulo, setNovoModuloTitulo] = useState('')
  const [modalEditarModulo, setModalEditarModulo] = useState<{ id: string; titulo: string; ordem: number } | null>(null)

  const [modalAula, setModalAula] = useState(false)
  const [aulaEdit, setAulaEdit] = useState<any>(null)
  const [moduloAtivoId, setModuloAtivoId] = useState<string | null>(null)
  const [formAula, setFormAula] = useState({
    titulo: '', descricao: '', duracao: '',
    ordem: 1, video_url: '', video_tipo: 'youtube',
  })

  const carregarCurso = () => {
    setCarregando(true)
    setErro('')
    cursosAPI.buscarPorSlug(cursoId as any)
      .then((data: any) => {
        setCurso(data)
        if (data.modulos?.length) setModulosAbertos(new Set([data.modulos[0].id]))
        setCarregando(false)
      })
      .catch((err: any) => {
        setErro(err.message ?? 'Erro ao carregar curso')
        setCarregando(false)
      })
  }

  useEffect(() => {
    carregarCurso()
  }, [cursoId])

  const toggleModulo = (id: number) => {
    setModulosAbertos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSalvarQuestao = async () => {
    if (!questaoEditando) return
    setSalvandoQuestao(true)
    try {
      const atualizada: any = await questoesAPI.atualizar(questaoEditando.id, {
        enunciado:    questaoEditando.enunciado,
        alternativas: questaoEditando.alternativas,
        gabarito:     questaoEditando.gabarito,
        explicacao:   questaoEditando.explicacao,
      })
      setCurso((prev: any) => ({
        ...prev,
        questoes: prev.questoes.map((q: any) =>
          q.id === questaoEditando.id ? atualizada : q
        ),
      }))
      setQuestaoEditando(null)
    } catch (err: any) {
      alert(err.message ?? 'Erro ao salvar questão')
    } finally {
      setSalvandoQuestao(false)
    }
  }

  const handleCriarQuestao = async () => {
    try {
      const criada: any = await questoesAPI.criar({
        curso_id: curso!.id,
        enunciado: novaQuestao.enunciado,
        alternativas: novaQuestao.alternativas,
        gabarito: novaQuestao.gabarito,
        explicacao: novaQuestao.explicacao || undefined,
      })
      setCurso((prev: any) => ({ ...prev, questoes: [...(prev.questoes ?? []), criada] }))
      setModalNovaQuestao(false)
      setNovaQuestao({ enunciado: '', alternativas: { A: '', B: '', C: '', D: '' }, gabarito: 'A', explicacao: '' })
    } catch (err: any) {
      alert(err.message ?? 'Erro ao criar questão')
    }
  }

  const handleApagarQuestao = async (id: string) => {
    if (!window.confirm('Apagar esta questão?')) return
    try {
      await questoesAPI.excluir(id)
      setCurso((prev: any) => ({ ...prev, questoes: prev.questoes.filter((q: any) => q.id !== id) }))
    } catch (err: any) {
      alert(err.message ?? 'Erro ao apagar questão')
    }
  }

  const handleCriarModulo = async () => {
    if (!novoModuloTitulo.trim()) return
    try {
      const criado: any = await modulosAPI.criar({ curso_id: curso!.id, titulo: novoModuloTitulo.trim() })
      setCurso((prev: any) => ({ ...prev, modulos: [...(prev.modulos ?? []), { ...criado, aulas: [] }] }))
      setModalNovoModulo(false)
      setNovoModuloTitulo('')
    } catch (err: any) {
      alert(err.message ?? 'Erro ao criar módulo')
    }
  }

  const handleEditarModulo = async () => {
    if (!modalEditarModulo) return
    try {
      const atualizado: any = await modulosAPI.atualizar(modalEditarModulo.id, { titulo: modalEditarModulo.titulo })
      setCurso((prev: any) => ({
        ...prev,
        modulos: prev.modulos.map((m: any) =>
          m.id === modalEditarModulo.id ? { ...m, titulo: atualizado.titulo } : m
        ),
      }))
      setModalEditarModulo(null)
    } catch (err: any) {
      alert(err.message ?? 'Erro ao editar módulo')
    }
  }

  const handleExcluirModulo = async (id: string) => {
    if (!window.confirm('Excluir módulo? Todas as aulas serão removidas.')) return
    try {
      await modulosAPI.excluir(id)
      setCurso((prev: any) => ({ ...prev, modulos: prev.modulos.filter((m: any) => m.id !== id) }))
    } catch (err: any) {
      alert(err.message ?? 'Erro ao excluir módulo')
    }
  }

  const abrirNovaAula = (moduloId: string) => {
    setModuloAtivoId(moduloId)
    setAulaEdit(null)
    setFormAula({
      titulo: '', descricao: '', duracao: '',
      ordem: 1, video_url: '', video_tipo: 'youtube',
    })
    setModalAula(true)
  }

  const abrirEditarAula = (aula: any) => {
    setAulaEdit(aula)
    setModuloAtivoId(aula.modulo_id)
    setFormAula({
      titulo: aula.titulo ?? '',
      descricao: aula.descricao ?? '',
      duracao: aula.duracao ?? '',
      ordem: aula.ordem ?? 1,
      video_url: aula.video_url ?? '',
      video_tipo: aula.video_tipo ?? 'youtube',
    })
    setModalAula(true)
  }

  const salvarAula = async () => {
    try {
      const tipo = isYoutube(formAula.video_url) ? 'youtube' : formAula.video_tipo
      const dados = { ...formAula, video_tipo: tipo }
      if (aulaEdit) {
        await aulasAPI.atualizar(aulaEdit.id, dados)
      } else if (moduloAtivoId) {
        await aulasAPI.criar(moduloAtivoId, dados)
      }
      setModalAula(false)
      carregarCurso()
    } catch (err) {
      console.error('Erro ao salvar aula:', err)
      alert('Erro ao salvar aula.')
    }
  }

  const excluirAula = async (aula: any) => {
    if (!window.confirm(`Excluir a aula "${aula.titulo}"?`)) return
    try {
      await aulasAPI.excluir(aula.id)
      carregarCurso()
    } catch (err) {
      console.error('Erro ao excluir aula:', err)
      alert('Erro ao excluir aula. Tente novamente.')
    }
  }

  if (carregando) return (
    <LayoutAdmin paginaAtiva="cursosAdmin" onNavigate={onNavigate} onLogout={onLogout}
      topbarTitulo="Gestão de Cursos" topbarSubtitulo="Carregando...">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
        <div style={{ width: '28px', height: '28px', border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '14px', color: C.muted }}>Carregando curso...</span>
      </div>
    </LayoutAdmin>
  )

  if (erro || !curso) return (
    <LayoutAdmin paginaAtiva="cursosAdmin" onNavigate={onNavigate} onLogout={onLogout}
      topbarTitulo="Gestão de Cursos" topbarSubtitulo="Erro">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
        <span style={{ fontSize: '40px' }}>⚠️</span>
        <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: 0 }}>
          {erro || 'Curso não encontrado'}
        </p>
        <button onClick={onVoltar}
          style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Voltar
        </button>
      </div>
    </LayoutAdmin>
  )

  const totalAulas         = Number(curso.total_aulas_real) || 0
  const totalAlunos        = Number(curso.publico_total) || 0
  const totalConcluidos    = Number(curso.total_concluintes) || 0
  const progressoMedio     = Number(curso.progresso_medio) || 0
  const totalIniciaram     = Number(curso.total_iniciaram) || 0
  const corCurso           = curso.cor ?? '#1a56ff'
  const statusLabel        = curso.status === 'ativo' ? 'Ativo' : curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado'
  const corStatus          = curso.status === 'ativo'
    ? { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' }
    : curso.status === 'rascunho'
    ? { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' }
    : { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.25)' }

  return (
    <LayoutAdmin
      paginaAtiva="cursosAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Gestão de Cursos"
      topbarSubtitulo="Detalhes e conteúdo do curso selecionado."
    >
      <div style={{ overflowY: 'auto', maxHeight: '100%' }}>

        {/* Breadcrumb */}
        <div style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <ArrowLeft size={14} color={C.blue} style={{ cursor: 'pointer' }} onClick={onVoltar} />
          <span onClick={onVoltar} style={{ fontSize: '13px', color: C.blue, cursor: 'pointer' }}>Cursos</span>
          <span style={{ fontSize: '13px', color: C.muted }}>›</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{curso.titulo}</span>
        </div>

        <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>

          {/* Header do curso */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${corCurso}18`, border: `1px solid ${corCurso}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
              {curso.icone ?? '📚'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, background: corStatus.bg, color: corStatus.color, border: `0.5px solid ${corStatus.border}`, borderRadius: '6px', padding: '2px 8px' }}>
                  {statusLabel}
                </span>
                {curso.categoria && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: C.blue, background: 'rgba(26,86,255,0.10)', border: '0.5px solid rgba(26,86,255,0.20)', borderRadius: '6px', padding: '2px 8px' }}>
                    {curso.categoria}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {curso.titulo}
              </h1>
              <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 8px', lineHeight: 1.5 }}>{curso.subtitulo}</p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {curso.instrutor && <span style={{ fontSize: '12px', color: C.muted }}>👤 <strong style={{ color: C.text }}>{curso.instrutor}</strong></span>}
                {curso.carga_horaria && <span style={{ fontSize: '12px', color: C.muted }}>⏱ <strong style={{ color: C.text }}>{curso.carga_horaria}</strong></span>}
                {curso.nota_minima && <span style={{ fontSize: '12px', color: C.muted }}>🎯 Nota mínima: <strong style={{ color: C.text }}>{curso.nota_minima}%</strong></span>}
              </div>
            </div>
            <button
              onClick={() => onVoltar()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: `1.5px solid ${C.blue}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, color: C.blue, cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.blue }}
            >
              <Edit size={13} /> Editar curso
            </button>
          </div>

          {/* Cards de estatísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {[
              { Icon: BookOpen,   val: totalAulas,       label: 'Total de aulas',        cor: C.blue    },
              { Icon: Users,      val: totalAlunos,      label: 'Alunos com acesso',   cor: '#f59e0b' },
              { Icon: Check,      val: totalConcluidos,  label: 'Concluíram o curso',    cor: '#10b981' },
              { Icon: TrendingUp, val: `${progressoMedio}%`, label: 'Progresso médio',  cor: '#8b5cf6', sub: `${totalIniciaram} iniciaram` },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${s.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.Icon size={18} color={s.cor} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: C.text, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{s.label}</div>
                  {'sub' in s && s.sub && <div style={{ fontSize: '10px', color: C.muted, marginTop: '1px' }}>{s.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Descrição */}
          {curso.descricao && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: C.muted2, lineHeight: 1.7, margin: 0 }}>{curso.descricao}</p>
            </div>
          )}

          {/* Módulos */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: 0 }}>
                Conteúdo do Curso — {(curso.modulos ?? []).length} módulo{(curso.modulos ?? []).length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setModalNovoModulo(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: C.blue, border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                <Plus size={13} /> Novo Módulo
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(curso.modulos ?? []).map((mod: any, idx: number) => {
                  const aberto = modulosAbertos.has(mod.id)
                  const aulas: any[] = mod.aulas ?? []
                  return (
                    <div key={mod.id}>
                      <div
                        onClick={() => toggleModulo(mod.id)}
                        style={{
                          background: C.surface, border: `1px solid ${C.border}`,
                          borderLeft: `4px solid ${corCurso}`,
                          borderRadius: aberto ? '10px 10px 0 0' : '10px',
                          padding: '14px 20px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '16px',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,86,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = C.surface}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${corCurso}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: corCurso }}>{idx + 1}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: C.text, flex: 1 }}>{mod.titulo}</span>
                        <span style={{ fontSize: '12px', color: C.muted }}>{aulas.length} aula{aulas.length !== 1 ? 's' : ''}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setModalEditarModulo({ id: mod.id, titulo: mod.titulo, ordem: mod.ordem })}
                            title="Editar módulo"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '5px', padding: '3px 7px', fontSize: '11px', color: C.muted, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
                          >
                            <Pencil size={10} /> Editar
                          </button>
                          <button
                            onClick={() => handleExcluirModulo(mod.id)}
                            title="Excluir módulo"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', padding: '3px 7px', fontSize: '11px', color: '#ef4444', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                          >
                            <Trash2 size={10} /> Excluir
                          </button>
                          <button
                            onClick={() => abrirNovaAula(mod.id)}
                            title="Nova aula"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#0d2550', border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '11px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                          >
                            <Plus size={10} /> Nova Aula
                          </button>
                        </div>
                        {aberto ? <ChevronUp size={16} color={C.blue} /> : <ChevronDown size={16} color={C.blue} />}
                      </div>

                      {aberto && (
                        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                          {aulas.map((aula: any, aulaIdx: number) => (
                            <div
                              key={aula.id}
                              style={{
                                padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px',
                                borderBottom: aulaIdx < aulas.length - 1 ? `1px solid ${C.border}` : 'none',
                                transition: 'background 150ms',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,86,255,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: aula.video_disponivel ? C.blue : C.surface2, border: `1px solid ${aula.video_disponivel ? C.blue : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {aula.video_disponivel
                                  ? <Play size={10} color="#fff" style={{ marginLeft: '1px' }} />
                                  : <Clock size={10} color={C.muted} />
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  Aula {aula.ordem ?? aulaIdx + 1} — {aula.titulo}
                                </p>
                                {aula.descricao && (
                                  <p style={{ fontSize: '11px', color: C.muted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {aula.descricao}
                                  </p>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                {aula.duracao && (
                                  <span style={{ fontSize: '11px', color: C.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={10} /> {aula.duracao}
                                  </span>
                                )}
                                <span style={{
                                  fontSize: '10px', fontWeight: 600, borderRadius: '6px', padding: '2px 8px',
                                  ...(aula.video_disponivel
                                    ? { background: 'rgba(26,86,255,0.10)', color: C.blue, border: '0.5px solid rgba(26,86,255,0.25)' }
                                    : { background: C.surface2, color: C.muted, border: `0.5px solid ${C.border}` })
                                }}>
                                  {aula.video_disponivel ? 'Vídeo' : 'Em breve'}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => abrirEditarAula(aula)}
                                    title="Editar aula"
                                    style={{ background: 'rgba(13,37,80,0.08)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#0d2550' }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => excluirAula(aula)}
                                    title="Excluir aula"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#ef4444' }}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Questões da prova */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: 0 }}>
                Questões da Prova — {(curso.questoes ?? []).length} questão{(curso.questoes ?? []).length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setModalNovaQuestao(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: C.blue, border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                <Plus size={13} /> Nova Pergunta
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(curso.questoes ?? []).map((q: any, i: number) => (
                  <div key={q.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: 0, flex: 1 }}>
                        {i + 1}. {q.enunciado}
                      </p>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => setQuestaoEditando({
                            id:           q.id,
                            enunciado:    q.enunciado,
                            alternativas: {
                              A: q.alternativas?.A ?? '',
                              B: q.alternativas?.B ?? '',
                              C: q.alternativas?.C ?? '',
                              D: q.alternativas?.D ?? '',
                            },
                            gabarito:   q.gabarito ?? 'A',
                            explicacao: q.explicacao ?? '',
                          })}
                          title="Editar questão"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: C.muted, cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
                        >
                          <Pencil size={11} /> Editar
                        </button>
                        <button
                          onClick={() => handleApagarQuestao(q.id)}
                          title="Apagar questão"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#ef4444', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                        >
                          <Trash2 size={11} /> Apagar
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(['A', 'B', 'C', 'D'] as const).map(letra => {
                        const op = q.alternativas?.[letra]
                        if (!op) return null
                        const certa = q.gabarito === letra
                        return (
                          <div key={letra} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: certa ? 'rgba(16,185,129,0.08)' : 'transparent', border: certa ? '0.5px solid rgba(16,185,129,0.25)' : '0.5px solid transparent' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: certa ? '#10b981' : C.muted, minWidth: '16px' }}>{letra})</span>
                            <span style={{ fontSize: '12px', color: certa ? C.text : C.muted2 }}>{op}</span>
                            {certa && <Check size={12} color="#10b981" style={{ marginLeft: 'auto' }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal de edição de questão */}
      {questaoEditando && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setQuestaoEditando(null) }}
        >
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 20px' }}>Editar Questão</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>Enunciado</label>
              <textarea
                value={questaoEditando.enunciado}
                onChange={e => setQuestaoEditando(prev => prev ? { ...prev, enunciado: e.target.value } : null)}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {(['A', 'B', 'C', 'D'] as const).map(letra => (
              <div key={letra} style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '4px' }}>{letra})</label>
                <input
                  type="text"
                  value={questaoEditando.alternativas[letra]}
                  onChange={e => setQuestaoEditando(prev => prev ? { ...prev, alternativas: { ...prev.alternativas, [letra]: e.target.value } } : null)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>Resposta correta</label>
              <select
                value={questaoEditando.gabarito}
                onChange={e => setQuestaoEditando(prev => prev ? { ...prev, gabarito: e.target.value } : null)}
                style={{ padding: '8px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>
                Explicação <span style={{ fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                value={questaoEditando.explicacao}
                onChange={e => setQuestaoEditando(prev => prev ? { ...prev, explicacao: e.target.value } : null)}
                rows={2}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setQuestaoEditando(null)}
                disabled={salvandoQuestao}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: C.muted, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarQuestao}
                disabled={salvandoQuestao}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: '#fff', background: salvandoQuestao ? C.muted : C.blue, border: 'none', borderRadius: '8px', cursor: salvandoQuestao ? 'not-allowed' : 'pointer' }}
              >
                {salvandoQuestao ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Pergunta */}
      {modalNovaQuestao && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setModalNovaQuestao(false) }}
        >
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 20px' }}>Nova Pergunta</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>Enunciado</label>
              <textarea
                value={novaQuestao.enunciado}
                onChange={e => setNovaQuestao(prev => ({ ...prev, enunciado: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {(['A', 'B', 'C', 'D'] as const).map(letra => (
              <div key={letra} style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '4px' }}>{letra})</label>
                <input
                  type="text"
                  value={novaQuestao.alternativas[letra]}
                  onChange={e => setNovaQuestao(prev => ({ ...prev, alternativas: { ...prev.alternativas, [letra]: e.target.value } }))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>Resposta correta</label>
              <select
                value={novaQuestao.gabarito}
                onChange={e => setNovaQuestao(prev => ({ ...prev, gabarito: e.target.value }))}
                style={{ padding: '8px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>
                Explicação <span style={{ fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                value={novaQuestao.explicacao}
                onChange={e => setNovaQuestao(prev => ({ ...prev, explicacao: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalNovaQuestao(false)}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: C.muted, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarQuestao}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: '#fff', background: C.blue, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Módulo */}
      {modalNovoModulo && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) { setModalNovoModulo(false); setNovoModuloTitulo('') } }}
        >
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 20px' }}>Novo Módulo</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>Título do módulo</label>
              <input
                type="text"
                value={novoModuloTitulo}
                onChange={e => setNovoModuloTitulo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCriarModulo() }}
                placeholder="Ex: Módulo 1 — Introdução"
                autoFocus
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setModalNovoModulo(false); setNovoModuloTitulo('') }}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: C.muted, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarModulo}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: '#fff', background: C.blue, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Módulo */}
      {modalEditarModulo && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setModalEditarModulo(null) }}
        >
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 20px' }}>Editar Módulo</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }}>Título do módulo</label>
              <input
                type="text"
                value={modalEditarModulo.titulo}
                onChange={e => setModalEditarModulo(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                onKeyDown={e => { if (e.key === 'Enter') handleEditarModulo() }}
                autoFocus
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalEditarModulo(null)}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: C.muted, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarModulo}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: '#fff', background: C.blue, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aula */}
      {modalAula && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '24px', width: '480px',
            maxWidth: '92vw', maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: '#0d2550' }}>
              {aulaEdit ? 'Editar Aula' : 'Nova Aula'}
            </h3>

            <label style={lblStyle}>Título *</label>
            <input
              value={formAula.titulo}
              onChange={e => setFormAula({ ...formAula, titulo: e.target.value })}
              style={inpStyle}
              placeholder="Ex: Aula 1 — Introdução"
            />

            <label style={lblStyle}>Descrição</label>
            <textarea
              value={formAula.descricao}
              onChange={e => setFormAula({ ...formAula, descricao: e.target.value })}
              style={{ ...inpStyle, minHeight: '70px', resize: 'vertical' }}
              placeholder="Breve descrição da aula"
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Duração</label>
                <input
                  value={formAula.duracao}
                  onChange={e => setFormAula({ ...formAula, duracao: e.target.value })}
                  style={inpStyle}
                  placeholder="Ex: 48 min"
                />
              </div>
              <div style={{ width: '90px' }}>
                <label style={lblStyle}>Ordem</label>
                <input
                  type="number"
                  value={formAula.ordem}
                  onChange={e => setFormAula({ ...formAula, ordem: Number(e.target.value) })}
                  style={inpStyle}
                />
              </div>
            </div>

            <label style={lblStyle}>🔗 Link do vídeo do YouTube</label>
            <input
              value={formAula.video_url}
              onChange={e => setFormAula({ ...formAula, video_url: e.target.value })}
              style={inpStyle}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
              Cole o link do vídeo do canal do YouTube. O vídeo será reproduzido dentro do portal.
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAula(false)}
                style={{ padding: '9px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={salvarAula}
                disabled={!formAula.titulo}
                style={{ padding: '9px 16px', background: formAula.titulo ? '#0d2550' : '#94a3b8', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                {aulaEdit ? 'Salvar' : 'Criar Aula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutAdmin>
  )
}
