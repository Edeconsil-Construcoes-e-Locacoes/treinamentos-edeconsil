import { useTheme } from '../contexts/ThemeContext'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { MeusCursosConteudo } from './MeusCursosConteudo'

interface MeusCursosListaProps {
  onNavigate: (page: string) => void
  onLogout: () => void
  onAbrirCurso: (cursoId: string) => void
}

/**
 * Tela do colaborador: só o layout. Todo o conteúdo (lista, filtros, cards,
 * progresso) vive no MeusCursosConteudo, que os painéis de admin e instrutor
 * também usam em "Minhas Aulas".
 */
export function MeusCursosLista({ onNavigate, onLogout, onAbrirCurso }: MeusCursosListaProps) {
  const { C } = useTheme()

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar paginaAtiva="meusCursos" onNavigate={onNavigate} onLogout={onLogout} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar titulo="Meus Cursos" subtitulo="Todos os cursos matriculados" onNavigate={onNavigate} />
        <MeusCursosConteudo onAbrirCurso={onAbrirCurso} />
      </main>
    </div>
  )
}
