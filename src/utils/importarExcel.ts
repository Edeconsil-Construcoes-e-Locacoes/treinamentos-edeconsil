import * as XLSX from 'xlsx'

const TURMAS_OFICIAIS = [
  'Coordenação de Suprimentos',
  'Recursos Humanos',
  'Segurança do Trabalho',
  'Serviços Gerais',
  'Comunicação',
  'Engenharia',
  'Manutenções - Oficina',
  'Tecnologia da Informação',
  'Coordenação de Pessoal',
  'Coordenação de Qualidade',
  'Gerência Financeira',
  'Gerência Jurídica e Compliance',
  'Gerência de Auditoria',
  'Gerência de Controladoria',
  'Gerência de Gestão de Pessoas',
  'Saúde Ocupacional',
  'Patrimônio',
]

function normalizarStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const ALIASES_TURMAS: Record<string, string> = {
  'coordenacao de suprimentos':  'Coordenação de Suprimentos',
  'coord suprimentos':           'Coordenação de Suprimentos',
  'suprimentos':                 'Coordenação de Suprimentos',
  'recursos humanos':            'Recursos Humanos',
  'rh':                          'Recursos Humanos',
  'seguranca do trabalho':       'Segurança do Trabalho',
  'seguranca':                   'Segurança do Trabalho',
  'sesmt':                       'Segurança do Trabalho',
  'servicos gerais':             'Serviços Gerais',
  'comunicacao':                 'Comunicação',
  'engenharia':                  'Engenharia',
  'manutencoes oficina':         'Manutenções - Oficina',
  'manutencao oficina':          'Manutenções - Oficina',
  'manutencao':                  'Manutenções - Oficina',
  'manutencoes':                 'Manutenções - Oficina',
  'oficina':                     'Manutenções - Oficina',
  'tecnologia da informacao':    'Tecnologia da Informação',
  'tecnologia informacao':       'Tecnologia da Informação',
  'ti':                          'Tecnologia da Informação',
  'tecnologia':                  'Tecnologia da Informação',
}

export function resolverTurmaFrontend(nome: string | null | undefined, turmasDoBanco?: any[]): string | null {
  if (!nome) return null
  const nomeTrimado = nome.trim()
  if (turmasDoBanco?.length) {
    const exatoBanco = turmasDoBanco.find(
      (t: any) => t.cargo_grupo === nomeTrimado || t.nome === nomeTrimado
    )
    if (exatoBanco) return exatoBanco.cargo_grupo || exatoBanco.nome
    const norm2 = normalizarStr(nomeTrimado)
    const parcialBanco = turmasDoBanco.find(
      (t: any) =>
        normalizarStr(t.cargo_grupo || '') === norm2 ||
        normalizarStr(t.cargo_grupo || '').includes(norm2) ||
        norm2.includes(normalizarStr(t.cargo_grupo || ''))
    )
    if (parcialBanco) return parcialBanco.cargo_grupo || parcialBanco.nome
  }
  const exato = TURMAS_OFICIAIS.find(t => t === nomeTrimado)
  if (exato) return exato
  const norm = normalizarStr(nomeTrimado)
  if (ALIASES_TURMAS[norm]) return ALIASES_TURMAS[norm]
  const parcial = TURMAS_OFICIAIS.find(t =>
    normalizarStr(t) === norm ||
    normalizarStr(t).includes(norm) ||
    norm.includes(normalizarStr(t))
  )
  return parcial ?? null
}

// Coluna G — Origem. A coluna no banco é VARCHAR(20) SEM check constraint,
// então qualquer texto entraria e só apareceria torto no badge e sumido do
// filtro. Por isso a normalização é aqui, e o que não bater é rejeitado.
const ORIGENS_OFICIAIS = ['Empregado', 'Parceiro', 'Terceiro'] as const

const ALIASES_ORIGEM: Record<string, string> = {
  'empregado':     'Empregado',
  'clt':           'Empregado',
  'proprio':       'Empregado',
  'parceiro':      'Parceiro',
  'parceira':      'Parceiro',
  'parceria':      'Parceiro',
  'terceiro':      'Terceiro',
  'terceira':      'Terceiro',
  'terceirizado':  'Terceiro',
  'terceirizada':  'Terceiro',
}

/** Vazio → 'Empregado' (default da coluna). Irreconhecível → null (linha rejeitada). */
export function resolverOrigem(valor: any): string | null {
  const bruto = valor === null || valor === undefined ? '' : String(valor).trim()
  if (!bruto) return 'Empregado'
  const exato = ORIGENS_OFICIAIS.find(o => o === bruto)
  if (exato) return exato
  return ALIASES_ORIGEM[normalizarStr(bruto)] ?? null
}

export interface AlunoImportado {
  nome:             string
  cpf:              string
  cargo:            string
  setor:            string | null  // coluna H — Setor/Turma (opcional)
  data_admissao:    string | null
  matricula:        string | null
  data_nascimento:  string | null
  origem:           string | null  // coluna G — era Centro de Custo
  cpfLimpo:         string
  senhaInicial:     string | null
  erros:            string[]
  valido:           boolean
}

