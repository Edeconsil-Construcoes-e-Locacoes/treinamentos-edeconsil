import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Edit3, Trash2, BookOpen, Users } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { instrutoresAPI } from '../../services/api'
import { EditarInstrutor } from './EditarInstrutor'
import { ModalNovoInstrutor } from '../../components/admin/ModalNovoInstrutor'
import { useBreakpoint } from '../../hooks/useMobile'

interface InstrutoresAdminProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

export function InstrutoresAdmin({ onNavigate, onLogout }: InstrutoresAdminProps) {
  const { C } = useTheme()
  const { isMobile, cols } = useBreakpoint()

  const [instrutores,    setInstrutores]    = useState<any[]>([])
  const [carregando,     setCarregando]     = useState(true)
  const [busca,          setBusca]          = useState('')
  const [modalEditar,    setModalEditar]    = useState<any>(null)
  const [modalCriar,     setModalCriar]     = useState(false)
  const [avisoTurma,     setAvisoTurma]     = useState<string | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState<any>(null)
  const [erroAcao,       setErroAcao]       = useState('')

  const carregar = useCallback(async (b = '') => {
    setCarregando(true)
    try {
      const params: Record<string, string> = {}
      if (b) params.busca = b
      const data = await instrutoresAPI.listar(params) as any[]
      setInstrutores(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const excluir = async (inst: any) => {
    try {
      await instrutoresAPI.excluir(inst.id)
      setConfirmExcluir(null)
      carregar(busca)
    } catch (err: any) {
      setErroAcao(err.message ?? 'Erro ao excluir')
      setConfirmExcluir(null)
    }
  }

  const total       = instrutores.length
  const ativos      = instrutores.filter(i => i.status === 'ativo').length
  const totalCursos = instrutores.reduce((s, i) => s + (parseInt(i.total_cursos) || 0), 0)
  const totalAlunos = instrutores.reduce((s, i) => s + (parseInt(i.total_alunos) || 0), 0)

  function Modal({ titulo, subtitulo, children, onFechar, largura = '580px' }: any) {
    return (
      <div
        onClick={onFechar}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.60)', zIndex: 1000,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.surface, borderRadius: '16px',
            width: '100%', maxWidth: largura,
            maxHeight: '90vh', overflowY: 'auto',
            border: `1px solid ${C.border}`,
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky', top: 0,
            background: C.surface, zIndex: 1,
          }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
                {titulo}
              </h2>
              {subtitulo && (
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>{subtitulo}</p>
              )}
            </div>
            <button onClick={onFechar} style={{
              background: 'none', border: `1px solid ${C.border}`,
              borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '18px', color: C.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  return (
    <LayoutAdmin
      paginaAtiva="instrutoresAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Gestão de Instrutores"
      topbarSubtitulo="Gerencie os instrutores da plataforma."
    >
      <div style={{ padding: '28px 24px' }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              Instrutores
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              Gerencie os instrutores da plataforma
            </p>
          </div>
          <button
            onClick={() => setModalCriar(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', background: C.blue,
              border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Novo Instrutor
          </button>
        </div>

        {/* Estatísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(2, 2, 4)}, 1fr)`, gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total',   valor: total,       icone: '👨‍🏫', cor: C.blue    },
            { label: 'Ativos',  valor: ativos,      icone: '✅',   cor: '#10b981' },
            { label: 'Cursos',  valor: totalCursos, icone: '📚',   cor: '#f59e0b' },
            { label: 'Alunos',  valor: totalAlunos, icone: '👥',   cor: '#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: '12px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icone}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.cor }}>{s.valor}</div>
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '8px 14px', flex: 1,
          }}>
            <Search size={14} color={C.muted} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === 'Enter') carregar(busca)
              }}
              placeholder="Buscar por nome ou especialidade..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: C.text, flex: 1 }}
            />
          </div>
          <button
            onClick={() => carregar(busca)}
            style={{
              padding: '9px 18px', background: C.blue, border: 'none',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}
          >
            Buscar
          </button>
          {busca && (
            <button
              onClick={() => { setBusca(''); carregar('') }}
              style={{
                padding: '9px 14px', background: 'none',
                border: `1px solid ${C.border}`, borderRadius: '8px',
                fontSize: '13px', color: C.muted, cursor: 'pointer',
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: C.muted }}>
            <div style={{
              width: '24px', height: '24px',
              border: `3px solid ${C.border}`, borderTopColor: C.blue,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            Carregando instrutores...
          </div>
        ) : instrutores.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '12px', padding: '48px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍🏫</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: '0 0 6px' }}>
              {busca ? 'Nenhum instrutor encontrado' : 'Nenhum instrutor cadastrado'}
            </p>
            <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 16px' }}>
              {busca ? 'Tente outros termos de busca' : 'Cadastre o primeiro instrutor da plataforma'}
            </p>
            {!busca && (
              <button
                onClick={() => setModalCriar(true)}
                style={{
                  padding: '10px 20px', background: C.blue, border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer',
                }}
              >
                + Novo Instrutor
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {instrutores.map(inst => (
              <div
                key={inst.id}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: '14px', overflow: 'hidden',
                  transition: 'box-shadow 200ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Header */}
                <div style={{
                  padding: '18px 20px', borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(26,86,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 700, color: C.blue, overflow: 'hidden',
                  }}>
                    {inst.foto_url ? (
                      <img src={inst.foto_url} alt={inst.nome}
                        style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      inst.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <p style={{
                        fontSize: '14px', fontWeight: 700, color: C.text, margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {inst.nome}
                      </p>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, flexShrink: 0,
                        padding: '2px 8px', borderRadius: '10px',
                        background: inst.status === 'ativo' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                        color: inst.status === 'ativo' ? '#10b981' : '#ef4444',
                        border: `1px solid ${inst.status === 'ativo' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.20)'}`,
                      }}>
                        {inst.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: C.blue, margin: '0 0 2px', fontWeight: 500 }}>
                      {inst.especialidade ?? 'Sem especialidade definida'}
                    </p>
                    {inst.email && (
                      <p style={{ fontSize: '11px', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inst.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {inst.bio && (
                  <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
                    <p style={{
                      fontSize: '12px', color: C.muted, margin: 0, lineHeight: 1.6,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {inst.bio}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div style={{
                  padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
                  display: 'flex', gap: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={13} color={C.muted} />
                    <span style={{ fontSize: '12px', color: C.muted }}>
                      <strong style={{ color: C.text }}>{inst.total_cursos ?? 0}</strong> curso{inst.total_cursos !== '1' ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} color={C.muted} />
                    <span style={{ fontSize: '12px', color: C.muted }}>
                      <strong style={{ color: C.text }}>{inst.total_alunos ?? 0}</strong> aluno{inst.total_alunos !== '1' ? 's' : ''}
                    </span>
                  </div>
                  {inst.telefone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: C.muted }}>📞 {inst.telefone}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div style={{ padding: '12px 20px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setModalEditar(inst)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                      padding: '8px', background: 'none',
                      border: `1px solid ${C.border}`, borderRadius: '8px',
                      fontSize: '12px', fontWeight: 600, color: C.text,
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(26,86,255,0.08)'
                      e.currentTarget.style.borderColor = C.blue
                      e.currentTarget.style.color = C.blue
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.color = C.text
                    }}
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => { setErroAcao(''); setConfirmExcluir(inst) }}
                    style={{
                      padding: '8px 12px', background: 'none',
                      border: `1px solid ${C.border}`, borderRadius: '8px',
                      color: C.muted, cursor: 'pointer', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                      e.currentTarget.style.borderColor = '#ef4444'
                      e.currentTarget.style.color = '#ef4444'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.color = C.muted
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar — promover colaborador (principal) ou cadastrar externo */}
      {modalCriar && (
        <Modal
          titulo="Novo Instrutor"
          subtitulo="Promova um colaborador ou cadastre um instrutor externo"
          onFechar={() => setModalCriar(false)}
        >
          <ModalNovoInstrutor
            onFechar={() => setModalCriar(false)}
            onSucesso={(avisoTurma) => {
              setModalCriar(false)
              carregar(busca)
              if (avisoTurma) setAvisoTurma(avisoTurma)
            }}
          />
        </Modal>
      )}

      {/* Aviso de turma reatribuída — o instrutor anterior perdeu a turma */}
      {avisoTurma && (
        <div
          onClick={() => setAvisoTurma(null)}
          style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200, maxWidth: '340px', padding: '12px 16px', background: C.surface, border: '1px solid #f59e0b', borderLeft: '4px solid #f59e0b', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '12px', fontWeight: 700, color: C.text, margin: '0 0 3px' }}>
            Turma reatribuída
          </p>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0, lineHeight: 1.5 }}>
            A turma dessa especialidade era de <strong style={{ color: C.text }}>{avisoTurma}</strong> e passou para o novo instrutor.
          </p>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <Modal
          titulo="Editar Instrutor"
          subtitulo={modalEditar.nome}
          onFechar={() => setModalEditar(null)}
        >
          <EditarInstrutor
            instrutor={modalEditar}
            onFechar={() => setModalEditar(null)}
            onSucesso={() => { setModalEditar(null); carregar(busca) }}
          />
        </Modal>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmExcluir && (
        <div
          onClick={() => setConfirmExcluir(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.60)', zIndex: 2000,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.surface, borderRadius: '14px',
              padding: '28px', maxWidth: '420px', width: '100%',
              border: `1px solid ${C.border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              Excluir instrutor?
            </h3>
            <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 20px' }}>
              Tem certeza que deseja excluir{' '}
              <strong style={{ color: C.text }}>{confirmExcluir.nome}</strong>?
            </p>
            {erroAcao && (
              <div style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px', padding: '10px',
                fontSize: '12px', color: '#ef4444', marginBottom: '16px',
              }}>
                {erroAcao}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => { setConfirmExcluir(null); setErroAcao('') }}
                style={{
                  padding: '10px 20px', background: 'none',
                  border: `1.5px solid ${C.border}`, borderRadius: '8px',
                  fontSize: '13px', color: C.text, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => excluir(confirmExcluir)}
                style={{
                  padding: '10px 20px', background: '#ef4444', border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  color: '#fff', cursor: 'pointer',
                }}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de erro */}
      {erroAcao && !confirmExcluir && (
        <div
          onClick={() => setErroAcao('')}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: '#ef4444', color: '#fff',
            borderRadius: '10px', padding: '12px 18px',
            fontSize: '13px', fontWeight: 600, zIndex: 3000,
            boxShadow: '0 8px 24px rgba(239,68,68,0.4)', cursor: 'pointer',
          }}
        >
          ⚠️ {erroAcao}
        </div>
      )}
    </LayoutAdmin>
  )
}
