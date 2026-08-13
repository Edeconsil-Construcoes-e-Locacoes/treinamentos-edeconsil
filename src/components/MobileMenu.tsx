import { useState } from 'react'
import { Menu, X, Home, BookOpen, Award, FileText, MessageSquare, LogOut, ChevronRight } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface MobileMenuProps {
  paginaAtiva: string
  onNavigate: (page: string) => void
  onLogout: () => void
  userName?: string
  userRole?: string
  userInitials?: string
}

export function MobileMenu({
  paginaAtiva, onNavigate, onLogout,
  userName = 'Colaborador', userRole = 'Aluno', userInitials = 'C',
}: MobileMenuProps) {
  const { C } = useTheme()
  const [aberto, setAberto] = useState(false)

  const navItems = [
    { label: 'Início',        page: 'dashboard',               icon: Home       },
    { label: 'Meus Cursos',   page: 'meusCursos',              icon: BookOpen   },
    { label: 'Certificados',  page: 'certificadosColaborador', icon: Award      },
    { label: 'Apostilas',     page: 'apostilas',               icon: FileText   },
    { label: 'Mensagens',     page: 'mensagens',               icon: MessageSquare },
    { label: 'Trilhas',       page: 'trilha',                  icon: ChevronRight },
  ]

  const navegar = (page: string) => { onNavigate(page); setAberto(false) }

  return (
    <>
      {/* Topbar Mobile */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '56px', zIndex: 200,
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: '12px',
      }}>
        <button
          onClick={() => setAberto(!aberto)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: C.text }}
        >
          {aberto ? <X size={22} color={C.text} /> : <Menu size={22} color={C.text} />}
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Logo height={24} />
        </div>

        <ThemeToggle />
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {userInitials}
        </div>
      </div>

      {/* Overlay */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', zIndex: 300 }}
        />
      )}

      {/* Drawer lateral */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '280px', zIndex: 400,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        transform: aberto ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: aberto ? '4px 0 24px rgba(0,0,0,0.20)' : 'none',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo height={28} />
          <button onClick={() => setAberto(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color={C.muted} />
          </button>
        </div>

        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${C.blue}22`, border: `2px solid ${C.blue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: C.blue, flexShrink: 0 }}>
            {userInitials}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{userName}</div>
            <div style={{ fontSize: '12px', color: C.blue }}>{userRole}</div>
          </div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.muted, letterSpacing: '1px', padding: '8px 12px 6px', textTransform: 'uppercase' }}>
            Menu
          </div>
          {navItems.map(item => {
            const ativo = paginaAtiva === item.page
            return (
              <button
                key={item.page}
                onClick={() => navegar(item.page)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: ativo ? 'rgba(26,86,255,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: ativo ? `3px solid ${C.blue}` : '3px solid transparent',
                  cursor: 'pointer', marginBottom: '2px',
                  textAlign: 'left',
                }}
              >
                <item.icon size={18} color={ativo ? C.blue : C.muted} />
                <span style={{ fontSize: '14px', fontWeight: ativo ? 700 : 400, color: ativo ? C.blue : C.text }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => { onLogout(); setAberto(false) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LogOut size={16} color="#ef4444" />
            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 500 }}>Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}
