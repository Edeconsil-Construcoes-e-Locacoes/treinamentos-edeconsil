import { useState, useEffect } from 'react'
import { Download, Award, BookOpen, ChevronRight } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { Sidebar } from '../components/Sidebar'
import { MobileMenu } from '../components/MobileMenu'
import { Topbar } from '../components/Topbar'
import { useResponsive } from '../hooks/useResponsive'
import { useUsuarioLogado } from '../hooks/useUsuarioLogado'
import { certificadosAPI } from '../services/api'
import { imprimirCertificado, formatarDataSimples } from '../utils/imprimirCertificado'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')

const tipoArquivo = (url: string) => {
  if (!url) return 'desconhecido'
  const ext = url.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext ?? '')) return 'imagem'
  if (ext === 'pdf') return 'pdf'
  return 'desconhecido'
}

interface CertificadosColaboradorProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

function IlustracaoVazia({ C }: { C: Record<string, string> }) {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="90" r="80" fill={C.blue} opacity="0.05" />
      <circle cx="100" cy="90" r="60" fill={C.blue} opacity="0.05" />
      <rect x="52" y="54" width="96" height="72" rx="6" fill={C.surface2} stroke={C.border} strokeWidth="1.5" />
      <rect x="52" y="54" width="96" height="16" rx="6" fill={C.blue} opacity="0.15" />
      <rect x="52" y="62" width="96" height="8" fill={C.blue} opacity="0.15" />
      <rect x="68" y="82" width="64" height="4" rx="2" fill={C.border} />
      <rect x="76" y="92" width="48" height="4" rx="2" fill={C.border} />
      <rect x="80" y="102" width="40" height="4" rx="2" fill={C.border} />
      <circle cx="100" cy="124" r="14" fill={C.blue} opacity="0.12" stroke={C.blue} strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="100" cy="124" r="9" fill={C.blue} opacity="0.10" />
      <text x="100" y="129" textAnchor="middle" fontSize="12" fontFamily="sans-serif">⭐</text>
      <line x1="96" y1="110" x2="93" y2="102" stroke={C.blue} strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
      <line x1="104" y1="110" x2="107" y2="102" stroke={C.blue} strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
      <path d="M100 42 L120 52 L100 62 L80 52 Z" fill={C.blue} opacity="0.25" />
      <rect x="98" y="52" width="4" height="12" rx="2" fill={C.blue} opacity="0.30" />
      <circle cx="100" cy="65" r="3" fill={C.blue} opacity="0.35" />
    </svg>
  )
}

