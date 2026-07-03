import { useState, useCallback, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { turmasAPI, cargosAPI } from '../../services/api'

interface FormAluno {
  nome:            string
  cpf:             string
  data_nascimento: string
  matricula:       string
  cargo:           string
  setor:           string
  centro_custo:    string
  ramal:           string
  celular:         string
}

interface CadastroAlunoProps {
  onFechar:     () => void
  onSucesso:    (usuario: any) => void
  setorInicial?: string
}

const FORM_INICIAL: FormAluno = {
  nome: '', cpf: '', data_nascimento: '',
  matricula: '', cargo: '', setor: '',
  centro_custo: '', ramal: '', celular: '',
}

export function CadastroAluno({ onFechar, onSucesso, setorInicial }: CadastroAlunoProps) {
  const { C } = useTheme()
  const [form, setForm]         = useState<FormAluno>(() => ({ ...FORM_INICIAL, setor: setorInicial ?? '' }))
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([])
  const [cargos, setCargos]     = useState<any[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')
  const [sucesso, setSucesso]   = useState<any>(null)

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

  const handleChange = useCallback((campo: keyof FormAluno) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [campo]: e.target.value }))
    }, [])

  const stopKeys = useCallback((e: React.KeyboardEvent) => e.stopPropagation(), [])

  const handleSalvar = async () => {
    setErro('')
    const cpfLimpo = form.cpf.replace(/\D/g, '')
    if (!form.nome.trim())      { setErro('Nome é obrigatório.'); return }
    if (cpfLimpo.length !== 11) { setErro('CPF deve ter 11 dígitos.'); return }
    if (!form.data_nascimento)  { setErro('Data de nascimento é obrigatória.'); return }
    if (!form.setor)            { setErro('Selecione o Setor / Turma.'); return }

    setSalvando(true)
    try {
      const { usuariosAPI } = await import('../../services/api')
      const resultado = await (usuariosAPI as any).criar({
        nome:            form.nome.trim(),
        cpf:             cpfLimpo,
        data_nascimento: form.data_nascimento,
        matricula:       form.matricula    || null,
        cargo:           form.cargo         || null,
        setor:           form.setor         || null,
        centro_custo:    form.centro_custo || null,
        ramal:           form.ramal        || null,
        celular:         form.celular      || null,
      }) as any
      setSucesso(resultado)
      onSucesso(resultado.usuario)
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao cadastrar aluno.')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', background: C.surface2,
    border: `1px solid ${C.border}`, borderRadius: '8px',
    fontSize: '13px', color: C.text, outline: 'none', fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: C.muted,
    display: 'block', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  // ── TELA DE SUCESSO ──
  if (sucesso) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
          Aluno cadastrado com sucesso!
        </h3>
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px', margin: '16px 0', textAlign: 'left' }}>
          {[
            { label: 'Nome',          valor: sucesso.usuario?.nome },
            { label: 'CPF',           valor: sucesso.usuario?.cpf },
            { label: 'Cargo',         valor: form.cargo || '—' },
            { label: 'Setor / Turma', valor: sucesso.usuario?.setor ?? sucesso.usuario?.cargo },
          ].map(i => (
            <p key={i.label} style={{ fontSize: '13px', color: C.text, margin: '0 0 6px' }}>
              <strong>{i.label}:</strong> {i.valor}
            </p>
          ))}
          <p style={{ fontSize: '13px', fontWeight: 700, color: C.blue, margin: '10px 0 0', padding: '10px', background: `rgba(26,86,255,0.08)`, borderRadius: '8px' }}>
            🔑 Senha inicial: <span style={{ fontFamily: 'monospace', fontSize: '15px' }}>{sucesso.senha_inicial}</span>
          </p>
          <p style={{ fontSize: '11px', color: C.muted, margin: '6px 0 0' }}>{sucesso.instrucoes}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => { setSucesso(null); setForm({ ...FORM_INICIAL, setor: setorInicial ?? '' }); setErro('') }}
            style={{ padding: '10px 20px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            + Cadastrar outro
          </button>
          <button
            onClick={onFechar}
            style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  // ── FORMULÁRIO ──
  return (
    <div style={{ padding: '24px' }}>
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
          value={form.nome}
          onChange={handleChange('nome')}
          onKeyDown={stopKeys}
          placeholder="Nome completo do colaborador"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = C.blue)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
          autoComplete="off"
        />
      </div>

      {/* CPF + Data nascimento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>CPF (apenas números) <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            value={form.cpf}
            onChange={e => setForm(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
            onKeyDown={stopKeys}
            placeholder="00000000000"
            maxLength={11}
            inputMode="numeric"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.blue)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
            autoComplete="off"
          />
        </div>
        <div>
          <label style={labelStyle}>Data de nascimento <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="date"
            value={form.data_nascimento}
            onChange={handleChange('data_nascimento')}
            onKeyDown={stopKeys}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.blue)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>

      {/* Matrícula */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Matrícula</label>
        <input
          type="text"
          value={form.matricula}
          onChange={handleChange('matricula')}
          onKeyDown={stopKeys}
          placeholder="Ex: MAT-001"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = C.blue)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
          autoComplete="off"
        />
      </div>

      {/* Cargo */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Cargo</label>
        <select
          value={form.cargo}
          onChange={handleChange('cargo')}
          onKeyDown={stopKeys}
          style={{ ...inputStyle, cursor: 'pointer', color: form.cargo ? C.text : C.muted }}
          onFocus={e => (e.target.style.borderColor = C.blue)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
        >
          <option value="">Selecione o cargo</option>
          {cargos.map((c: any) => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>
      </div>

      {/* Setor / Turma */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Setor / Turma <span style={{ color: '#ef4444' }}>*</span></label>
        <select
          value={form.setor}
          onChange={handleChange('setor')}
          onKeyDown={stopKeys}
          style={{ ...inputStyle, cursor: 'pointer', color: form.setor ? C.text : C.muted }}
          onFocus={e => (e.target.style.borderColor = C.blue)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
        >
          <option value="">Selecione o setor / turma</option>
          {turmasDisponiveis.map((t: any) => (
            <option key={t.id} value={t.cargo_grupo || t.nome}>{t.cargo_grupo || t.nome}</option>
          ))}
        </select>
        <p style={{ fontSize: '11px', color: C.muted, margin: '4px 0 0' }}>
          Define os cursos disponíveis para o aluno
        </p>
      </div>

      {/* Ramal + Celular */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Ramal</label>
          <input
            type="text"
            value={form.ramal}
            onChange={handleChange('ramal')}
            onKeyDown={stopKeys}
            placeholder="Ex: 1234"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.blue)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
            autoComplete="off"
          />
        </div>
        <div>
          <label style={labelStyle}>Celular</label>
          <input
            type="text"
            value={form.celular}
            onChange={handleChange('celular')}
            onKeyDown={stopKeys}
            placeholder="Ex: 85999999999"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.blue)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Centro de Custo */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Centro de Custo</label>
        <input
          type="text"
          value={form.centro_custo}
          onChange={handleChange('centro_custo')}
          onKeyDown={stopKeys}
          placeholder="Ex: CC-001"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = C.blue)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
          autoComplete="off"
        />
      </div>

      {/* Info senha */}
      <div style={{ background: 'rgba(26,86,255,0.06)', border: '1px solid rgba(26,86,255,0.20)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: C.blue, margin: 0, fontWeight: 600 }}>
          💡 Senha inicial gerada automaticamente
        </p>
        <p style={{ fontSize: '12px', color: C.muted, margin: '4px 0 0' }}>
          A senha será a data de nascimento no formato DDMMAAAA. Matrículas nos cursos da turma são criadas automaticamente.
        </p>
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
          style={{ padding: '10px 24px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
        >
          {salvando ? 'Cadastrando...' : '✓ Cadastrar aluno'}
        </button>
      </div>
    </div>
  )
}
