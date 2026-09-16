import { useState, useEffect, useCallback } from 'react'
import { Search, Users, BookOpen, GraduationCap, RefreshCw, Pencil, Trash2, Plus, X, Download } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { turmasAPI } from '../../services/api'
import { exportarTurmasExcel, nomeArquivoTurmas } from '../../utils/exportarTurmasExcel'
import { ImportarTurmasModal } from '../../components/admin/ImportarTurmasModal'
import { useBreakpoint } from '../../hooks/useMobile'

interface TurmasAdminProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

const ICONES: Record<string, string> = {
  'Coordenação de Suprimentos':       '📦',
  'Recursos Humanos':                  '👥',
  'Segurança do Trabalho':             '🛡️',
  'Serviços Gerais':                   '🏗️',
  'Comunicação':                       '📢',
  'Engenharia':                        '📐',
  'Manutenções - Oficina':             '⚙️',
  'Tecnologia da Informação':          '💻',
  'Coordenação de Pessoal':            '👤',
  'Coordenação de Qualidade':          '✅',
  'Gerência Financeira':               '💰',
  'Gerência Jurídica e Compliance':    '⚖️',
  'Gerência de Auditoria':             '🔍',
  'Gerência de Controladoria':         '📊',
  'Gerência de Gestão de Pessoas':     '🤝',
  'Saúde Ocupacional':                 '🏥',
  'Patrimônio':                        '🏛️',
}

const CORES: Record<string, string> = {
  'Coordenação de Suprimentos':       '#f59e0b',
  'Recursos Humanos':                  '#10b981',
  'Segurança do Trabalho':             '#ef4444',
  'Serviços Gerais':                   '#6366f1',
  'Comunicação':                       '#ec4899',
  'Engenharia':                        '#0891b2',
  'Manutenções - Oficina':             '#78716c',
  'Tecnologia da Informação':          '#1a56ff',
  'Coordenação de Pessoal':            '#8b5cf6',
  'Coordenação de Qualidade':          '#14b8a6',
  'Gerência Financeira':               '#f59e0b',
  'Gerência Jurídica e Compliance':    '#7c3aed',
  'Gerência de Auditoria':             '#dc2626',
  'Gerência de Controladoria':         '#0284c7',
  'Gerência de Gestão de Pessoas':     '#db2777',
  'Saúde Ocupacional':                 '#0d9488',
  'Patrimônio':                        '#92400e',
}

