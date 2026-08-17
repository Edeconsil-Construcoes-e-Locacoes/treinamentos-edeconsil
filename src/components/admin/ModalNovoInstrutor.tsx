import { useState, useEffect, useMemo } from 'react'
import { Search, AlertTriangle, Check } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { usuariosAPI, turmasAPI, instrutoresAPI } from '../../services/api'
import { EditarInstrutor } from '../../pages/admin/EditarInstrutor'

const AZUL = '#0d2550'

interface Colaborador {
  id: string
  nome: string
  cpf: string | null
  cargo: string | null
  data_nascimento: string | null
}

interface ModalNovoInstrutorProps {
  onFechar: () => void
  /** Recebe o aviso de turma reatribuída, quando houver. */
  onSucesso: (avisoTurma?: string | null) => void
}

const soDigitos = (v: string) => v.replace(/\D/g, '')

const formatarCpf = (cpf: string | null) =>
  cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'

export function ModalNovoInstrutor({ onFechar, onSucesso }: ModalNovoInstrutorProps) {
  const { C } = useTheme()

  const [aba, setAba] = useState<'promover' | 'externo'>('promover')

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando]       = useState(true)
  const [busca, setBusca]                 = useState('')
  const [selecionado, setSelecionado]     = useState<Colaborador | null>(null)

  const [turmas, setTurmas]             = useState<any[]>([])
  const [especialidade, setEspecialidade] = useState('')
  const [telefone, setTelefone]         = useState('')
  const [bio, setBio]                   = useState('')

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  useEffect(() => {
    usuariosAPI.listar({ perfil: 'colaborador', limite: '500' })
      .then((resp: any) => {
        const lista = Array.isArray(resp) ? resp : (resp?.usuarios ?? [])
        setColaboradores(lista)
      })
      .catch(err => {
        console.error('Erro ao carregar colaboradores:', err)
        setErro('Não foi possível carregar a lista de colaboradores.')
      })
      .finally(() => setCarregando(false))

    turmasAPI.listar()
      .then((lista: any) => setTurmas((lista as any[]).filter(t => t.status === 'ativa')))
      .catch(err => console.error('Erro ao carregar turmas:', err))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return colaboradores
    const termoDigitos = soDigitos(termo)
    return colaboradores.filter(c =>
      c.nome?.toLowerCase().includes(termo) ||
      (termoDigitos && (c.cpf ?? '').includes(termoDigitos))
    )
  }, [colaboradores, busca])

  const promover = async () => {
    if (!selecionado || !especialidade) return
    setSalvando(true)
    setErro('')
    try {
      const res = await instrutoresAPI.promover({
        usuario_id: selecionado.id,
        especialidade,
        telefone: telefone || undefined,
        bio:      bio      || undefined,
      })
      onSucesso(res?.turma_transferida_de ?? null)
    } catch (e: any) {
      console.error('Erro ao promover:', e)
      setErro(e?.message ?? 'Erro ao promover colaborador.')
    } finally {
      setSalvando(false)
    }
  }

  const abaStyle = (ativa: boolean) => ({
    flex: 1, padding: '10px 12px', background: 'none', border: 'none',
    borderBottom: ativa ? `2px solid ${C.blue}` : '2px solid transparent',
    color: ativa ? C.blue : C.muted, fontSize: '13px',
    fontWeight: ativa ? 700 : 400, cursor: 'pointer',
    fontFamily: "'Inter',sans-serif",
  })

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const, background: C.inputBg,
    border: `1px solid ${C.border}`, borderRadius: '8px', padding: '9px 12px',
    fontSize: '13px', color: C.text,
  }

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        <button style={abaStyle(aba === 'promover')} onClick={() => setAba('promover')}>
          Promover colaborador
        </button>
        <button style={abaStyle(aba === 'externo')} onClick={() => setAba('externo')}>
          Instrutor externo
        </button>
      </div>

      {aba === 'externo' ? (
        <>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0, padding: '12px 24px 0' }}>
            Para quem <strong>não é colaborador</strong> da Edeconsil (consultor, parceiro).
            Se a pessoa já está cadastrada como aluno, use a aba anterior.
          </p>
          <EditarInstrutor onFechar={onFechar} onSucesso={() => onSucesso(null)} />
        </>
      ) : (
        <div style={{ padding: '20px 24px' }}>

          {erro && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>
              {erro}
            </div>
          )}

          {!selecionado ? (
            <>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou CPF..."
                  style={{ ...inputStyle, paddingLeft: '32px' }}
                />
              </div>

              {carregando ? (
                <div style={{ padding: '30px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                  Carregando colaboradores...
                </div>
              ) : filtrados.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                  Nenhum colaborador encontrado
                </div>
              ) : (
                <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filtrados.map(c => {
                    // Sem data de nascimento não há senha (ela É a senha), então
                    // o promovido não conseguiria entrar no painel novo.
                    const podePromover = !!c.data_nascimento
                    return (
                      <div
                        key={c.id}
                        onClick={() => podePromover && setSelecionado(c)}
                        title={podePromover ? undefined : 'Sem data de nascimento'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', borderRadius: '8px',
                          background: C.surface2, border: `1px solid ${C.border}`,
                          cursor: podePromover ? 'pointer' : 'not-allowed',
                          opacity: podePromover ? 1 : 0.55,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{c.nome}</div>
                          <div style={{ fontSize: '11px', color: C.muted }}>
                            {c.cargo ?? '—'} · {formatarCpf(c.cpf)}
                          </div>
                          {!podePromover && (
                            <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={11} />
                              sem data de nascimento — preencha no cadastro do aluno antes
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ padding: '12px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{selecionado.nome}</div>
                    <div style={{ fontSize: '11px', color: C.muted }}>
                      {selecionado.cargo ?? '—'} · {formatarCpf(selecionado.cpf)}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelecionado(null); setErro('') }}
                    style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: C.muted, cursor: 'pointer' }}
                  >
                    Trocar
                  </button>
                </div>
              </div>

              <label style={{ fontSize: '12px', fontWeight: 600, color: C.text, display: 'block', marginBottom: '5px' }}>
                Especialidade <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', marginBottom: '4px' }}
              >
                <option value="">Selecione a especialidade...</option>
                {/* value = cargo_grupo: é por ele que o backend acha a turma. */}
                {turmas.map((t: any) => (
                  <option key={t.id} value={t.cargo_grupo || t.nome}>
                    {t.cargo_grupo || t.nome}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 14px' }}>
                Define a turma do instrutor — sem ela, o painel dele abre vazio.
              </p>

              <label style={{ fontSize: '12px', fontWeight: 600, color: C.text, display: 'block', marginBottom: '5px' }}>
                Telefone
              </label>
              <input value={telefone} onChange={e => setTelefone(e.target.value)}
                placeholder="(98) 90000-0000" style={{ ...inputStyle, marginBottom: '14px' }} />

              <label style={{ fontSize: '12px', fontWeight: 600, color: C.text, display: 'block', marginBottom: '5px' }}>
                Bio
              </label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder="Breve descrição (opcional)"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Inter',sans-serif", marginBottom: '18px' }} />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={onFechar}
                  style={{ padding: '10px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.muted, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  onClick={promover}
                  disabled={!especialidade || salvando}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: !especialidade || salvando ? C.surface2 : AZUL,
                    color: !especialidade || salvando ? C.muted : '#fff',
                    fontSize: '13px', fontWeight: 700,
                    cursor: !especialidade || salvando ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Check size={14} /> {salvando ? 'Promovendo...' : 'Promover a Instrutor'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
