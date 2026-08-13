import {
  GraduationCap, BookOpen, Users, Award,
  UserPlus, TrendingUp, Send, BarChart2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import { LayoutAdmin } from '../components/admin/LayoutAdmin'
import { useMetricasAdmin } from '../hooks/useMetricasAdmin'
import { useBreakpoint } from '../hooks/useMobile'
import { indicadoresAPI } from '../services/api'

const metricasBase = [
  { icon: BookOpen,      label: 'Total de Cursos',   cor: '#3b82f6' },
  { icon: BookOpen,      label: 'Cursos Ativos',     cor: '#1a56ff' },
  { icon: GraduationCap, label: 'Total de Alunos',   cor: '#10b981' },
  { icon: Users,         label: 'Alunos Ativos',     cor: '#059669' },
  { icon: Users,         label: 'Total de Turmas',   cor: '#8b5cf6' },
  { icon: Award,         label: 'Matrículas Ativas', cor: '#f59e0b' },
  { icon: TrendingUp,    label: 'Taxa de Conclusão', cor: '#ec4899' },
  { icon: TrendingUp,    label: 'Progresso Médio',   cor: '#0891b2' },
]


const acoes = [
  { icon: BookOpen,  label: 'Novo Curso',        desc: 'Criar um novo curso'        },
  { icon: Users,     label: 'Nova Turma',         desc: 'Criar uma nova turma'       },
  { icon: UserPlus,  label: 'Matricular Alunos',  desc: 'Matricular alunos em massa' },
  { icon: Send,      label: 'Enviar Notificação', desc: 'Enviar para os alunos'      },
  { icon: BarChart2, label: 'Relatórios',         desc: 'Gerar relatórios'           },
]


export function DashboardAdmin({ onNavigate, onLogout }: { onNavigate: (p: string) => void; onLogout: () => void }) {
  const { C } = useTheme()
  const m = useMetricasAdmin()
  const { isMobile, isTablet, cols } = useBreakpoint()

  // A série de admissões vive em /admin/indicadores (o dashboard usa
  // /admin/metricas), então é uma chamada extra — mas é a única série do
  // sistema com dispersão temporal real: data_admissao vem do RH.
  const [admissoes, setAdmissoes] = useState<{ mes: string; total: number }[]>([])
  useEffect(() => {
    indicadoresAPI.buscar()
      .then((d: any) => setAdmissoes(d?.admissoesPorMes ?? []))
      .catch(err => console.error('Erro ao carregar admissões:', err))
  }, [])
  const admissoesData = admissoes.map(a => ({ mes: a.mes, total: Number(a.total) }))

  const valoresMetricas = [
    m.cursos.total,
    m.cursos.ativos,
    m.alunos.total,
    m.alunos.ativos,
    m.turmas.total,
    m.matriculas.ativas,
    m.carregando ? '...' : `${m.taxaConclusao}%`,
    m.carregando ? '...' : `${m.progressoMedio}%`,
  ]

  const variacoes: (number | undefined)[] = [
    undefined,
    undefined,
    m.variacao?.alunos,
    m.variacao?.alunos,
    undefined,
    m.variacao?.matriculas,
    undefined,
    undefined,
  ]

  const metricas = metricasBase.map((base, i) => ({
    ...base,
    valor: m.carregando ? '...' : String(valoresMetricas[i]),
    variacao: variacoes[i],
  }))

  return (
    <LayoutAdmin
      paginaAtiva="admin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Olá, Administrador! 👋"
      topbarSubtitulo="Bem-vindo ao painel de gestão da Universidade Corporativa."
    >
      <div style={{ padding: isMobile ? '12px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

{/* ── MÉTRICAS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(2, 2, 4)}, 1fr)`, gap: '12px' }}>
            {metricas.map(mt => (
              <div key={mt.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${mt.cor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <mt.icon size={20} color={mt.cor} />
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: C.text, lineHeight: 1 }}>{mt.valor}</div>
                    <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{mt.label}</div>
                    {mt.variacao !== undefined && (
                      <div style={{ fontSize: '11px', fontWeight: 600, color: mt.variacao >= 0 ? '#16a34a' : '#dc2626', marginTop: '3px' }}>
                        {mt.variacao >= 0 ? '+' : ''}{mt.variacao}%
                        <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>vs. últimos 30 dias</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── LINHA 2: Gráfico + Atividades + Distribuição ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 320px' : '1fr 320px 280px', gap: '16px' }}>

            {/* Admissões — título diz o que o dado é. A série é de
                data_admissao (RH), não de matrícula nem de engajamento. */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '12px' }}>Admissões nos últimos 12 meses</div>
              {admissoesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={admissoesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: any) => [`${v} ${Number(v) === 1 ? 'admissão' : 'admissões'}`, '']}
                    />
                    <Line type="monotone" dataKey="total" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '13px' }}>
                  Sem dados de admissão no período
                </div>
              )}
            </div>

            {/* Atividades Recentes */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '12px' }}>Atividades Recentes</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {m.carregando ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: C.muted }}>Carregando...</div>
                ) : m.alunosRecentes.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: C.muted }}>Nenhuma atividade recente</div>
                ) : m.alunosRecentes.slice(0, 5).map((aluno: any) => (
                  <div key={aluno.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(26,86,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: C.blue, flexShrink: 0 }}>
                      {aluno.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>Novo aluno matriculado</div>
                      <div style={{ fontSize: '11px', color: C.muted, lineHeight: 1.4 }}>{aluno.nome} · {aluno.setor ?? aluno.cargo ?? '—'}</div>
                      <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{new Date(aluno.criado_em).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                      {new Date(aluno.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => onNavigate('notificacoesAdmin')}
                  style={{ width: '100%', marginTop: '12px', padding: '8px', background: 'transparent', border: 'none', color: '#1a56ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}
                >
                  Ver todas as atividades →
                </button>
              </div>
            </div>

            {/* Distribuição de Alunos */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '12px' }}>Distribuição de Alunos</div>
              <div style={{ position: 'relative', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.distribuicaoTurmas ?? []}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {(m.distribuicaoTurmas ?? []).map((t, i) => (
                        <Cell key={i} fill={t.cor} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: C.text }}>{m.alunos.ativos}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(m.distribuicaoTurmas ?? []).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: t.cor, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: '#475569' }}>{t.nome}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: C.text }}>{t.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── LINHA 3: Cursos + Taxa Conclusão + Status + Ações Rápidas ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 220px 220px 200px', gap: '16px' }}>

            {/* Cursos mais acessados */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>Cursos Mais Acessados</div>
                <span style={{ fontSize: '12px', color: C.blue, cursor: 'pointer' }}>Ver todos</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {m.carregando ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: C.muted }}>Carregando...</div>
                ) : m.cursosMaisAcessados.map((curso: any, idx: number) => (
                  <div key={curso.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: curso.cor ?? C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{idx + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: C.text, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{curso.titulo}</div>
                      <div style={{ background: 'rgba(26,86,255,0.12)', borderRadius: '4px', height: '4px' }}>
                        <div style={{ background: curso.cor ?? C.blue, height: '4px', borderRadius: '4px', width: `${Math.min(curso.progresso_medio ?? 0, 100)}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: C.muted, flexShrink: 0 }}>{curso.total_alunos} alunos</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Taxa de Conclusão */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '12px' }}>Taxa de Conclusão</div>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 12px' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(26,86,255,0.12)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={C.blue} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40 * (m.taxaConclusao / 100)} ${2 * Math.PI * 40 * (1 - m.taxaConclusao / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: C.text }}>{m.carregando ? '...' : `${m.taxaConclusao}%`}</div>
                  <div style={{ fontSize: '9px', color: C.muted }}>Taxa geral</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>⊙ Meta: 70%</div>
            </div>

            {/* Alunos por Status */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '14px' }}>Alunos por Status</div>
              {m.carregando ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: C.muted }}>Carregando...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Ativos',       valor: m.alunos.ativos,             cor: '#1a56ff', pct: m.alunos.total > 0 ? Math.round(m.alunos.ativos / m.alunos.total * 100) : 0 },
                    { label: 'Em andamento', valor: m.matriculas.ativas,          cor: '#3b82f6', pct: m.alunos.total > 0 ? Math.round(m.matriculas.ativas / m.alunos.total * 100) : 0 },
                    { label: 'Certificados', valor: m.certificados?.total ?? 0,   cor: '#10b981', pct: m.alunos.total > 0 ? Math.round((m.certificados?.total ?? 0) / m.alunos.total * 100) : 0 },
                    { label: 'Inativos',     valor: m.alunos.total - m.alunos.ativos, cor: '#8b5cf6', pct: m.alunos.total > 0 ? Math.round((m.alunos.total - m.alunos.ativos) / m.alunos.total * 100) : 0 },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: C.muted2 }}>{s.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{s.valor}</span>
                      </div>
                      <div style={{ background: 'rgba(26,86,255,0.08)', borderRadius: '4px', height: '4px' }}>
                        <div style={{ background: s.cor, height: '4px', borderRadius: '4px', width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '12px' }}>Ações Rápidas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: '📋 Importar Alunos',  page: 'alunosAdmin'        },
                  { label: '📚 Gerenciar Cursos', page: 'cursosAdmin'        },
                  { label: '🏆 Ver Certificados', page: 'certificadosAdmin'  },
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={() => onNavigate(a.page)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: C.text, textAlign: 'left', transition: 'all 150ms', fontFamily: 'inherit', width: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,86,255,0.06)'; e.currentTarget.style.borderColor = C.blue }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.borderColor = C.border }}
                  >
                    <span>{a.label}</span>
                    <span style={{ color: C.blue }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── CURSOS RECENTES + ALUNOS RECENTES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>

            {/* Cursos Recentes */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '14px' }}>Cursos Recentes</div>
              {m.carregando ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: C.muted }}>
                  Carregando...
                </div>
              ) : m.cursosRecentes.map((curso: any) => (
                <div key={curso.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: `1px solid ${C.border}`,
                }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>
                      {curso.titulo}
                    </p>
                    <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                      {curso.total_aulas} aulas ·{' '}
                      <span style={{
                        color: curso.status === 'ativo' ? '#10b981' :
                               curso.status === 'rascunho' ? '#f59e0b' : C.muted,
                        fontWeight: 600,
                      }}>
                        {curso.status === 'ativo' ? 'Publicado' :
                         curso.status === 'rascunho' ? 'Rascunho' : 'Arquivado'}
                      </span>
                    </p>
                  </div>
                  <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                    {new Date(curso.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>

            {/* Alunos Recentes */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '14px' }}>Alunos Recentes</div>
              {m.alunosRecentes.map((aluno: any) => (
                <div key={aluno.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 0', borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(26,86,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: C.blue, flexShrink: 0,
                  }}>
                    {aluno.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {aluno.nome}
                    </p>
                    <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                      {aluno.setor ?? aluno.cargo ?? '—'}
                    </p>
                  </div>
                  <p style={{ fontSize: '11px', color: C.muted, margin: 0, flexShrink: 0 }}>
                    {new Date(aluno.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* ── GERENCIAMENTO RÁPIDO ── */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '14px' }}>Gerenciamento Rápido</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(2, 3, 5)}, 1fr)`, gap: '12px' }}>
              {acoes.map(a => (
                <div key={a.label}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 150ms', textAlign: 'center' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(26,86,255,0.4)'
                    e.currentTarget.style.background = 'rgba(26,86,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border
                    e.currentTarget.style.background = C.surface2
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(26,86,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={20} color={C.blue} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{a.label}</div>
                    <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

      </div>
    </LayoutAdmin>
  )
}
