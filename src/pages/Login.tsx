import { useState } from 'react'
import {
  HardHat, ShieldCheck, BookOpen, TrendingUp,
  GraduationCap, User, Lock, Eye, EyeOff, ArrowRight
} from 'lucide-react'
import { Logo } from '../components/Logo'
import fundoTreinamento from '../assets/fundo-treinamento.png'
import { useResponsive } from '../hooks/useResponsive'
import { authAPI } from '../services/api'
import { salvarSessao } from '../services/authStorage'

interface LoginProps {
  onLogin: (perfil: 'colaborador' | 'admin' | 'instrutor') => void
}


const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const IconMicrosoft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#f25022" d="M1 1h10v10H1z"/>
    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
    <path fill="#7fba00" d="M1 13h10v10H1z"/>
    <path fill="#ffb900" d="M13 13h10v10H13z"/>
  </svg>
)

const diferenciais = [
  {
    icone: <HardHat size={16} color="#1a56ff" />,
    titulo: 'Especialização Técnica',
    desc: 'Cursos desenvolvidos por especialistas da construção civil.',
  },
  {
    icone: <ShieldCheck size={16} color="#1a56ff" />,
    titulo: 'Segurança em 1º Lugar',
    desc: 'Treinamentos essenciais para promover um ambiente de trabalho seguro.',
  },
  {
    icone: <BookOpen size={16} color="#1a56ff" />,
    titulo: 'Aprendizado Flexível',
    desc: 'Estude onde e quando quiser com conteúdo 100% online.',
  },
  {
    icone: <TrendingUp size={16} color="#1a56ff" />,
    titulo: 'Desempenho que Constrói',
    desc: 'Acompanhe seu progresso e evolua constantemente.',
  },
]

