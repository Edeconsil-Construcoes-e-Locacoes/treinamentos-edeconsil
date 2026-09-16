import * as XLSX from 'xlsx'

/**
 * Leitura da planilha de turmas — 3 colunas lidas por POSIÇÃO:
 *   A = Nome da turma · B = Setor · C = Responsável
 *
 * Parser próprio, não reaproveita o importarExcel.ts: aquele é monolítico e
 * cravado nas 8 colunas de aluno (CPF, dígito verificador, data de nascimento
 * virando senha, resolução de turma por alias). Só a mecânica de leitura é a
 * mesma.
 *
 * Import estático do xlsx: import dinâmico da lib já quebrou em produção neste
 * projeto com `XLSX.utils` undefined.
 */

export interface TurmaImportada {
  nome:        string
  setor:       string
  responsavel: string
  valido:      boolean
  erros:       string[]
}

export function lerPlanilhaTurmas(arquivo: File): Promise<TurmaImportada[]> {
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

        const turmas: TurmaImportada[] = []

        const primeiraLinha = linhas[0] ?? []
        const temCabecalho  = typeof primeiraLinha[0] === 'string'
          && primeiraLinha[0].toLowerCase().includes('nome')

        const inicio = temCabecalho ? 1 : 0

        // Duplicata DENTRO da planilha, detectada já aqui para o usuário ver no
        // preview. O backend refaz essa checagem — ele é quem tem a verdade, e
        // a planilha pode ser enviada por outro caminho.
        const vistos = new Set<string>()

        for (let i = inicio; i < linhas.length; i++) {
          const linha = linhas[i]

          if (!linha || linha.every((c: any) => !c)) continue

          const nome        = String(linha[0] ?? '').trim()
          const setor       = String(linha[1] ?? '').trim()
          const responsavel = String(linha[2] ?? '').trim()

          const erros: string[] = []
          if (!nome) {
            erros.push('Nome vazio')
          } else {
            // Mesma normalização do backend (trim + lower), para que o preview
            // não diga "ok" numa linha que o servidor vai rejeitar.
            const chave = nome.toLowerCase()
            if (vistos.has(chave)) erros.push('Nome repetido na planilha')
            else                   vistos.add(chave)
          }

          // Duplicata contra o BANCO não é checada aqui: só o backend sabe o
          // que já existe.

          turmas.push({
            nome,
            setor,
            responsavel,
            erros,
            valido: erros.length === 0,
          })
        }

        resolve(turmas)
      } catch (err) {
        reject(new Error('Erro ao ler planilha: ' + (err as Error).message))
      }
    }

    reader.onerror = () => reject(new Error('Erro ao carregar arquivo'))
    reader.readAsArrayBuffer(arquivo)
  })
}
