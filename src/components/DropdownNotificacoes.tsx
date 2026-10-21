import { useRef, useEffect } from 'react'
import { Bell, CheckCheck, MessageSquare, Award, BookOpen, AlertCircle, X, Megaphone } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { Notificacao } from '../hooks/useNotificacoes'

interface DropdownNotificacoesProps {
  notificacoes:  Notificacao[]
  naoLidas:      number
  aberto:        boolean
  carregando:    boolean
  onFechar:      () => void
  onMarcarLida:  (id: string) => void
  onMarcarTodas: () => void
  onNavegar:     (pagina: string) => void
}

function iconeNotif(tipo: string) {
  switch (tipo) {
    case 'curso_concluido':     return <BookOpen     size={14} color="#10b981" />
    case 'certificado_emitido': return <Award        size={14} color="#f59e0b" />
    case 'nova_mensagem':       return <MessageSquare size={14} color="#1a56ff" />
    case 'reprovado':           return <AlertCircle  size={14} color="#ef4444" />
    case 'aluno_concluiu':      return <BookOpen     size={14} color="#10b981" />
    case 'aviso':               return <Megaphone    size={14} color="#F5C400" />
    default:                    return <Bell         size={14} color="#6366f1" />
  }
}

function tempoAtras(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const hrs  = Math.floor(min / 60)
  const dias = Math.floor(hrs / 24)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min atrás`
  if (hrs < 24) return `${hrs}h atrás`
  if (dias < 7) return `${dias}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function DropdownNotificacoes({
  notificacoes, naoLidas, aberto, carregando,
  onFechar, onMarcarLida, onMarcarTodas, onNavegar,
}: DropdownNotificacoesProps) {
  const { C } = useTheme()
  const ref   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onFechar()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      ref={ref}
      style={{
        position:     'absolute',
        top:          '48px',
        right:        '0',
        width:        '360px',
        background:   C.surface,
        border:       `1px solid ${C.border}`,
        borderRadius: '14px',
        boxShadow:    '0 16px 48px rgba(0,0,0,0.20)',
        zIndex:       9999,
        overflow:     'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding:        '14px 16px',
        borderBottom:   `1px solid ${C.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color={C.text} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>Notificações</span>
          {naoLidas > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 700,
              color: '#fff', background: '#ef4444',
              borderRadius: '10px', padding: '1px 7px',
            }}>
              {naoLidas}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {naoLidas > 0 && (
            <button
              onClick={onMarcarTodas}
              title="Marcar todas como lidas"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 8px', background: 'none',
                border: `1px solid ${C.border}`,
                borderRadius: '6px', fontSize: '11px',
                color: C.muted, cursor: 'pointer',
              }}
            >
              <CheckCheck size={12} /> Marcar todas
            </button>
          )}
          <button
            onClick={onFechar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {carregando ? (
          <div style={{ padding: '32px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
            <div style={{
              width: '20px', height: '20px',
              border: `2px solid ${C.border}`, borderTopColor: C.blue,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 8px',
            }} />
            Carregando...
          </div>
        ) : notificacoes.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔔</div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
              Nenhuma notificação
            </p>
            <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>Você está em dia com tudo!</p>
          </div>
        ) : (
          notificacoes.map((n, idx) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.lida) onMarcarLida(n.id)
                if (n.link_pagina) { onNavegar(n.link_pagina); onFechar() }
              }}
              style={{
                padding:      '12px 16px',
                borderBottom: idx < notificacoes.length - 1 ? `1px solid ${C.border}` : 'none',
                background:   n.lida ? 'transparent' : 'rgba(26,86,255,0.04)',
                cursor:       n.link_pagina ? 'pointer' : 'default',
                display:      'flex',
                gap:          '10px',
                alignItems:   'flex-start',
                transition:   'background 150ms',
              }}
              onMouseEnter={e => {
                if (n.link_pagina) e.currentTarget.style.background = 'rgba(26,86,255,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = n.lida ? 'transparent' : 'rgba(26,86,255,0.04)'
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: C.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {iconeNotif(n.tipo)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize:     '13px',
                  fontWeight:   n.lida ? 400 : 600,
                  color:        C.text,
                  margin:       '0 0 2px',
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {n.titulo}
                </p>
                {n.mensagem && (
                  <p style={{
                    fontSize:            '12px',
                    color:               C.muted,
                    margin:              '0 0 4px',
                    lineHeight:          1.4,
                    display:             '-webkit-box',
                    WebkitLineClamp:     2,
                    WebkitBoxOrient:     'vertical' as const,
                    overflow:            'hidden',
                  }}>
                    {n.mensagem}
                  </p>
                )}
                <p style={{ fontSize: '10px', color: C.muted, margin: 0 }}>
                  {tempoAtras(n.criado_em)}
                </p>
              </div>
              {!n.lida && (
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#1a56ff', flexShrink: 0, marginTop: '4px',
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notificacoes.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
          <button
            onClick={() => { onNavegar('notificacoesAdmin'); onFechar() }}
            style={{
              background: 'none', border: 'none',
              fontSize: '12px', color: C.blue,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Ver todas as notificações →
          </button>
        </div>
      )}
    </div>
  )
}
