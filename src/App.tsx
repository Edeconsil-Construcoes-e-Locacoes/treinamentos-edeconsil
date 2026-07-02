import React, { useState } from 'react'
import Login from './pages/Login'
import { DashboardColaborador } from './pages/DashboardColaborador'
import { DashboardAdmin } from './pages/DashboardAdmin'
import { MeusCursosLista } from './pages/MeusCursosLista'
import { CursoDetalheColaborador } from './pages/CursoDetalheColaborador'
import { VideoAulaColaborador } from './pages/VideoAulaColaborador'
import { TrilhaAprendizado } from './pages/TrilhaAprendizado'
import { CursosAdmin } from './pages/admin/CursosAdmin'
import { CursoDetalheAdmin } from './pages/admin/CursoDetalheAdmin'
import { IndicadoresAdmin } from './pages/admin/IndicadoresAdmin'
import { TurmasAdmin } from './pages/admin/TurmasAdmin'
import { MatrizCursosAdmin } from './pages/admin/MatrizCursosAdmin'
import { AlunosAdmin } from './pages/admin/AlunosAdmin'
import { InstrutoresAdmin } from './pages/admin/InstrutoresAdmin'
import { CertificadosAdmin } from './pages/admin/CertificadosAdmin'
import { BibliotecaAdmin } from './pages/admin/BibliotecaAdmin'
import { ConfiguracoesAdmin } from './pages/admin/ConfiguracoesAdmin'
import { PermissoesAdmin } from './pages/admin/PermissoesAdmin'
import { CertificadosColaborador } from './pages/CertificadosColaborador'
import { ApostilasColaborador } from './pages/ApostilasColaborador'
import { MensagensColaborador } from './pages/MensagensColaborador'
import { MensagensConteudo }    from './pages/admin/MensagensConteudo'
import { LayoutAdmin }          from './components/admin/LayoutAdmin'
import { NotificacoesAdmin }   from './pages/admin/NotificacoesAdmin'
import { AnotacoesColaborador } from './pages/AnotacoesColaborador'
import { EdeconQuiz } from './pages/EdeconQuiz'
import { ProvaOnline } from './pages/ProvaOnline'
import { PainelInstrutor } from './layouts/PainelInstrutor'
import { ThemeProvider } from './contexts/ThemeContext'
import { getUsuario, sessaoAtiva, limparSessao } from './services/authStorage'
import './App.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (
      error.message.includes('removeChild') ||
      error.message.includes('Extension') ||
      error.message.includes('pinComponent') ||
      error.message.includes('NotFoundError')
    ) {
      console.warn('Erro de extensão do navegador ignorado:', error.message)
      this.setState({ hasError: false, error: null })
      return
    }
    console.error('Erro na aplicação:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: '16px', fontFamily: 'Inter, sans-serif',
          background: '#050d1a', color: '#ffffff',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', margin: 0 }}>
            Algo deu errado
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
            Uma extensão do navegador pode estar causando conflito.
            Tente recarregar a página ou usar o modo anônimo.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', background: '#1a56ff',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

type Perfil = 'colaborador' | 'admin' | 'instrutor'
type Pagina = 'dashboard' | 'meusCursos' | 'meusCursosLista' | 'cursoDetalhe' | 'videoAula' | 'trilha' | 'mensagens' | 'anotacoes' | 'prova' | 'edeconQuiz' | 'admin' | 'cursosAdmin' | 'cursoDetalheAdmin' | 'indicadoresAdmin' | 'turmasAdmin' | 'matrizCursosAdmin' | 'alunosAdmin' | 'instrutoresAdmin' | 'certificadosAdmin' | 'bibliotecaAdmin' | 'configuracoesAdmin' | 'permissoesAdmin' | 'certificadosColaborador' | 'apostilas' | 'mensagensAdmin' | 'notificacoesAdmin'

function AppContent() {
  // Limpar sessões antigas (sem campo 'id' no usuário)
  const usuarioAtual = getUsuario<{ id?: string; nome?: string }>()
  if (usuarioAtual && !usuarioAtual.id) {
    limparSessao()
  }

  const [logado, setLogado] = useState(() => sessaoAtiva())
  const [perfil, setPerfil] = useState<Perfil>(() => {
    const u = getUsuario<{ perfil: string }>()
    if (u?.perfil === 'admin') return 'admin'
    if (u?.perfil === 'instrutor') return 'instrutor'
    return 'colaborador'
  })
  const [pagina, setPagina] = useState<Pagina>('dashboard')
  const [cursoAtivoId, setCursoAtivoId] = useState<string>('coord-suprimentos')
  const [moduloAtivoId, setModuloAtivoId] = useState<number>(1)
  const [aulaAtivaId, setAulaAtivaId] = useState<number>(1)
  const [cursoProvaSlug, setCursoProvaSlug]     = useState('coord-suprimentos')
  const [cursoProvaTitulo, setCursoProvaTitulo] = useState('Coordenação de Suprimentos')
  const [navKey, setNavKey] = useState(0)

  const handleLogout = () => {
    limparSessao()
    setLogado(false)
  }

  if (!logado) {
    return (
      <Login onLogin={(p) => {
        setPerfil(p as Perfil)
        setLogado(true)
      }} />
    )
  }

  if (perfil === 'instrutor') {
    return (
      <PainelInstrutor
        onLogout={handleLogout}
      />
    )
  }

  if (perfil === 'admin') {
    if (pagina === 'cursosAdmin') return (
      <CursosAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
        onAbrirCurso={(slug) => { setCursoAtivoId(slug); setPagina('cursoDetalheAdmin') }}
      />
    )
    if (pagina === 'cursoDetalheAdmin') return (
      <CursoDetalheAdmin
        cursoId={cursoAtivoId}
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
        onVoltar={() => setPagina('cursosAdmin')}
      />
    )
    if (pagina === 'indicadoresAdmin') return (
      <IndicadoresAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'turmasAdmin') return (
      <TurmasAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'matrizCursosAdmin') return (
      <MatrizCursosAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'alunosAdmin') return (
      <AlunosAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'instrutoresAdmin') return (
      <InstrutoresAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'certificadosAdmin') return (
      <CertificadosAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'bibliotecaAdmin') return (
      <BibliotecaAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
if (pagina === 'configuracoesAdmin') return (
      <ConfiguracoesAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    if (pagina === 'permissoesAdmin') return (
      <PermissoesAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={() => { limparSessao(); setLogado(false) }}
      />
    )
    if (pagina === 'mensagensAdmin') return (
      <LayoutAdmin
        paginaAtiva="mensagensAdmin"
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      >
        <MensagensConteudo
          onNavigate={(p) => setPagina(p as Pagina)} />
      </LayoutAdmin>
    )
    if (pagina === 'notificacoesAdmin') return (
      <NotificacoesAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
    return (
      <DashboardAdmin
        onNavigate={(p) => setPagina(p as Pagina)}
        onLogout={handleLogout}
      />
    )
  }

  if (pagina === 'edeconQuiz') return (
    <EdeconQuiz
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={() => { limparSessao(); setLogado(false) }}
    />
  )

  if (pagina === 'prova') return (
    <ProvaOnline
      cursoSlug={cursoProvaSlug}
      cursoTitulo={cursoProvaTitulo}
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={() => { limparSessao(); setLogado(false) }}
      onVoltarDetalhe={() => {
        setCursoAtivoId(cursoProvaSlug)
        setNavKey(k => k + 1)
        setPagina('cursoDetalhe')
      }}
    />
  )

  if (pagina === 'meusCursos' || pagina === 'meusCursosLista') return (
    <MeusCursosLista
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
      onAbrirCurso={(id) => {
        setCursoAtivoId(id)
        setPagina('cursoDetalhe')
      }}
    />
  )

  if (pagina === 'cursoDetalhe') return (
    <CursoDetalheColaborador
      key={navKey}
      cursoId={cursoAtivoId}
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
      onVoltarLista={() => setPagina('meusCursos')}
      onAbrirAula={(id, modId, aulId) => {
        setCursoAtivoId(id)
        setModuloAtivoId(modId)
        setAulaAtivaId(aulId)
        setPagina('videoAula')
      }}
      onAbrirProva={(cursoId, titulo) => {
        setCursoProvaSlug(cursoId)
        setCursoProvaTitulo(titulo ?? 'Avaliação Final')
        setPagina('prova')
      }}
    />
  )

  if (pagina === 'videoAula') return (
    <VideoAulaColaborador
      cursoId={cursoAtivoId}
      moduloId={moduloAtivoId}
      aulaId={aulaAtivaId}
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
      onVoltarLista={() => setPagina('meusCursos')}
      onVoltarDetalhe={(id) => {
        setCursoAtivoId(id)
        setNavKey(k => k + 1)
        setPagina('cursoDetalhe')
      }}
      onTrocarAula={(id, modId, aulId) => {
        setCursoAtivoId(id)
        setModuloAtivoId(modId)
        setAulaAtivaId(aulId)
      }}
    />
  )

  if (pagina === 'trilha') return (
    <TrilhaAprendizado
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
    />
  )

  if (pagina === 'certificadosColaborador') return (
    <CertificadosColaborador
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
    />
  )

  if (pagina === 'apostilas') return (
    <ApostilasColaborador
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
    />
  )

  if (pagina === 'mensagens') return (
    <MensagensColaborador
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
    />
  )

  if (pagina === 'anotacoes') return (
    <AnotacoesColaborador
      onNavigate={(p) => setPagina(p as Pagina)}
      onLogout={handleLogout}
    />
  )

  return (
    <DashboardColaborador
      onLogout={handleLogout}
      onNavigate={(page) => setPagina(page as Pagina)}
    />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
