import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  ChevronRight, ChevronDown, Filter, Calendar,
  AlertTriangle, TrendingUp
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { indicadoresAPI } from '../../services/api'
import { BarraProgresso } from '../../components/BarraProgresso'

export function IndicadoresAdmin({ onNavigate, onLogout }: {
  onNavigate: (page: string) => void
  onLogout: () => void
}) {
  const { C } = useTheme()
  const [abaCursos, setAbaCursos] = useState<'historico' | 'disponiveis' | 'certificados' | 'individual'>('historico')
  const [periodoHoras, setPeriodoHoras] = useState<'geral' | 'centro'>('geral')
  const [dados, setDados] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [escopoCursos, setEscopoCursos] = useState<'admin' | 'turma' | 'sem_turma'>('admin')
  const [cursosDisponiveis, setCursosDisponiveis] = useState<any[]>([])
  const [certificadosLista, setCertificadosLista] = useState<any[]>([])
  const [alunosIndividual, setAlunosIndividual] = useState<any[]>([])
  const [erroCursos, setErroCursos] = useState('')
  const [erroAlunos, setErroAlunos] = useState('')
  const [buscaAluno, setBuscaAluno] = useState('')
  const [somenteIniciaram, setSomenteIniciaram] = useState(false)

  useEffect(() => {
    indicadoresAPI.buscar()
      .then((data: any) => { setDados(data); setCarregando(false) })
      .catch(() => setCarregando(false))

    indicadoresAPI.buscarCursos()
      .then((data: any) => {
        setEscopoCursos(data.escopo)
        setCursosDisponiveis(data.disponiveis ?? [])
        setCertificadosLista(data.certificados ?? [])
      })
      .catch((err: any) => setErroCursos(err?.message ?? 'Erro ao carregar treinamentos e certificados.'))

    indicadoresAPI.buscarAlunos()
      .then((data: any) => {
        setEscopoCursos(data.escopo)
        setAlunosIndividual(data.alunos ?? [])
      })
      .catch((err: any) => setErroAlunos(err?.message ?? 'Erro ao carregar indicador individual.'))
  }, [])

  const alunosFiltrados = alunosIndividual
    .filter((a: any) => (a.nome ?? '').toLowerCase().includes(buscaAluno.toLowerCase()))
    .filter((a: any) => !somenteIniciaram || Number(a.cursos_concluidos) > 0)

  const semTurmaMsg = 'Nenhum colaborador cadastrado na sua turma. Fale com o RH para vincular colaboradores.'

  const _ = carregando ? '...' : undefined

  // KPI cards
  const metricas = [
    { label: 'Total de Colaboradores',  valor: _ ?? String(dados?.colaboradores?.total ?? 0),                                       cor: '#1a56ff' },
    { label: 'Matrículas Ativas',       valor: _ ?? String(dados?.matriculas?.total ?? 0),                                          cor: '#10b981' },
    { label: 'Certificados Emitidos',   valor: _ ?? String(dados?.certificados?.total ?? 0),                                        cor: '#8b5cf6' },
    { label: 'Turmas com Curso',        valor: _ ?? String(dados?.turmas?.comCurso ?? 0),                                           cor: '#f59e0b'  },
    { label: 'Taxa de Aprovação',       valor: _ ?? (dados?.provas?.total > 0 ? `${dados.provas.taxaAprovacao}%` : '—'),            cor: '#ef4444'            },
  ]

  // Pizza — visão geral
  const certTotal   = dados?.certificados?.total ?? 0
  const matricTotal = dados?.matriculas?.total ?? 0
  const turmasCurso = dados?.turmas?.comCurso ?? 0
  const instTotal   = dados?.instrutores?.total ?? 0
  const somaGeral   = certTotal + matricTotal + turmasCurso + instTotal || 1
  const totalPizza  = certTotal + matricTotal + turmasCurso + instTotal
  const visaoGeral  = [
    { nome: 'Certificados',    valor: certTotal,   pct: Math.round(certTotal   / somaGeral * 100), cor: '#10b981' },
    { nome: 'Matrículas',      valor: matricTotal,  pct: Math.round(matricTotal  / somaGeral * 100), cor: '#1a56ff' },
    { nome: 'Turmas c/ curso', valor: turmasCurso, pct: Math.round(turmasCurso / somaGeral * 100), cor: '#f59e0b' },
    { nome: 'Instrutores',     valor: instTotal,   pct: Math.round(instTotal   / somaGeral * 100), cor: '#7c3aed' },
  ].filter(v => v.valor > 0)

  // Linha chart — admissões por mês
  const horasData = (dados?.admissoesPorMes ?? []).map((m: any) => ({ dia: m.mes, horas: m.total }))
  const totalAdmissoes = (dados?.admissoesPorMes ?? []).reduce((s: number, m: any) => s + Number(m.total), 0)

  // Atenções reais
  const semLogin       = dados?.instrutores?.semLogin ?? 0
  const turmasSemCurso = Math.max(0, (dados?.turmas?.total ?? 0) - (dados?.turmas?.comCurso ?? 0))
  const mensNaoLidas   = dados?.mensagens?.naoLidas ?? 0
  const notifNaoLidas  = dados?.notificacoes?.naoLidas ?? 0
  const atencoes = [
    { cor: '#ef4444', valor: semLogin,       titulo: 'Instrutores sem acesso',     sub: 'Cadastrar CPF + data nascimento' },
    { cor: '#f59e0b', valor: turmasSemCurso, titulo: 'Turmas sem curso vinculado', sub: 'Requer configuração'             },
    { cor: '#1a56ff', valor: mensNaoLidas,   titulo: 'Mensagens não respondidas',  sub: 'Aguardando resposta'             },
    { cor: '#6366f1', valor: notifNaoLidas,  titulo: 'Notificações não lidas',     sub: 'Verificar painel'               },
  ]

  // Ficha — primeiro da lista de admissões recentes
  const primeiroRecente = (dados?.admissoesRecentes ?? [])[0]
  const colaborador = primeiroRecente ? {
    nome:        primeiroRecente.nome,
    cargo:       'Colaborador',
    funcao:      primeiroRecente.cargo ?? '—',
    centroCusto: primeiroRecente.turma ?? '—',
    admissao:    new Date(primeiroRecente.data_admissao).toLocaleDateString('pt-BR'),
  } : { nome: '—', cargo: '—', funcao: '—', centroCusto: '—', admissao: '—' }

  // Histórico (tab) — admissões recentes mapeadas
  const historicoCursos = (dados?.admissoesRecentes ?? []).slice(0, 7).map((u: any) => ({
    curso:     u.turma ?? 'Sem turma',
    status:    'Ativo',
    conclusao: new Date(u.data_admissao).toLocaleDateString('pt-BR'),
    validade:  '—',
    cargaH:    '—',
  }))

  // Coluna direita — top 5 turmas
  const topTurmas  = (dados?.colaboradoresPorTurma ?? []).slice(0, 5)
  const maxAlunos  = Math.max(1, ...topTurmas.map((t: any) => Number(t.total)))
  const horasCentro = topTurmas.map((t: any) => ({
    nome:  (t.turma ?? 'Sem turma').slice(0, 20),
    horas: Number(t.total),
    pct:   Math.round((Number(t.total) / maxAlunos) * 100),
  }))

  // Coluna direita — admissões recentes (4 primeiros)
  const pendentesCols = (dados?.admissoesRecentes ?? []).slice(0, 4).map((u: any) => ({
    nome:  u.nome,
    cargo: u.cargo ?? '—',
    curso: u.turma ?? '—',
    data:  new Date(u.data_admissao).toLocaleDateString('pt-BR'),
  }))

  return (
    <LayoutAdmin
      paginaAtiva="indicadoresAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Painel de Indicadores"
      topbarSubtitulo="Acompanhe o desempenho dos treinamentos em toda a organização."
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── FILTRO DE DATA ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 14px' }}>
            <Calendar size={13} color={C.muted} />
            <span style={{ fontSize: '12px', color: C.text }}>Dados em tempo real</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 14px', cursor: 'pointer' }}>
            <Filter size={13} color={C.muted} />
            <span style={{ fontSize: '12px', color: C.text }}>Filtros</span>
          </div>
        </div>

        {/* ── MÉTRICAS PRINCIPAIS (5 cards) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {metricas.map(m => (
            <div key={m.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${m.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={18} color={m.cor} />
                </div>
                <span style={{ fontSize: '11px', color: C.muted, lineHeight: 1.3 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>{m.valor}</div>
              <div style={{ fontSize: '10px', color: C.muted }}>banco de dados</div>
            </div>
          ))}
        </div>

        {/* ── LINHA 2: Pizza + Gráfico + Atenções ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '16px' }}>

          {/* Pizza — Visão Geral */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>Visão Geral do Sistema</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: C.muted }}>
                Geral <ChevronDown size={12} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={visaoGeral.length ? visaoGeral : [{ nome: '—', valor: 1, pct: 100, cor: C.border }]}
                    cx={75} cy={75} innerRadius={48} outerRadius={72}
                    dataKey="valor" strokeWidth={0}
                  >
                    {(visaoGeral.length ? visaoGeral : [{ cor: C.border }]).map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: C.text }}>{totalPizza}</div>
                  <div style={{ fontSize: '10px', color: C.muted }}>Total</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visaoGeral.map(v => (
                  <div key={v.nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: v.cor, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: C.muted }}>{v.nome}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>
                      {v.valor} <span style={{ color: C.muted, fontWeight: 400 }}>({v.pct}%)</span>
                    </span>
                  </div>
                ))}
                {visaoGeral.length === 0 && (
                  <span style={{ fontSize: '12px', color: C.muted }}>Sem dados</span>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico Admissões por Mês */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>Admissões por Mês</span>
              <div style={{ display: 'flex', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                {(['geral', 'centro'] as const).map(p => (
                  <button key={p} onClick={() => setPeriodoHoras(p)} style={{ padding: '5px 12px', background: periodoHoras === p ? C.blue : 'none', color: periodoHoras === p ? '#fff' : C.muted, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                    {p === 'geral' ? 'Geral' : 'Por Turma'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: C.text }}>{totalAdmissoes}</div>
              <div style={{ fontSize: '11px', color: C.muted }}>Total de admissões</div>
            </div>
            {horasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={horasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${v} admissões`]}
                  />
                  <Line type="monotone" dataKey="horas" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '12px' }}>
                Sem dados de admissão no período
              </div>
            )}
          </div>

          {/* Atenções Necessárias */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>Atenções Necessárias</span>
              <span style={{ fontSize: '12px', color: C.blue, cursor: 'pointer', fontWeight: 500 }}>Ver todas</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {atencoes.map((a, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.cor }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${a.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={15} color={a.cor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: a.cor }}>{a.valor}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: C.text }}>{a.titulo}</div>
                    <div style={{ fontSize: '10px', color: C.muted }}>{a.sub}</div>
                  </div>
                  <ChevronRight size={14} color={C.muted} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── LINHA 3: Ficha + Histórico + Coluna Direita ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: '16px' }}>

          {/* Ficha do Colaborador */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>Admissão Recente</span>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(26,86,255,0.15)', border: `2px solid ${C.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: C.blue }}>
                {colaborador.nome !== '—'
                  ? colaborador.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : '—'}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{colaborador.nome}</div>
                <span style={{ fontSize: '10px', background: 'rgba(26,86,255,0.15)', color: C.blue, borderRadius: '6px', padding: '2px 10px', fontWeight: 600 }}>{colaborador.cargo}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
              {[
                { label: 'Função',   valor: colaborador.funcao      },
                { label: 'Turma',    valor: colaborador.centroCusto },
                { label: 'Admissão', valor: colaborador.admissao    },
              ].map(d => (
                <div key={d.label}>
                  <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.label}</div>
                  <div style={{ fontSize: '12px', color: C.text, fontWeight: 500, wordBreak: 'break-all' }}>{d.valor}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('alunosAdmin')}
              style={{ width: '100%', padding: '9px', background: 'none', border: `1.5px solid ${C.blue}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.blue, cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.blue }}
            >
              Ver todos os colaboradores
            </button>
          </div>

          {/* Histórico / Tabs */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: '12px', flexWrap: 'wrap' }}>
              {[
                { key: 'historico',    label: 'Admissões Recentes'       },
                { key: 'disponiveis',  label: 'Treinamentos Disponíveis' },
                { key: 'certificados', label: 'Certificados'             },
                { key: 'individual',   label: 'Indicador individual'     },
              ].map(aba => (
                <button
                  key={aba.key}
                  onClick={() => setAbaCursos(aba.key as typeof abaCursos)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '13px', fontWeight: abaCursos === aba.key ? 600 : 400, color: abaCursos === aba.key ? C.blue : C.muted, borderBottom: abaCursos === aba.key ? `2px solid ${C.blue}` : '2px solid transparent', marginBottom: '-1px', transition: 'all 150ms' }}
                >
                  {aba.label}
                </button>
              ))}
            </div>

            {abaCursos === 'historico' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 80px 70px', gap: '8px', padding: '6px 8px', marginBottom: '4px' }}>
                  {['Turma / Cargo', 'Status', 'Admissão', 'Validade', 'C.H.'].map(h => (
                    <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{h}</span>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {historicoCursos.length > 0 ? historicoCursos.map((curso: any, i: number) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 80px 70px', gap: '8px', padding: '10px 8px', background: C.surface2, borderRadius: '8px', alignItems: 'center', border: `0.5px solid ${C.border}` }}>
                      <span style={{ fontSize: '12px', color: C.text, fontWeight: 500 }}>{curso.curso}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>{curso.status}</span>
                      <span style={{ fontSize: '11px', color: C.muted }}>{curso.conclusao}</span>
                      <span style={{ fontSize: '11px', color: C.muted }}>{curso.validade}</span>
                      <span style={{ fontSize: '11px', color: C.muted }}>{curso.cargaH}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                      Sem admissões recentes
                    </div>
                  )}
                </div>
                <button onClick={() => onNavigate('alunosAdmin')} style={{ marginTop: '12px', padding: '9px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', color: C.blue, cursor: 'pointer', fontWeight: 600 }}>
                  Ver todos os colaboradores
                </button>
              </>
            )}

            {abaCursos === 'disponiveis' && (
              escopoCursos === 'sem_turma' ? (
                <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                  {semTurmaMsg}
                </div>
              ) : erroCursos ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '12px' }}>
                  {erroCursos}
                </div>
              ) : cursosDisponiveis.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                  Nenhum curso disponível.
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cursosDisponiveis.map((curso: any) => {
                    const publicoTotal   = Number(curso.publico_total) || 0
                    const iniciaram      = Number(curso.total_iniciaram) || 0
                    const concluintes    = Number(curso.total_concluintes) || 0
                    const progressoMedio = Number(curso.progresso_medio) || 0
                    return (
                      <div key={curso.id} style={{ padding: '10px 12px', background: C.surface2, borderRadius: '8px', border: `0.5px solid ${C.border}` }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '6px' }}>{curso.titulo}</div>
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
                  })}
                </div>
              )
            )}

            {abaCursos === 'certificados' && (
              escopoCursos === 'sem_turma' ? (
                <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                  {semTurmaMsg}
                </div>
              ) : erroCursos ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '12px' }}>
                  {erroCursos}
                </div>
              ) : certificadosLista.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                  Nenhum certificado emitido ainda
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {certificadosLista.map((cert: any) => (
                    <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 10px', background: C.surface2, borderRadius: '8px', border: `0.5px solid ${C.border}` }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{cert.aluno_nome}</div>
                        <div style={{ fontSize: '10px', color: C.muted }}>{cert.curso_titulo}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: '#1a56ff', borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {String(cert.data_emissao).slice(0, 10).split('-').reverse().join('/')}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}

            {abaCursos === 'individual' && (
              escopoCursos === 'sem_turma' ? (
                <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                  {semTurmaMsg}
                </div>
              ) : erroAlunos ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '12px' }}>
                  {erroAlunos}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                      value={buscaAluno}
                      onChange={e => setBuscaAluno(e.target.value)}
                      placeholder="Buscar por nome..."
                      style={{ flex: 1, minWidth: '140px', padding: '7px 10px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', color: C.text }}
                    />
                    <button
                      onClick={() => setSomenteIniciaram(v => !v)}
                      style={{ padding: '7px 12px', background: somenteIniciaram ? C.blue : 'none', color: somenteIniciaram ? '#fff' : C.muted, border: `1px solid ${somenteIniciaram ? C.blue : C.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {somenteIniciaram ? 'Só quem iniciou' : 'Todos'}
                    </button>
                  </div>
                  <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {alunosFiltrados.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>
                        Nenhum colaborador encontrado.
                      </div>
                    ) : alunosFiltrados.map((a: any) => (
                      <div key={a.id} style={{ padding: '8px 10px', background: C.surface2, borderRadius: '8px', border: `0.5px solid ${C.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{a.nome}</div>
                            <div style={{ fontSize: '10px', color: C.muted }}>{a.cargo ?? '—'} · {a.turma_nome ?? '—'}</div>
                          </div>
                          <span style={{ fontSize: '10px', color: C.muted, whiteSpace: 'nowrap' }}>
                            {a.cursos_concluidos} de {a.cursos_atribuidos} cursos
                          </span>
                        </div>
                        <BarraProgresso valor={Number(a.progresso_geral) || 0} />
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>

          {/* Coluna direita */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Colaboradores por Turma */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>Colaboradores por Turma</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: C.muted }}>
                  Top 5 <ChevronDown size={11} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {horasCentro.length > 0 ? horasCentro.map((h: any) => (
                  <div key={h.nome} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: C.muted, minWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nome}</span>
                    <div style={{ flex: 1, background: 'rgba(26,86,255,0.08)', borderRadius: '4px', height: '5px' }}>
                      <div style={{ background: C.blue, height: '5px', borderRadius: '4px', width: `${h.pct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, minWidth: '24px', textAlign: 'right' }}>{h.horas}</span>
                  </div>
                )) : (
                  <div style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '8px 0' }}>Sem dados</div>
                )}
              </div>
            </div>

            {/* Admissões Recentes */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>Admissões Recentes</span>
                <span onClick={() => onNavigate('alunosAdmin')} style={{ fontSize: '12px', color: C.blue, cursor: 'pointer', fontWeight: 500 }}>Ver todos</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendentesCols.length > 0 ? pendentesCols.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: C.surface2, borderRadius: '8px', border: `0.5px solid ${C.border}` }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(26,86,255,0.15)', border: '1px solid rgba(26,86,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: C.blue, flexShrink: 0 }}>
                      {p.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{p.nome}</div>
                      <div style={{ fontSize: '10px', color: C.muted }}>{p.cargo}</div>
                      <div style={{ fontSize: '10px', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.curso}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: '#1a56ff', borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {p.data}
                    </span>
                  </div>
                )) : (
                  <div style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                    Sem admissões recentes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '12px 0', borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: '11px', color: C.muted }}>Indicadores atualizados com dados reais — Edeconsil Universidade Corporativa</span>
        </div>

      </div>
    </LayoutAdmin>
  )
}
