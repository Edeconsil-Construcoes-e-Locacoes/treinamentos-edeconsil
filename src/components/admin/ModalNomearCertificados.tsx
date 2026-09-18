import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cursosAPI } from '../../services/api'

interface ModalNomearCertificadosProps {
  onFechar: () => void
}

export function ModalNomearCertificados({ onFechar }: ModalNomearCertificadosProps) {
  const { C } = useTheme()
  const [cursos,     setCursos]     = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro,       setErro]       = useState('')
  const [valores,    setValores]    = useState<Record<string, string>>({})
  const [salvandoId, setSalvandoId] = useState<string | null>(null)
  const [salvoId,    setSalvoId]    = useState<string | null>(null)

  // Recarrega sempre que abre — mais simples que cache e evita nome_certificado
  // desatualizado se outro admin editou entre uma abertura e outra.
  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const data = await cursosAPI.listar() as any[]
      const lista = Array.isArray(data) ? data : []
      setCursos(lista)
      const iniciais: Record<string, string> = {}
      lista.forEach(c => { iniciais[c.id] = c.nome_certificado ?? '' })
      setValores(iniciais)
    } catch (err) {
      console.error('Erro ao carregar cursos:', err)
      setErro('Erro ao carregar cursos. Verifique a conexão.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const salvar = async (curso: any) => {
    setSalvandoId(curso.id)
    setSalvoId(null)
    try {
      await cursosAPI.atualizar(curso.id, { nome_certificado: valores[curso.id] || null })
      setSalvoId(curso.id)
      // Recarrega para confirmar o valor realmente persistido (não só o que
      // o input tinha), no mesmo espírito do refetch ao abrir.
      await carregar()
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao salvar nome de exibição.')
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>
            Nomes no Certificado
          </h2>
          <button
            onClick={onFechar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 20px', lineHeight: 1.5 }}>
          O nome definido aqui aparece nos certificados deste curso — já emitidos e futuros —,
          no lugar do título interno. Deixe em branco para usar o título.
        </p>

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>
            ⚠️ {erro}
          </div>
        )}

        {carregando && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', color: C.muted }}>
            <div style={{ width: '20px', height: '20px', border: `3px solid ${C.border}`, borderTopColor: '#0d2550', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Carregando cursos...
          </div>
        )}

        {!carregando && cursos.length === 0 && !erro && (
          <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', padding: '24px 0' }}>
            Nenhum curso cadastrado.
          </p>
        )}

        {!carregando && cursos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cursos.map(curso => (
              <div
                key={curso.id}
                style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 14px' }}
              >
                <p style={{ fontSize: '12px', fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
                  {curso.titulo}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={valores[curso.id] ?? ''}
                    onChange={e => setValores(v => ({ ...v, [curso.id]: e.target.value }))}
                    placeholder={`Padrão: ${curso.titulo}`}
                    style={{ flex: 1, padding: '8px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '13px', color: C.text, boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={() => salvar(curso)}
                    disabled={salvandoId === curso.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px',
                      background: salvoId === curso.id ? '#10b981' : '#F5C400',
                      color: '#0d2550', border: 'none', borderRadius: '6px',
                      fontSize: '12px', fontWeight: 700,
                      cursor: salvandoId === curso.id ? 'not-allowed' : 'pointer',
                      opacity: salvandoId === curso.id ? 0.7 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {salvoId === curso.id
                      ? (<><Check size={13} /> Salvo</>)
                      : (salvandoId === curso.id ? 'Salvando...' : 'Salvar')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onFechar}
            style={{ padding: '9px 18px', background: '#0d2550', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
