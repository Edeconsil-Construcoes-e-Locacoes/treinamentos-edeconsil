import React, { useState } from 'react'
import {
  ChevronRight, MessageSquare,
  FileText, Download, Edit3, Check, Play, Pause,
  SkipForward, Volume2, Settings, Maximize,
  Clock, Award
} from 'lucide-react'
import { Sidebar } from '../components/Sidebar'
import { MobileMenu } from '../components/MobileMenu'
import { Logo } from '../components/Logo'
import modeloTreinamento from '../assets/modelo-treinamento.png'
import { Topbar } from '../components/Topbar'
import { useTheme } from '../contexts/ThemeContext'
import { useResponsive } from '../hooks/useResponsive'

const curso = {
  titulo: 'Leitura e Interpretação de Projetos de Terraplanagem',
  modulo: 'Módulo 02',
  categoria: 'Planejamento de Terraplanagem',
  duracao: '32 min',
  status: 'Em andamento',
  progresso: 65,
  totalAulas: 28,
  aulasConcluidas: 18,
  aulaAtual: {
    numero: '04',
    tempoAtual: '12:47',
    tempoTotal: '32:16',
    velocidade: '1.25x',
  }
}

const modulos = [
  {
    id: 1,
    titulo: 'Módulo 01 - Introdução à Construção Civil',
    aulas: 4, concluidas: 4, aberto: false,
    itens: [
      { num: 1, titulo: 'Fundamentos da Construção', dur: '28 min', concluida: true,  ativa: false },
      { num: 2, titulo: 'Materiais e Equipamentos',  dur: '24 min', concluida: true,  ativa: false },
      { num: 3, titulo: 'Normas Técnicas',            dur: '30 min', concluida: true,  ativa: false },
      { num: 4, titulo: 'Segurança Básica',           dur: '22 min', concluida: true,  ativa: false },
    ]
  },
  {
    id: 2,
    titulo: 'Módulo 02 - Planejamento de Terraplanagem',
    aulas: 6, concluidas: 3, aberto: true,
    itens: [
      { num: 1, titulo: 'Fundamentos de Terraplanagem',        dur: '28 min', concluida: true,  ativa: false },
      { num: 2, titulo: 'Equipamentos e Aplicações',           dur: '24 min', concluida: true,  ativa: false },
      { num: 3, titulo: 'Leitura e Interpretação de Projetos', dur: '32 min', concluida: false, ativa: true  },
      { num: 4, titulo: 'Cálculo de Volumes',                  dur: '26 min', concluida: false, ativa: false },
      { num: 5, titulo: 'Compactação de Solos',                dur: '22 min', concluida: false, ativa: false },
      { num: 6, titulo: 'Exercícios Práticos',                 dur: '30 min', concluida: false, ativa: false },
    ]
  },
  {
    id: 3,
    titulo: 'Módulo 03 - Pavimentação',
    aulas: 5, concluidas: 0, aberto: false,
    itens: []
  },
  {
    id: 4,
    titulo: 'Módulo 04 - Gestão de Obras',
    aulas: 4, concluidas: 0, aberto: false,
    itens: []
  },
]

// Só "Sobre a Aula" tem conteúdo; as outras ficam desabilitadas em vez de
// abrir um vazio. O "(12)" de Perguntas era um contador inventado.
const abasSobre = ['Sobre a Aula', 'Materiais', 'Anotações', 'Perguntas']
const ABAS_ATIVAS = ['Sobre a Aula']

const aprendizados = [
  'Como ler plantas topográficas',
  'Interpretar perfis e seções',
  'Calcular volumes de corte e aterro',
  'Identificar pontos críticos no projeto',
]