export function CertificadosColaborador({ onNavigate, onLogout }: CertificadosColaboradorProps) {
  const { C } = useTheme()
  const { isMobile, isTablet } = useResponsive()
  const isSmall = isMobile || isTablet
  const { nome, iniciais, perfil } = useUsuarioLogado()

  const [certificados, setCertificados] = useState<any[]>([])
  const [carregando,   setCarregando]   = useState(true)
  const [certSelecionado, setCertSelecionado] = useState<any>(null)

  useEffect(() => {
    certificadosAPI.meusCertificados()
      .then((data: any) => {
        setCertificados(Array.isArray(data) ? data : [])
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  const formatarData = (iso: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const roleDisplay = perfil === 'admin' ? 'Administrador' : 'Colaborador'

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.bg, color: C.text, display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {!isSmall && (
        <Sidebar paginaAtiva="certificados" onNavigate={onNavigate} onLogout={onLogout} />
      )}

      {isSmall && (
        <MobileMenu
          paginaAtiva="certificadosColaborador"
          onNavigate={onNavigate}
          onLogout={onLogout}
          userName={nome}
          userRole={roleDisplay}
          userInitials={iniciais}
        />
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: isSmall ? '56px' : '0' }}>

        {!isSmall && (
          <Topbar titulo="Certificados" subtitulo="Histórico de conquistas" onNavigate={onNavigate} />
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: isSmall ? '20px 16px' : '32px 40px' }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ width: '40px', height: '3px', background: C.blue, borderRadius: '2px', marginBottom: '10px' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              Meus Certificados
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              Certificados conquistados ao concluir os cursos da plataforma
            </p>
          </div>

          {/* Loading */}
          {carregando && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '12px', color: C.muted }}>
              <div style={{ width: '24px', height: '24px', border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Carregando certificados...
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Estado vazio */}
          {!carregando && certificados.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '0' }}>
              <IlustracaoVazia C={C as Record<string, string>} />
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(26,86,255,0.08)', border: '2px solid rgba(26,86,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Award size={32} color={C.blue} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 12px', maxWidth: '440px', lineHeight: 1.3 }}>
                Você ainda não tem certificados!
              </h2>
              <p style={{ fontSize: '14px', color: C.muted, margin: '0 0 32px', maxWidth: '480px', lineHeight: 1.7 }}>
                Conclua cursos disponíveis na aba{' '}
                <strong style={{ color: C.blue }}>"Meus Cursos"</strong>
                {' '}e seja aprovado na avaliação final para receber seu certificado.
              </p>
              <button
                onClick={() => onNavigate('meusCursos')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.blue, color: '#fff', border: 'none', borderRadius: '10px', padding: '13px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(26,86,255,0.30)', marginBottom: '40px' }}
              >
                <BookOpen size={16} />
                Ver cursos disponíveis
                <ChevronRight size={16} />
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px', width: '100%', maxWidth: '680px' }}>
                {[
                  { num: '01', titulo: 'Escolha um curso',     desc: 'Acesse "Meus Cursos" e escolha um treinamento da sua área', icone: '📚' },
                  { num: '02', titulo: 'Conclua as aulas',     desc: 'Assista todas as videoaulas e complete as avaliações',       icone: '🎯' },
                  { num: '03', titulo: 'Receba o certificado', desc: 'Seu certificado é emitido automaticamente ao ser aprovado',  icone: '🏅' },
                ].map(passo => (
                  <div key={passo.num} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>{passo.icone}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: C.blue, letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Passo {passo.num}</div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{passo.titulo}</p>
                    <p style={{ fontSize: '12px', color: C.muted, margin: 0, lineHeight: 1.5 }}>{passo.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid de certificados */}
          {!carregando && certificados.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'repeat(2, 1fr)', gap: '20px', maxWidth: '900px' }}>
              {certificados.map(cert => (
                <div key={cert.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', transition: 'transform 200ms, box-shadow 200ms' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Preview header Edeconsil */}
                  <div style={{ background: '#0d2550', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#F5C400', fontWeight: 700, margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Edeconsil Construções e Locações LTDA
                      </p>
                      <p style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '2px' }}>
                        CERTIFICADO
                      </p>
                    </div>
                    <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {cert.curso_icone ?? '🏆'}
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'linear-gradient(90deg,#F5C400,#e6b800)' }} />

                  <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 4px' }}>A Edeconsil certifica que</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{cert.aluno_nome}</p>
                    <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
                      concluiu com êxito <strong style={{ color: C.text }}>{cert.curso_titulo}</strong>
                      {cert.tipo === 'externo' && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f59e0b', color: '#fff', borderRadius: '4px', fontWeight: 700, marginLeft: '6px', verticalAlign: 'middle' }}>
                          EXTERNO
                        </span>
                      )}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                      {[
                        { label: 'Emitido em',    valor: formatarData(cert.data_emissao) },
                        { label: 'Válido até',    valor: cert.data_validade ? formatarData(cert.data_validade) : 'Sem validade' },
                        { label: cert.tipo === 'externo' ? 'Entidade' : 'Nota obtida', valor: cert.nota_obtida != null ? `${cert.nota_obtida}%` : (cert.entidade_emissora ?? '—') },
                        { label: 'Carga horária', valor: cert.carga_horaria ?? '—' },
                      ].map(d => (
                        <div key={d.label} style={{ background: C.surface2, borderRadius: '8px', padding: '8px 10px' }}>
                          <p style={{ fontSize: '10px', color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.label}</p>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: C.text, margin: 0 }}>{d.valor}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'rgba(26,86,255,0.06)', border: '1px solid rgba(26,86,255,0.15)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px' }}>
                      <p style={{ fontSize: '10px', color: C.blue, fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Código de verificação
                      </p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: C.blue, margin: 0, fontFamily: 'monospace', letterSpacing: '1px' }}>
                        {cert.codigo}
                      </p>
                    </div>

                    {cert.tipo === 'externo' && cert.url_pdf && (
                      <>
                        {tipoArquivo(cert.url_pdf) === 'imagem' ? (
                          <a href={`${BASE_URL}${cert.url_pdf}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '12px' }}>
                            <img
                              src={`${BASE_URL}${cert.url_pdf}`}
                              alt={cert.curso_titulo ?? cert.titulo_externo}
                              style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '180px', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'block' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <span style={{ fontSize: '11px', color: C.blue, fontWeight: 600, display: 'block', marginTop: '4px' }}>Ver certificado completo →</span>
                          </a>
                        ) : (
                          <a
                            href={`${BASE_URL}${cert.url_pdf}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', textDecoration: 'none', cursor: 'pointer' }}
                          >
                            <span style={{ fontSize: '22px' }}>📄</span>
                            <div>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', margin: 0 }}>Abrir PDF</p>
                              <p style={{ fontSize: '10px', color: C.muted, margin: 0 }}>{cert.curso_titulo ?? cert.titulo_externo}</p>
                            </div>
                          </a>
                        )}
                      </>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          if (cert.tipo === 'externo' && cert.url_pdf) {
                            window.open(`${BASE_URL}${cert.url_pdf}`, '_blank')
                          } else {
                            imprimirCertificado(cert)
                          }
                        }}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                      >
                        <Download size={14} /> Baixar PDF
                      </button>
                      <button
                        onClick={() => setCertSelecionado(cert)}
                        style={{ padding: '10px 14px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}
                      >
                        👁️ Ver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal visualização completa */}
      {certSelecionado && (
        <div onClick={() => setCertSelecionado(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', maxWidth: '800px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

            <div style={{ background: '#0d2550', padding: '22px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#F5C400', fontWeight: 700, margin: '0 0 4px', letterSpacing: '1px' }}>
                  EDECONSIL CONSTRUÇÕES E LOCAÇÕES LTDA
                </p>
                <p style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '2px' }}>
                  CERTIFICADO
                </p>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {certSelecionado.curso_icone ?? '🏆'}
              </div>
            </div>
            <div style={{ height: '5px', background: 'linear-gradient(90deg,#F5C400,#e6b800)' }} />

            <div style={{ padding: '36px 48px', textAlign: 'center', border: '3px solid #0d2550', borderTop: 'none', margin: '0 12px' }}>
              <p style={{ fontSize: '14px', color: '#555', margin: '0 0 14px', fontStyle: 'italic' }}>A Edeconsil certifica que</p>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#0d2550', margin: '0 0 16px', textTransform: 'uppercase', borderBottom: '2px solid #F5C400', paddingBottom: '10px' }}>
                {certSelecionado.aluno_nome}
              </p>
              <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, margin: '0 0 16px' }}>
                concluiu com êxito <strong style={{ color: '#0d2550' }}>{certSelecionado.curso_titulo}</strong>,{' '}
                realizado em {formatarDataSimples(certSelecionado.data_emissao)},
                demonstrando comprometimento e excelência.
              </p>
              <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, margin: '0 0 20px' }}>
                Este certificado é concedido como reconhecimento pelo desempenho e dedicação apresentados.
              </p>
              <p style={{ fontSize: '13px', color: '#444', margin: '0 0 6px' }}>
                São Luís, {formatarDataSimples(certSelecionado.data_emissao)}.
              </p>
              <p style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace' }}>
                Código: {certSelecionado.codigo}
              </p>
            </div>

            <div style={{ background: '#f8f8f8', borderTop: '1px solid #e0e0e0', padding: '16px 36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { label: 'GREAT\nPLACE\nTO WORK', cor: '#e63946' },
                  { label: 'ISO\n9001', cor: '#0d2550' },
                  { label: 'ISO\n14001', cor: '#0d2550' },
                ].map((s, i) => (
                  <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `2px solid ${s.cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: s.cor, textAlign: 'center', whiteSpace: 'pre', lineHeight: 1.2 }}>
                    {s.label}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '32px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ textAlign: 'center', minWidth: '140px' }}>
                    <div style={{ height: '32px' }} />
                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#666' }}>
                      [Assinatura do responsável]<br />[Cargo]
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: '#fff' }}>
              <button onClick={() => setCertSelecionado(null)}
                style={{ padding: '9px 18px', background: 'none', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                Fechar
              </button>
              <button
                onClick={() => {
                  if (certSelecionado.tipo === 'externo' && certSelecionado.url_pdf) {
                    window.open(`${BASE_URL}${certSelecionado.url_pdf}`, '_blank')
                  } else {
                    imprimirCertificado(certSelecionado)
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#0d2550', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                <Download size={14} /> Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