export default function Login({ onLogin }: LoginProps) {
  const { isMobile, isTablet } = useResponsive()
  const isSmall = isMobile || isTablet
  const [cpf, setCpf]           = useState('')
  const [senha, setSenha]       = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [focusCpf, setFocusCpf]   = useState(false)
  const [focusSenha, setFocusSenha] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroLogin('')

    const cpfLimpo = cpf.replace(/\D/g, '')

    if (cpfLimpo.length !== 11) {
      setErroLogin('CPF deve ter 11 dígitos.')
      return
    }

    if (!senha.trim()) {
      setErroLogin('Digite a senha.')
      return
    }

    const ehAdmin = cpfLimpo === '00000000000'
    if (!ehAdmin && (senha.length !== 8 || !/^\d+$/.test(senha))) {
      setErroLogin('Senha deve ser sua data de nascimento (DDMMAAAA — 8 dígitos).')
      return
    }

    setLoading(true)
    try {
      const resposta = await authAPI.login(cpfLimpo, senha)
      salvarSessao(resposta.token, resposta.usuario)
      const p = resposta.usuario.perfil as string
      if (p === 'admin') onLogin('admin')
      else if (p === 'instrutor') onLogin('instrutor')
      else onLogin('colaborador')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'CPF ou senha inválidos'
      setErroLogin(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: isSmall ? 'auto' : 'hidden',
      display: 'flex',
      fontFamily: "'Inter', sans-serif",
      background: isSmall ? `url(${fundoTreinamento}) center center / cover no-repeat` : 'none',
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .social-btn:hover {
          border-color: #1a56ff55 !important;
          background: #1a3060 !important;
        }
        .login-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>

      {/* PAINEL ESQUERDO — oculto em mobile/tablet */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: `url(${fundoTreinamento}) center center / cover no-repeat`,
        overflow: 'hidden',
        display: isSmall ? 'none' : 'block',
      }}>
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(5,13,26,0.88) 0%, rgba(5,13,26,0.55) 60%, rgba(5,13,26,0.20) 100%)',
          zIndex: 0,
        }} />

        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, #1a56ff15 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: 100, left: -50,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, #1a56ff10 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', top: '50%', right: 200,
          width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, #1a56ff08 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* LOGO */}
        <div style={{
          position: 'absolute',
          top: '36px',
          left: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 10,
        }}>
          <Logo height={58} forceClara />
          <div style={{
            width: '1.5px',
            height: '38px',
            background: 'rgba(255,255,255,0.25)',
            flexShrink: 0,
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '3px',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Universidade
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#1a56ff',
              letterSpacing: '3px',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Corporativa
            </span>
          </div>
        </div>

        {/* CONTEÚDO CENTRAL */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '38px 45px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          height: '100%',
        }}>
          {/* Badge */}
          <div style={{ marginTop: 120 }}>
            <span style={{
              display: 'inline-block',
              border: '1px solid rgba(26,86,255,0.60)',
              background: 'rgba(5,15,40,0.75)',
              borderRadius: 20, padding: '6px 16px',
              color: '#1a56ff', fontSize: 9, fontWeight: 600, letterSpacing: 3,
            }}>PLATAFORMA EAD</span>
          </div>

          {/* Headline */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Capacitação</div>
            <div style={{
              fontSize: 38, fontWeight: 800, lineHeight: 1.1,
              background: 'linear-gradient(90deg, #1a56ff, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Inteligente</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>para Construção Civil</div>
          </div>

          {/* Subtítulo */}
          <div style={{ marginTop: 16, fontSize: 12, color: '#8899aa', lineHeight: 1.6 }}>
            Formação técnica, segurança e excelência<br />
            para quem constrói o <span style={{ color: '#1a56ff' }}>futuro.</span>
          </div>

          {/* Diferenciais */}
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {diferenciais.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 35, height: 35, background: 'rgba(5,15,40,0.75)',
                  border: '1px solid rgba(26,86,255,0.55)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.icone}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>{item.titulo}</p>
                  <p style={{ fontSize: 10, color: '#8899aa', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marca d'água */}
        <div style={{
          position: 'absolute', bottom: 32, left: 56, zIndex: 1,
          fontSize: 11, color: '#ffffff20', letterSpacing: 6, fontWeight: 700,
        }}>EDECONSIL</div>
      </div>

      {/* PAINEL DIREITO */}
      <div style={{
        position: isSmall ? 'relative' : 'absolute',
        right: isSmall ? 'auto' : '48px',
        top: isSmall ? 'auto' : '50%',
        transform: isSmall ? 'none' : 'translateY(-50%)',
        width: isSmall ? '100%' : '420px',
        maxWidth: isSmall ? '440px' : 'none',
        margin: isSmall ? 'auto' : '0',
        background: 'linear-gradient(160deg, rgba(10,22,40,0.97) 0%, rgba(5,13,26,0.99) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(26,86,255,0.22)',
        borderRadius: isSmall ? '20px' : '28px',
        padding: isSmall ? '26px 24px' : '38px 44px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(26,86,255,0.10)',
        zIndex: 10,
        alignSelf: isSmall ? 'center' : 'auto',
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340 }}>

          {/* Ícone topo */}
          <div style={{
            width: 58, height: 58,
            background: 'linear-gradient(135deg, #1a56ff22, #1a56ff44)',
            border: '1px solid #1a56ff55',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 19px',
          }}>
            <GraduationCap size={26} color="#1a56ff" />
          </div>

          {/* Título */}
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#fff',
            textAlign: 'center', margin: '0 0 8px',
          }}>Bem-vindo!</h1>

          {/* Subtítulo */}
          <p style={{
            fontSize: 12, color: '#8899aa', textAlign: 'center',
            lineHeight: 1.6, margin: '0 0 32px',
          }}>
            Acesse sua conta para continuar<br />
            na Universidade Corporativa.
          </p>

          {/* Campo CPF */}
          <div>
            <label htmlFor="cpf" style={{
              display: 'block', fontSize: 10, fontWeight: 500,
              color: '#ccddee', margin: '0 0 8px',
            }}>CPF</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#8899aa" style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }} />
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={e => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                onFocus={() => setFocusCpf(true)}
                onBlur={() => setFocusCpf(false)}
                placeholder="00000000000"
                maxLength={11}
                inputMode="numeric"
                autoComplete="off"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 35px 12px 35px',
                  background: '#0d1f3c',
                  border: `1px solid ${focusCpf ? '#1a56ff' : '#1a56ff33'}`,
                  borderRadius: 10, color: '#fff', fontSize: 12,
                  outline: 'none', transition: 'all 200ms',
                  boxShadow: focusCpf ? '0 0 0 3px #1a56ff22' : 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              {cpf.length > 0 && cpf.length < 11 && (
                <span style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11, color: '#f59e0b', fontWeight: 600,
                  pointerEvents: 'none',
                }}>
                  {cpf.length}/11
                </span>
              )}
              {cpf.length === 11 && (
                <span style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16, color: '#10b981',
                  pointerEvents: 'none',
                }}>
                  ✓
                </span>
              )}
            </div>
          </div>

          {/* Campo Senha */}
          <div style={{ marginTop: 16 }}>
            <label htmlFor="senha" style={{
              display: 'block', fontSize: 10, fontWeight: 500,
              color: '#ccddee', margin: '0 0 8px',
            }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#8899aa" style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }} />
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onFocus={() => setFocusSenha(true)}
                onBlur={() => setFocusSenha(false)}
                placeholder="Senha (data de nascimento: DDMMAAAA)"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 35px 12px 35px',
                  background: '#0d1f3c',
                  border: `1px solid ${focusSenha ? '#1a56ff' : '#1a56ff33'}`,
                  borderRadius: 10, color: '#fff', fontSize: 12,
                  outline: 'none', transition: 'all 200ms',
                  boxShadow: focusSenha ? '0 0 0 3px #1a56ff22' : 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', alignItems: 'center',
                }}
              >
                {mostrarSenha
                  ? <EyeOff size={16} color="#8899aa" />
                  : <Eye size={16} color="#8899aa" />}
              </button>
            </div>
          </div>

          {/* Lembrar + Esqueci */}
          <div style={{
            marginTop: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            }}>
              <div
                onClick={() => setLembrar(v => !v)}
                role="checkbox"
                aria-checked={lembrar}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && setLembrar(v => !v)}
                style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: lembrar ? '#1a56ff' : 'transparent',
                  border: '1px solid #1a56ff55',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 150ms',
                }}
              >
                {lembrar && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, color: '#8899aa' }}>Lembrar-me</span>
            </label>

            <span style={{ fontSize: 13, color: '#8899aa' }}>
              Esqueceu? Contate o RH
            </span>
          </div>

          {/* Erro de login */}
          {erroLogin && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.30)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#ef4444',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              ⚠️ {erroLogin}
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="login-btn"
            style={{
              marginTop: 24,
              width: '100%', padding: '13px',
              background: 'linear-gradient(90deg, #1a56ff, #3b82f6)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px #1a56ff44',
              transition: 'all 200ms',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid #ffffff44', borderTopColor: '#fff',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* Divisor */}
          <div style={{
            marginTop: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: '#1a56ff22' }} />
            <span style={{ fontSize: 12, color: '#8899aa', whiteSpace: 'nowrap' }}>
              ou continue com
            </span>
            <div style={{ flex: 1, height: 1, background: '#1a56ff22' }} />
          </div>

          {/* Botões sociais */}
          <div style={{
            marginTop: 16,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            <button
              type="button"
              className="social-btn"
              style={{
                background: '#0d1f3c',
                border: '1px solid #1a56ff22',
                borderRadius: 10, padding: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 500, color: '#fff',
                cursor: 'pointer', transition: 'all 200ms',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <IconGoogle />
              Google
            </button>
            <button
              type="button"
              className="social-btn"
              style={{
                background: '#0d1f3c',
                border: '1px solid #1a56ff22',
                borderRadius: 10, padding: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 500, color: '#fff',
                cursor: 'pointer', transition: 'all 200ms',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <IconMicrosoft />
              Microsoft
            </button>
          </div>


          {/* Rodapé do card */}
          <div style={{
            marginTop: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <ShieldCheck size={14} color="#8899aa" />
            <span style={{ fontSize: 12, color: '#8899aa', textAlign: 'center' }}>
              Ambiente seguro e dados protegidos
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