export function MeusCursos({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { C } = useTheme()
  const { isMobile, isTablet } = useResponsive()
  const isSmall = isMobile || isTablet
  const [modulosAbertos, setModulosAbertos] = useState<number[]>([2])
  const [abaAtiva, setAbaAtiva] = useState('Sobre a Aula')
  const [tocando, setTocando] = useState(false)

  const toggleModulo = (id: number) => {
    setModulosAbertos(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* SIDEBAR — apenas desktop */}
      {!isSmall && (
        <Sidebar
          paginaAtiva="meusCursos"
          onNavigate={onNavigate}
          onLogout={() => onNavigate('dashboard')}
        />
      )}

      {/* MENU MOBILE/TABLET */}
      {isSmall && (
        <MobileMenu
          paginaAtiva="meusCursos"
          onNavigate={onNavigate}
          onLogout={() => onNavigate('dashboard')}
          userName="João Silva"
          userRole="Aluno"
          userInitials="JS"
        />
      )}

      {/* ÁREA CENTRAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: isSmall ? '56px' : '0' }}>

        {/* TOPBAR — apenas desktop */}
        {!isSmall && (
          <Topbar titulo="Meus Cursos" subtitulo="Cursos e matrículas" onNavigate={onNavigate} />
        )}

        {/* CONTEÚDO COM SCROLL */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Breadcrumb */}
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {['Meus Cursos','Gestão de Obras e Construção Civil','Módulo 02','Aula 04'].map((b, i, arr) => (
              <React.Fragment key={b}>
                <span style={{ fontSize: '12px', color: i === arr.length - 1 ? C.text : C.muted, cursor: i < arr.length - 1 ? 'pointer' : 'default', fontWeight: i === arr.length - 1 ? 600 : 400 }}>
                  {b}
                </span>
                {i < arr.length - 1 && <span style={{ fontSize: '12px', color: C.muted }}>›</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Título + botão concluída */}
          <div style={{ padding: isSmall ? '0 12px 12px' : '0 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexShrink: 0, flexWrap: isSmall ? 'wrap' : 'nowrap' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                {curso.titulo}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: C.blue, background: 'rgba(26,86,255,0.15)', border: `1px solid rgba(26,86,255,0.3)`, borderRadius: '6px', padding: '3px 10px' }}>
                  {curso.modulo}
                </span>
                <span style={{ fontSize: '12px', color: C.muted }}>{curso.categoria}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.muted }}>
                  <Clock size={12} /> {curso.duracao}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: C.green, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '3px 10px' }}>
                  {curso.status}
                </span>
              </div>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'transparent',
              border: `1.5px solid ${C.blue}`,
              borderRadius: '8px', padding: '9px 16px',
              fontSize: '13px', fontWeight: 600, color: C.blue,
              cursor: 'pointer', flexShrink: 0,
              transition: 'all 150ms',
              fontFamily: "'Inter',sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.blue }}
            >
              <Check size={14} /> Marcar como concluída
            </button>
          </div>

          {/* VIDEO PLAYER */}
          <div style={{ padding: '0 20px', flexShrink: 0 }}>
            <div style={{
              background: C.surface3,
              borderRadius: '12px',
              overflow: 'hidden',
              border: `1px solid ${C.border}`,
              aspectRatio: '16/7',
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Thumbnail */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `url(${modeloTreinamento}) center center / cover no-repeat`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'center',
                padding: '32px',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(5,13,26,0.85) 0%, rgba(5,13,26,0.40) 60%, rgba(5,13,26,0.20) 100%)',
                  zIndex: 0,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                  <Logo height={28} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px', maxWidth: '340px', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
                  Leitura e Interpretação de Projetos de{' '}
                  <span style={{ color: C.blue }}>Terraplanagem</span>
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: '8px 0 0', maxWidth: '300px', position: 'relative', zIndex: 1 }}>
                  Entenda plantas, cortes, perfis e volumes com eficiência.
                </p>
              </div>

              {/* Botão play central */}
              <button
                onClick={() => setTocando(!tocando)}
                style={{
                  position: 'relative', zIndex: 2,
                  width: '56px', height: '56px',
                  borderRadius: '50%',
                  background: tocando ? 'rgba(26,86,255,0.8)' : C.blue,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 12px rgba(26,86,255,0.15)`,
                  transition: 'all 200ms',
                }}
              >
                {tocando
                  ? <Pause size={22} color="#fff" />
                  : <Play size={22} color="#fff" style={{ marginLeft: '2px' }} />
                }
              </button>

              {/* Barra de progresso do vídeo */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(to top, rgba(5,13,26,0.95), transparent)',
              }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', height: '4px', marginBottom: '10px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ background: C.blue, height: '4px', borderRadius: '4px', width: '39%' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '39%', transform: 'translate(-50%,-50%)', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => setTocando(!tocando)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                    {tocando ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                    <SkipForward size={18} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                    <Volume2 size={18} />
                  </button>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginLeft: '4px' }}>
                    {curso.aulaAtual.tempoAtual} / {curso.aulaAtual.tempoTotal}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.12)', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>
                      {curso.aulaAtual.velocidade}
                    </span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                      <Settings size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                      <Maximize size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ABAS + CONTEÚDO */}
          <div style={{ padding: isSmall ? '12px' : '16px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${C.border}`, marginBottom: '16px', overflowX: isSmall ? 'auto' : 'visible' }}>
              {abasSobre.map(aba => {
                const habilitada = ABAS_ATIVAS.includes(aba)
                return (
                <button key={aba}
                  disabled={!habilitada}
                  title={habilitada ? undefined : 'Ainda não disponível'}
                  onClick={() => habilitada && setAbaAtiva(aba)}
                  style={{
                    background: 'none', border: 'none',
                    cursor: habilitada ? 'pointer' : 'not-allowed',
                    opacity: habilitada ? 1 : 0.45,
                    padding: '10px 16px',
                    fontSize: '13px', fontWeight: abaAtiva === aba ? 600 : 400,
                    color: abaAtiva === aba ? C.text : C.muted,
                    borderBottom: abaAtiva === aba ? `2px solid ${C.blue}` : '2px solid transparent',
                    marginBottom: '-1px',
                    transition: 'all 150ms',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  {aba === 'Sobre a Aula' && <FileText size={13} />}
                  {aba === 'Materiais'    && <Download size={13} />}
                  {aba === 'Anotações'    && <Edit3 size={13} />}
                  {aba === 'Perguntas'    && <MessageSquare size={13} />}
                  {aba}
                </button>
                )
              })}
            </div>

            {abaAtiva === 'Sobre a Aula' && (
              <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 320px', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: C.muted2, lineHeight: 1.7, margin: '0 0 16px' }}>
                    Nesta aula você vai aprender a interpretar projetos de terraplanagem, identificando informações essenciais como curvas de nível, cortes, aterros, volumes e movimentações de terra.
                  </p>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '10px' }}>O que você vai aprender:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aprendizados.map(a => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color={C.green} />
                        <span style={{ fontSize: '13px', color: C.muted2 }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>Materiais da Aula</span>
                  </div>
                  {/* Os 4 arquivos que ficavam aqui eram fixos no código
                      (Terraplanagem.dwg etc) e não existiam no banco. */}
                  <div style={{ fontSize: '12px', color: C.muted, padding: '4px 2px' }}>
                    Nenhum material disponível
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* PAINEL DIREITO */}
      <aside style={{
        width: isSmall ? '100%' : '300px', flexShrink: 0,
        background: C.surface,
        borderLeft: isSmall ? 'none' : `1px solid ${C.border}`,
        borderTop: isSmall ? `1px solid ${C.border}` : 'none',
        display: 'flex', flexDirection: 'column',
        overflowY: isSmall ? 'visible' : 'auto',
        maxHeight: isSmall ? '320px' : 'none',
      }}>

        {/* Progresso do curso */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>Progresso do Curso</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: C.blue }}>{curso.progresso}%</span>
          </div>
          <div style={{ background: 'rgba(26,86,255,0.10)', borderRadius: '4px', height: '6px', marginBottom: '6px' }}>
            <div style={{ background: C.blue, height: '6px', borderRadius: '4px', width: `${curso.progresso}%` }} />
          </div>
          <div style={{ fontSize: '11px', color: C.muted }}>{curso.aulasConcluidas} de {curso.totalAulas} aulas concluídas</div>
        </div>

        {/* Tabs Conteúdo / Aula Anterior */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {['Conteúdo','Aula Anterior'].map(tab => (
            <button key={tab} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 8px',
              fontSize: '12px', fontWeight: tab === 'Conteúdo' ? 600 : 400,
              color: tab === 'Conteúdo' ? C.blue : C.muted,
              borderBottom: tab === 'Conteúdo' ? `2px solid ${C.blue}` : '2px solid transparent',
              marginBottom: '-1px',
              fontFamily: "'Inter',sans-serif",
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Lista de módulos */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {modulos.map(mod => (
            <div key={mod.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <div
                onClick={() => toggleModulo(mod.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,86,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{mod.titulo}</div>
                  <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>{mod.concluidas}/{mod.aulas}</div>
                </div>
                <ChevronRight size={14} color={C.muted} style={{ transform: modulosAbertos.includes(mod.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms', flexShrink: 0 }} />
              </div>

              {modulosAbertos.includes(mod.id) && mod.itens.map(item => (
                <div key={item.num} style={{
                  padding: '10px 16px 10px 28px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: item.ativa ? 'rgba(26,86,255,0.10)' : 'transparent',
                  borderLeft: item.ativa ? `3px solid ${C.blue}` : '3px solid transparent',
                  cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => { if (!item.ativa) e.currentTarget.style.background = 'rgba(26,86,255,0.05)' }}
                onMouseLeave={e => { if (!item.ativa) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: item.concluida ? C.green : item.ativa ? C.blue : 'rgba(255,255,255,0.08)',
                    border: item.concluida ? 'none' : item.ativa ? 'none' : `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.concluida
                      ? <Check size={11} color="#fff" />
                      : item.ativa
                      ? <Play size={10} color="#fff" style={{ marginLeft: '1px' }} />
                      : <span style={{ fontSize: '10px', color: C.muted, fontWeight: 600 }}>{String(item.num).padStart(2,'0')}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: item.ativa ? 600 : 400, color: item.ativa ? C.text : C.muted2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.titulo}
                    </div>
                    <div style={{ fontSize: '10px', color: C.muted }}>{item.dur}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Motivacional */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}`, background: 'rgba(26,86,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={16} color={C.amber} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.amber }}>Continue assim!</div>
              <div style={{ fontSize: '11px', color: C.muted, lineHeight: 1.5, marginTop: '2px' }}>
                Você está se dedicando e evoluindo muito. Foco no objetivo!
              </div>
            </div>
          </div>
        </div>
      </aside>

    </div>
  )
}
