export interface DadosFrequencia {
  curso: {
    id: string
    titulo: string
    instrutor: string | null
    carga_horaria: string | null
  }
  conteudoProgramatico: string[]
  alunos: {
    nome: string
    cpf: string
    cargo: string | null
    data_emissao: string
    hora_emissao?: string
  }[]
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

// data_emissao chega crua do banco (YYYY-MM-DD...) — new Date() joga pro fuso
// local e pode voltar um dia. Fatiar a string evita isso.
const formatarData = (d: string) =>
  d ? String(d).slice(0, 10).split('-').reverse().join('/') : ''

const formatarCpf = (cpf: string) => {
  const digitos = String(cpf ?? '').replace(/\D/g, '').padStart(11, '0')
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`
}

// Strings "HH:MM" ordenam corretamente por comparação lexicográfica — não
// precisa (e não deve) virar Date, já causou bug de fuso neste projeto.
const calcularFaixaHorario = (alunos: DadosFrequencia['alunos']) => {
  const horarios = alunos
    .map(a => a.hora_emissao)
    .filter((h): h is string => Boolean(h))
    .sort()
  if (horarios.length === 0) return ''
  const menor = horarios[0]
  const maior = horarios[horarios.length - 1]
  return menor === maior ? menor : `${menor} às ${maior}`
}

export const imprimirFrequencia = (dados: DadosFrequencia) => {
  const janela = window.open('', '_blank', 'width=1200,height=900')
  if (!janela) return

  const { curso, conteudoProgramatico, alunos } = dados
  // A janela é about:blank, sem base URL — o caminho da logo precisa ser
  // absoluto, senão não carrega.
  const logo = `${window.location.origin}/logo-edeconsil.png`

  const conteudoHtml = conteudoProgramatico.length > 0
    ? conteudoProgramatico.map(item => esc(item)).join('<br>')
    : ''

  const linhasAlunos = alunos.map((aluno, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td>${esc(aluno.nome)}</td>
      <td style="text-align:center;">${formatarCpf(aluno.cpf)}</td>
      <td>${esc(aluno.cargo)}</td>
      <td style="text-align:center;">${formatarData(aluno.data_emissao)}</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `).join('')

  janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Controle de Frequência — ${esc(curso.titulo)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Great+Vibes&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size: A4 portrait; margin: 10mm; }
    body {
      font-family:'Montserrat',Arial,sans-serif; font-size:7.5pt; color:#000;
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    table {
      width:100%; border-collapse:collapse; margin-bottom:6pt;
    }
    td, th {
      border:1px solid #000; padding:4px 6px; vertical-align:middle;
    }
    .lbl { font-weight:700; }
    .titulo-form {
      text-align:center; font-weight:700; font-size:11pt;
    }
    .cod-form {
      font-size:8pt; line-height:1.6;
    }
    .logo-cel { text-align:center; }
    .logo-cel img { height:50px; }
    thead { display:table-header-group; }
    .tabela-presenca td, .tabela-presenca th {
      font-size:7pt; padding:2px 4px; line-height:1.2;
    }
    tbody tr { page-break-inside:avoid; }
    .conteudo-cel { min-height:15mm; }
    .rodape {
      margin-top:16pt; display:flex; justify-content:space-between; align-items:flex-end;
    }
    .assinatura {
      text-align:center; width:60%;
    }
    .assinatura .nome {
      font-family:'Great Vibes',cursive; font-size:20pt; line-height:1.2;
    }
    .assinatura .linha {
      border-top:1px solid #000; margin-top:2px; padding-top:2px; font-size:8pt;
    }
    .legenda {
      font-size:8pt; white-space:nowrap;
    }
  </style>
</head>
<body>

  <table>
    <tr>
      <td class="logo-cel" style="width:25%;"><img src="${logo}" alt="Edeconsil"></td>
      <td class="titulo-form" style="width:50%;">CONTROLE DE FREQUÊNCIA PARA TREINAMENTO</td>
      <td class="cod-form" style="width:25%;">
        Codificação: FOR-CRH-005<br>
        Versão: 02<br>
        Revisão: 24.04.2018
      </td>
    </tr>
  </table>

  <table>
    <tr>
      <td class="lbl" style="width:18%;">TÍTULO DO TREINAMENTO:</td>
      <td colspan="3">${esc(curso.titulo)}</td>
    </tr>
    <tr>
      <td class="lbl">INSTRUTOR:</td>
      <td style="width:32%;">${esc(curso.instrutor)}</td>
      <td class="lbl" style="width:18%;">HORÁRIO:</td>
      <td style="width:32%;">${esc(calcularFaixaHorario(alunos))}</td>
    </tr>
    <tr>
      <td class="lbl">ÁREA / OBRA:</td>
      <td></td>
      <td class="lbl">LOCAL:</td>
      <td>Portal de Treinamentos - EaD</td>
    </tr>
    <tr>
      <td colspan="2">NECESSÁRIO AVALIAR A EFICÁCIA? &#9744; SIM &#9744; NÃO</td>
      <td class="lbl">CARGA HORÁRIA:</td>
      <td>${esc(curso.carga_horaria)}</td>
    </tr>
    <tr>
      <td colspan="2">FORMA DE VERIFICAÇÃO DE EFICÁCIA: &#9744; Teste escrito &#9744; Teste prático &#9744; Teste oral &#9744; Observação no trabalho — Data limite: __/__/____</td>
      <td class="lbl">RESPONSÁVEL PELA AVALIAÇÃO DA EFICÁCIA:</td>
      <td>${esc(curso.instrutor)}</td>
    </tr>
  </table>

  <table>
    <tr>
      <td class="lbl" style="width:18%; vertical-align:top;">CONTEÚDO PROGRAMÁTICO:</td>
      <td class="conteudo-cel">${conteudoHtml}</td>
    </tr>
  </table>

  <table class="tabela-presenca">
    <thead>
      <tr>
        <th style="width:4%;">Nº</th>
        <th style="width:22%;">NOME</th>
        <th style="width:13%;">CPF</th>
        <th style="width:16%;">CARGO</th>
        <th style="width:11%;">DATA DO TREINAMENTO</th>
        <th style="width:15%;">ASSINATURA</th>
        <th style="width:11%;">DATA AV. EFICÁCIA</th>
        <th style="width:8%;">EFICÁCIA</th>
      </tr>
    </thead>
    <tbody>
      ${linhasAlunos}
    </tbody>
  </table>

  <div class="rodape">
    <div class="assinatura">
      <div class="nome">${esc(curso.instrutor)}</div>
      <div class="linha">ASSINATURA DO INSTRUTOR</div>
    </div>
    <div class="legenda">E = Eficaz / NE = Não eficaz</div>
  </div>

  <script>
    var imprimiu = false
    function imprimir() { if (!imprimiu) { imprimiu = true; window.print() } }
    window.onload = function () {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { setTimeout(imprimir, 200) })
        setTimeout(imprimir, 3000)
      } else {
        setTimeout(imprimir, 800)
      }
    }
  </script>
</body>
</html>`)
  janela.document.close()
}