function converterData(valor: any): string | null {
  if (!valor) return null

  if (typeof valor === 'number') {
    const data = XLSX.SSF.parse_date_code(valor)
    if (data) {
      const dd   = String(data.d).padStart(2, '0')
      const mm   = String(data.m).padStart(2, '0')
      const yyyy = data.y
      return `${yyyy}-${mm}-${dd}`
    }
  }

  if (typeof valor === 'string') {
    const partes = valor.trim().split('/')
    if (partes.length === 3) {
      const [dd, mm, yyyy] = partes
      return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor
    }
    if (/^\d{8}$/.test(valor)) {
      const dd   = valor.slice(0,2)
      const mm   = valor.slice(2,4)
      const yyyy = valor.slice(4,8)
      return `${yyyy}-${mm}-${dd}`
    }
  }

  return null
}

function dataNascimentoParaSenha(dataIso: string | null): string | null {
  if (!dataIso) return null
  const [yyyy, mm, dd] = dataIso.split('-')
  if (!yyyy || !mm || !dd) return null
  return `${dd}${mm}${yyyy}`
}

function limparCpf(valor: any): string {
  if (!valor) return ''
  const so = String(valor).replace(/[.\-\s]/g, '').trim()
  // Excel guarda CPF como número e come o zero à esquerda: 06521190342 vira
  // 6521190342. Completa só a 10 dígitos — abaixo disso é dado faltando de
  // verdade e a linha continua rejeitada. O regex (em vez de length === 10)
  // impede completar algo como "abc1234567", que cai na checagem de letras.
  return /^\d{10}$/.test(so) ? so.padStart(11, '0') : so
}

/**
 * Dígitos verificadores do CPF. Necessário porque completar o zero à esquerda
 * assume que faltou justamente um zero — sem esta checagem, um CPF digitado
 * com um dígito a menos no meio viraria um CPF de tamanho certo e conteúdo
 * errado, e o CPF é a credencial de login e a chave de deduplicação.
 */
function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // 111.111.111-11 e afins passam na conta
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i)
  let d1 = 11 - (soma % 11); if (d1 >= 10) d1 = 0
  if (d1 !== parseInt(cpf[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i)
  let d2 = 11 - (soma % 11); if (d2 >= 10) d2 = 0
  return d2 === parseInt(cpf[10])
}

export function lerPlanilhaExcel(arquivo: File, turmasDoBanco?: any[]): Promise<AlunoImportado[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: false,
          raw: false,
        })

        const nomePlanilha = workbook.SheetNames[0]
        const planilha     = workbook.Sheets[nomePlanilha]

        const linhas: any[][] = XLSX.utils.sheet_to_json(planilha, {
          header: 1,
          raw: true,
          defval: '',
        })

        const alunos: AlunoImportado[] = []

        const primeiraLinha = linhas[0] ?? []
        const temCabecalho  = typeof primeiraLinha[0] === 'string'
          && primeiraLinha[0].toLowerCase().includes('nome')

        const inicio = temCabecalho ? 1 : 0

        for (let i = inicio; i < linhas.length; i++) {
          const linha = linhas[i]

          if (!linha || linha.every((c: any) => !c)) continue

          const nome            = String(linha[0] ?? '').trim()
          const cpfRaw          = linha[1]
          const cargo           = String(linha[2] ?? '').trim()
          const admissaoRaw     = linha[3]
          const matriculaRaw    = linha[4]
          const dataNascRaw     = linha[5]
          const origemRaw       = linha[6]  // coluna G — Origem (era Centro de Custo)
          const setorRaw        = linha[7]  // coluna H — Setor/Turma (opcional)

          const cpfLimpo        = limparCpf(cpfRaw)
          const data_admissao   = converterData(admissaoRaw)
          const data_nascimento = converterData(dataNascRaw)
          const matricula       = matriculaRaw ? String(matriculaRaw).trim() : null
          const origem          = resolverOrigem(origemRaw)
          const setorStr        = setorRaw ? String(setorRaw).trim() : null
          const setor           = setorStr ? (resolverTurmaFrontend(setorStr, turmasDoBanco) ?? setorStr) : null
          const senhaInicial    = dataNascimentoParaSenha(data_nascimento)

          const erros: string[] = []
          if (!nome)                   erros.push('Nome vazio')
          if (cpfLimpo.length !== 11)  erros.push(`CPF inválido: "${cpfRaw}" (${cpfLimpo.length} dígitos)`)
          if (!/^\d+$/.test(cpfLimpo)) erros.push('CPF contém letras')
          // Só roda se as duas checagens acima passaram — evita empilhar
          // dois erros de CPF na mesma linha.
          if (cpfLimpo.length === 11 && /^\d+$/.test(cpfLimpo) && !cpfValido(cpfLimpo))
            erros.push('CPF inválido - verifique os dígitos')
          if (!data_nascimento)        erros.push('Data de nascimento inválida ou ausente')
          // Rejeita em vez de cair no default: um Terceiro virando Empregado
          // em silêncio é o tipo de erro que ninguém percebe depois.
          if (origem === null)         erros.push(`Origem inválida: "${origemRaw}" (use Empregado, Parceiro ou Terceiro)`)

          alunos.push({
            nome,
            cpf:            cpfRaw ? String(cpfRaw) : '',
            cargo,
            setor,
            data_admissao,
            matricula,
            data_nascimento,
            origem,
            cpfLimpo,
            senhaInicial,
            erros,
            valido: erros.length === 0,
          })
        }

        resolve(alunos)
      } catch (err) {
        reject(new Error('Erro ao ler planilha: ' + (err as Error).message))
      }
    }

    reader.onerror = () => reject(new Error('Erro ao carregar arquivo'))
    reader.readAsArrayBuffer(arquivo)
  })
}
