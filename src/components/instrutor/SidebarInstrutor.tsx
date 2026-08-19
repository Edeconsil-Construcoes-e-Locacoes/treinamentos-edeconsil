import { useTheme } from '../../contexts/ThemeContext'
import { Logo } from '../Logo'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  MessageSquare, FileText, LogOut, Award, BarChart2, Bell
} from 'lucide-react'

const navInstrutor = [
  { label: 'Início',        page: 'dashboardInstrutor',    icon: LayoutDashboard },
  { label: 'Minhas Aulas',  page: 'minhasAulas',           icon: GraduationCap   },
  { label: 'Minha Turma',   page: 'turmaInstrutor',        icon: Users           },
  { label: 'Alunos',        page: 'alunosInstrutor',       icon: GraduationCap   },
  { label: 'Cursos',        page: 'cursosInstrutor',       icon: BookOpen        },
  { label: 'Certificados',  page: 'certificadosInstrutor', icon: Award           },
  { label: 'Indicadores',   page: 'indicadoresInstrutor',  icon: BarChart2       },
  { label: 'Notificações',  page: 'notificacoesInstrutor', icon: Bell            },
  { label: 'Mensagens',     page: 'mensagensInstrutor',    icon: MessageSquare   },
  { label: 'Biblioteca',    page: 'bibliotecaInstrutor',   icon: FileText        },
]

interface SidebarInstrutorProps {
  paginaAtual: string
  onNavigate: (page: string) => void
  onLogout: () => void
  nome: string
}

export function SidebarInstrutor({ paginaAtual, onNavigate, onLogout, nome }: SidebarInstrutorProps) {
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

      <div style={{ padding: '12px 8px', flexShrink: 0 }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, color: C.muted,
          letterSpacing: '1px', padding: '4px 12px 8px',
          textTransform: 'uppercase',
        }}>
          Instrutor
        </div>
        {navInstrutor.map(({ label, page, icon: Icon }) => {
          const ativo = paginaAtual === page
          return (
            <div
              key={page}
              onClick={() => onNavigate(page)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                background: ativo ? 'rgba(26,86,255,0.15)' : 'transparent',
                borderLeft: ativo ? `3px solid ${C.blue}` : '3px solid transparent',
                marginBottom: '1px', transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = 'rgba(26,86,255,0.06)' }}
              onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={14} color={ativo ? C.blue : C.muted} />
              <span style={{
                fontSize: '13px',
                fontWeight: ativo ? 700 : 400,
                color: ativo ? C.blue : C.muted2,
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '8px', flexShrink: 0 }}>
        <div style={{
          background: 'rgba(245,196,0,0.08)',
          border: `1px solid rgba(245,196,0,0.25)`,
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '8px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5C400', marginBottom: '2px' }}>
            {nome || 'Instrutor'}
          </div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(245,196,0,0.15)',
            border: '1px solid rgba(245,196,0,0.30)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#F5C400',
          }}>
            INSTRUTOR
          </div>
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
