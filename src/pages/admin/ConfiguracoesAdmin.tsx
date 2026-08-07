import { useState, useRef } from 'react'
import {
  Building2, Monitor, Palette, Bell,
  Shield, BookOpen, Award,
  UserCheck, Database, Save,
  Eye, EyeOff, Download,
  AlertTriangle, Check,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'
import { useMobile } from '../../hooks/useMobile'

interface ConfiguracoesAdminProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

export function ConfiguracoesAdmin({ onNavigate, onLogout }: ConfiguracoesAdminProps) {
  const { C, toggleTheme, isDark } = useTheme()
  const { config, atualizar, salvar, salvando, mensagem, tipoMsg, restaurarPadroes } = useConfiguracoes()
  const isMobile = useMobile()

  const [secaoAtiva, setSecaoAtiva] = useState('perfil')
  const [mostrarApiKey, setMostrarApiKey] = useState(false)
  const [apiKey] = useState('sk-edeconsil-' + btoa('edeconsil2026').slice(0, 16))
  const logoRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box' as const,
    padding: '9px 13px',
    background: C.surface2, border: `1px solid ${C.border}`,
    borderRadius: '8px', fontSize: '13px',
    color: C.text, outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: C.muted,
    display: 'block', marginBottom: '5px',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  }

  const Toggle = ({ valor, onChange, label, descricao }: {
    valor: boolean; onChange: (v: boolean) => void; label: string; descricao?: string
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{label}</p>
        {descricao && <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>{descricao}</p>}
      </div>
      <button
        onClick={() => onChange(!valor)}
        style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: valor ? config.corPrimaria : C.border, position: 'relative', transition: 'background 200ms', flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', top: '3px', left: valor ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )

  const BotaoSalvar = ({ secao }: { secao: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
      {mensagem ? (
        <span style={{ fontSize: '13px', fontWeight: 600, color: tipoMsg === 'sucesso' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {tipoMsg === 'sucesso' ? <Check size={14} /> : <AlertTriangle size={14} />}
          {mensagem}
        </span>
      ) : <span />}
      <button
        onClick={() => salvar(secao)}
        disabled={salvando}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: config.corPrimaria, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
      >
        {salvando
          ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
          : <><Save size={14} /> Salvar alterações</>
        }
      </button>
    </div>
  )

  const Campo = ({ label, campo, tipo = 'text', placeholder = '' }: {
    label: string; campo: keyof typeof config; tipo?: string; placeholder?: string
  }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={tipo}
        value={String(config[campo] ?? '')}
        onChange={e => atualizar(campo as any, tipo === 'number' ? (parseInt(e.target.value) || 0) : e.target.value as any)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = config.corPrimaria}
        onBlur={e  => e.target.style.borderColor = C.border}
      />
    </div>
  )

  const menuItens = [
    { grupo: 'GERAL', itens: [
      { key: 'perfil',       label: 'Perfil da Empresa', icone: <Building2 size={14} /> },
      { key: 'plataforma',   label: 'Plataforma',        icone: <Monitor   size={14} /> },
      { key: 'aparencia',    label: 'Aparência',         icone: <Palette   size={14} /> },
    ]},
    { grupo: 'COMUNICAÇÃO', itens: [
      { key: 'notificacoes', label: 'Notificações',       icone: <Bell    size={14} /> },
    ]},
    { grupo: 'SEGURANÇA', itens: [
      { key: 'seguranca',    label: 'Segurança e Acesso', icone: <Shield  size={14} /> },
    ]},
    { grupo: 'GESTÃO', itens: [
      { key: 'treinamentos', label: 'Treinamentos',       icone: <BookOpen  size={14} /> },
      { key: 'certificados', label: 'Certificados',       icone: <Award     size={14} /> },
      { key: 'matriculas',   label: 'Matrículas',         icone: <UserCheck size={14} /> },
    ]},
    { grupo: 'SISTEMA', itens: [
      { key: 'backup',       label: 'Backup e Dados',     icone: <Database size={14} /> },
    ]},
  ]

  const renderSecao = () => {
    switch (secaoAtiva) {

      case 'perfil': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Perfil da Empresa</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Informações institucionais exibidas na plataforma</p>

          <div style={{ marginBottom: '20px', padding: '16px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: config.corPrimaria, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>E</div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 4px' }}>Logo da empresa</p>
              <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 8px' }}>PNG ou SVG, mínimo 200×200px</p>
              <button onClick={() => logoRef.current?.click()} style={{ padding: '6px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', color: C.text, cursor: 'pointer' }}>
                Trocar logo
              </button>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) console.log('Logo:', f.name) }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={{ gridColumn: '1/-1' }}><Campo label="Nome da Empresa" campo="nomeEmpresa" placeholder="Edeconsil Construções e Locações LTDA" /></div>
            <Campo label="Nome do Portal"    campo="nomePortal"   placeholder="Universidade Corporativa" />
            <Campo label="CNPJ"              campo="cnpj"         placeholder="00.000.000/0001-00" />
            <Campo label="Site"              campo="site"         tipo="url"   placeholder="https://edeconsil.com.br" />
            <Campo label="Telefone"          campo="telefone"     placeholder="(98) 9999-9999" />
            <Campo label="E-mail de Suporte" campo="emailSuporte" tipo="email" placeholder="suporte@edeconsil.com.br" />
            <div style={{ gridColumn: '1/-1' }}><Campo label="Endereço" campo="endereco" placeholder="São Luís, MA" /></div>
            <div style={{ gridColumn: '1/-1', marginBottom: '14px' }}>
              <label style={labelStyle}>Descrição</label>
              <textarea
                value={config.descricao}
                onChange={e => atualizar('descricao', e.target.value)}
                placeholder="Breve descrição da empresa e do portal..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }}
                onFocus={e => e.target.style.borderColor = config.corPrimaria}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
          </div>
          <BotaoSalvar secao="Perfil" />
        </div>
      )

      case 'plataforma': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Configurações da Plataforma</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Configurações regionais e de acesso</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Idioma</label>
              <select value={config.idioma} onChange={e => atualizar('idioma', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border}>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Fuso Horário</label>
              <select value={config.fusoHorario} onChange={e => atualizar('fusoHorario', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border}>
                <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
                <option value="America/Belem">Belém (GMT-3)</option>
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Formato de Data</label>
              <select value={config.formatoData} onChange={e => atualizar('formatoData', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border}>
                <option value="DD/MM/AAAA">DD/MM/AAAA</option>
                <option value="MM/DD/AAAA">MM/DD/AAAA</option>
                <option value="AAAA-MM-DD">AAAA-MM-DD</option>
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Itens por Página</label>
              <input type="number" value={config.itensPorPagina} onChange={e => atualizar('itensPorPagina', parseInt(e.target.value) || 20)} min={5} max={100} style={inputStyle} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <Toggle valor={config.modoManutencao}  onChange={v => atualizar('modoManutencao', v)}  label="Modo Manutenção"    descricao="Bloqueia o acesso de colaboradores à plataforma" />
            <Toggle valor={config.registroPublico} onChange={v => atualizar('registroPublico', v)} label="Registro Público"   descricao="Permite cadastros sem convite do admin" />
            <Toggle valor={config.loginGoogle}     onChange={v => atualizar('loginGoogle', v)}     label="Login com Google"   descricao="Habilita autenticação via Google Workspace" />
            <Toggle valor={config.loginMicrosoft}  onChange={v => atualizar('loginMicrosoft', v)}  label="Login com Microsoft" descricao="Habilita autenticação via Microsoft 365" />
          </div>
          <BotaoSalvar secao="Plataforma" />
        </div>
      )

      case 'aparencia': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Aparência</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Tema e identidade visual da plataforma</p>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <Toggle valor={isDark} onChange={() => toggleTheme()} label="Modo Escuro" descricao="Salvo automaticamente — persiste ao recarregar" />
          </div>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Cores da Plataforma</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Cor Primária</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={config.corPrimaria} onChange={e => atualizar('corPrimaria', e.target.value)} style={{ width: '44px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={config.corPrimaria} onChange={e => atualizar('corPrimaria', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', width: 'auto', flex: 1 }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Cor de Destaque</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={config.corDestaque} onChange={e => atualizar('corDestaque', e.target.value)} style={{ width: '44px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={config.corDestaque} onChange={e => atualizar('corDestaque', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', width: 'auto', flex: 1 }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: C.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={{ padding: '8px 16px', background: config.corPrimaria, border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Botão Primário</button>
                <button style={{ padding: '8px 16px', background: config.corDestaque, border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: config.corPrimaria, cursor: 'pointer' }}>Destaque</button>
                <button style={{ padding: '8px 16px', background: 'none', border: `2px solid ${config.corPrimaria}`, borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: config.corPrimaria, cursor: 'pointer' }}>Outline</button>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: C.muted, margin: '10px 0 0' }}>
              As cores são aplicadas ao ThemeContext após salvar e recarregar a página.
            </p>
          </div>

          <BotaoSalvar secao="Aparência" />
        </div>
      )

      case 'notificacoes': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Notificações</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Canais e eventos de notificação</p>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Canais</p>
            <Toggle valor={config.notifEmail}    onChange={v => atualizar('notifEmail', v)}    label="E-mail"    descricao="Enviar notificações por e-mail" />
            <Toggle valor={config.notifSistema}  onChange={v => atualizar('notifSistema', v)}  label="Sistema"   descricao="Sino de notificações na plataforma" />
            <Toggle valor={config.notifWhatsapp} onChange={v => atualizar('notifWhatsapp', v)} label="WhatsApp"  descricao="Notificações via WhatsApp Business" />
          </div>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Eventos</p>
            <Toggle valor={config.notifNovoCurso}   onChange={v => atualizar('notifNovoCurso', v)}   label="Novo Curso"              descricao="Ao publicar um novo curso" />
            <Toggle valor={config.notifCertificado} onChange={v => atualizar('notifCertificado', v)} label="Certificado Emitido"     descricao="Ao concluir e receber certificado" />
            <Toggle valor={config.notifMensagem}    onChange={v => atualizar('notifMensagem', v)}    label="Nova Mensagem"           descricao="Ao receber mensagem do suporte" />
            <Toggle valor={config.notifAvaliacao}   onChange={v => atualizar('notifAvaliacao', v)}   label="Avaliação Disponível"   descricao="Quando uma prova for liberada" />
            <Toggle valor={config.notifVencimento}  onChange={v => atualizar('notifVencimento', v)}  label="Vencimento de Certificado" descricao="Dias antes do certificado vencer" />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Dias de antecedência (vencimento)</label>
            <input type="number" value={config.diasAntecedencia} onChange={e => atualizar('diasAntecedencia', parseInt(e.target.value) || 7)} min={1} max={60} style={{ ...inputStyle, maxWidth: '120px' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <BotaoSalvar secao="Notificações" />
        </div>
      )

      case 'seguranca': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Segurança e Acesso</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Políticas de senha e controle de acesso</p>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 12px' }}>Política de Senhas</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Mínimo de caracteres</label>
                <input type="number" value={config.senhaMinChars} onChange={e => atualizar('senhaMinChars', parseInt(e.target.value) || 8)} min={6} max={32} style={inputStyle} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
              </div>
              <div>
                <label style={labelStyle}>Expiração (dias)</label>
                <input type="number" value={config.diasExpiracao} onChange={e => atualizar('diasExpiracao', parseInt(e.target.value) || 90)} min={30} max={365} disabled={!config.senhaExpiracao} style={{ ...inputStyle, opacity: config.senhaExpiracao ? 1 : 0.5 }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            </div>
            <Toggle valor={config.senhaMaiuscula} onChange={v => atualizar('senhaMaiuscula', v)} label="Exigir letra maiúscula" />
            <Toggle valor={config.senhaNumero}    onChange={v => atualizar('senhaNumero', v)}    label="Exigir número" />
            <Toggle valor={config.senhaEspecial}  onChange={v => atualizar('senhaEspecial', v)}  label="Exigir caractere especial" />
            <Toggle valor={config.senhaExpiracao} onChange={v => atualizar('senhaExpiracao', v)} label="Senhas expiram" descricao="Forçar troca periódica de senha" />
          </div>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 12px' }}>Controle de Acesso</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Timeout de sessão (min)</label>
                <input type="number" value={config.timeoutSessao} onChange={e => atualizar('timeoutSessao', parseInt(e.target.value) || 480)} min={30} max={1440} style={inputStyle} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
              </div>
              <div>
                <label style={labelStyle}>Tentativas antes de bloquear</label>
                <input type="number" value={config.tentativasMax} onChange={e => atualizar('tentativasMax', parseInt(e.target.value) || 5)} min={3} max={10} style={inputStyle} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            </div>
            <Toggle valor={config.autenticacao2fa} onChange={v => atualizar('autenticacao2fa', v)} label="Autenticação em 2 fatores" descricao="Exige código adicional no login" />
            <Toggle valor={config.logAcessos}      onChange={v => atualizar('logAcessos', v)}      label="Log de acessos" descricao="Registrar horário e IP de cada login" />
          </div>

          <BotaoSalvar secao="Segurança" />
        </div>
      )

      case 'treinamentos': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Treinamentos</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Comportamento padrão dos cursos e avaliações</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Nota mínima de aprovação (%)</label>
              <input type="number" value={config.notaMinima} onChange={e => atualizar('notaMinima', parseInt(e.target.value) || 70)} min={0} max={100} style={inputStyle} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
            </div>
            <div>
              <label style={labelStyle}>Tentativas máximas na prova</label>
              <input type="number" value={config.tentativasProva} onChange={e => atualizar('tentativasProva', parseInt(e.target.value) || 3)} min={1} max={10} style={inputStyle} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
            </div>
            <div>
              <label style={labelStyle}>Qualidade padrão de vídeo</label>
              <select value={config.qualidadeVideo} onChange={e => atualizar('qualidadeVideo', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border}>
                <option value="480p">480p</option>
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
          </div>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px' }}>
            <Toggle valor={config.progressoObrig}  onChange={v => atualizar('progressoObrig', v)}  label="Progresso obrigatório"   descricao="Aluno deve assistir 100% antes de avançar" />
            <Toggle valor={config.ordemObrig}       onChange={v => atualizar('ordemObrig', v)}       label="Ordem obrigatória"        descricao="Aulas devem ser feitas em sequência" />
            <Toggle valor={config.comentarios}      onChange={v => atualizar('comentarios', v)}      label="Comentários nas aulas"    descricao="Permite alunos comentar nas aulas" />
            <Toggle valor={config.avaliacaoObrig}   onChange={v => atualizar('avaliacaoObrig', v)}   label="Avaliação obrigatória"    descricao="Necessária para concluir o curso" />
            <Toggle valor={config.pausarVideo}      onChange={v => atualizar('pausarVideo', v)}      label="Permitir pausar vídeo" />
            <Toggle valor={config.velocidadeVideo}  onChange={v => atualizar('velocidadeVideo', v)}  label="Controle de velocidade"   descricao="Aluno pode ajustar velocidade do vídeo" />
          </div>
          <BotaoSalvar secao="Treinamentos" />
        </div>
      )

      case 'certificados': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Certificados</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Configurações de emissão e validade</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Validade padrão (meses)</label>
            <input type="number" value={config.validadeCert} onChange={e => atualizar('validadeCert', parseInt(e.target.value) || 24)} min={1} max={120} style={{ ...inputStyle, maxWidth: '160px' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
          </div>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
            <Toggle valor={config.emissaoAuto}          onChange={v => atualizar('emissaoAuto', v)}          label="Emissão automática"       descricao="Gera certificado ao ser aprovado na prova" />
            <Toggle valor={config.assinaturaDigital}    onChange={v => atualizar('assinaturaDigital', v)}    label="Assinatura digital"       descricao="Adiciona assinatura digital ao PDF" />
            <Toggle valor={config.codigoVerif}          onChange={v => atualizar('codigoVerif', v)}          label="Código de verificação"    descricao="Inclui código único EDEC-XXXX" />
            <Toggle valor={config.gerarPdf}             onChange={v => atualizar('gerarPdf', v)}             label="Gerar PDF para download" />
            <Toggle valor={config.compartilharLinkedin} onChange={v => atualizar('compartilharLinkedin', v)} label="Compartilhar no LinkedIn" descricao="Botão para publicar no LinkedIn" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Campo label="Nome do assinante" campo="nomeAssinante" placeholder="Nome do responsável pela assinatura" />
            <Campo label="Texto do rodapé"   campo="rodapeCert"    placeholder="São Luís, MA — Edeconsil" />
          </div>
          <BotaoSalvar secao="Certificados" />
        </div>
      )

      case 'matriculas': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Matrículas</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Comportamento do processo de matrícula</p>

          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}>
            <Toggle valor={config.aprovacaoManual} onChange={v => atualizar('aprovacaoManual', v)} label="Aprovação manual"       descricao="Admin aprova cada matrícula individualmente" />
            <Toggle valor={config.crAutomatico}    onChange={v => atualizar('crAutomatico', v)}    label="CR automático"         descricao="Gerar código de registro automaticamente" />
            <Toggle valor={config.emailBoasVindas} onChange={v => atualizar('emailBoasVindas', v)} label="E-mail de boas-vindas" descricao="Enviar e-mail ao novo aluno matriculado" />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Limite de alunos por turma (0 = ilimitado)</label>
            <input type="number" value={config.limitePorturma} onChange={e => atualizar('limitePorturma', parseInt(e.target.value) || 0)} min={0} style={{ ...inputStyle, maxWidth: '160px' }} onFocus={e => e.target.style.borderColor = config.corPrimaria} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <BotaoSalvar secao="Matrículas" />
        </div>
      )

      case 'backup': return (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Backup e Dados</h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>Exportação de dados e ações de sistema</p>

          {/* API Key */}
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 12px' }}>Chave de API</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type={mostrarApiKey ? 'text' : 'password'} value={apiKey} readOnly style={{ ...inputStyle, fontFamily: 'monospace' }} />
              <button onClick={() => setMostrarApiKey(v => !v)} style={{ padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {mostrarApiKey ? <EyeOff size={15} color={C.muted} /> : <Eye size={15} color={C.muted} />}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: C.muted, margin: '6px 0 0' }}>Use como Bearer Token nas requisições à API.</p>
          </div>

          {/* Exportações */}
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 14px' }}>Exportar Dados</p>
            {[
              { label: 'Lista de Alunos',       rota: '/api/usuarios?perfil=colaborador',  arquivo: 'alunos.csv'        },
              { label: 'Certificados Emitidos', rota: '/api/admin/certificados',            arquivo: 'certificados.csv'  },
              { label: 'Cursos',                rota: '/api/cursos',                        arquivo: 'cursos.csv'        },
              { label: 'Instrutores',           rota: '/api/instrutores',                   arquivo: 'instrutores.csv'   },
            ].map(exp => (
              <div key={exp.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{exp.label}</p>
                  <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>Exportar em formato CSV</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const token   = localStorage.getItem('edeconsil_token')
                      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://edeconsil.driverpro.site/api'
                      const resp    = await fetch(`${apiBase}${exp.rota}`, { headers: { Authorization: `Bearer ${token}` } })
                      const data    = await resp.json()
                      const rows    = Array.isArray(data) ? data : (data.usuarios ?? data.certificados ?? data.cursos ?? data.instrutores ?? [])
                      if (!rows.length) { alert('Sem dados para exportar'); return }
                      const headers = Object.keys(rows[0]).join(',')
                      const csv = [headers, ...rows.map((r: Record<string, unknown>) =>
                        Object.values(r).map(v => (typeof v === 'string' && v.includes(',')) ? `"${v}"` : String(v ?? '')).join(',')
                      )].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url  = URL.createObjectURL(blob)
                      const a    = document.createElement('a')
                      a.href = url; a.download = exp.arquivo; a.click()
                      URL.revokeObjectURL(url)
                    } catch { alert('Erro ao exportar dados') }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: C.text, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = config.corPrimaria; e.currentTarget.style.color = config.corPrimaria }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;           e.currentTarget.style.color = C.text }}
                >
                  <Download size={13} /> Exportar CSV
                </button>
              </div>
            ))}
          </div>

          {/* Zona de Perigo */}
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '16px 20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} /> Zona de Perigo
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>Restaurar configurações padrão</p>
                <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>Redefine todas as configurações para os valores padrão</p>
              </div>
              <button
                onClick={() => { if (window.confirm('Restaurar todos os valores padrão? Esta ação não pode ser desfeita.')) restaurarPadroes() }}
                style={{ padding: '7px 14px', background: 'none', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#f59e0b', cursor: 'pointer' }}
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )

      default: return null
    }
  }

  return (
    <LayoutAdmin
      paginaAtiva="configuracoesAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Configurações"
      topbarSubtitulo="Gerencie as configurações gerais da plataforma."
    >
      <div style={{ display: isMobile ? 'block' : 'flex', height: isMobile ? 'auto' : 'calc(100vh - 60px)', overflow: isMobile ? 'auto' : 'hidden' }}>

        {/* Sidebar de navegação */}
        <div style={{ width: isMobile ? '100%' : '220px', flexShrink: 0, borderRight: isMobile ? 'none' : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : 'none', overflowX: isMobile ? 'auto' : 'visible', overflowY: isMobile ? 'hidden' : 'auto', display: isMobile ? 'flex' : 'block', background: C.surface, padding: isMobile ? '8px' : '16px 0' }}>
          {menuItens.map(grupo => (
            <div key={grupo.grupo}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, margin: '16px 16px 6px', textTransform: 'uppercase', letterSpacing: '0.8px', display: isMobile ? 'none' : 'block' }}>
                {grupo.grupo}
              </p>
              {grupo.itens.map(item => (
                <button
                  key={item.key}
                  onClick={() => setSecaoAtiva(item.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: isMobile ? '8px 12px' : '9px 16px', background: secaoAtiva === item.key ? 'rgba(26,86,255,0.08)' : 'none', whiteSpace: 'nowrap' as const,
                    border: 'none',
                    borderLeft: secaoAtiva === item.key ? `3px solid ${config.corPrimaria}` : '3px solid transparent',
                    cursor: 'pointer', fontSize: '13px',
                    fontWeight: secaoAtiva === item.key ? 600 : 400,
                    color: secaoAtiva === item.key ? config.corPrimaria : C.text,
                    textAlign: 'left', transition: 'all 150ms',
                  }}
                >
                  <span style={{ color: secaoAtiva === item.key ? config.corPrimaria : C.muted }}>{item.icone}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {renderSecao()}
        </div>
      </div>
    </LayoutAdmin>
  )
}
