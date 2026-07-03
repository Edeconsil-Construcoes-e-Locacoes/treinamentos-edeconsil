import { useState, useEffect, useCallback } from 'react'
import { Camera } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { usuariosAPI, turmasAPI, cargosAPI } from '../../services/api'

const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '')

interface EditarAlunoProps {
  aluno: any
  onFechar:  () => void
  onSucesso: (alunoAtualizado: any) => void
}

export function EditarAluno({ aluno, onFechar, onSucesso }: EditarAlunoProps) {
  const { C } = useTheme()

  const [nome,         setNome]         = useState('')
  const [cargo,        setCargo]        = useState('')
  const [setor,        setSetor]        = useState('')
  const [matricula,    setMatricula]    = useState('')
  const [ramal,        setRamal]        = useState('')
  const [celular,      setCelular]      = useState('')
  const [centroCusto,  setCentroCusto]  = useState('')
  const [dataAdmissao,   setDataAdmissao]   = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [status,         setStatus]         = useState('ativo')
  const [origem,         setOrigem]         = useState('Empregado')
  const [empresaTerceiro, setEmpresaTerceiro] = useState('')
  const [fotoPreview,    setFotoPreview]    = useState<string | null>(null)
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([])
  const [cargos,       setCargos]       = useState<any[]>([])
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [sucesso,      setSucesso]      = useState(false)

  useEffect(() => {
    turmasAPI.listar()
      .then((lista: any) => {
        const arr = Array.isArray(lista) ? lista : (lista.turmas ?? [])
        setTurmasDisponiveis(arr.filter((t: any) => t.status === 'ativa'))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargosAPI.listar()
      .then((d: any) => setCargos(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!aluno) return
    setNome(aluno.nome           ?? '')
    setCargo(aluno.cargo         ?? '')
    setSetor(aluno.setor         ?? '')
    setMatricula(aluno.matricula ?? '')
    setRamal(aluno.ramal         ?? '')
    setCelular(aluno.celular     ?? '')
    setCentroCusto(aluno.centro_custo ?? '')
    setStatus(aluno.status === 'Ativo' ? 'ativo' : (aluno.status ?? 'ativo'))
    setOrigem(aluno.origem ?? 'Empregado')
    setEmpresaTerceiro(aluno.empresa_terceiro ?? '')
    setFotoPreview(null)

    if (aluno.data_admissao) {
      const d = new Date(aluno.data_admissao)
      if (!isNaN(d.getTime())) {
        setDataAdmissao(d.toISOString().split('T')[0])
      }
    }

    if (aluno.data_nascimento) {
      const dn = new Date(aluno.data_nascimento + 'T00:00:00')
      if (!isNaN(dn.getTime())) {
        setDataNascimento(dn.toISOString().split('T')[0])
      }
    }
  }, [aluno])

  const stopKeys = useCallback((e: React.KeyboardEvent) => e.stopPropagation(), [])

  const handleSalvar = async () => {
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }

    setSalvando(true)
    try {
      const atualizado = await usuariosAPI.atualizar(aluno.id, {
        nome:          nome.trim(),
        cargo,
        setor,
        matricula:     matricula   || null,
        ramal:         ramal       || null,
        celular:       celular     || null,
        centro_custo:  centroCusto || null,
        data_admissao:   dataAdmissao   || null,
        data_nascimento: dataNascimento || null,
        status,
        origem,
        empresa_terceiro: origem === 'Terceiro' ? (empresaTerceiro || null) : null,
      }) as any

      setSucesso(true)
      onSucesso(atualizado.usuario ?? atualizado)
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao salvar alterações.')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    fontSize: '13px',
    color: C.text,
    outline: 'none',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700,
    color: C.muted, display: 'block',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const onFocusInput  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = C.blue)
  const onBlurInput   = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = C.border)

  if (sucesso) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
          Dados atualizados!
        </h3>
        <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 24px' }}>
          As informações de <strong style={{ color: C.text }}>{nome}</strong> foram salvas com sucesso.
        </p>
        <button
          onClick={onFechar}
          style={{ padding: '10px 28px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          Fechar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>

      {/* Info não editável */}
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(26,86,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: C.blue, flexShrink: 0 }}>
          {aluno?.nome?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px' }}>{aluno?.nome}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: C.muted }}>
              CPF: <strong style={{ color: C.text, fontFamily: 'monospace' }}>
                {aluno?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') ?? '—'}
              </strong>
            </span>
            <span style={{ fontSize: '11px', color: C.muted }}>
              CR: <strong style={{ color: C.blue }}>{aluno?.cr ?? '—'}</strong>
            </span>
            <span style={{ fontSize: '11px', color: C.muted }}>
              E-mail: <strong style={{ color: C.text }}>{aluno?.email ?? '—'}</strong>
            </span>
            {aluno?.data_nascimento && (
              <span style={{ fontSize: '11px', color: C.muted }}>
                Nasc: <strong style={{ color: C.text }}>
                  {new Date(aluno.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                </strong>
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 10px', flexShrink: 0 }}>
          🔒 CPF não editável
        </div>
      </div>

      {/* Avatar do colaborador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: C.surface2, borderRadius: '10px', border: `1px solid ${C.border}` }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: '#e8edf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid #0d2550' }}>
          {fotoPreview || aluno?.foto_url ? (
            <img
              src={fotoPreview ?? `${BACKEND_URL}${aluno.foto_url}`}
              alt={nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '28px' }}>👤</span>
          )}
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Foto do colaborador</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#0d2550', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <Camera size={13} />
            Alterar foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                const preview = URL.createObjectURL(file)
                setFotoPreview(preview)
                const fd = new FormData()
                fd.append('foto', file)
                try {
                  const resultado = await (usuariosAPI as any).uploadFoto(aluno.id, fd) as any
                  if (resultado?.foto_url) {
                    aluno.foto_url = resultado.foto_url
                  }
                } catch {
                  alert('Erro ao fazer upload da foto.')
                }
              }}
            />
          </label>
          <p style={{ fontSize: '11px', color: C.muted, margin: '4px 0 0' }}>JPG, PNG ou WEBP até 5MB</p>
        </div>
      </div>

      {erro && (
        <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Nome */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Nome completo <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          onKeyDown={stopKeys}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          style={inputStyle}
          autoComplete="off"
        />
      </div>

      {/* Cargo + Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Cargo</label>
          <select
            value={cargo}
            onChange={e => setCargo(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Selecione o cargo</option>
            {cargo && !cargos.some((c: any) => c.nome === cargo) && (
              <option value={cargo}>{cargo}</option>
            )}
            {cargos.map((c: any) => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      {/* Origem */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Origem</label>
        <select
          value={origem}
          onChange={e => { setOrigem(e.target.value); if (e.target.value !== 'Terceiro') setEmpresaTerceiro('') }}
          onKeyDown={stopKeys}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="Empregado">Empregado</option>
          <option value="Parceiro">Parceiro</option>
          <option value="Terceiro">Terceiro</option>
        </select>
      </div>

      {/* Empresa terceirizada — só quando Terceiro */}
      {origem === 'Terceiro' && (
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Empresa Terceirizada</label>
          <input
            type="text"
            value={empresaTerceiro}
            onChange={e => setEmpresaTerceiro(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            placeholder="Nome da empresa terceirizada"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
      )}

      {/* Setor / Turma */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Setor / Turma</label>
        <select
          value={setor}
          onChange={e => setSetor(e.target.value)}
          onKeyDown={stopKeys}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          style={{ ...inputStyle, cursor: 'pointer', color: setor ? C.text : C.muted }}
        >
          <option value="">Selecione o setor / turma</option>
          {turmasDisponiveis.map((t: any) => (
            <option key={t.id} value={t.cargo_grupo || t.nome}>{t.cargo_grupo || t.nome}</option>
          ))}
        </select>
        <p style={{ fontSize: '11px', color: C.muted, margin: '4px 0 0' }}>
          Alterar o setor atualiza os cursos disponíveis para o aluno
        </p>
      </div>

      {/* Matrícula + Data Admissão */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Matrícula</label>
          <input
            type="text"
            value={matricula}
            onChange={e => setMatricula(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            placeholder="Ex: MAT-001"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        <div>
          <label style={labelStyle}>Data de Admissão</label>
          <input
            type="date"
            value={dataAdmissao}
            onChange={e => setDataAdmissao(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Data de Nascimento — define a senha de login */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>
          Data de Nascimento <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="date"
          value={dataNascimento}
          onChange={e => setDataNascimento(e.target.value)}
          onKeyDown={stopKeys}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          style={inputStyle}
        />
        {dataNascimento && (
          <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(26,86,255,0.08)', border: '1px solid rgba(26,86,255,0.20)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🔑</span>
            <div>
              <p style={{ fontSize: '11px', color: C.blue, fontWeight: 700, margin: '0 0 1px' }}>
                Senha de acesso do aluno:
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blue, margin: 0, fontFamily: 'monospace', letterSpacing: '2px' }}>
                {(() => {
                  const d = new Date(dataNascimento + 'T00:00:00')
                  const dd   = String(d.getDate()).padStart(2, '0')
                  const mm   = String(d.getMonth() + 1).padStart(2, '0')
                  const yyyy = d.getFullYear()
                  return `${dd}${mm}${yyyy}`
                })()}
              </p>
              <p style={{ fontSize: '10px', color: C.muted, margin: '2px 0 0' }}>
                Formato DDMMAAAA — o aluno usa este código para fazer login
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ramal + Celular */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Ramal</label>
          <input
            type="text"
            value={ramal}
            onChange={e => setRamal(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            placeholder="Ex: 1234"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        <div>
          <label style={labelStyle}>Celular</label>
          <input
            type="text"
            value={celular}
            onChange={e => setCelular(e.target.value)}
            onKeyDown={stopKeys}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            placeholder="Ex: 85999999999"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Centro de Custo */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Centro de Custo</label>
        <input
          type="text"
          value={centroCusto}
          onChange={e => setCentroCusto(e.target.value)}
          onKeyDown={stopKeys}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          placeholder="Ex: CC-001"
          style={inputStyle}
          autoComplete="off"
        />
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onFechar}
          style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          style={{ padding: '10px 24px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {salvando ? 'Salvando...' : '✓ Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
