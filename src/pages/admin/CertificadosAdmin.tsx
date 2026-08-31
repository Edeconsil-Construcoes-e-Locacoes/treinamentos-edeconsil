import { useState, useEffect } from 'react'
import { Search, FileDown, Upload, LayoutGrid, List, Download } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { LayoutAdmin } from '../../components/admin/LayoutAdmin'
import { certificadosAPI, usuariosAPI } from '../../services/api'
import { imprimirCertificado } from '../../utils/imprimirCertificado'

const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')

const tipoArquivo = (url: string) => {
  if (!url) return 'desconhecido'
  const ext = url.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext ?? '')) return 'imagem'
  if (ext === 'pdf') return 'pdf'
  return 'desconhecido'
}

interface CertificadosAdminProps {
  onNavigate: (page: string) => void
  onLogout:   () => void
}

export function CertificadosAdmin({ onNavigate, onLogout }: CertificadosAdminProps) {
  const { C } = useTheme()
  const [certificados, setCertificados] = useState<any[]>([])
  const [total,        setTotal]        = useState(0)
  const [carregando,   setCarregando]   = useState(true)
  const [busca,        setBusca]        = useState('')
  const [pagina,       setPagina]       = useState(1)
  const [modalUpload,   setModalUpload]   = useState(false)
  const [uploadForm,    setUploadForm]    = useState({
    usuario_id: '', titulo_externo: '', entidade_emissora: '',
    data_emissao: '', data_validade: '', carga_horaria: '',
  })
  const [uploadArquivo, setUploadArquivo] = useState<File | null>(null)
  const [usuarios,      setUsuarios]      = useState<any[]>([])
  const [enviando,      setEnviando]      = useState(false)
  const [visuMural,     setVisuMural]     = useState(true)

  const carregar = async (p = 1, b = busca) => {
    setCarregando(true)
    try {
      const params: Record<string, string> = { pagina: String(p), limite: '20' }
      if (b) params.busca = b
      const data = await certificadosAPI.listarAdmin(params) as any
      setCertificados(data.certificados ?? [])
      setTotal(data.total ?? 0)
      setPagina(p)
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrirModalUpload = async () => {
    if (usuarios.length === 0) {
      try {
        const data = await usuariosAPI.listar({ perfil: 'colaborador', limite: '500' }) as any
        const lista = Array.isArray(data) ? data : (data.usuarios ?? [])
        setUsuarios(lista.filter((u: any) => u.perfil === 'colaborador'))
      } catch (err) {
        console.error('Erro ao buscar alunos:', err)
      }
    }
    setModalUpload(true)
  }

  const enviarCertificado = async () => {
    if (!uploadArquivo || !uploadForm.usuario_id || !uploadForm.titulo_externo) {
      alert('Preencha aluno, título e arquivo.')
      return
    }
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', uploadArquivo)
      Object.entries(uploadForm).forEach(([k, v]) => v && fd.append(k, v))
      await certificadosAPI.uploadExterno(fd)
      setModalUpload(false)
      setUploadArquivo(null)
      setUploadForm({ usuario_id: '', titulo_externo: '', entidade_emissora: '', data_emissao: '', data_validade: '', carga_horaria: '' })
      carregar(1)
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao enviar.')
    } finally {
      setEnviando(false)
    }
  }

  const formatarData = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-BR')
  }

  const baixarCertificado = (cert: any) => {
    if (cert.tipo === 'externo' && cert.url_pdf) {
      window.open(`${BACKEND_URL}${cert.url_pdf}`, '_blank')
    } else {
      imprimirCertificado(cert)
    }
  }

  return (
    <LayoutAdmin
      paginaAtiva="certificadosAdmin"
      onNavigate={onNavigate}
      onLogout={onLogout}
      topbarTitulo="Certificados"
      topbarSubtitulo="Certificados emitidos automaticamente ao aprovar nas avaliações."
    >
      <div style={{ padding: '28px 24px' }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              Certificados Emitidos
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              {total} certificado{total !== 1 ? 's' : ''} emitido{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Toggle mural / tabela */}
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => setVisuMural(true)}
              title="Mural"
              style={{ padding: '6px 10px', background: visuMural ? '#0d2550' : 'transparent', color: visuMural ? '#fff' : '#0d2550', border: '1px solid #0d2550', borderRadius: '6px 0 0 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setVisuMural(false)}
              title="Tabela"
              style={{ padding: '6px 10px', background: !visuMural ? '#0d2550' : 'transparent', color: !visuMural ? '#fff' : '#0d2550', border: '1px solid #0d2550', borderLeft: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <List size={15} />
            </button>
          </div>
          <button
            onClick={abrirModalUpload}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', background: '#0d2550', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 700,
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Upload size={16} />
            Adicionar Certificado
          </button>
          <a
            href="/certificados/FOR-CCR-006.r03_Modelo_de_Certificado.pptx"
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#F5C400',
              color: '#0d2550',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <FileDown size={16} />
            Modelo de Certificado
          </a>
          </div>
        </div>

        {/* Busca */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', flex: 1 }}>
            <Search size={14} color={C.muted} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && carregar(1, busca)}
              placeholder="Buscar por aluno ou código..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: C.text, flex: 1 }}
            />
          </div>
          <button onClick={() => carregar(1, busca)}
            style={{ padding: '9px 18px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            Buscar
          </button>
        </div>

        {/* Mural visual */}
        {visuMural && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {carregando ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: C.muted, fontSize: '14px' }}>
                Carregando...
              </div>
            ) : certificados.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: C.muted, fontSize: '14px' }}>
                Nenhum certificado encontrado.
              </div>
            ) : certificados.map((cert: any) => (
              <div key={cert.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' }}>
                {/* Faixa colorida */}
                <div style={{ height: '6px', background: cert.tipo === 'externo' ? '#f59e0b' : '#0d2550' }} />

                <div style={{ padding: '16px' }}>
                  {/* Ícone + título */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cert.tipo === 'externo' ? '#fef3c7' : '#e8edf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {cert.curso_icone ?? '📜'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: C.text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cert.curso_titulo ?? cert.titulo_externo ?? 'Certificado'}
                      </p>
                      <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                        {cert.aluno_nome}
                      </p>
                    </div>
                    {cert.tipo === 'externo' && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f59e0b', color: '#fff', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>EXT</span>
                    )}
                  </div>

                  {/* Informações */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <p style={{ color: C.muted, margin: '0 0 2px' }}>Emitido em</p>
                      <p style={{ fontWeight: 600, color: C.text, margin: 0 }}>
                        {cert.data_emissao ? new Date(cert.data_emissao).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: C.muted, margin: '0 0 2px' }}>{cert.nota_obtida != null ? 'Nota' : 'Setor'}</p>
                      <p style={{ fontWeight: 600, color: C.text, margin: 0 }}>
                        {cert.nota_obtida != null ? `${cert.nota_obtida}%` : (cert.aluno_setor ?? '—')}
                      </p>
                    </div>
                    {cert.data_validade && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ color: C.muted, margin: '0 0 2px' }}>Válido até</p>
                        <p style={{ fontWeight: 600, color: C.text, margin: 0 }}>
                          {new Date(cert.data_validade).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pré-visualização do arquivo externo */}
                  {cert.tipo === 'externo' && cert.url_pdf && (
                    <>
                      {tipoArquivo(cert.url_pdf) === 'imagem' ? (
                        <a href={`${BACKEND_URL}${cert.url_pdf}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '10px' }}>
                          <img
                            src={`${BACKEND_URL}${cert.url_pdf}`}
                            alt={cert.titulo_externo}
                            style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '160px', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'block' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <span style={{ fontSize: '11px', color: '#0d2550', fontWeight: 600, display: 'block', marginTop: '4px' }}>Ver certificado completo →</span>
                        </a>
                      ) : (
                        <a
                          href={`${BACKEND_URL}${cert.url_pdf}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '10px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          <span style={{ fontSize: '22px' }}>📄</span>
                          <div>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', margin: 0 }}>Abrir PDF</p>
                            <p style={{ fontSize: '10px', color: C.muted, margin: 0 }}>{cert.titulo_externo}</p>
                          </div>
                        </a>
                      )}
                    </>
                  )}

                  {cert.tipo !== 'externo' && (
                    <button
                      onClick={() => baixarCertificado(cert)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '12px', padding: '8px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.text, cursor: 'pointer' }}
                    >
                      <Download size={13} /> Baixar
                    </button>
                  )}

                  {/* Rodapé — código */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '10px', color: C.muted, fontFamily: 'monospace' }}>
                      {cert.codigo}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabela */}
        {!visuMural && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface2 }}>
                {['Aluno', 'Curso', 'Código', 'Nota', 'Emitido em', 'Válido até', 'Setor', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: C.muted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                    Carregando...
                  </td>
                </tr>
              ) : certificados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏆</div>
                    <p style={{ fontSize: '14px', color: C.text, margin: '0 0 4px', fontWeight: 600 }}>
                      Nenhum certificado emitido ainda
                    </p>
                    <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>
                      Os certificados são gerados automaticamente quando um aluno é aprovado na avaliação final
                    </p>
                  </td>
                </tr>
              ) : certificados.map((cert, idx) => (
                <tr key={cert.id} style={{ borderBottom: idx < certificados.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{cert.aluno_nome}</p>
                    <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: 'monospace' }}>
                      {cert.aluno_cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: C.text }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {cert.curso_titulo}
                      {cert.tipo === 'externo' && (
                        <span style={{ fontSize: '10px', padding: '2px 5px', background: '#f59e0b', color: '#fff', borderRadius: '4px', fontWeight: 700 }}>EXT</span>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.blue, fontFamily: 'monospace', background: 'rgba(26,86,255,0.08)', border: '1px solid rgba(26,86,255,0.20)', borderRadius: '6px', padding: '3px 8px' }}>
                      {cert.codigo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: cert.nota_obtida != null ? (cert.nota_obtida >= 70 ? '#10b981' : '#ef4444') : C.muted }}>
                    {cert.nota_obtida != null ? `${cert.nota_obtida}%` : (cert.tipo === 'externo' ? (cert.entidade_emissora ?? '—') : '—')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: C.muted }}>
                    {formatarData(cert.data_emissao)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: C.muted }}>
                    {cert.data_validade ? formatarData(cert.data_validade) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: C.muted }}>
                    {cert.aluno_setor ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => baixarCertificado(cert)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: C.text, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <Download size={12} /> Baixar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Paginação */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => carregar(pagina - 1)} disabled={pagina === 1}
              style={{ padding: '8px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '13px', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? C.muted : C.text }}>
              ← Anterior
            </button>
            <span style={{ padding: '8px 16px', fontSize: '13px', color: C.muted, alignSelf: 'center' }}>
              Página {pagina} de {Math.ceil(total / 20)}
            </span>
            <button onClick={() => carregar(pagina + 1)} disabled={pagina >= Math.ceil(total / 20)}
              style={{ padding: '8px 16px', background: C.blue, border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>
              Próxima →
            </button>
          </div>
        )}

      </div>

      {/* Modal upload certificado externo */}
      {modalUpload && (
        <div
          onClick={() => setModalUpload(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 20px' }}>
              Emitir Certificado Externo
            </h2>

            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Aluno *</label>
            <select
              value={uploadForm.usuario_id}
              onChange={e => setUploadForm(f => ({ ...f, usuario_id: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, marginBottom: '14px' }}
            >
              <option value="">Selecione o aluno</option>
              {usuarios.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>

            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Título do Certificado *</label>
            <input
              value={uploadForm.titulo_externo}
              onChange={e => setUploadForm(f => ({ ...f, titulo_externo: e.target.value }))}
              placeholder="Ex: NR-35 Trabalho em Altura"
              style={{ width: '100%', padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, marginBottom: '14px', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Entidade Emissora</label>
            <input
              value={uploadForm.entidade_emissora}
              onChange={e => setUploadForm(f => ({ ...f, entidade_emissora: e.target.value }))}
              placeholder="Ex: SENAI, SESI..."
              style={{ width: '100%', padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, marginBottom: '14px', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Data de Emissão</label>
                <input type="date" value={uploadForm.data_emissao}
                  onChange={e => setUploadForm(f => ({ ...f, data_emissao: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Data de Validade</label>
                <input type="date" value={uploadForm.data_validade}
                  onChange={e => setUploadForm(f => ({ ...f, data_validade: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, boxSizing: 'border-box' }} />
              </div>
            </div>

            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Carga Horária</label>
            <input
              value={uploadForm.carga_horaria}
              onChange={e => setUploadForm(f => ({ ...f, carga_horaria: e.target.value }))}
              placeholder="Ex: 8h"
              style={{ width: '100%', padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, marginBottom: '14px', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '4px' }}>Arquivo (PDF, JPG, PNG) *</label>
            <input
              type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setUploadArquivo(e.target.files?.[0] ?? null)}
              style={{ width: '100%', fontSize: '13px', color: C.text, marginBottom: '4px' }}
            />
            {uploadArquivo && (
              <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 14px' }}>📎 {uploadArquivo.name}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setModalUpload(false)}
                style={{ padding: '9px 18px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={enviarCertificado}
                disabled={enviando}
                style={{ padding: '9px 18px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutAdmin>
  )
}
