import { useState, useRef, useCallback } from 'react'
import {
  FileSpreadsheet, AlertCircle, Download,
  ChevronDown, ChevronUp, X, Upload
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { lerPlanilhaExcel } from '../../utils/importarExcel'
import type { AlunoImportado } from '../../utils/importarExcel'
import { usuariosAPI } from '../../services/api'

interface ImportarAlunosModalProps {
  onFechar:      () => void
  onSucesso:     (total: number) => void
  turmasDoBanco?: any[]
}

type Etapa = 'upload' | 'preview' | 'importando' | 'resultado'

interface ResultadoImportacao {
  importados: number
  erros:      number
  mensagem?:  string
  detalhes:   any[]
  falhas:     any[]
}

export function ImportarAlunosModal({ onFechar, onSucesso, turmasDoBanco }: ImportarAlunosModalProps) {
  const { C } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa]             = useState<Etapa>('upload')
  const [arquivo, setArquivo]         = useState<File | null>(null)
  const [alunos, setAlunos]           = useState<AlunoImportado[]>([])
  const [erro, setErro]               = useState('')
  const [carregando, setCarregando]   = useState(false)
  const [resultado, setResultado]     = useState<ResultadoImportacao | null>(null)
  const [expandirErros, setExpandirErros] = useState(false)
  const [dragOver, setDragOver]       = useState(false)

  const alunosValidos   = alunos.filter(a => a.valido)
  const alunosInvalidos = alunos.filter(a => !a.valido)

  const processarArquivo = async (file: File) => {
    setErro('')
    setCarregando(true)
    try {
      const dados = await lerPlanilhaExcel(file, turmasDoBanco)
      if (dados.length === 0) {
        setErro('Planilha vazia ou sem dados reconhecíveis.')
        return
      }
      setArquivo(file)
      setAlunos(dados)
      setEtapa('preview')
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao processar planilha')
    } finally {
      setCarregando(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processarArquivo(file)
  }, [])

  const importar = async () => {
    setEtapa('importando')
    try {
      const payload = alunosValidos.map(a => ({
        nome:            a.nome,
        cpf:             a.cpfLimpo,
        cargo:           a.cargo,
        setor:           a.setor,       // coluna H — Setor/Turma
        data_nascimento: a.data_nascimento,
        data_admissao:   a.data_admissao,
        matricula:       a.matricula,
        origem:          a.origem,       // coluna G — era centro_custo
      }))

      const res = await (usuariosAPI as any).importarCsv(payload) as ResultadoImportacao
      setResultado(res)
      setEtapa('resultado')
      if (res.importados > 0) {
        onSucesso(res.importados)
      }
    } catch (e: any) {
      setErro(e.message ?? 'Erro na importação')
      setEtapa('preview')
    }
  }

  // Arquivo fixo em public/modelos/ (2 abas: Alunos + Instruções, com o CPF
  // já formatado como texto). Substitui a geração por código, que só produzia
  // a aba de dados e perdia o zero à esquerda do CPF.
  const baixarTemplate = () => {
    const a = document.createElement('a')
    a.href = '/modelos/Modelo_Upload_Alunos.xlsx'
    a.download = 'Modelo_Upload_Alunos.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ── ETAPA UPLOAD ──
  if (etapa === 'upload') {
    return (
      <div style={{ padding:'24px' }}>
        {erro && (
          <div style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#ef4444', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.blue : C.border}`,
            borderRadius: '12px',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? `rgba(26,86,255,0.05)` : C.surface2,
            transition: 'all 200ms',
            marginBottom: '20px',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
            style={{ display:'none' }}
          />
          {carregando ? (
            <>
              <div style={{ width:'36px', height:'36px', border:`3px solid ${C.border}`, borderTopColor:C.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
              <p style={{ fontSize:'14px', color:C.muted, margin:0 }}>Processando planilha...</p>
            </>
          ) : (
            <>
              <FileSpreadsheet size={40} color={C.blue} style={{ marginBottom:'12px' }} />
              <p style={{ fontSize:'15px', fontWeight:600, color:C.text, margin:'0 0 6px' }}>
                Arraste a planilha aqui
              </p>
              <p style={{ fontSize:'13px', color:C.muted, margin:'0 0 16px' }}>
                ou clique para selecionar o arquivo
              </p>
              <span style={{ fontSize:'12px', color:C.muted, background:C.surface, border:`1px solid ${C.border}`, borderRadius:'6px', padding:'4px 12px' }}>
                .xlsx · .xls · .csv
              </span>
            </>
          )}
        </div>

        <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
          <p style={{ fontSize:'12px', fontWeight:700, color:C.text, margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Colunas esperadas na planilha:
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px 6px' }}>
            {[
              { col:'A', label:'Nome',          obrig:true  },
              { col:'B', label:'CPF',           obrig:true  },
              { col:'C', label:'Cargo',         obrig:false },
              { col:'D', label:'Admissão',      obrig:false },
              { col:'E', label:'Mat',           obrig:false },
              { col:'F', label:'Dat. Nasc',     obrig:true  },
              { col:'G', label:'Centro Custo',  obrig:false },
              { col:'H', label:'Setor/Turma',   obrig:false },
            ].map(c => (
              <div key={c.col} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 8px', background:C.surface, borderRadius:'6px', border:`0.5px solid ${C.border}` }}>
                <span style={{ fontSize:'10px', fontWeight:800, color:'#fff', background:C.blue, borderRadius:'4px', padding:'1px 5px' }}>{c.col}</span>
                <span style={{ fontSize:'11px', color:C.text, fontWeight:c.obrig?600:400 }}>{c.label}</span>
                {c.obrig && <span style={{ fontSize:'9px', color:'#ef4444' }}>*</span>}
              </div>
            ))}
          </div>
          <p style={{ fontSize:'11px', color:C.muted, margin:'8px 0 0' }}>
            * Obrigatório · Col. H (Setor/Turma) define o grupo do aluno e cria matrículas automáticas nos cursos
          </p>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button
            onClick={e => { e.stopPropagation(); baixarTemplate() }}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:`1.5px solid ${C.border}`, borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:500, color:C.text, cursor:'pointer' }}
          >
            <Download size={14} /> Baixar modelo Excel
          </button>
          <button
            onClick={onFechar}
            style={{ padding:'9px 20px', background:'none', border:`1.5px solid ${C.border}`, borderRadius:'8px', fontSize:'13px', color:C.text, cursor:'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // ── ETAPA PREVIEW ──
  if (etapa === 'preview') {
    return (
      <div style={{ padding:'24px' }}>
        {erro && (
          <div style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#ef4444', marginBottom:'16px' }}>
            ⚠️ {erro}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'Total na planilha',    valor:alunos.length,         cor:C.text,    bg:C.surface2  },
            { label:'Prontos p/ importar',  valor:alunosValidos.length,  cor:'#10b981', bg:'rgba(16,185,129,0.08)' },
            { label:'Com problemas',        valor:alunosInvalidos.length, cor:'#ef4444', bg:'rgba(239,68,68,0.08)'  },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1px solid ${C.border}`, borderRadius:'10px', padding:'14px', textAlign:'center' }}>
              <div style={{ fontSize:'28px', fontWeight:800, color:s.cor }}>{s.valor}</div>
              <div style={{ fontSize:'11px', color:C.muted, marginTop:'2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'8px', marginBottom:'16px' }}>
          <FileSpreadsheet size={16} color={C.blue} />
          <span style={{ fontSize:'13px', color:C.text, flex:1 }}>{arquivo?.name}</span>
          <button onClick={() => { setEtapa('upload'); setAlunos([]); setArquivo(null) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, display:'flex' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ maxHeight:'280px', overflowY:'auto', border:`1px solid ${C.border}`, borderRadius:'10px', marginBottom:'12px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:C.surface2, position:'sticky', top:0 }}>
                {['#','Nome','CPF','Cargo','Dat. Nasc','Mat','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:'11px', fontWeight:700, color:C.muted, textAlign:'left', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:`1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map((a, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: a.valido ? 'transparent' : 'rgba(239,68,68,0.04)' }}>
                  <td style={{ padding:'8px 10px', fontSize:'12px', color:C.muted }}>{i+1}</td>
                  <td style={{ padding:'8px 10px', fontSize:'12px', color:C.text, fontWeight:500, maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome || '—'}</td>
                  <td style={{ padding:'8px 10px', fontSize:'12px', color:C.muted, fontFamily:'monospace' }}>
                    {a.cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </td>
                  <td style={{ padding:'8px 10px', fontSize:'11px', color:C.muted, maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.cargo || '—'}</td>
                  <td style={{ padding:'8px 10px', fontSize:'11px', color:C.muted, fontFamily:'monospace' }}>
                    {a.senhaInicial ?? '—'}
                  </td>
                  <td style={{ padding:'8px 10px', fontSize:'11px', color:C.muted }}>{a.matricula ?? '—'}</td>
                  <td style={{ padding:'8px 10px' }}>
                    {a.valido ? (
                      <span style={{ fontSize:'10px', fontWeight:700, color:'#10b981', background:'rgba(16,185,129,0.12)', borderRadius:'4px', padding:'2px 8px' }}>✓ OK</span>
                    ) : (
                      <span title={a.erros.join(' | ')} style={{ fontSize:'10px', fontWeight:700, color:'#ef4444', background:'rgba(239,68,68,0.12)', borderRadius:'4px', padding:'2px 8px', cursor:'help' }}>
                        ✕ {a.erros.length} erro{a.erros.length>1?'s':''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {alunosInvalidos.length > 0 && (
          <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:'8px', marginBottom:'16px', overflow:'hidden' }}>
            <button
              onClick={() => setExpandirErros(!expandirErros)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, color:'#ef4444' }}
            >
              <span>⚠️ Ver detalhes dos {alunosInvalidos.length} registro(s) com problema</span>
              {expandirErros ? <ChevronUp size={14} color="#ef4444" /> : <ChevronDown size={14} color="#ef4444" />}
            </button>
            {expandirErros && (
              <div style={{ padding:'0 14px 14px' }}>
                {alunosInvalidos.map((a, i) => (
                  <div key={i} style={{ marginBottom:'8px', padding:'8px', background:'rgba(239,68,68,0.08)', borderRadius:'6px' }}>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'#ef4444', margin:'0 0 4px' }}>
                      Linha {alunos.indexOf(a)+2}: {a.nome || 'Sem nome'} — CPF: {a.cpf || '—'}
                    </p>
                    {a.erros.map((e, j) => (
                      <p key={j} style={{ fontSize:'11px', color:'#ef4444', margin:'2px 0 0', paddingLeft:'8px' }}>
                        · {e}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {alunosInvalidos.length > 0 && alunosValidos.length > 0 && (
          <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'12px', color:'#f59e0b' }}>
            ⚠️ Os {alunosInvalidos.length} registro(s) com problema serão ignorados.
            Apenas os {alunosValidos.length} válidos serão importados.
          </div>
        )}

        {alunosValidos.length === 0 && (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'12px', color:'#ef4444' }}>
            ❌ Nenhum registro válido encontrado. Corrija a planilha e tente novamente.
          </div>
        )}

        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={() => { setEtapa('upload'); setAlunos([]); setArquivo(null) }}
            style={{ padding:'10px 20px', background:'none', border:`1.5px solid ${C.border}`, borderRadius:'8px', fontSize:'13px', color:C.text, cursor:'pointer' }}>
            ← Trocar arquivo
          </button>
          <button
            onClick={importar}
            disabled={alunosValidos.length === 0}
            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 24px', background:alunosValidos.length>0?C.blue:C.border, border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, color:'#fff', cursor:alunosValidos.length>0?'pointer':'not-allowed' }}
          >
            <Upload size={14} />
            Importar {alunosValidos.length} aluno{alunosValidos.length!==1?'s':''}
          </button>
        </div>
      </div>
    )
  }

  // ── ETAPA IMPORTANDO ──
  if (etapa === 'importando') {
    return (
      <div style={{ padding:'48px 24px', textAlign:'center' }}>
        <div style={{ width:'48px', height:'48px', border:`3px solid ${C.border}`, borderTopColor:C.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ fontSize:'15px', fontWeight:600, color:C.text, margin:'0 0 6px' }}>
          Importando alunos...
        </p>
        <p style={{ fontSize:'13px', color:C.muted, margin:0 }}>
          Cadastrando {alunosValidos.length} aluno{alunosValidos.length!==1?'s':''} e criando matrículas automáticas
        </p>
      </div>
    )
  }

  // ── ETAPA RESULTADO ──
  if (etapa === 'resultado' && resultado) {
    return (
      <div style={{ padding:'24px' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>
            {resultado.importados > 0 ? '🎉' : '⚠️'}
          </div>
          <h3 style={{ fontSize:'18px', fontWeight:700, color:C.text, margin:'0 0 6px' }}>
            Importação concluída!
          </h3>
          <p style={{ fontSize:'13px', color:C.muted, margin:0 }}>
            {resultado.mensagem}
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
          <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:'32px', fontWeight:800, color:'#10b981' }}>{resultado.importados}</div>
            <div style={{ fontSize:'12px', color:C.muted, marginTop:'4px' }}>Importados com sucesso</div>
          </div>
          <div style={{ background: resultado.erros>0?'rgba(239,68,68,0.08)':C.surface2, border:`1px solid ${resultado.erros>0?'rgba(239,68,68,0.25)':C.border}`, borderRadius:'10px', padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:'32px', fontWeight:800, color:resultado.erros>0?'#ef4444':C.muted }}>{resultado.erros}</div>
            <div style={{ fontSize:'12px', color:C.muted, marginTop:'4px' }}>Erros / Duplicatas</div>
          </div>
        </div>

        {resultado.detalhes.length > 0 && (
          <div style={{ marginBottom:'16px' }}>
            <p style={{ fontSize:'12px', fontWeight:700, color:C.text, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Alunos cadastrados — senhas iniciais:
            </p>
            <div style={{ maxHeight:'200px', overflowY:'auto', border:`1px solid ${C.border}`, borderRadius:'8px' }}>
              {resultado.detalhes.map((d: any, i: number) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom: i<resultado.detalhes.length-1?`1px solid ${C.border}`:'none' }}>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:600, color:C.text, margin:'0 0 2px' }}>{d.nome}</p>
                    <p style={{ fontSize:'11px', color:C.muted, margin:0, fontFamily:'monospace' }}>
                      CPF: {d.cpf}
                    </p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'11px', color:C.muted, margin:'0 0 2px' }}>Senha inicial:</p>
                    <p style={{ fontSize:'13px', fontWeight:700, color:C.blue, margin:0, fontFamily:'monospace' }}>
                      {d.senha_inicial}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resultado.falhas.length > 0 && (
          <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.20)', borderRadius:'8px', padding:'12px', marginBottom:'16px' }}>
            <p style={{ fontSize:'12px', fontWeight:700, color:'#ef4444', margin:'0 0 6px' }}>Não importados:</p>
            {resultado.falhas.map((f: any, i: number) => (
              <p key={i} style={{ fontSize:'11px', color:'#ef4444', margin:'2px 0' }}>
                · {f.nome ?? f.cpf}: {f.erro}
              </p>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          {resultado.importados < alunosValidos.length && (
            <button onClick={() => setEtapa('upload')}
              style={{ padding:'10px 18px', background:'none', border:`1.5px solid ${C.border}`, borderRadius:'8px', fontSize:'13px', color:C.text, cursor:'pointer' }}>
              Importar mais
            </button>
          )}
          <button onClick={onFechar}
            style={{ padding:'10px 24px', background:C.blue, border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, color:'#fff', cursor:'pointer' }}>
            Concluir
          </button>
        </div>
      </div>
    )
  }

  return null
}
