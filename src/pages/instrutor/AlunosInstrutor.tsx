import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Users, UserCheck, UserX, X, UserPlus } from 'lucide-react'

const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')
import { CadastroAluno } from '../admin/CadastroAluno'
import { EditarAluno } from '../admin/EditarAluno'
import { ImportarAlunosModal } from '../../components/admin/ImportarAlunosModal'
import { usuariosAPI, instrutorAPI } from '../../services/api'
import { useBreakpoint } from '../../hooks/useMobile'

interface Aluno {
  id: string
  nome: string
  email: string
  cr: string
  cargo: string
  setor: string
  matricula: string
  status: 'Ativo' | 'Inativo'
}

const ITENS_POR_PAGINA = 10
const CORES_AVATAR = ['#1a56ff','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316']
function getIniciais(nome: string) {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function corAvatar(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return CORES_AVATAR[Math.abs(hash) % 8]
}

type CampoOrdem = 'nome' | 'cargo' | 'setor' | 'status'

interface AlunosInstrutorProps {
  onNavigate: (page: string) => void
}

export function AlunosInstrutor({ onNavigate: _onNavigate }: AlunosInstrutorProps) {
  const { C } = useTheme()
  const { cols } = useBreakpoint()

  const [alunos, setAlunos]                           = useState<Aluno[]>([])
  const [carregando, setCarregando]                   = useState(false)
  const [modalCadastro, setModalCadastro]             = useState(false)
  const [modalImportar, setModalImportar]             = useState(false)
  const [alunoExcluindo, setAlunoExcluindo]           = useState<Aluno | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [excluindoId, setExcluindoId]                 = useState<string | null>(null)
  const [alunoEditando, setAlunoEditando]             = useState<any>(null)
  const [busca, setBusca]                             = useState('')
  const [statusFiltro, setStatusFiltro]               = useState('Todos')
  const [paginaAtual, setPaginaAtual]                 = useState(1)
  const [ordenacao, setOrdenacao]                     = useState<CampoOrdem>('nome')
  const [ordemDir, setOrdemDir]                       = useState<'asc' | 'desc'>('asc')
  const [cargoFiltro,  setCargoFiltro]                = useState('')
  const [turmaFiltro,  setTurmaFiltro]                = useState('')
  const [origemFiltro, setOrigemFiltro]               = useState('Todos')
  const [turmasDisponiveis, setTurmasDisponiveis]     = useState<any[]>([])
  const [turmaId, setTurmaId]                         = useState<string | null>(null)
  const [setorInicial, setSetorInicial]               = useState('')

  useEffect(() => {
    instrutorAPI.minhaTurma().then((t: any) => {
      if (t?.id) {
        setTurmaId(String(t.id))
        setTurmasDisponiveis([t])
        setSetorInicial(t.cargo_grupo || t.nome || '')
      }
    }).catch(() => {})
  }, [])

  const carregarAlunos = useCallback(async () => {
    if (!turmaId) return
    setCarregando(true)
    try {
      const resp = await usuariosAPI.listar({ limite: '500', perfil: 'colaborador', turma_id: turmaId }) as any
      const lista: any[] = Array.isArray(resp) ? resp : (resp?.usuarios ?? [])
      const normalizados: Aluno[] = lista.map((u: any) => ({
        id:        String(u.id),
        nome:      u.nome ?? '—',
        email:     u.email ?? '—',
        cr:        u.cr ?? '—',
        cargo:     u.cargo ?? '—',
        setor:     u.setor ?? '—',
        matricula: u.matricula ?? '—',
        status:    u.status === 'ativo' || u.status === 'Ativo' ? 'Ativo' : 'Inativo',
      }))
      setAlunos(normalizados)
    } catch (e) {
      console.error('Erro ao carregar alunos:', e)
    } finally {
      setCarregando(false)
    }
  }, [turmaId])

  useEffect(() => { carregarAlunos() }, [carregarAlunos])

  function toggleOrdem(campo: CampoOrdem) {
    if (campo === ordenacao) {
      setOrdemDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenacao(campo)
      setOrdemDir('asc')
    }
    setPaginaAtual(1)
  }

  function limparFiltros() {
    setBusca('')
    setStatusFiltro('Todos')
    setCargoFiltro('')
    setTurmaFiltro('')
    setOrigemFiltro('Todos')
    setPaginaAtual(1)
  }

  const alunosFiltrados = useMemo(() => {
    let lista = alunos.filter((a: any) => {
      const buscaOk  = busca === '' || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase())
      const statusOk = statusFiltro === 'Todos' || a.status === statusFiltro
      const cargoOk  = cargoFiltro === '' || (a.cargo ?? '').toLowerCase().includes(cargoFiltro.toLowerCase())
      const turmaOk  = turmaFiltro === '' || a.turma_id === turmaFiltro
      const origemOk = origemFiltro === 'Todos' || (a as any).origem === origemFiltro
      return buscaOk && statusOk && cargoOk && turmaOk && origemOk
    })

    lista = [...lista].sort((a, b) => {
      let va: string = a[ordenacao] ?? ''
      let vb: string = b[ordenacao] ?? ''
      va = va.toLowerCase()
      vb = vb.toLowerCase()
      if (va < vb) return ordemDir === 'asc' ? -1 : 1
      if (va > vb) return ordemDir === 'asc' ? 1 : -1
      return 0
    })

    return lista
  }, [alunos, busca, statusFiltro, ordenacao, ordemDir])

  const totalPaginas = Math.max(1, Math.ceil(alunosFiltrados.length / ITENS_POR_PAGINA))
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
  const alunosPagina = alunosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)

  const totalAtivos   = alunos.filter(a => a.status === 'Ativo').length
  const totalInativos = alunos.filter(a => a.status === 'Inativo').length

  const metricas = [
    { label: 'Total de Alunos', valor: alunos.length, icon: Users,     cor: C.blue    },
    { label: 'Alunos Ativos',   valor: totalAtivos,   icon: UserCheck, cor: '#10b981' },
    { label: 'Alunos Inativos', valor: totalInativos, icon: UserX,     cor: '#ef4444' },
  ]

  function SortIcon({ campo }: { campo: CampoOrdem }) {
    if (campo !== ordenacao) return <ChevronsUpDown size={12} color={C.muted} />
    return ordemDir === 'asc'
      ? <ChevronUp size={12} color={C.blue} />
      : <ChevronDown size={12} color={C.blue} />
  }

  function renderPaginas() {
    const botoes: (number | '...')[] = []
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) botoes.push(i)
    } else {
      botoes.push(1)
      if (paginaAtual > 3) botoes.push('...')
      for (let i = Math.max(2, paginaAtual - 1); i <= Math.min(totalPaginas - 1, paginaAtual + 1); i++) botoes.push(i)
      if (paginaAtual < totalPaginas - 2) botoes.push('...')
      botoes.push(totalPaginas)
    }
    return botoes
  }

  async function handleExcluir() {
    if (!alunoExcluindo) return
    setExcluindoId(alunoExcluindo.id)
    try {
      await (usuariosAPI as any).deletar(alunoExcluindo.id)
      setConfirmandoExclusao(false)
      setAlunoExcluindo(null)
      await carregarAlunos()
    } catch (e: any) {
      alert('Erro ao excluir: ' + (e.message ?? 'Tente novamente'))
    } finally {
      setExcluindoId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: '8px', fontSize: '13px',
    border: `1px solid ${C.border}`, background: C.surface, color: C.text,
    outline: 'none',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: '11px', fontWeight: 600,
    color: C.muted, textAlign: 'left', cursor: 'pointer', userSelect: 'none',
    whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`,
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(1, 3, 3)}, 1fr)`, gap: '16px', marginBottom: '24px' }}>
        {metricas.map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: `${m.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={m.cor} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: C.text }}>{m.valor}</div>
                <div style={{ fontSize: '11px', color: C.muted }}>{m.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '200px' }}>
            <Search size={14} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); setPaginaAtual(1) }}
              placeholder="Buscar por nome ou e-mail..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '32px', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={statusFiltro}
            onChange={e => { setStatusFiltro(e.target.value); setPaginaAtual(1) }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>

          <input
            value={cargoFiltro}
            onChange={e => { setCargoFiltro(e.target.value); setPaginaAtual(1) }}
            placeholder="Filtrar por cargo..."
            style={{ ...inputStyle, width: '160px' }}
          />

          <select
            value={turmaFiltro}
            onChange={e => { setTurmaFiltro(e.target.value); setPaginaAtual(1) }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Todas as turmas</option>
            {turmasDisponiveis.map((t: any) => (
              <option key={t.id} value={t.id}>{t.cargo_grupo || t.nome}</option>
            ))}
          </select>

          <select
            value={origemFiltro}
            onChange={e => { setOrigemFiltro(e.target.value); setPaginaAtual(1) }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="Todos">Todas as origens</option>
            <option value="Empregado">Empregado</option>
            <option value="Parceiro">Parceiro</option>
            <option value="Terceiro">Terceiro</option>
          </select>

          {(busca || statusFiltro !== 'Todos' || cargoFiltro || turmaFiltro || origemFiltro !== 'Todos') && (
            <button
              onClick={limparFiltros}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px', border: `1px solid ${C.border}`,
                background: 'transparent', color: C.muted, fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <X size={13} />
              Limpar filtros
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.muted }}>
            {carregando ? 'Carregando...' : `${alunosFiltrados.length} resultado${alunosFiltrados.length !== 1 ? 's' : ''}`}
          </span>

          <button
            onClick={() => setModalImportar(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', background: 'none',
              border: `1.5px solid ${C.blue}`, borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, color: C.blue, cursor: 'pointer', transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `rgba(26,86,255,0.08)` }}
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
            onClick={() => setModalCadastro(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: C.blue, color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter',sans-serif",
            }}
          >
            <UserPlus size={14} />
            Novo Aluno
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: '12px', overflow: 'hidden', marginBottom: '20px',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <colgroup>
              <col />
              <col style={{ width: '160px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
              <tr style={{ background: C.surface }}>
                <th style={thStyle} onClick={() => toggleOrdem('nome')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Aluno <SortIcon campo="nome" />
                  </span>
                </th>
                <th style={thStyle}>
                  Origem
                </th>
                <th style={thStyle} onClick={() => toggleOrdem('setor')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Setor / Turma <SortIcon campo="setor" />
                  </span>
                </th>
                <th style={thStyle} onClick={() => toggleOrdem('cargo')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Cargo <SortIcon campo="cargo" />
                  </span>
                </th>
                <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: C.muted, textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                  Status
                </th>
                <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: C.muted, textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
                    Carregando alunos...
                  </td>
                </tr>
              ) : alunosPagina.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
                    {alunos.length === 0
                      ? 'Nenhum aluno cadastrado ainda.'
                      : 'Nenhum aluno encontrado com os filtros aplicados.'}
                  </td>
                </tr>
              ) : alunosPagina.map((aluno, idx) => (
                <tr
                  key={aluno.id}
                  style={{
                    borderBottom: idx < alunosPagina.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${C.blue}08`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: corAvatar(aluno.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                        {(aluno as any).foto_url ? (
                          <img src={`${BACKEND_URL}${(aluno as any).foto_url}`} alt={aluno.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : getIniciais(aluno.nome)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{aluno.nome}</div>
                        <div style={{ fontSize: '11px', color: C.muted }}>{aluno.email}</div>
                        {(aluno as any).origem && (aluno as any).origem !== 'Empregado' && (
                          <span style={{ fontSize: '10px', padding: '1px 5px', background: (aluno as any).origem === 'Terceiro' ? '#fef3c7' : '#ede9fe', color: (aluno as any).origem === 'Terceiro' ? '#92400e' : '#5b21b6', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                            {(aluno as any).origem}{(aluno as any).origem === 'Terceiro' && (aluno as any).empresa_terceiro ? ` · ${(aluno as any).empresa_terceiro}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 12px' }}>
                    {(aluno as any).origem && (aluno as any).origem !== 'Empregado' ? (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px',
                        borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                        background: (aluno as any).origem === 'Terceiro' ? '#fef3c7' : '#ede9fe',
                        color: (aluno as any).origem === 'Terceiro' ? '#92400e' : '#5b21b6',
                      }}>
                        {(aluno as any).origem}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: C.muted }}>Empregado</span>
                    )}
                  </td>

                  <td style={{ padding: '12px 12px', fontSize: '12px', color: C.muted2 }}>
                    {aluno.setor}
                  </td>

                  <td style={{ padding: '12px 12px', fontSize: '12px', color: C.muted2 }}>
                    {aluno.cargo}
                  </td>

                  <td style={{ padding: '12px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: aluno.status === 'Ativo' ? '#10b98118' : '#ef444418',
                      color: aluno.status === 'Ativo' ? '#10b981' : '#ef4444',
                    }}>
                      {aluno.status}
                    </span>
                  </td>

                  <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setAlunoEditando(aluno)}
                      title="Editar aluno"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: C.text, cursor: 'pointer', transition: 'all 150ms', marginRight: '6px' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,86,255,0.08)'; e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      title="Excluir aluno"
                      onClick={() => { setAlunoExcluindo(aluno); setConfirmandoExclusao(true) }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: C.muted, cursor: 'pointer', transition: 'all 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
                    >
                      🗑️ Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: C.muted }}>
            Mostrando {inicio + 1}–{Math.min(inicio + ITENS_POR_PAGINA, alunosFiltrados.length)} de {alunosFiltrados.length} alunos
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                border: `1px solid ${C.border}`, background: C.surface, color: C.muted2,
                cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer', opacity: paginaAtual === 1 ? 0.4 : 1,
              }}
            >
              Anterior
            </button>

            {renderPaginas().map((p, i) =>
              p === '...'
                ? <span key={`el-${i}`} style={{ padding: '6px 4px', color: C.muted, fontSize: '13px' }}>…</span>
                : (
                  <button
                    key={p}
                    onClick={() => setPaginaAtual(p as number)}
                    style={{
                      width: 34, height: 34, borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                      border: `1px solid ${p === paginaAtual ? C.blue : C.border}`,
                      background: p === paginaAtual ? C.blue : C.surface,
                      color: p === paginaAtual ? '#fff' : C.muted2,
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                )
            )}

            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                border: `1px solid ${C.border}`, background: C.surface, color: C.muted2,
                cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaAtual === totalPaginas ? 0.4 : 1,
              }}
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {confirmandoExclusao && alunoExcluindo && (
        <div
          onClick={() => { setConfirmandoExclusao(false); setAlunoExcluindo(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: '14px', padding: '28px', maxWidth: '420px', width: '100%', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              Excluir aluno?
            </h3>
            <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 20px' }}>
              Tem certeza que deseja excluir <strong style={{ color: C.text }}>{alunoExcluindo.nome}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => { setConfirmandoExclusao(false); setAlunoExcluindo(null) }}
                style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                disabled={!!excluindoId}
                style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: excluindoId ? 'not-allowed' : 'pointer', opacity: excluindoId ? 0.7 : 1 }}
              >
                {excluindoId ? 'Excluindo...' : 'Sim, excluir'}
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
                  Importar Alunos — Planilha Excel
                </h2>
                <p style={{ fontSize:'12px', color:C.muted, margin:0 }}>
                  Colunas: Nome · CPF · Cargo · Admissão · Mat · Dat. Nasc · Centro de Custo
                </p>
              </div>
              <button
                onClick={() => setModalImportar(false)}
                style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'18px', color:C.muted, display:'flex', alignItems:'center', justifyContent:'center' }}
              >
                ×
              </button>
            </div>
            <ImportarAlunosModal
              onFechar={() => setModalImportar(false)}
              turmasDoBanco={turmasDisponiveis}
              onSucesso={async (total) => {
                setModalImportar(false)
                await carregarAlunos()
                console.log(`${total} aluno(s) importados`)
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Editar Aluno */}
      {alunoEditando && (
        <div
          onClick={() => setAlunoEditando(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.surface, zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Editar Aluno</h2>
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Altere os dados cadastrais e salve</p>
              </div>
              <button
                onClick={() => setAlunoEditando(null)}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
            <EditarAluno
              aluno={alunoEditando}
              onFechar={() => setAlunoEditando(null)}
              onSucesso={(alunoAtualizado) => {
                setAlunoEditando(null)
                setAlunos(prev => prev.map(a =>
                  a.id === alunoAtualizado.id ? { ...a, ...alunoAtualizado, status: alunoAtualizado.status === 'ativo' ? 'Ativo' : 'Inativo' } : a
                ))
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Cadastro de Aluno */}
      {modalCadastro && (
        <div
          onClick={() => setModalCadastro(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Novo Aluno</h2>
                <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Cadastrar colaborador na plataforma</p>
              </div>
              <button
                onClick={() => setModalCadastro(false)}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: C.muted, fontFamily: "'Inter',sans-serif" }}
              >
                ×
              </button>
            </div>
            <CadastroAluno
              setorInicial={setorInicial}
              onFechar={() => setModalCadastro(false)}
              onSucesso={async (_usuario) => {
                setModalCadastro(false)
                await carregarAlunos()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
