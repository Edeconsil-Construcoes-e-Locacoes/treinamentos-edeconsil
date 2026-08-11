import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { usuariosAPI } from '../../services/api'

const AZUL    = '#0d2550'
const AMARELO = '#F5C400'
const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')

interface CursoDossie {
  id: string
  titulo: string
  carga_horaria: number | null
  total_aulas_real: number
  aulas_concluidas: number
  progresso_usuario: number
  nota_obtida: number | null
  aprovado: boolean | null
}

interface CertificadoDossie {
  codigo: string
  curso_titulo: string
  data_emissao: string
  data_validade: string | null
  nota_obtida: number | null
}

interface ProvaDossie {
  curso_titulo: string
  nota: number
  aprovado: boolean
  tentativa: number
  realizado_em: string
}

interface Dossie {
  aluno: Record<string, any>
  cursos: CursoDossie[]
  certificados: CertificadoDossie[]
  provas: ProvaDossie[]
  resumo: {
    cursos_concluidos: number
    total_certificados: number
    media_notas: number | null
  }
}

interface ModalDossieProps {
  aluno: { id: string; nome: string; [k: string]: any }
  onFechar: () => void
}

const dataBR = (v: string | null) =>
  v ? new Date(v.length <= 10 ? v + 'T00:00:00' : v).toLocaleDateString('pt-BR') : '—'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { C } = useTheme()
  return (
    <div style={{ marginBottom: '22px' }}>
      <h3 style={{
        fontSize: '11px', fontWeight: 700, color: C.muted, margin: '0 0 10px',
        textTransform: 'uppercase', letterSpacing: '0.6px',
      }}>
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function Vazio({ texto }: { texto: string }) {
  const { C } = useTheme()
  return (
    <div style={{
      padding: '18px', textAlign: 'center', fontSize: '12px', color: C.muted,
      background: C.surface2, border: `1px dashed ${C.border}`, borderRadius: '10px',
    }}>
      {texto}
    </div>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  const { C } = useTheme()
  return (
    <div>
      <p style={{ fontSize: '10px', color: C.muted, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {rotulo}
      </p>
      <p style={{ fontSize: '12px', fontWeight: 600, color: C.text, margin: 0 }}>{valor || '—'}</p>
    </div>
  )
}

export function ModalDossie({ aluno, onFechar }: ModalDossieProps) {
  const { C } = useTheme()

  const [dados, setDados]           = useState<Dossie | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState('')

  useEffect(() => {
    usuariosAPI.dossie(aluno.id)
      .then(d => setDados(d as Dossie))
      .catch(err => {
        console.error('Erro ao carregar dossiê:', err)
        setErro('Não foi possível carregar o dossiê deste colaborador.')
      })
      .finally(() => setCarregando(false))
  }, [aluno.id])

  // Provas agrupadas por curso para virar "1ª: 60% ❌ · 2ª: 85% ✅".
  const provasPorCurso = (dados?.provas ?? []).reduce((acc, p) => {
    (acc[p.curso_titulo] ||= []).push(p)
    return acc
  }, {} as Record<string, ProvaDossie[]>)

  const statusCurso = (c: CursoDossie) => {
    if (c.aprovado === true) return { texto: 'Concluído',     cor: '#10b981' }
    if (c.progresso_usuario > 0) return { texto: 'Em andamento', cor: AMARELO }
    return { texto: 'Não iniciado', cor: C.muted }
  }

  return (
    <>
      <div style={{
        padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '14px',
        position: 'sticky', top: 0, background: C.surface, zIndex: 1,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: AZUL, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 700, color: '#fff',
        }}>
          {dados?.aluno?.foto_url
            ? <img src={`${BACKEND_URL}${dados.aluno.foto_url}`} alt={aluno.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : aluno.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
            {aluno.nome}
          </h2>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>
            Dossiê do colaborador · somente leitura
          </p>
        </div>
        <button
          onClick={onFechar}
          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {carregando ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
            Carregando dossiê...
          </div>
        ) : erro ? (
          <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
            {erro}
          </div>
        ) : dados && (
          <>
            <Secao titulo="Dados cadastrais">
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px', padding: '14px 16px', background: C.surface2,
                border: `1px solid ${C.border}`, borderRadius: '10px',
              }}>
                <Campo rotulo="Cargo"     valor={dados.aluno.cargo} />
                <Campo rotulo="Setor"     valor={dados.aluno.setor} />
                <Campo rotulo="Turma"     valor={dados.aluno.turma_nome ?? dados.aluno.cargo_grupo} />
                <Campo rotulo="Matrícula" valor={dados.aluno.matricula} />
                <Campo rotulo="Admissão"  valor={dataBR(dados.aluno.data_admissao)} />
                <Campo rotulo="Status"    valor={dados.aluno.status === 'ativo' ? 'Ativo' : 'Inativo'} />
                <Campo rotulo="E-mail"    valor={dados.aluno.email} />
                {dados.aluno.origem && dados.aluno.origem !== 'Empregado' && (
                  <Campo
                    rotulo="Origem"
                    valor={dados.aluno.origem + (dados.aluno.empresa_terceiro ? ` · ${dados.aluno.empresa_terceiro}` : '')}
                  />
                )}
              </div>
            </Secao>

            <Secao titulo="Resumo">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { rot: 'Cursos concluídos', val: String(dados.resumo.cursos_concluidos), cor: '#10b981' },
                  { rot: 'Certificados',      val: String(dados.resumo.total_certificados), cor: AZUL },
                  // media_notas vem null quando não há prova aprovada.
                  { rot: 'Média das notas',   val: dados.resumo.media_notas === null ? '—' : `${dados.resumo.media_notas}%`, cor: AMARELO },
                ].map(k => (
                  <div key={k.rot} style={{ flex: 1, minWidth: '110px', padding: '12px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                    <p style={{ fontSize: '10px', color: C.muted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{k.rot}</p>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: k.cor, margin: 0 }}>{k.val}</p>
                  </div>
                ))}
              </div>
            </Secao>

            <Secao titulo={`Cursos (${dados.cursos.length})`}>
              {dados.cursos.length === 0 ? (
                <Vazio texto="Nenhum curso atribuído a este colaborador" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dados.cursos.map(c => {
                    const st = statusCurso(c)
                    return (
                      <div key={c.id} style={{ padding: '12px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{c.titulo}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: st.cor, background: `${st.cor}18`, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>
                            {st.texto}
                          </span>
                        </div>
                        <div style={{ height: '6px', background: C.border, borderRadius: '20px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ width: `${c.progresso_usuario}%`, height: '100%', background: st.cor, transition: 'width 200ms' }} />
                        </div>
                        <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                          {c.aulas_concluidas}/{c.total_aulas_real} aulas · {c.progresso_usuario}%
                          {c.nota_obtida !== null && ` · Nota ${c.nota_obtida}%`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Secao>

            <Secao titulo={`Certificados (${dados.certificados.length})`}>
              {dados.certificados.length === 0 ? (
                <Vazio texto="Nenhum certificado emitido" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dados.certificados.map(cert => (
                    <div key={cert.codigo} style={{ padding: '12px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 3px' }}>{cert.curso_titulo}</p>
                      <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: 'monospace' }}>{cert.codigo}</p>
                      <p style={{ fontSize: '11px', color: C.muted, margin: '3px 0 0' }}>
                        Emitido em {dataBR(cert.data_emissao)} · Válido até {dataBR(cert.data_validade)}
                        {cert.nota_obtida !== null && ` · Nota ${cert.nota_obtida}%`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Secao>

            <Secao titulo={`Provas (${dados.provas.length})`}>
              {dados.provas.length === 0 ? (
                <Vazio texto="Nenhuma prova realizada" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(provasPorCurso).map(([curso, tentativas]) => (
                    <div key={curso} style={{ padding: '12px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 6px' }}>{curso}</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {tentativas.map(t => (
                          <span key={t.tentativa} style={{ fontSize: '11px', color: C.muted2 }}>
                            {t.tentativa}ª tentativa: <strong style={{ color: t.aprovado ? '#10b981' : '#ef4444' }}>
                              {t.nota}% {t.aprovado ? '✅' : '❌'}
                            </strong>
                            <span style={{ color: C.muted }}> · {dataBR(t.realizado_em)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Secao>
          </>
        )}
      </div>
    </>
  )
}