export function TurmasAdmin({ onNavigate, onLogout }: TurmasAdminProps) {
  const { C } = useTheme()
  const { cols } = useBreakpoint()

  const [turmas,       setTurmas]       = useState<any[]>([])
  const [carregando,   setCarregando]   = useState(true)
  const [erro,         setErro]         = useState('')
  const [busca,        setBusca]        = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modalTurma,   setModalTurma]   = useState<{ modo: 'criar' | 'editar'; turma?: any } | null>(null)
  const [formTurma,    setFormTurma]    = useState({
    nome: '', cargo_grupo: '', setor: '', responsavel: '',
    icone: '🏢', cor: '#0d2550', status: 'ativa', instrutor_id: ''
  })
  const [exportando,   setExportando]   = useState(false)
  const [modalImportar, setModalImportar] = useState(false)

  // Exporta o que está na tela (turmasFiltradas respeita busca e filtro). Sem
  // menu todos/filtrados como em AlunosAdmin: são ~20 turmas, não 500.
  // O catch loga: `.catch(() => {})` já escondeu um 500 por dois meses aqui.
  const exportar = async () => {
    if (exportando) return
    setExportando(true)
    try {
      await exportarTurmasExcel(turmasFiltradas, nomeArquivoTurmas())
    } catch (err) {
      console.error('Erro ao exportar turmas:', err)
      alert('Não foi possível gerar a planilha.')
    } finally {
      setExportando(false)
    }
  }

  const abrirCriar = () => {
    setFormTurma({ nome: '', cargo_grupo: '', setor: '', responsavel: '', icone: '🏢', cor: '#0d2550', status: 'ativa', instrutor_id: '' })
    setModalTurma({ modo: 'criar' })
  }

  const abrirEditar = (turma: any) => {
    setFormTurma({
      nome:         turma.nome         ?? '',
      cargo_grupo:  turma.cargo_grupo  ?? '',
      setor:        turma.setor        ?? '',
      responsavel:  turma.responsavel  ?? '',
      icone:        turma.icone        ?? '🏢',
      cor:          turma.cor          ?? '#0d2550',
      status:       turma.status       ?? 'ativa',
      instrutor_id: turma.instrutor_id ?? '',
    })
    setModalTurma({ modo: 'editar', turma })
  }

  const salvarTurma = async () => {
    const dados = { ...formTurma, instrutor_id: formTurma.instrutor_id || null }
    try {
      if (modalTurma?.modo === 'criar') {
        const nova = await turmasAPI.criar(dados) as any
        setTurmas(prev => [nova, ...prev])
      } else {
        const atualizada = await turmasAPI.atualizar(modalTurma!.turma.id, dados) as any
        setTurmas(prev => prev.map(t => t.id === atualizada.id ? { ...t, ...atualizada } : t))
      }
      setModalTurma(null)
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao salvar turma')
    }
  }

  const excluirTurma = async (turma: any) => {
    if (!window.confirm(`Excluir a turma "${turma.nome}"?\nEsta ação não pode ser desfeita.`)) return
    try {
      await turmasAPI.excluir(turma.id)
      setTurmas(prev => prev.filter(t => t.id !== turma.id))
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao excluir turma')
    }
  }

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const data = await turmasAPI.listar() as any[]
      setTurmas(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setErro('Erro ao carregar turmas. Verifique a conexão.')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const turmasFiltradas = turmas.filter(t => {
    const matchBusca = !busca ||
      t.cargo_grupo?.toLowerCase().includes(busca.toLowerCase()) ||
      t.instrutor_nome?.toLowerCase().includes(busca.toLowerCase())
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'com_curso'      && parseInt(t.total_cursos) > 0) ||
      (filtroStatus === 'sem_curso'      && parseInt(t.total_cursos) === 0) ||
      (filtroStatus === 'com_instrutor'  && t.instrutor_nome)
    return matchBusca && matchStatus
  })

  const totalAlunos  = turmas.reduce((s, t) => s + (parseInt(t.total_alunos) || 0), 0)
  const totalCursos  = turmas.reduce((s, t) => s + (parseInt(t.total_cursos) || 0), 0)
  const comInstrutor = turmas.filter(t => t.instrutor_nome).length
  const comCurso     = turmas.filter(t => parseInt(t.total_cursos) > 0).length

  return (
    <LayoutAdmin
      paginaAtiva="turmasAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Gestão de Turmas"
      topbarSubtitulo="Turmas e vinculações reais do banco de dados."
    >
      <div style={{ padding: '28px 24px' }}>

        {/* Cabeçalho */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              Turmas
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {turmas.length} turmas cadastradas no sistema
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={abrirCriar}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', background: '#F5C400', color: '#0d2550',
              border: 'none', borderRadius: '7px', fontWeight: 700,
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Nova Turma
          </button>
          <button
            onClick={exportar}
            disabled={exportando}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', background: 'none',
              border: `1.5px solid ${C.blue}`, borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, color: C.blue,
              cursor: exportando ? 'not-allowed' : 'pointer',
              opacity: exportando ? 0.6 : 1, transition: 'all 150ms',
            }}
            onMouseEnter={e => { if (!exportando) e.currentTarget.style.background = 'rgba(26,86,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <Download size={15} />
            {exportando ? 'Exportando...' : 'Exportar'}
          </button>
          <button
            onClick={() => setModalImportar(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', background: 'none',
              border: `1.5px solid ${C.blue}`, borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, color: C.blue,
              cursor: 'pointer', transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,86,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar planilha
          </button>
          <button
            onClick={carregar}
            disabled={carregando}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: '8px', fontSize: '12px',
              color: C.muted, cursor: 'pointer',
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: carregando ? 'spin 0.8s linear infinite' : 'none' }}
            />
            Atualizar
          </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${cols(2, 2, 4)}, 1fr)`,
          gap: '12px', marginBottom: '24px',
        }}>
          {[
            { label: 'Total de Turmas',  valor: turmas.length, icone: '🏫',  cor: C.blue    },
            { label: 'Total de Alunos',  valor: totalAlunos,   icone: '👥',  cor: '#10b981' },
            { label: 'Cursos Ativos',    valor: totalCursos,   icone: '📚',  cor: '#f59e0b' },
            { label: 'Com Instrutor',    valor: comInstrutor,  icone: '👨‍🏫', cor: '#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: '12px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icone}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.cor }}>
                {carregando ? '…' : s.valor}
              </div>
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Busca e filtros */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '8px 14px', flex: 1, minWidth: '200px',
          }}>
            <Search size={14} color={C.muted} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              placeholder="Buscar por turma ou instrutor..."
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: '13px', color: C.text, flex: 1,
              }}
            />
          </div>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            style={{
              padding: '8px 14px', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: '8px',
              fontSize: '13px', color: C.text, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="todos">Todas as turmas</option>
            <option value="com_curso">Com curso</option>
            <option value="sem_curso">Sem curso</option>
            <option value="com_instrutor">Com instrutor</option>
          </select>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px', padding: '12px 16px',
            fontSize: '13px', color: '#ef4444', marginBottom: '16px',
          }}>
            ⚠️ {erro}
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '60px', gap: '12px', color: C.muted,
          }}>
            <div style={{
              width: '24px', height: '24px',
              border: `3px solid ${C.border}`, borderTopColor: C.blue,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            Carregando turmas...
          </div>
        )}

        {/* Vazio */}
        {!carregando && turmasFiltradas.length === 0 && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '12px', padding: '48px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏫</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: '0 0 6px' }}>
              {busca ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
            </p>
          </div>
        )}

        {/* Grid de cards */}
        {!carregando && turmasFiltradas.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {turmasFiltradas.map(turma => {
              const nome      = turma.cargo_grupo ?? turma.nome
              const icone     = turma.icone     ?? ICONES[nome] ?? '🏫'
              const cor       = turma.cor       ?? CORES[nome]  ?? C.blue
              const alunos    = parseInt(turma.total_alunos) || 0
              const cursos    = parseInt(turma.total_cursos) || 0
              const instrutor = turma.instrutor_nome ?? null

              return (
                <div
                  key={turma.id}
                  style={{
                    background:   C.surface,
                    border:       `1px solid ${C.border}`,
                    borderTop:    `4px solid ${cor}`,
                    borderRadius: '12px',
                    overflow:     'hidden',
                    transition:   'transform 200ms, box-shadow 200ms',
                    position:     'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform  = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow  = '0 8px 24px rgba(0,0,0,0.10)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform  = 'translateY(0)'
                    e.currentTarget.style.boxShadow  = 'none'
                  }}
                >
                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '6px', position: 'absolute', top: '12px', right: '12px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); abrirEditar(turma) }}
                      title="Editar turma"
                      style={{ background: 'rgba(13,37,80,0.08)', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Pencil size={13} color="#0d2550" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); excluirTurma(turma) }}
                      title="Excluir turma"
                      style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>

                  {/* Header */}
                  <div style={{ padding: '18px 20px 14px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      gap: '12px', marginBottom: '12px',
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: `${cor}18`,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0,
                      }}>
                        {icone}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14px', fontWeight: 700,
                          color: C.text, margin: '0 0 4px',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {nome}
                        </p>
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          padding: '2px 8px', borderRadius: '10px',
                          background: cursos > 0
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(245,158,11,0.12)',
                          color:      cursos > 0 ? '#10b981' : '#f59e0b',
                          border:     `1px solid ${cursos > 0
                            ? 'rgba(16,185,129,0.30)'
                            : 'rgba(245,158,11,0.30)'}`,
                        }}>
                          {cursos > 0
                            ? `${cursos} curso${cursos > 1 ? 's' : ''}`
                            : 'Aguardando curso'}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{
                        background: C.surface2, borderRadius: '8px', padding: '10px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <Users size={14} color={C.muted} />
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>
                            {alunos}
                          </p>
                          <p style={{ fontSize: '10px', color: C.muted, margin: '2px 0 0' }}>
                            aluno{alunos !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        background: C.surface2, borderRadius: '8px', padding: '10px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <BookOpen size={14} color={C.muted} />
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>
                            {cursos}
                          </p>
                          <p style={{ fontSize: '10px', color: C.muted, margin: '2px 0 0' }}>
                            curso{cursos !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instrutor */}
                  <div style={{
                    padding: '12px 20px',
                    borderTop: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    {instrutor ? (
                      <>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: `${cor}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, color: cor, flexShrink: 0,
                        }}>
                          {instrutor.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '12px', fontWeight: 600, color: C.text, margin: 0,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {instrutor}
                          </p>
                          <p style={{ fontSize: '10px', color: C.muted, margin: 0 }}>Instrutor / Tutor</p>
                        </div>
                        <GraduationCap size={14} color={C.muted} />
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: C.surface2,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                        }}>
                          <GraduationCap size={13} color={C.muted} />
                        </div>
                        <p style={{ fontSize: '12px', color: C.muted, margin: 0, fontStyle: 'italic', flex: 1 }}>
                          Instrutor não vinculado
                        </p>
                        <button
                          onClick={() => onNavigate('instrutoresAdmin')}
                          style={{
                            fontSize: '11px', color: C.blue,
                            background: 'none', border: 'none',
                            cursor: 'pointer', fontWeight: 600,
                            padding: 0, flexShrink: 0,
                          }}
                        >
                          + Vincular
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé resumo */}
        {!carregando && turmasFiltradas.length > 0 && (
          <div style={{
            marginTop: '20px', padding: '12px 16px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '12px', color: C.muted }}>
              Mostrando <strong style={{ color: C.text }}>{turmasFiltradas.length}</strong> de {turmas.length} turmas
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              <strong style={{ color: '#10b981' }}>{comCurso}</strong> com curso
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              <strong style={{ color: '#f59e0b' }}>{turmas.length - comCurso}</strong> aguardando curso
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              <strong style={{ color: '#7c3aed' }}>{comInstrutor}</strong> com instrutor
            </span>
          </div>
        )}

      </div>

      {/* Modal Nova Turma / Editar Turma */}
      {modalTurma && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            background: C.surface, borderRadius: '14px',
            padding: '28px', width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {/* Cabeçalho modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: 0 }}>
                {modalTurma.modo === 'criar' ? 'Nova Turma' : 'Editar Turma'}
              </h2>
              <button onClick={() => setModalTurma(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} color={C.muted} />
              </button>
            </div>

            {/* Campos */}
            {([
              { label: 'Nome da turma *', field: 'nome',        placeholder: 'Ex: Recursos Humanos' },
              { label: 'Grupo / Cargo',   field: 'cargo_grupo', placeholder: 'Ex: Recursos Humanos' },
              { label: 'Setor',           field: 'setor',       placeholder: 'Ex: Administrativo'    },
              { label: 'Responsável',     field: 'responsavel', placeholder: 'Nome do responsável'   },
              { label: 'Ícone (emoji)',   field: 'icone',       placeholder: '🏢'                    },
            ] as { label: string; field: keyof typeof formTurma; placeholder: string }[]).map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '5px' }}>
                  {label}
                </label>
                <input
                  value={formTurma[field] as string}
                  onChange={e => setFormTurma(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '9px 12px', background: C.surface2,
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    fontSize: '13px', color: C.text, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {/* Cor */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '5px' }}>Cor</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formTurma.cor}
                  onChange={e => setFormTurma(p => ({ ...p, cor: e.target.value }))}
                  style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
                />
                <input
                  value={formTurma.cor}
                  onChange={e => setFormTurma(p => ({ ...p, cor: e.target.value }))}
                  placeholder="#0d2550"
                  style={{
                    flex: 1, padding: '9px 12px', background: C.surface2,
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    fontSize: '13px', color: C.text, outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '5px' }}>Status</label>
              <select
                value={formTurma.status}
                onChange={e => setFormTurma(p => ({ ...p, status: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px', background: C.surface2,
                  border: `1px solid ${C.border}`, borderRadius: '8px',
                  fontSize: '13px', color: C.text, outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
                <option value="arquivada">Arquivada</option>
              </select>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalTurma(null)}
                style={{
                  padding: '9px 18px', background: 'none',
                  border: `1px solid ${C.border}`, borderRadius: '8px',
                  fontSize: '13px', color: C.muted, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarTurma}
                style={{
                  padding: '9px 20px', background: C.blue, border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  color: '#fff', cursor: 'pointer',
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Planilha */}
      {modalImportar && (
        <div
          onClick={() => setModalImportar(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.60)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:C.surface, borderRadius:'16px', width:'100%', maxWidth:'780px', maxHeight:'90vh', overflowY:'auto', border:`1px solid ${C.border}`, boxShadow:'0 32px 80px rgba(0,0,0,0.4)' }}
          >
            <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:C.surface, zIndex:1 }}>
              <div>
                <h2 style={{ fontSize:'16px', fontWeight:700, color:C.text, margin:'0 0 2px' }}>
                  Importar Turmas — Planilha Excel
                </h2>
                <p style={{ fontSize:'12px', color:C.muted, margin:0 }}>
                  Colunas: Nome da turma · Setor · Responsável
                </p>
              </div>
              <button
                onClick={() => setModalImportar(false)}
                style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'18px', color:C.muted, display:'flex', alignItems:'center', justifyContent:'center' }}
              >
                ×
              </button>
            </div>
            <ImportarTurmasModal
              onFechar={() => setModalImportar(false)}
              onSucesso={async (total) => {
                setModalImportar(false)
                await carregar()
                console.log(`${total} turma(s) importadas`)
              }}
            />
          </div>
        </div>
      )}
    </LayoutAdmin>
  )
}
