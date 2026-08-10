import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { avaliacaoAPI } from '../services/api'

const AMARELO = '#F5C400'

interface ModalAvaliacaoProps {
  cursoSlug: string
  cursoTitulo: string
  /** Chamado depois de enviar OU dispensar — o pai só precisa fechar o modal. */
  onFechar: () => void
}

export function ModalAvaliacao({ cursoSlug, cursoTitulo, onFechar }: ModalAvaliacaoProps) {
  const { C } = useTheme()

  const [estrelas, setEstrelas]     = useState(0)
  const [hover, setHover]           = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando]     = useState(false)

  // Fechar sem avaliar grava dispensado=true: é isso que impede o pop-up de
  // voltar em outro dispositivo. Se o POST falhar, fecha assim mesmo — no pior
  // caso o modal reaparece numa proxima aprovacao, nada quebra.
  async function dispensar() {
    if (enviando) return
    setEnviando(true)
    try {
      await avaliacaoAPI.enviar(cursoSlug, { dispensado: true })
    } catch (err) {
      console.error('Erro ao dispensar avaliação:', err)
    } finally {
      setEnviando(false)
      onFechar()
    }
  }

  async function enviar() {
    if (enviando || estrelas < 1) return
    setEnviando(true)
    try {
      await avaliacaoAPI.enviar(cursoSlug, { estrelas, comentario: comentario.trim() || undefined })
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err)
    } finally {
      setEnviando(false)
      onFechar()
    }
  }

  const destacadas = hover || estrelas

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={dispensar}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px', background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: '16px',
          padding: '28px', position: 'relative',
        }}
      >
        <button
          onClick={dispensar}
          aria-label="Fechar sem avaliar"
          style={{
            position: 'absolute', top: '14px', right: '14px', background: 'none',
            border: 'none', cursor: 'pointer', color: C.muted, padding: '4px',
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>⭐</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
            O que achou do treinamento?
          </h3>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0, lineHeight: 1.5 }}>
            Sua opinião sobre <strong style={{ color: C.text }}>{cursoTitulo}</strong> ajuda
            a melhorar o material. Leva menos de um minuto.
          </p>
        </div>

        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setEstrelas(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                display: 'flex', alignItems: 'center',
                transform: destacadas >= n ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.12s',
              }}
            >
              <Star
                size={34}
                color={destacadas >= n ? AMARELO : C.muted}
                fill={destacadas >= n ? AMARELO : 'none'}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Deixe uma sugestão ou comentário... (opcional)"
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', background: C.inputBg,
            border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px',
            fontSize: '13px', color: C.text, fontFamily: "'Inter',sans-serif",
            resize: 'vertical', marginBottom: '18px',
          }}
        />

        <button
          onClick={enviar}
          disabled={estrelas < 1 || enviando}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: estrelas < 1 ? C.surface2 : '#0d2550',
            color: estrelas < 1 ? C.muted : '#fff',
            fontSize: '14px', fontWeight: 700,
            cursor: estrelas < 1 || enviando ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar avaliação'}
        </button>

        <button
          onClick={dispensar}
          disabled={enviando}
          style={{
            width: '100%', padding: '8px', background: 'none', border: 'none',
            color: C.muted, fontSize: '12px', cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
