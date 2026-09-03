import { useTheme } from '../../contexts/ThemeContext'
import { Logo } from '../Logo'
import {
  BarChart2, Grid3x3, BookOpen,
  MessageSquare, LogOut
} from 'lucide-react'

const navGestao = [
  { label: 'Cursos',                 page: 'cursosAdmin' },
  { label: 'Turmas',                 page: 'turmasAdmin' },
  { label: 'Matriz de Cursos',       page: 'matrizCursosAdmin', icon: Grid3x3 },
  { label: 'Alunos',                 page: 'alunosAdmin' },
  { label: 'Instrutores',            page: 'instrutoresAdmin' },
  { label: 'Certificados',           page: 'certificadosAdmin' },
  { label: 'Controle de Frequência', page: 'controleFrequencia' },
  { label: 'Avaliações',             page: 'avaliacoesAdmin' },
  { label: 'Biblioteca',             page: 'bibliotecaAdmin' },
]

const navAdmin = [
  { label: 'Mensagens',      page: 'mensagensAdmin'    },
  { label: 'Indicadores',    page: 'indicadoresAdmin'  },
  { label: 'Notificações',   page: 'notificacoesAdmin'  },
  { label: 'Configurações',  page: 'configuracoesAdmin' },
  { label: 'Permissões',     page: 'permissoesAdmin'   },
]

interface SidebarAdminProps {
  paginaAtiva: string
  onNavigate: (page: string) => void
  onLogout: () => void
}

export function SidebarAdmin({ paginaAtiva, onNavigate, onLogout }: SidebarAdminProps) {
  const { C } = useTheme()

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      height: '100vh',
    }}>

      {/* Logo */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
      }}>
        <Logo height={32} />
        <div>
          <div style={{ fontSize: '8px', fontWeight: 700, color: C.text, letterSpacing: '1.5px' }}>UNIVERSIDADE</div>
          <div style={{ fontSize: '8px', color: C.blue, letterSpacing: '1px' }}>CORPORATIVA</div>
        </div>
      </div>

      {/* Dashboard */}
      <div style={{ padding: '12px 8px 4px', flexShrink: 0 }}>
        <div
          onClick={() => onNavigate('admin')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
            background: paginaAtiva === 'admin' ? C.blue : 'transparent',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { if (paginaAtiva !== 'admin') e.currentTarget.style.background = 'rgba(26,86,255,0.08)' }}
          onMouseLeave={e => { if (paginaAtiva !== 'admin') e.currentTarget.style.background = 'transparent' }}
        >
          <BarChart2 size={15} color={paginaAtiva === 'admin' ? '#fff' : C.muted} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: paginaAtiva === 'admin' ? '#fff' : C.muted2 }}>
            Dashboard
          </span>
        </div>
      </div>

      {/* Minhas Aulas — o admin também faz cursos e tira certificado */}
      <div style={{ padding: '0 8px 4px', flexShrink: 0 }}>
        <div
          onClick={() => onNavigate('minhasAulas')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
            background: paginaAtiva === 'minhasAulas' ? C.blue : 'transparent',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { if (paginaAtiva !== 'minhasAulas') e.currentTarget.style.background = 'rgba(26,86,255,0.08)' }}
          onMouseLeave={e => { if (paginaAtiva !== 'minhasAulas') e.currentTarget.style.background = 'transparent' }}
        >
          <BookOpen size={15} color={paginaAtiva === 'minhasAulas' ? '#fff' : C.muted} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: paginaAtiva === 'minhasAulas' ? '#fff' : C.muted2 }}>
            Minhas Aulas
          </span>
        </div>
      </div>

      {/* GESTÃO */}
      <div style={{ padding: '0 8px', flexShrink: 0 }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, color: C.muted,
          letterSpacing: '1px', padding: '12px 12px 6px',
          textTransform: 'uppercase',
        }}>
          Gestão
        </div>
        {navGestao.map(item => {
          const ativo = paginaAtiva === item.page && item.page !== ''
          return (
            <div
              key={item.label}
              onClick={() => item.page && onNavigate(item.page)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px',
                cursor: item.page ? 'pointer' : 'default',
                background: ativo ? 'rgba(26,86,255,0.15)' : 'transparent',
                borderLeft: ativo ? `3px solid ${C.blue}` : '3px solid transparent',
                marginBottom: '1px', transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!ativo && item.page) e.currentTarget.style.background = 'rgba(26,86,255,0.06)' }}
              onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                fontSize: '13px',
                fontWeight: ativo ? 700 : 400,
                color: ativo ? C.blue : item.page ? C.muted2 : C.muted,
              }}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ADMINISTRAÇÃO */}
      <div style={{ padding: '0 8px', flexShrink: 0 }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, color: C.muted,
          letterSpacing: '1px', padding: '12px 12px 6px',
          textTransform: 'uppercase',
        }}>
          Administração
        </div>
        {navAdmin.map(item => {
          const ativo = paginaAtiva === item.page && item.page !== ''
          return (
            <div
              key={item.label}
              onClick={() => item.page && onNavigate(item.page)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px',
                cursor: item.page ? 'pointer' : 'default',
                background: ativo ? 'rgba(26,86,255,0.15)' : 'transparent',
                borderLeft: ativo ? `3px solid ${C.blue}` : '3px solid transparent',
                marginBottom: '1px', transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!ativo && item.page) e.currentTarget.style.background = 'rgba(26,86,255,0.06)' }}
              onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                fontSize: '13px',
                fontWeight: ativo ? 700 : 400,
                color: ativo ? C.blue : item.page ? C.muted2 : C.muted,
              }}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Espaço flex */}
      <div style={{ flex: 1 }} />

      {/* Suporte EAD + Sair */}
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <div style={{
          background: 'rgba(26,86,255,0.08)',
          border: `1px solid ${C.border}`,
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '8px',
          cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <MessageSquare size={13} color={C.blue} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.blue }}>Suporte EAD</span>
          </div>
          <p style={{ fontSize: '10px', color: C.muted, margin: 0, lineHeight: 1.4 }}>
            Precisa de ajuda? Fale com nosso suporte
          </p>
        </div>

        <div
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 12px', borderRadius: '8px',
            cursor: 'pointer', transition: 'all 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={14} color={C.muted} />
          <span style={{ fontSize: '13px', color: C.muted }}>Sair</span>
        </div>
      </div>
    </aside>
  )
}
