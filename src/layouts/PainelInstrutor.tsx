import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useResponsive } from '../hooks/useResponsive'
import { useUsuarioLogado } from '../hooks/useUsuarioLogado'
import { SidebarInstrutor } from '../components/instrutor/SidebarInstrutor'
import { TopbarAdmin } from '../components/admin/TopbarAdmin'
import { DashboardInstrutor } from '../pages/instrutor/DashboardInstrutor'
import { TurmaInstrutor } from '../pages/instrutor/TurmaInstrutor'
import { AlunosInstrutor } from '../pages/instrutor/AlunosInstrutor'
import { CursosInstrutor } from '../pages/instrutor/CursosInstrutor'
import { MensagensConteudo } from '../pages/admin/MensagensConteudo'
import { BibliotecaConteudo } from '../pages/admin/BibliotecaConteudo'
import { CursoDetalheConteudo } from '../pages/admin/CursoDetalheConteudo'
import { CertificadosInstrutor } from '../pages/instrutor/CertificadosInstrutor'
import { IndicadoresInstrutor } from '../pages/instrutor/IndicadoresInstrutor'
import { NotificacoesInstrutor } from '../pages/instrutor/NotificacoesInstrutor'
import { MeusCursosConteudo } from '../pages/MeusCursosConteudo'
import { FluxoCursoAluno } from '../pages/FluxoCursoAluno'

type PaginaInstrutor =
  | 'dashboardInstrutor'
  | 'minhasAulas'
  | 'turmaInstrutor'
  | 'alunosInstrutor'
  | 'cursosInstrutor'
  | 'cursoDetalheInstrutor'
  | 'mensagensInstrutor'
  | 'bibliotecaInstrutor'
  | 'certificadosInstrutor'
  | 'indicadoresInstrutor'
  | 'notificacoesInstrutor'

interface PainelInstrutorProps {
  onLogout: () => void
}

const TITULOS: Record<PaginaInstrutor, string> = {
  dashboardInstrutor:      'Painel do Instrutor',
  minhasAulas:             'Minhas Aulas',
  turmaInstrutor:          'Minha Turma',
  alunosInstrutor:         'Alunos',
  cursosInstrutor:         'Cursos',
  cursoDetalheInstrutor:   'Detalhe do Curso',
  mensagensInstrutor:      'Mensagens',
  bibliotecaInstrutor:     'Biblioteca',
  certificadosInstrutor:   'Certificados',
  indicadoresInstrutor:    'Indicadores',
  notificacoesInstrutor:   'Notificações',
}

export function PainelInstrutor({ onLogout }: PainelInstrutorProps) {
  const { C } = useTheme()
  const { isMobile, isTablet } = useResponsive()
  const isSmall = isMobile || isTablet
  const { nome } = useUsuarioLogado()
  const [pagina, setPagina] = useState<PaginaInstrutor>('dashboardInstrutor')
  const [cursoAtivoId, setCursoAtivoId] = useState('')
  // Curso aberto por "Minhas Aulas": o fluxo do aluno ocupa a tela inteira.
  const [cursoAluno, setCursoAluno] = useState<string | null>(null)
  const [etapaCurso, setEtapaCurso] = useState<'detalhe' | 'video' | 'prova'>('detalhe')
  const [sidebarAberta, setSidebarAberta] = useState(false)

  function navegar(p: string) {
    setPagina(p as PaginaInstrutor)
    setSidebarAberta(false)
  }

  // Em "Minhas Aulas" o titulo acompanha a etapa do curso aberto.
  const tituloAtual = pagina === 'minhasAulas' && cursoAluno
    ? (etapaCurso === 'video' ? 'Vídeo Aula' : 'Detalhes do Curso')
    : TITULOS[pagina]

  function renderConteudo() {
    switch (pagina) {
      case 'minhasAulas':
        // Curso aberto: o fluxo entra na area de conteudo, com a sidebar do
        // painel por fora. A prova sobe como overlay (ver FluxoCursoAluno).
        return cursoAluno ? (
          <FluxoCursoAluno
            embutido
            cursoSlug={cursoAluno}
            onSair={() => { setCursoAluno(null); setEtapaCurso('detalhe') }}
            onLogout={onLogout}
            onEtapaChange={setEtapaCurso}
          />
        ) : (
          <MeusCursosConteudo onAbrirCurso={(slug) => setCursoAluno(slug)} />
        )
      case 'dashboardInstrutor':
        return <DashboardInstrutor onNavigate={navegar} />
      case 'turmaInstrutor':
        return <TurmaInstrutor onNavigate={navegar} />
      case 'alunosInstrutor':
        return <AlunosInstrutor onNavigate={navegar} />
      case 'cursosInstrutor':
        return (
          <CursosInstrutor
            onNavigate={navegar}
            onAbrirCurso={(slug) => {
              setCursoAtivoId(slug)
              setPagina('cursoDetalheInstrutor')
            }}
          />
        )
      case 'cursoDetalheInstrutor':
        return (
          <CursoDetalheConteudo
            cursoId={cursoAtivoId}
            onNavigate={navegar}
            onVoltar={() => setPagina('cursosInstrutor')}
          />
        )
      case 'mensagensInstrutor':
        return <MensagensConteudo onNavigate={navegar} />
      case 'bibliotecaInstrutor':
        return <BibliotecaConteudo onNavigate={navegar} />
      case 'certificadosInstrutor':
        return <CertificadosInstrutor onNavigate={navegar} />
      case 'indicadoresInstrutor':
        return <IndicadoresInstrutor onNavigate={navegar} />
      case 'notificacoesInstrutor':
        return <NotificacoesInstrutor onNavigate={navegar} />
      default:
        return <DashboardInstrutor onNavigate={navegar} />
    }
  }

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: C.bg,
      color: C.text,
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {isSmall && sidebarAberta && (
        <div
          onClick={() => setSidebarAberta(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 499 }}
        />
      )}

      <div style={{
        position: isSmall ? 'fixed' : 'relative',
        top: isSmall ? 0 : 'auto',
        left: isSmall ? 0 : 'auto',
        bottom: isSmall ? 0 : 'auto',
        zIndex: isSmall ? 500 : 'auto',
        transform: isSmall
          ? sidebarAberta ? 'translateX(0)' : 'translateX(-100%)'
          : 'none',
        transition: isSmall ? 'transform 280ms ease' : 'none',
        width: '220px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: isSmall ? '100vh' : 'auto',
      } as React.CSSProperties}>
        {isSmall && (
          <button
            onClick={() => setSidebarAberta(false)}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 1 }}
          >
            <X size={18} color={C.muted} />
          </button>
        )}
        <SidebarInstrutor
          paginaAtual={pagina}
          onNavigate={navegar}
          onLogout={onLogout}
          nome={nome}
        />
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isSmall ? (
          <div style={{
            height: '56px', background: C.surface, borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarAberta(!sidebarAberta)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '8px' }}
            >
              <Menu size={22} color={C.text} />
            </button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>
              {tituloAtual}
            </span>
          </div>
        ) : (
          <TopbarAdmin
            titulo={tituloAtual}
            onNavigate={navegar}
          />
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderConteudo()}
        </div>
      </main>
    </div>
  )
}
