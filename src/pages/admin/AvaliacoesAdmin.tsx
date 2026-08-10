import { useState, useEffect } from 'react'
import { Search, Star } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { avaliacaoAPI } from '../../services/api'

const AMARELO = '#F5C400'
const AZUL    = '#0d2550'
const POR_PAGINA = 20

interface Avaliacao {
  id: string
  estrelas: number
  comentario: string | null
  criado_em: string
  aluno_nome: string
  curso_titulo: string
}

interface RespostaAvaliacoes {
  avaliacoes: Avaliacao[]
  media: number | null
  total: number
  dispensados: number
  pagina: number
  totalPaginas: number
}

interface AvaliacoesAdminProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

// Fora da função pai: não remonta a cada render da página.
function Estrelas({ nota, tamanho = 14 }: { nota: number; tamanho?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={tamanho}
          color={n <= nota ? AMARELO : 'rgba(128,128,128,0.35)'}
          fill={n <= nota ? AMARELO : 'none'}
        />
      ))}
    </span>
  )
}

function CardResumo({
  rotulo, children, cor, borda,
}: { rotulo: string; children: React.ReactNode; cor: string; borda: string }) {
  return (
    <div style={{
      flex: 1, minWidth: '160px', background: cor, border: `1px solid ${borda}`,
      borderRadius: '12px', padding: '16px 18px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {rotulo}
      </p>
      {children}
    </div>
  )
}

export function AvaliacoesAdmin({ onNavigate, onLogout }: AvaliacoesAdminProps) {
  const { C } = useTheme()

  const [avaliacoes, setAvaliacoes]   = useState<Avaliacao[]>([])
  const [media, setMedia]             = useState<number | null>(null)
  const [total, setTotal]             = useState(0)
  const [dispensados, setDispensados] = useState(0)
  const [pagina, setPagina]           = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [busca, setBusca]             = useState('')
  const [carregando, setCarregando]   = useState(true)
  const [erro, setErro]               = useState('')

  const carregar = async (p = 1, b = busca) => {
    setCarregando(true)
    setErro('')
    try {
      const params: Record<string, string> = { pagina: String(p), limite: String(POR_PAGINA) }
      if (b.trim()) params.busca = b.trim()

      const data = await avaliacaoAPI.listarAdmin(params) as RespostaAvaliacoes
      setAvaliacoes(data.avaliacoes ?? [])
      setMedia(data.media)
      setTotal(data.total ?? 0)
      setDispensados(data.dispensados ?? 0)
      setPagina(data.pagina ?? p)
      setTotalPaginas(data.totalPaginas ?? 1)
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err)
      setErro('Não foi possível carregar as avaliações.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // media vem null do backend quando ainda não há nenhuma avaliação.
  const temMedia = media !== null && total > 0

  const thStyle = {
    padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: C.muted,
    textAlign: 'left' as const, borderBottom: `1px solid ${C.border}`,
  }

  return (
    <LayoutAdmin
      paginaAtiva="avaliacoesAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Avaliações"
      topbarSubtitulo="Avaliações dos alunos sobre os treinamentos."
    >
      <div style={{ padding: '28px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            Avaliações dos Treinamentos
          </h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
            Notas e comentários enviados pelos alunos ao concluir um curso.
          </p>
        </div>

        {/* Resumo */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <CardResumo rotulo="Média das notas" cor={C.surface} borda={C.border}>
            {temMedia ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: AMARELO }}>
                  {media!.toFixed(1)}
                </span>
                <Estrelas nota={Math.round(media!)} tamanho={16} />
              </div>
            ) : (
              <span style={{ fontSize: '20px', fontWeight: 700, color: C.muted }}>
                Sem avaliações
              </span>
            )}
          </CardResumo>

          <CardResumo rotulo="Total de avaliações" cor={C.surface} borda={C.border}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: C.text }}>{total}</span>
          </CardResumo>

          <CardResumo rotulo="Fecharam sem avaliar" cor={C.surface} borda={C.border}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: C.muted2 }}>{dispensados}</span>
          </CardResumo>
        </div>

        {/* Busca */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && carregar(1, busca)}
              placeholder="Buscar por nome do aluno..."
              style={{
                width: '100%', boxSizing: 'border-box', background: C.inputBg,
                border: `1px solid ${C.border}`, borderRadius: '8px',
                padding: '9px 12px 9px 32px', fontSize: '13px', color: C.text,
              }}
            />
          </div>
          <button
            onClick={() => carregar(1, busca)}
            style={{ padding: '9px 20px', background: AZUL, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
          >
            Buscar
          </button>
        </div>

        {erro && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
            {erro}
          </div>
        )}

        {/* Tabela */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '200px' }} />
                <col style={{ width: '130px' }} />
                <col />
                <col style={{ width: '200px' }} />
                <col style={{ width: '110px' }} />
              </colgroup>
              <thead>
                <tr style={{ background: C.surface2 }}>
                  <th style={thStyle}>Aluno</th>
                  <th style={thStyle}>Estrelas</th>
                  <th style={thStyle}>Comentário</th>
                  <th style={thStyle}>Curso</th>
                  <th style={thStyle}>Data</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
                      Carregando avaliações...
                    </td>
                  </tr>
                ) : avaliacoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '14px' }}>
                      Nenhuma avaliação ainda
                    </td>
                  </tr>
                ) : avaliacoes.map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: C.text }}>
                      {a.aluno_nome}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Estrelas nota={a.estrelas} />
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: a.comentario ? C.text : C.muted, lineHeight: 1.5 }}>
                      {a.comentario || '—'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: C.muted2 }}>
                      {a.curso_titulo}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: C.muted }}>
                      {new Date(a.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => carregar(pagina - 1)} disabled={pagina === 1}
              style={{ padding: '8px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '13px', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? C.muted : C.text }}>
              ← Anterior
            </button>
            <span style={{ padding: '8px 16px', fontSize: '13px', color: C.muted, alignSelf: 'center' }}>
              Página {pagina} de {totalPaginas}
            </span>
            <button onClick={() => carregar(pagina + 1)} disabled={pagina >= totalPaginas}
              style={{ padding: '8px 16px', background: AZUL, border: 'none', borderRadius: '6px', fontSize: '13px', cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 600 }}>
              Próxima →
            </button>
          </div>
        )}

      </div>
    </LayoutAdmin>
  )
}
