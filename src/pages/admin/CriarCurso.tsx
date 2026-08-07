import { useState, useCallback, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { cursosAPI, turmasAPI } from '../../services/api'

interface CriarCursoProps {
  onFechar:  () => void
  onSucesso: (curso: any) => void
  cursoEditar?: any
}


const CORES = [
  '#1a56ff','#dc2626','#059669','#d97706',
  '#7c3aed','#db2777','#0891b2','#f59e0b',
  '#16a34a','#ec4899','#6366f1','#14b8a6',
]

const ICONES = [
  '📦','👥','🛡️','🏗️','📢','📐','⚙️','💻',
  '📋','🏥','⚡','🚜','♻️','📊','🔧','📚',
  '🎯','💰','⚖️','🔍','🤝','🏛️','✅','👤',
]

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function CriarCurso({ onFechar, onSucesso, cursoEditar }: CriarCursoProps) {
  const { C } = useTheme()
  const ehEdicao = !!cursoEditar

  const [titulo,       setTitulo]       = useState(cursoEditar?.titulo       ?? '')
  const [slug,         setSlug]         = useState(cursoEditar?.slug         ?? '')
  const [subtitulo,    setSubtitulo]    = useState(cursoEditar?.subtitulo    ?? '')
  const [descricao,    setDescricao]    = useState(cursoEditar?.descricao    ?? '')
  const [categoria,    setCategoria]    = useState(cursoEditar?.categoria    ?? '')
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([])
  const [turmaSelecionada,  setTurmaSelecionada]  = useState<string>(cursoEditar?.turma_id ?? '')
  const [cargo,        setCargo]        = useState(cursoEditar?.cargo        ?? '')
  const [trilha]                         = useState(cursoEditar?.trilha       ?? '')
  const [cargaHoraria, setCargaHoraria] = useState(cursoEditar?.carga_horaria ?? '')
  const [instrutor,    setInstrutor]    = useState(cursoEditar?.instrutor    ?? '')
  const [cor,          setCor]          = useState(cursoEditar?.cor          ?? '#1a56ff')
  const [icone,        setIcone]        = useState(cursoEditar?.icone        ?? '📚')
  const [notaMinima,   setNotaMinima]   = useState(cursoEditar?.nota_minima  ?? 70)
  const [status,       setStatus]       = useState(cursoEditar?.status       ?? 'rascunho')
  const [slugManual,   setSlugManual]   = useState(ehEdicao)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [sucesso,      setSucesso]      = useState(false)
  const [cursoCriado,  setCursoCriado]  = useState<any>(null)

  const stopKeys = useCallback((e: React.KeyboardEvent) => e.stopPropagation(), [])

  useEffect(() => {
    turmasAPI.listar()
      .then((data: any) => setTurmasDisponiveis(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (cursoEditar?.turma_id) {
      setTurmaSelecionada(cursoEditar.turma_id)
    }
  }, [cursoEditar])

  const handleTituloChange = (val: string) => {
    setTitulo(val)
    if (!slugManual) setSlug(gerarSlug(val))
  }

  const handleSalvar = async () => {
    setErro('')
    if (!titulo.trim())   { setErro('Título é obrigatório'); return }
    if (!slug.trim())     { setErro('Slug é obrigatório'); return }
    // Turma é opcional: curso sem turma fica visível para TODOS os alunos.
    if (!instrutor.trim()) { setErro('Instrutor é obrigatório'); return }

    setSalvando(true)
    try {
      const payload = {
        titulo: titulo.trim(), slug: slug.trim(),
        subtitulo: subtitulo.trim() || null,
        descricao: descricao.trim() || null,
        categoria, turma_id: turmaSelecionada || null,
        cargo: cargo.trim() || null,
        trilha: trilha.trim() || null,
        carga_horaria: cargaHoraria.trim() || null,
        instrutor: instrutor.trim(), cor, icone,
        nota_minima: notaMinima, status,
      }

      let resultado: any
      if (ehEdicao) {
        resultado = await (cursosAPI as any).atualizar(cursoEditar.id, payload)
      } else {
        resultado = await (cursosAPI as any).criar(payload)
      }

      setCursoCriado(resultado.curso)
      setSucesso(true)
      onSucesso(resultado.curso)
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao salvar curso')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', background: C.surface2,
    border: `1px solid ${C.border}`, borderRadius: '8px',
    fontSize: '13px', color: C.text, outline: 'none',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: C.muted,
    display: 'block', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }
  const onFocusI = (e: React.FocusEvent<any>) => e.target.style.borderColor = cor
  const onBlurI  = (e: React.FocusEvent<any>) => e.target.style.borderColor = C.border

  if (sucesso && cursoCriado) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
          Curso {ehEdicao ? 'atualizado' : 'criado'} com sucesso!
        </h3>
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px', margin: '16px 0', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {icone}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>{cursoCriado.titulo}</p>
              <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>/{cursoCriado.slug}</p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>
            Status: <strong style={{ color: cursoCriado.status === 'ativo' ? '#10b981' : '#f59e0b' }}>
              {cursoCriado.status === 'ativo' ? 'Publicado' : 'Rascunho'}
            </strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {!ehEdicao && (
            <button onClick={() => { setSucesso(false); setCursoCriado(null); setTitulo(''); setSlug(''); setSubtitulo(''); setDescricao('') }}
              style={{ padding: '10px 20px', background: C.blue, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              + Criar outro
            </button>
          )}
          <button onClick={onFechar}
            style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}>
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {erro && (
        <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Ícone + Cor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Ícone</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px', maxHeight: '90px', overflowY: 'auto' }}>
            {ICONES.map(ic => (
              <button key={ic} onClick={() => setIcone(ic)} onKeyDown={stopKeys}
                style={{ fontSize: '18px', width: '32px', height: '32px', borderRadius: '6px', border: `2px solid ${icone === ic ? cor : 'transparent'}`, background: icone === ic ? `${cor}18` : 'none', cursor: 'pointer' }}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Cor</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px' }}>
            {CORES.map(c => (
              <button key={c} onClick={() => setCor(c)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: `3px solid ${cor === c ? C.text : 'transparent'}`, cursor: 'pointer', outline: 'none', boxShadow: cor === c ? `0 0 0 2px ${C.bg},0 0 0 4px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Título */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Título <span style={{ color: '#ef4444' }}>*</span></label>
        <input type="text" value={titulo} onChange={e => handleTituloChange(e.target.value)}
          onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
          placeholder="Ex: NR-35 — Trabalho em Altura"
          style={inputStyle} autoComplete="off" />
      </div>

      {/* Slug */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>
          Slug (identificador único) <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input type="text" value={slug}
          onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugManual(true) }}
          onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
          placeholder="ex: nr35-trabalho-altura"
          style={{ ...inputStyle, fontFamily: 'monospace' }}
          disabled={ehEdicao}
          autoComplete="off" />
        <p style={{ fontSize: '11px', color: C.muted, margin: '4px 0 0' }}>
          URL: /api/cursos/<strong>{slug || 'slug-do-curso'}</strong>
          {ehEdicao && ' — não pode ser alterado'}
        </p>
      </div>

      {/* Subtítulo */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Subtítulo</label>
        <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)}
          onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
          placeholder="Descrição curta do curso"
          style={inputStyle} autoComplete="off" />
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Descrição completa</label>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
          onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
          placeholder="Descreva o conteúdo e objetivos do curso..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
      </div>

      {/* Categoria + Cargo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Turma (opcional)</label>
          <select value={turmaSelecionada} onChange={e => {
            const id = e.target.value
            setTurmaSelecionada(id)
            const t = turmasDisponiveis.find((x: any) => x.id === id)
            if (t) setCategoria(t.cargo_grupo || t.nome)
          }}
            onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
            style={{ ...inputStyle, cursor: 'pointer', color: turmaSelecionada ? C.text : C.muted }}>
            <option value="">Sem turma — visível para todos os alunos</option>
            {turmasDisponiveis.map((t: any) => (
              <option key={t.id} value={t.id}>{t.cargo_grupo || t.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Cargo / Turma alvo</label>
          <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
            onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
            placeholder="Ex: Coordenação de Suprimentos"
            style={inputStyle} autoComplete="off" />
        </div>
      </div>

      {/* Instrutor + Carga horária */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Instrutor <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" value={instrutor} onChange={e => setInstrutor(e.target.value)}
            onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
            placeholder="Nome do instrutor"
            style={inputStyle} autoComplete="off" />
        </div>
        <div>
          <label style={labelStyle}>Carga horária</label>
          <input type="text" value={cargaHoraria} onChange={e => setCargaHoraria(e.target.value)}
            onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
            placeholder="Ex: 4h"
            style={inputStyle} autoComplete="off" />
        </div>
      </div>

      {/* Nota mínima + Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Nota mínima para aprovação (%)</label>
          <input type="number" value={notaMinima}
            onChange={e => setNotaMinima(parseInt(e.target.value) || 70)}
            onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
            min={0} max={100} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Status de publicação</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            onKeyDown={stopKeys} onFocus={onFocusI} onBlur={onBlurI}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="rascunho">🔶 Rascunho</option>
            <option value="ativo">✅ Publicado</option>
            <option value="arquivado">📦 Arquivado</option>
          </select>
        </div>
      </div>

      {/* Preview do card */}
      {titulo && (
        <div style={{ background: C.surface2, border: `1px solid ${cor}44`, borderRadius: '10px', padding: '14px', borderLeft: `4px solid ${cor}`, marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{icone}</div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{titulo}</p>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                {instrutor || 'Instrutor'} · {cargaHoraria || 'Carga?'} · Nota mín: {notaMinima}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onFechar}
          style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleSalvar} disabled={salvando}
          style={{ padding: '10px 24px', background: cor, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {salvando ? (
            <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Salvando...</>
          ) : `✓ ${ehEdicao ? 'Salvar alterações' : 'Criar curso'}`}
        </button>
      </div>
    </div>
  )
}
