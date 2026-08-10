import { useState, useEffect, useCallback } from 'react'
import {
  Clock, AlertCircle, ChevronRight, ChevronLeft,
  RotateCcw, Check, X,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { ModalAvaliacao } from '../components/ModalAvaliacao'
import { provaAPI, avaliacaoAPI } from '../services/api'

interface Questao {
  id: string
  enunciado: string
  alternativas: Record<string, string>
  ordem: number
}

interface DetalheResposta {
  questao_id: string
  ordem: number
  resposta_aluno: string | null
  gabarito: string
  acertou: boolean
  explicacao: string
}

interface ResultadoProva {
  nota: number
  aprovado: boolean
  corretas: number
  total: number
  tentativa: number
  detalhe: DetalheResposta[]
  mensagem: string
  certificado: { codigo: string } | null
}

interface ProvaOnlineProps {
  cursoSlug: string
  cursoTitulo: string
  onNavigate: (page: string) => void
  onLogout: () => void
  onVoltarDetalhe: () => void
}

export function ProvaOnline({
  cursoSlug,
  cursoTitulo,
  onNavigate,
  onLogout,
  onVoltarDetalhe,
}: ProvaOnlineProps) {
  const { C } = useTheme()

  const [questoes, setQuestoes]           = useState<Questao[]>([])
  const [notaMinima, setNotaMinima]       = useState(70)
  const [carregando, setCarregando]       = useState(true)
  const [erro, setErro]                   = useState('')
  const [tentativasAnteriores, setTentativasAnteriores] = useState<any[]>([])

  const [iniciada, setIniciada]           = useState(false)
  const [questaoAtual, setQuestaoAtual]   = useState(0)
  const [respostas, setRespostas]         = useState<Record<string, string>>({})
  const [enviando, setEnviando]           = useState(false)
  const [resultado, setResultado]         = useState<ResultadoProva | null>(null)

  const [tempoRestante, setTempoRestante] = useState(30 * 60)
  const [timerAtivo, setTimerAtivo]       = useState(false)

  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false)

  // Só pergunta a quem foi aprovado, e só se o curso pedir avaliação e o aluno
  // ainda não tiver respondido nem dispensado (a checagem é do banco).
  useEffect(() => {
    if (!resultado?.aprovado) return
    avaliacaoAPI.status(cursoSlug)
      .then(s => { if (s.ativa && !s.ja_respondeu) setMostrarAvaliacao(true) })
      .catch(err => console.error('Erro ao consultar status da avaliação:', err))
  }, [resultado, cursoSlug])

  useEffect(() => {
    provaAPI.buscar(cursoSlug)
      .then((data: any) => {
        setQuestoes(data.questoes)
        setNotaMinima(data.curso.nota_minima)
        setTentativasAnteriores(data.tentativas ?? [])
        setCarregando(false)
      })
      .catch(() => {
        setErro('Não foi possível carregar a prova. Tente novamente.')
        setCarregando(false)
      })
  }, [cursoSlug])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const submeterProva = useCallback(async () => {
    setTimerAtivo(false)
    setEnviando(true)
    try {
      const data = await provaAPI.submeter(cursoSlug, respostas) as ResultadoProva
      setResultado(data)
      setIniciada(false)
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao enviar prova.')
    } finally {
      setEnviando(false)
    }
  }, [cursoSlug, respostas])

  useEffect(() => {
    if (!timerAtivo || tempoRestante <= 0) return
    const interval = setInterval(() => {
      setTempoRestante(t => {
        if (t <= 1) {
          clearInterval(interval)
          submeterProva()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerAtivo, submeterProva, tempoRestante])

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const iniciarProva = () => {
    setIniciada(true)
    setTimerAtivo(true)
    setTempoRestante(30 * 60)
    setQuestaoAtual(0)
    setRespostas({})
    setResultado(null)
  }

  const responder = (questaoId: string, letra: string) => {
    setRespostas(prev => ({ ...prev, [questaoId]: letra }))
  }

  const questao = questoes[questaoAtual]
  const totalRespondidas = Object.keys(respostas).length
  const timerCritico     = tempoRestante < 5 * 60

  // ── LOADING ──
  if (carregando) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, display: 'flex', height: '100vh' }}>
        <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: C.muted }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p>Carregando prova...</p>
          </div>
        </main>
      </div>
    )
  }

  // ── ERRO ──
  if (erro) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, display: 'flex', height: '100vh' }}>
        <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', color: C.text, marginBottom: '16px' }}>{erro}</p>
            <button onClick={onVoltarDetalhe}
              style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              Voltar ao curso
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── RESULTADO ──
  if (resultado) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar titulo="Meus Cursos" subtitulo="Avaliações e provas" onNavigate={onNavigate} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '720px' }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{
                  padding: '32px',
                  background: resultado.aprovado
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                  borderBottom: `1px solid ${C.border}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '12px' }}>
                    {resultado.aprovado ? '🏆' : '📝'}
                  </div>
                  <h2 style={{
                    fontSize: '24px', fontWeight: 800,
                    color: resultado.aprovado ? '#10b981' : '#ef4444',
                    margin: '0 0 8px',
                  }}>
                    {resultado.aprovado ? 'Aprovado!' : 'Não foi dessa vez'}
                  </h2>
                  <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
                    {resultado.mensagem}
                  </p>
                </div>

                <div style={{ padding: '24px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '56px', fontWeight: 800, color: resultado.aprovado ? '#10b981' : '#ef4444' }}>
                      {resultado.nota}%
                    </div>
                    <p style={{ fontSize: '13px', color: C.muted, margin: '4px 0 0' }}>
                      {resultado.corretas} de {resultado.total} questões corretas
                      · Tentativa {resultado.tentativa}/3
                    </p>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
                    Gabarito detalhado
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {resultado.detalhe.map(d => (
                      <div key={d.questao_id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '12px',
                        background: d.acertou ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${d.acertou ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        borderRadius: '10px',
                      }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                          background: d.acertou ? '#10b981' : '#ef4444',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {d.acertou
                            ? <Check size={12} color="#fff" />
                            : <X size={12} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
                            Questão {d.ordem}
                            {!d.acertou && (
                              <span style={{ color: '#ef4444', marginLeft: '8px' }}>
                                Sua resposta: {d.resposta_aluno ?? '—'} · Correta: {d.gabarito}
                              </span>
                            )}
                          </p>
                          <p style={{ fontSize: '11px', color: C.muted, margin: 0, lineHeight: 1.5 }}>
                            {d.explicacao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {!resultado.aprovado && resultado.tentativa < 3 && (
                      <button onClick={iniciarProva}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'none', border: `1.5px solid ${C.blue}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: C.blue, cursor: 'pointer' }}>
                        <RotateCcw size={14} /> Tentar novamente
                      </button>
                    )}
                    <button onClick={onVoltarDetalhe}
                      style={{ padding: '10px 24px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Voltar ao curso
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {mostrarAvaliacao && (
          <ModalAvaliacao
            cursoSlug={cursoSlug}
            cursoTitulo={cursoTitulo}
            onFechar={() => setMostrarAvaliacao(false)}
          />
        )}
      </div>
    )
  }

  // ── TELA INICIAL ──
  if (!iniciada) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar titulo="Prova Online" subtitulo="Configurações da avaliação" onNavigate={onNavigate} />
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', maxWidth: '560px', width: '100%', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: C.blue }} />
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>📝</div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                  Avaliação Final
                </h2>
                <p style={{ fontSize: '14px', color: C.blue, fontWeight: 600, margin: '0 0 20px' }}>
                  {cursoTitulo}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Questões',  valor: `${questoes.length}` },
                    { label: 'Tempo',     valor: '30 min'             },
                    { label: 'Aprovação', valor: `${notaMinima}%`     },
                  ].map(i => (
                    <div key={i.label} style={{ background: C.surface2, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: C.blue }}>{i.valor}</div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{i.label}</div>
                    </div>
                  ))}
                </div>

                {tentativasAnteriores.length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', textAlign: 'left' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', margin: '0 0 6px' }}>
                      Tentativas anteriores ({tentativasAnteriores.length}/3):
                    </p>
                    {tentativasAnteriores.map((t: any, i: number) => (
                      <p key={i} style={{ fontSize: '12px', color: C.muted, margin: '2px 0' }}>
                        Tentativa {t.tentativa}: {t.nota}% — {t.aprovado ? '✅ Aprovado' : '❌ Reprovado'}
                      </p>
                    ))}
                  </div>
                )}

                {tentativasAnteriores.length >= 3 ? (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, fontWeight: 600 }}>
                      Número máximo de tentativas atingido (3/3).
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={iniciarProva}
                    style={{ width: '100%', padding: '14px', background: C.blue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px rgba(26,86,255,0.30)` }}
                  >
                    {tentativasAnteriores.length > 0 ? 'Tentar novamente →' : 'Iniciar avaliação →'}
                  </button>
                )}

                <button onClick={onVoltarDetalhe}
                  style={{ marginTop: '12px', background: 'none', border: 'none', fontSize: '13px', color: C.muted, cursor: 'pointer', textDecoration: 'underline' }}>
                  Voltar ao curso
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── PROVA EM ANDAMENTO ──
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar titulo="Prova em Andamento" subtitulo="Responda com atenção" onNavigate={onNavigate} />

        {/* Barra de progresso e timer */}
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '12px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>
              Questão {questaoAtual + 1} de {questoes.length}
              <span style={{ color: C.muted, fontWeight: 400, marginLeft: '8px' }}>
                ({totalRespondidas} respondidas)
              </span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: timerCritico ? '#ef4444' : C.text }}>
              <Clock size={16} color={timerCritico ? '#ef4444' : C.muted} />
              <span style={{ fontSize: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {formatarTempo(tempoRestante)}
              </span>
            </div>
          </div>
          <div style={{ background: C.surface2, borderRadius: '4px', height: '6px' }}>
            <div style={{
              background: C.blue, height: '6px', borderRadius: '4px',
              width: `${((questaoAtual + 1) / questoes.length) * 100}%`,
              transition: 'width 300ms',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {questoes.map((q, i) => (
              <div
                key={q.id}
                onClick={() => setQuestaoAtual(i)}
                style={{
                  width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === questaoAtual
                    ? C.blue
                    : respostas[q.id]
                    ? 'rgba(16,185,129,0.20)'
                    : C.surface2,
                  color: i === questaoAtual ? '#fff' : respostas[q.id] ? '#10b981' : C.muted,
                  border: `1px solid ${i === questaoAtual ? C.blue : respostas[q.id] ? 'rgba(16,185,129,0.40)' : C.border}`,
                  transition: 'all 150ms',
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Questão */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          {questao && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', width: '100%', maxWidth: '680px', padding: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
                Questão {questao.ordem}
              </p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: C.text, margin: '0 0 24px', lineHeight: 1.6 }}>
                {questao.enunciado}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {Object.entries(questao.alternativas).map(([letra, texto]) => {
                  const selecionada = respostas[questao.id] === letra
                  return (
                    <button
                      key={letra}
                      onClick={() => responder(questao.id, letra)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', borderRadius: '10px', textAlign: 'left',
                        border: `2px solid ${selecionada ? C.blue : C.border}`,
                        background: selecionada ? 'rgba(26,86,255,0.08)' : C.surface2,
                        cursor: 'pointer', transition: 'all 150ms',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: selecionada ? C.blue : C.surface,
                        border: `2px solid ${selecionada ? C.blue : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700,
                        color: selecionada ? '#fff' : C.muted,
                      }}>
                        {letra}
                      </div>
                      <span style={{ fontSize: '14px', color: C.text, fontWeight: selecionada ? 600 : 400, lineHeight: 1.4 }}>
                        {texto}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setQuestaoAtual(q => Math.max(0, q - 1))}
                  disabled={questaoAtual === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: questaoAtual === 0 ? C.muted : C.text, cursor: questaoAtual === 0 ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>

                {questaoAtual < questoes.length - 1 ? (
                  <button
                    onClick={() => setQuestaoAtual(q => q + 1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                  >
                    Próxima <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={submeterProva}
                    disabled={enviando || totalRespondidas < questoes.length}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '10px 20px',
                      background: totalRespondidas >= questoes.length ? '#10b981' : C.border,
                      border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff',
                      cursor: totalRespondidas >= questoes.length ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {enviando ? 'Enviando...' : `Finalizar (${totalRespondidas}/${questoes.length})`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
