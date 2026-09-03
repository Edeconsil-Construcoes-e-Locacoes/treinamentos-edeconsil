import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { frequenciaAPI } from '../../services/api'
import { imprimirFrequencia, type DadosFrequencia } from '../../utils/imprimirFrequencia'

interface ControleFrequenciaProps {
  onNavigate?: (page: string) => void
  onLogout?: () => void
  /** Dentro do painel de admin/instrutor: devolve só o conteúdo, sem a
   *  sidebar e a topbar do painel (já providas por fora). */
  embutido?: boolean
}

export function ControleFrequencia({ onNavigate, onLogout, embutido = false }: ControleFrequenciaProps) {
  const { C } = useTheme()

  const [cursos, setCursos] = useState<{ id: string; titulo: string; slug: string }[]>([])
  const [cursoId, setCursoId] = useState('')
  const [carregandoCursos, setCarregandoCursos] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const lista = await frequenciaAPI.listarCursos()
        if (!cancelado) setCursos(lista ?? [])
      } catch (e) {
        if (!cancelado) setErro(e instanceof Error ? e.message : 'Erro ao carregar cursos')
      } finally {
        if (!cancelado) setCarregandoCursos(false)
      }
    }
    carregar()
    return () => { cancelado = true }
  }, [])

  const handleGerar = async () => {
    if (!cursoId) return
    setGerando(true)
    setErro('')
    setAviso('')
    try {
      const dados = await frequenciaAPI.obter(cursoId) as DadosFrequencia
      if (!dados.alunos || dados.alunos.length === 0) {
        setAviso('Nenhum aluno concluiu este curso ainda')
        return
      }
      imprimirFrequencia(dados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar controle de frequência')
    } finally {
      setGerando(false)
    }
  }

  const Moldura = ({ children }: { children: React.ReactNode }) =>
    embutido ? <>{children}</> : (
      <LayoutAdmin
        paginaAtiva="controleFrequencia"
        onNavigate={onNavigate ?? (() => {})}
        onLogout={onLogout ?? (() => {})}
        topbarTitulo="Controle de Frequência"
        topbarSubtitulo="Gere o FOR-CRH-005 com os alunos que concluíram o curso"
      >
        {children}
      </LayoutAdmin>
    )

  return (
    <Moldura>
      <div style={{ padding: '32px', maxWidth: '640px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
          Controle de Frequência
        </h1>
        <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>
          Selecione um curso para gerar o formulário FOR-CRH-005 com os alunos que concluíram o treinamento.
        </p>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '8px' }}>
            Curso
          </label>
          <select
            value={cursoId}
            onChange={e => { setCursoId(e.target.value); setAviso(''); setErro('') }}
            disabled={carregandoCursos}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: `1px solid ${C.border}`, background: C.bg, color: C.text,
              fontSize: '13px', fontFamily: "'Inter',sans-serif", marginBottom: '16px',
            }}
          >
            <option value="">{carregandoCursos ? 'Carregando cursos...' : 'Selecione um curso'}</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.titulo}</option>
            ))}
          </select>

          {erro && (
            <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 12px' }}>{erro}</p>
          )}
          {aviso && (
            <p style={{ fontSize: '12px', color: '#F5C400', margin: '0 0 12px' }}>{aviso}</p>
          )}

          <button
            onClick={handleGerar}
            disabled={!cursoId || gerando}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
              background: !cursoId || gerando ? C.border : '#F5C400',
              color: !cursoId || gerando ? C.muted : '#0d2550',
              fontSize: '13px', fontWeight: 700, cursor: !cursoId || gerando ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            {gerando ? 'Gerando...' : 'Gerar Controle de Frequência'}
          </button>
        </div>
      </div>
    </Moldura>
  )
}
