import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { usuariosAPI } from '../services/api'

interface ColaboradorOption {
  id: string
  nome: string
  cpf?: string | null
  cargo?: string | null
}

interface BuscaColaboradorProps {
  /** Aluno já escolhido — quando presente, mostra o nome fixo + botão de trocar. */
  selecionado: { id: string; nome: string } | null
  onSelecionar: (u: { id: string; nome: string }) => void
  onLimpar: () => void
  /** Parâmetros extras para usuariosAPI.listar (ex.: { turma_id } no instrutor). */
  extraParams?: Record<string, string>
  placeholder?: string
}

/** CPF cru -> "123.456.789-00". Se não tiver 11 dígitos, devolve como veio. */
function formatarCpf(cpf?: string | null): string {
  const digitos = String(cpf ?? '').replace(/\D/g, '')
  if (digitos.length !== 11) return cpf ?? ''
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`
}

/**
 * Campo de busca com sugestões para escolher um colaborador, no lugar de um
 * <select> com todos carregados de uma vez — com ~1900 colaboradores, o <select>
 * dependia de um `limite` alto na listagem e cortava a lista em ordem alfabética
 * antes do fim (ex.: ninguém depois da letra E).
 *
 * Busca no servidor (usuariosAPI.listar com `busca`), debounce de 300ms, só a
 * partir de 2 caracteres. Descarta respostas que chegam fora de ordem comparando
 * um id de requisição incremental.
 */
export function BuscaColaborador({
  selecionado,
  onSelecionar,
  onLimpar,
  extraParams,
  placeholder = 'Digite o nome do aluno...',
}: BuscaColaboradorProps) {
  const { C } = useTheme()
  const [texto, setTexto]             = useState('')
  const [sugestoes, setSugestoes]     = useState<ColaboradorOption[]>([])
  const [buscando, setBuscando]       = useState(false)
  const [erro, setErro]               = useState('')
  const [mostrarLista, setMostrarLista] = useState(false)
  const requisicaoAtual = useRef(0)

  useEffect(() => {
    if (texto.trim().length < 2) {
      setSugestoes([])
      setErro('')
      setBuscando(false)
      setMostrarLista(false)
      return
    }

    const idDestaBusca = ++requisicaoAtual.current
    setBuscando(true)
    setMostrarLista(true)

    const timer = setTimeout(async () => {
      try {
        const params: Record<string, string> = {
          busca: texto.trim(),
          limite: '20',
          perfil: 'colaborador',
          ...extraParams,
        }
        const data = await usuariosAPI.listar(params) as any
        // Resposta de uma busca antiga (usuário já digitou de novo) — descarta.
        if (idDestaBusca !== requisicaoAtual.current) return
        const lista = Array.isArray(data) ? data : (data.usuarios ?? [])
        setSugestoes(lista)
        setErro('')
      } catch (err: any) {
        if (idDestaBusca !== requisicaoAtual.current) return
        console.error('Erro ao buscar colaboradores:', err)
        setSugestoes([])
        setErro(err?.message ?? 'Não foi possível buscar colaboradores.')
      } finally {
        if (idDestaBusca === requisicaoAtual.current) setBuscando(false)
      }
    }, 300)

    return () => clearTimeout(timer)
    // extraParams é um objeto novo a cada render — comparar só o que de fato
    // muda a busca (hoje, turma_id) evita refazer a query sem necessidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, extraParams?.turma_id])

  if (selecionado) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: '8px', marginBottom: '14px', boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: 1, fontSize: '13px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selecionado.nome}
        </span>
        <button
          type="button"
          onClick={() => { onLimpar(); setTexto(''); setSugestoes([]) }}
          title="Trocar aluno"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', marginBottom: '14px' }}>
      <input
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onFocus={() => { if (texto.trim().length >= 2) setMostrarLista(true) }}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', background: C.surface2,
          border: `1px solid ${C.border}`, borderRadius: '8px',
          fontSize: '13px', color: C.text, boxSizing: 'border-box',
        }}
      />

      {mostrarLista && (
        <>
          {/* Fecha a lista ao clicar fora, sem atrapalhar o clique numa sugestão
              (a sugestão fica acima deste overlay na ordem do DOM/zIndex). */}
          <div onClick={() => setMostrarLista(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px',
              maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
          >
            {buscando ? (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: C.muted }}>Buscando...</div>
            ) : erro ? (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#ef4444' }}>{erro}</div>
            ) : sugestoes.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: C.muted }}>
                Nenhum colaborador encontrado
              </div>
            ) : (
              sugestoes.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    onSelecionar({ id: u.id, nome: u.nome })
                    setTexto('')
                    setSugestoes([])
                    setMostrarLista(false)
                  }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.surface2 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <div style={{ fontSize: '13px', color: C.text, fontWeight: 500 }}>{u.nome}</div>
                  {/* CPF diferencia homônimos; a API não devolve nome de turma (só
                      turma_id, um UUID sem uso para leitura humana), então o
                      fallback é o cargo, também útil pra distinguir. */}
                  <div style={{ fontSize: '11px', color: C.muted }}>
                    {formatarCpf(u.cpf) || u.cargo || '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
