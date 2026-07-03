import { useState, useEffect, useCallback } from 'react'
import { Search, Users, BookOpen, RefreshCw, ListChecks, X, Check, Plus, Pencil } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { matrizAPI, cursosAPI, cargosAPI } from '../../services/api'
import { useBreakpoint } from '../../hooks/useMobile'

interface MatrizCursosAdminProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

interface CargoLinha {
  id:           string
  nome:         string
  setor:        string | null
  total_alunos: number | string
  total_cursos: number | string
}

interface Curso {
  id:     string
  slug:   string
  titulo: string
  icone?: string
  cor?:   string
  status?: string
}

interface ModalGerenciarProps {
  C: any
  cargo: string
  todosCursos: Curso[]
  vinculados: Set<string>
  carregando: boolean
  onToggle: (curso: Curso) => void
  onFechar: () => void
}

function ModalGerenciar({ C, cargo, todosCursos, vinculados, carregando, onToggle, onFechar }: ModalGerenciarProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: C.surface, borderRadius: '14px',
        padding: '28px', width: '100%', maxWidth: '520px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: 0 }}>
            Cursos de {cargo}
          </h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color={C.muted} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, marginBottom: '18px' }}>
          {carregando ? (
            <div style={{ padding: '30px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
              Carregando cursos...
            </div>
          ) : todosCursos.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
              Nenhum curso cadastrado.
            </div>
          ) : (
            todosCursos.map(curso => {
              const marcado = vinculados.has(curso.id)
              return (
                <div
                  key={curso.id}
                  onClick={() => onToggle(curso)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: marcado ? 'rgba(26,86,255,0.08)' : 'transparent',
                    marginBottom: '4px', transition: 'background 150ms',
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    border: `2px solid ${marcado ? C.blue : C.border}`,
                    background: marcado ? C.blue : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {marcado && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '13px', color: C.text, fontWeight: marcado ? 600 : 400 }}>
                    {curso.titulo}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onFechar}
            style={{
              padding: '9px 18px', background: C.blue, border: 'none',
              borderRadius: '8px', fontSize: '13px', fontWeight: 700,
              color: '#fff', cursor: 'pointer',
            }}
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  )
}

interface ModalCargoProps {
  C: any
  cargoEditando: CargoLinha | null
  nome: string
  setor: string
  salvando: boolean
  erro: string
  onChangeNome: (v: string) => void
  onChangeSetor: (v: string) => void
  onSalvar: () => void
  onFechar: () => void
}

function ModalCargo({
  C, cargoEditando, nome, setor, salvando, erro,
  onChangeNome, onChangeSetor, onSalvar, onFechar,
}: ModalCargoProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', background: C.surface2,
    border: `1px solid ${C.border}`, borderRadius: '8px',
    fontSize: '13px', color: C.text, outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: C.muted,
    display: 'block', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: C.surface, borderRadius: '14px',
        padding: '28px', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: 0 }}>
            {cargoEditando ? 'Editar cargo' : 'Novo cargo'}
          </h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color={C.muted} />
          </button>
        </div>

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444', marginBottom: '14px' }}>
            ⚠️ {erro}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Nome do cargo <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            value={nome}
            onChange={e => onChangeNome(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Ex: Técnico Administrativo I"
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Setor (opcional)</label>
          <input
            type="text"
            value={setor}
            onChange={e => onChangeSetor(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Ex: Coordenação de Suprimentos"
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onFechar}
            style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={onSalvar}
            disabled={salvando}
            style={{ padding: '10px 20px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MatrizCursosAdmin({ onNavigate, onLogout }: MatrizCursosAdminProps) {
  const { C } = useTheme()
  const { cols } = useBreakpoint()

  const [cargos,     setCargos]     = useState<CargoLinha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro,       setErro]       = useState('')
  const [busca,      setBusca]      = useState('')

  const [cargoAtivo,     setCargoAtivo]     = useState<string | null>(null)
  const [todosCursos,    setTodosCursos]    = useState<Curso[]>([])
  const [vinculados,     setVinculados]     = useState<Set<string>>(new Set())
  const [carregandoModal, setCarregandoModal] = useState(false)

  const [modalCargo,    setModalCargo]    = useState(false)
  const [cargoEditando, setCargoEditando] = useState<CargoLinha | null>(null)
  const [nomeCargo,     setNomeCargo]     = useState('')
  const [setorCargo,    setSetorCargo]    = useState('')
  const [salvandoCargo, setSalvandoCargo] = useState(false)
  const [erroCargo,     setErroCargo]     = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const data = await cargosAPI.listar() as CargoLinha[]
      setCargos(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setErro('Erro ao carregar matriz de cursos. Verifique a conexão.')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const abrirModalCargo = (item: CargoLinha | null) => {
    setCargoEditando(item)
    setNomeCargo(item?.nome ?? '')
    setSetorCargo(item?.setor ?? '')
    setErroCargo('')
    setModalCargo(true)
  }

  const fecharModalCargo = () => {
    setModalCargo(false)
    setCargoEditando(null)
    setNomeCargo('')
    setSetorCargo('')
    setErroCargo('')
  }

  const salvarCargo = async () => {
    if (!nomeCargo.trim()) { setErroCargo('Nome do cargo é obrigatório.'); return }
    setSalvandoCargo(true)
    setErroCargo('')
    try {
      if (cargoEditando) {
        await cargosAPI.editar(cargoEditando.id, nomeCargo.trim(), setorCargo.trim() || undefined)
      } else {
        await cargosAPI.criar(nomeCargo.trim(), setorCargo.trim() || undefined)
      }
      fecharModalCargo()
      carregar()
    } catch (err: any) {
      setErroCargo(err?.message ?? 'Erro ao salvar cargo.')
    } finally {
      setSalvandoCargo(false)
    }
  }

  const abrirGerenciar = async (cargo: string) => {
    setCargoAtivo(cargo)
    setCarregandoModal(true)
    try {
      const [todos, doCargo] = await Promise.all([
        cursosAPI.listar() as Promise<Curso[]>,
        matrizAPI.cursosDoCargo(cargo) as Promise<Curso[]>,
      ])
      setTodosCursos(Array.isArray(todos) ? todos : [])
      setVinculados(new Set((Array.isArray(doCargo) ? doCargo : []).map(c => c.id)))
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao carregar cursos do cargo')
      setCargoAtivo(null)
    } finally {
      setCarregandoModal(false)
    }
  }

  const fecharGerenciar = () => {
    setCargoAtivo(null)
    setTodosCursos([])
    setVinculados(new Set())
    carregar()
  }

  const toggleCurso = async (curso: Curso) => {
    if (!cargoAtivo) return
    const jaVinculado = vinculados.has(curso.id)
    setVinculados(prev => {
      const novo = new Set(prev)
      if (jaVinculado) novo.delete(curso.id)
      else novo.add(curso.id)
      return novo
    })
    try {
      if (jaVinculado) await matrizAPI.desvincular(cargoAtivo, curso.id)
      else await matrizAPI.vincular(cargoAtivo, curso.id)
    } catch (err: any) {
      // reverte em caso de erro
      setVinculados(prev => {
        const novo = new Set(prev)
        if (jaVinculado) novo.add(curso.id)
        else novo.delete(curso.id)
        return novo
      })
      alert(err?.message ?? 'Erro ao atualizar vínculo')
    }
  }

  const cargosFiltrados = cargos.filter(c =>
    !busca || c.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  const totalAlunos = cargos.reduce((s, c) => s + (parseInt(String(c.total_alunos)) || 0), 0)
  const totalCursos = cargos.reduce((s, c) => s + (parseInt(String(c.total_cursos)) || 0), 0)
  const comCurso     = cargos.filter(c => parseInt(String(c.total_cursos)) > 0).length

  return (
    <LayoutAdmin
      paginaAtiva="matrizCursosAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Matriz de Cursos"
      topbarSubtitulo="Vínculo entre cargo e cursos — define os cursos obrigatórios de cada função."
    >
      <div style={{ padding: '28px 24px' }}>

        {/* Cabeçalho */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              Matriz de Cursos
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {cargos.length} cargos cadastrados no sistema
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
            <button
              onClick={() => abrirModalCargo(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', background: '#F5C400', color: '#0d2550',
                border: 'none', borderRadius: '7px', fontWeight: 700,
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Novo cargo
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${cols(2, 2, 3)}, 1fr)`,
          gap: '12px', marginBottom: '24px',
        }}>
          {[
            { label: 'Total de Cargos',   valor: cargos.length, icone: '🧩', cor: C.blue    },
            { label: 'Total de Alunos',   valor: totalAlunos,   icone: '👥', cor: '#10b981' },
            { label: 'Vínculos de Curso', valor: totalCursos,   icone: '📚', cor: '#f59e0b' },
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

        {/* Busca */}
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
              placeholder="Buscar por cargo..."
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: '13px', color: C.text, flex: 1,
              }}
            />
          </div>
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
            Carregando matriz de cursos...
          </div>
        )}

        {/* Vazio */}
        {!carregando && cargosFiltrados.length === 0 && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '12px', padding: '48px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧩</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: '0 0 6px' }}>
              {busca ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado'}
            </p>
          </div>
        )}

        {/* Grid de cards */}
        {!carregando && cargosFiltrados.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            {cargosFiltrados.map(item => {
              const alunos = parseInt(String(item.total_alunos)) || 0
              const cursos = parseInt(String(item.total_cursos)) || 0

              return (
                <div
                  key={item.id}
                  style={{
                    background:   C.surface,
                    border:       `1px solid ${C.border}`,
                    borderTop:    `4px solid ${cursos > 0 ? '#10b981' : C.blue}`,
                    borderRadius: '12px',
                    overflow:     'hidden',
                    transition:   'transform 200ms, box-shadow 200ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ padding: '18px 20px 14px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      gap: '12px', marginBottom: '12px',
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: 'rgba(26,86,255,0.10)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px', flexShrink: 0,
                      }}>
                        🧩
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14px', fontWeight: 700,
                          color: C.text, margin: '0 0 4px',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.nome}
                        </p>
                        <p style={{
                          fontSize: '11px', color: C.muted, margin: 0,
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.setor ?? '—'}
                        </p>
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

                  <div style={{
                    padding: '12px 20px',
                    borderTop: `1px solid ${C.border}`,
                    display: 'flex', gap: '8px',
                  }}>
                    <button
                      onClick={() => abrirGerenciar(item.nome)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                        padding: '9px 12px', background: 'rgba(26,86,255,0.08)',
                        border: 'none', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 600, color: C.blue,
                        cursor: 'pointer',
                      }}
                    >
                      <ListChecks size={14} />
                      Gerenciar cursos
                    </button>
                    <button
                      onClick={() => abrirModalCargo(item)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '6px',
                        padding: '9px 12px', background: 'none',
                        border: `1px solid ${C.border}`, borderRadius: '8px',
                        fontSize: '12px', fontWeight: 600, color: C.muted,
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé resumo */}
        {!carregando && cargosFiltrados.length > 0 && (
          <div style={{
            marginTop: '20px', padding: '12px 16px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '12px', color: C.muted }}>
              Mostrando <strong style={{ color: C.text }}>{cargosFiltrados.length}</strong> de {cargos.length} cargos
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              <strong style={{ color: '#10b981' }}>{comCurso}</strong> com curso vinculado
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              <strong style={{ color: '#f59e0b' }}>{cargos.length - comCurso}</strong> sem curso vinculado
            </span>
          </div>
        )}

      </div>

      {cargoAtivo && (
        <ModalGerenciar
          C={C}
          cargo={cargoAtivo}
          todosCursos={todosCursos}
          vinculados={vinculados}
          carregando={carregandoModal}
          onToggle={toggleCurso}
          onFechar={fecharGerenciar}
        />
      )}

      {modalCargo && (
        <ModalCargo
          C={C}
          cargoEditando={cargoEditando}
          nome={nomeCargo}
          setor={setorCargo}
          salvando={salvandoCargo}
          erro={erroCargo}
          onChangeNome={setNomeCargo}
          onChangeSetor={setSetorCargo}
          onSalvar={salvarCargo}
          onFechar={fecharModalCargo}
        />
      )}
    </LayoutAdmin>
  )
}
