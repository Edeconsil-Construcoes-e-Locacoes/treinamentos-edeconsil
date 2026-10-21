import { useState, useEffect, useCallback } from 'react'
import { Megaphone, Plus, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { avisosAPI, turmasAPI, instrutorAPI } from '../services/api'

interface AvisosPainelProps {
  modo: 'admin' | 'instrutor'
  abrirFormularioAoCarregar?: boolean
}

const ASSUNTOS = [
  { value: 'aulas',         label: 'Aulas'          },
  { value: 'cursos',        label: 'Cursos'         },
  { value: 'turmas',        label: 'Turmas'         },
  { value: 'certificacoes', label: 'Certificações'  },
]

const MAX_TITULO   = 255
const MAX_MENSAGEM = 1000

export function AvisosPainel({ modo, abrirFormularioAoCarregar }: AvisosPainelProps) {
  const { C } = useTheme()

  const [avisos,       setAvisos]       = useState<any[]>([])
  const [carregando,   setCarregando]   = useState(true)
  const [erroLista,    setErroLista]    = useState('')
  const [sucesso,      setSucesso]      = useState('')

  const [aberto,       setAberto]       = useState(false)
  const [destino,      setDestino]      = useState<'todos' | 'turma'>('todos')
  const [turmas,       setTurmas]       = useState<any[]>([])
  const [turmaId,      setTurmaId]      = useState('')
  // undefined = carregando; null = instrutor sem turma
  const [minhaTurma,   setMinhaTurma]   = useState<any | null | undefined>(undefined)
  const [assunto,      setAssunto]      = useState('')
  const [titulo,       setTitulo]       = useState('')
  const [mensagem,     setMensagem]     = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const [erroEnvio,    setErroEnvio]    = useState('')

  const carregarLista = useCallback(async () => {
    setCarregando(true)
    setErroLista('')
    try {
      const data = await avisosAPI.enviados()
      setAvisos(data.avisos ?? [])
    } catch (err) {
      console.error('Erro ao carregar avisos enviados:', err)
      setErroLista(err instanceof Error ? err.message : 'Erro ao carregar avisos enviados.')
    } finally {
      setCarregando(false)
    }
  }, [])

  const abrirFormulario = useCallback(async () => {
    setDestino('todos')
    setTurmaId('')
    setAssunto('')
    setTitulo('')
    setMensagem('')
    setErroEnvio('')
    setSucesso('')
    setAberto(true)
    try {
      if (modo === 'admin') {
        const lista = await turmasAPI.listar()
        setTurmas(Array.isArray(lista) ? lista : [])
      } else {
        setMinhaTurma(undefined)
        const t = await instrutorAPI.minhaTurma()
        setMinhaTurma(t ?? null)
      }
    } catch (err) {
      console.error('Erro ao carregar destinos do aviso:', err)
      setErroEnvio(err instanceof Error ? err.message : 'Erro ao carregar turmas.')
      if (modo === 'instrutor') setMinhaTurma(null)
    }
  }, [modo])

  useEffect(() => { carregarLista() }, [carregarLista])

  // Abre o formulario uma unica vez ao montar (vindo do Dashboard).
  useEffect(() => {
    if (abrirFormularioAoCarregar) abrirFormulario()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const semTurmaInstrutor = modo === 'instrutor' && minhaTurma === null

  const enviar = async () => {
    if (enviando) return
    setErroEnvio('')
    if (modo === 'admin' && destino === 'turma' && !turmaId) { setErroEnvio('Selecione a turma.'); return }
    if (modo === 'instrutor' && !minhaTurma)                   { setErroEnvio('Você não está vinculado a nenhuma turma.'); return }
    if (!assunto)           { setErroEnvio('Escolha o assunto.'); return }
    if (!titulo.trim())     { setErroEnvio('Informe o título.'); return }
    if (!mensagem.trim())   { setErroEnvio('Informe a mensagem.'); return }
    if (modo === 'admin' && destino === 'todos'
        && !window.confirm('Enviar este aviso para todos os colaboradores ativos?')) return

    setEnviando(true)
    try {
      const r = await avisosAPI.enviar({
        titulo: titulo.trim(), mensagem: mensagem.trim(), assunto,
        ...(modo === 'admin' ? { destino, turma_id: destino === 'turma' ? turmaId : null } : {}),
      })
      setAberto(false)
      setSucesso(`Aviso enviado para ${r.enviados} colaborador${r.enviados !== 1 ? 'es' : ''}.`)
      carregarLista()
    } catch (err) {
      console.error('Erro ao enviar aviso:', err)
      setErroEnvio(err instanceof Error ? err.message : 'Erro ao enviar aviso.')
    } finally {
      setEnviando(false)
    }
  }

  const campo = {
    width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px',
    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px',
    fontSize: '13px', color: C.text, fontFamily: "'Inter',sans-serif", outline: 'none',
  }
  const rotulo = { display: 'block', fontSize: '12px', fontWeight: 600, color: C.muted, marginBottom: '6px' }

  const linkInfo = assunto === 'certificacoes' ? 'Meus Certificados' : 'Meus Cursos'
  const nomeAssunto = (v: string) => ASSUNTOS.find(a => a.value === v)?.label ?? v

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={16} color="#F5C400" /> Avisos enviados
          </h2>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>
            {modo === 'admin' ? 'Avisos para todos os colaboradores ou para uma turma.' : 'Avisos para a sua turma.'}
          </p>
        </div>
        <button
          onClick={abrirFormulario}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#0d2550', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
        >
          <Plus size={14} /> Novo aviso
        </button>
      </div>

      {sucesso && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
          {sucesso}
        </div>
      )}

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        {carregando ? (
          <div style={{ padding: '20px', fontSize: '13px', color: C.muted }}>Carregando…</div>
        ) : erroLista ? (
          <div style={{ padding: '20px', fontSize: '13px', color: '#ef4444' }}>{erroLista}</div>
        ) : avisos.length === 0 ? (
          <div style={{ padding: '20px', fontSize: '13px', color: C.muted }}>Nenhum aviso enviado ainda.</div>
        ) : (
          avisos.map((a, idx) => (
            <div key={a.envio_id ?? idx} style={{ padding: '12px 16px', borderBottom: idx < avisos.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{a.titulo}</div>
                <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                  {nomeAssunto(a.assunto)} · {a.destino === 'turma' ? (a.turma_nome ?? 'Turma') : 'Todos'}
                  {modo === 'admin' && a.remetente_nome ? ` · ${a.remetente_nome}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: C.muted }}>
                <div>{a.enviado_em ? new Date(a.enviado_em).toLocaleString('pt-BR') : '—'}</div>
                <div style={{ marginTop: '2px', color: C.text, fontWeight: 600 }}>{a.lidas} de {a.destinatarios} leram</div>
              </div>
            </div>
          ))
        )}
      </div>

      {aberto && (
        <div
          onClick={() => { if (!enviando) setAberto(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '22px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>Novo aviso</h3>
              <button onClick={() => setAberto(false)} disabled={enviando} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} color={C.muted} />
              </button>
            </div>

            {/* Destino */}
            {modo === 'admin' ? (
              <div style={{ marginBottom: '16px' }}>
                <span style={rotulo}>Destino</span>
                <div style={{ display: 'flex', gap: '8px', marginBottom: destino === 'turma' ? '10px' : 0 }}>
                  {([['todos', 'Todos os colaboradores'], ['turma', 'Uma turma']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setDestino(v)}
                      style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                        border: `1px solid ${destino === v ? '#0d2550' : C.border}`,
                        background: destino === v ? '#0d2550' : C.surface2,
                        color: destino === v ? '#fff' : C.text }}>
                      {l}
                    </button>
                  ))}
                </div>
                {destino === 'turma' && (
                  <select value={turmaId} onChange={e => setTurmaId(e.target.value)} style={campo}>
                    <option value="">Selecione a turma…</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '16px', fontSize: '13px', color: semTurmaInstrutor ? '#ef4444' : C.text }}>
                {minhaTurma === undefined
                  ? 'Carregando sua turma…'
                  : minhaTurma
                    ? <>Destino: sua turma — <strong>{minhaTurma.nome}</strong></>
                    : 'Você não está vinculado a nenhuma turma. Fale com o RH.'}
              </div>
            )}

            {/* Assunto */}
            <div style={{ marginBottom: '16px' }}>
              <span style={rotulo}>Assunto</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ASSUNTOS.map(a => (
                  <button key={a.value} onClick={() => setAssunto(a.value)}
                    style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                      border: `1px solid ${assunto === a.value ? '#F5C400' : C.border}`,
                      background: assunto === a.value ? 'rgba(245,196,0,0.18)' : C.surface2,
                      color: C.text }}>
                    {a.label}
                  </button>
                ))}
              </div>
              {assunto && (
                <p style={{ fontSize: '11px', color: C.muted, margin: '8px 0 0' }}>
                  Ao clicar no aviso, o aluno será levado para: {linkInfo}
                </p>
              )}
            </div>

            {/* Título */}
            <div style={{ marginBottom: '16px' }}>
              <label style={rotulo}>Título</label>
              <input value={titulo} maxLength={MAX_TITULO} onChange={e => setTitulo(e.target.value)} style={campo} />
            </div>

            {/* Mensagem */}
            <div style={{ marginBottom: '16px' }}>
              <label style={rotulo}>Mensagem</label>
              <textarea value={mensagem} maxLength={MAX_MENSAGEM} rows={5} onChange={e => setMensagem(e.target.value)} style={{ ...campo, resize: 'vertical' }} />
              <div style={{ textAlign: 'right', fontSize: '11px', color: C.muted, marginTop: '4px' }}>{mensagem.length}/{MAX_MENSAGEM}</div>
            </div>

            {erroEnvio && (
              <div style={{ marginBottom: '14px', fontSize: '13px', color: '#ef4444' }}>{erroEnvio}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setAberto(false)} disabled={enviando}
                style={{ padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.muted, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Cancelar
              </button>
              <button onClick={enviar} disabled={enviando || semTurmaInstrutor || minhaTurma === undefined && modo === 'instrutor'}
                style={{ padding: '9px 18px', background: '#0d2550', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'Inter',sans-serif",
                  cursor: enviando || semTurmaInstrutor ? 'not-allowed' : 'pointer',
                  opacity: enviando || semTurmaInstrutor ? 0.6 : 1 }}>
                {enviando ? 'Enviando…' : 'Enviar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
