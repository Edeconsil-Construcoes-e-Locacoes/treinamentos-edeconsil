import { certificadosAPI } from '../services/api'

export const formatarDataSimples = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, '0')} de ${d.toLocaleDateString('pt-BR', { month: 'long' })} de ${d.getUTCFullYear()}`
}

export const imprimirCertificado = async (cert: any): Promise<void> => {
  // Primeira linha executável, antes de qualquer await — se abrisse depois do
  // fetch, o navegador trataria como pop-up fora do gesto do usuário e bloquearia.
  const janela = window.open('', '_blank', 'width=1200,height=900')
  if (!janela) return

  // Aviso simples enquanto busca o conteúdo programático — sem isso o usuário
  // veria uma aba em branco durante o fetch.
  janela.document.write('<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Gerando certificado...</title></head><body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#555;">Gerando certificado...</body></html>')
  janela.document.close()

  try {
    const dataEmissao = formatarDataSimples(cert.data_emissao)
    // A janela é about:blank, sem base URL — o caminho da imagem precisa ser
    // absoluto, senão o fundo não carrega.
    const fundo      = `${window.location.origin}/certificados/modelo-certificado.png`
    const fundoVerso = `${window.location.origin}/certificados/modelo-certificado-verso.png`
    const instrutorNome = cert.instrutor ?? ''
    const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

    let cargaHoraria: string | null = null
    let modulos: { titulo: string; aulas: string[] }[] = []
    try {
      const dados = await certificadosAPI.conteudo(cert.id) as any
      cargaHoraria = dados?.carga_horaria ?? null
      modulos = Array.isArray(dados?.modulos) ? dados.modulos : []
    } catch (e) {
      // Não trava a janela no aviso: segue e gera só a página 1.
      console.error('Erro ao buscar conteúdo programático do certificado:', e)
    }

    // "com carga horária de X com validade de 2 anos" ou, sem carga conhecida,
    // só "com validade de 2 anos" — omite o trecho, não escreve "de null".
    const cargaParte = cargaHoraria
      ? ` com carga horária de ${esc(cargaHoraria)} com validade de 2 anos`
      : ` com validade de 2 anos`

    // Linhas = 1 por módulo (título) + 1 por aula. Decide colunas/tamanho da
    // página 2 pelo volume real de conteúdo.
    const totalLinhas = modulos.reduce((acc, m) => acc + 1 + m.aulas.length, 0)
    const classeColunas =
      totalLinhas > 60 ? 'cp-colunas duas compacta' :
      totalLinhas > 30 ? 'cp-colunas duas' :
      'cp-colunas'

    const modulosHtml = modulos.map(m => `
        <div class="cp-modulo">
          <div class="cp-modulo-titulo">• ${esc(m.titulo)}</div>
          ${m.aulas.map(a => `<div class="cp-aula">• ${esc(a)}</div>`).join('\n          ')}
        </div>`).join('\n')

    // Certificado externo (sem curso) ou falha no fetch: modulos vem vazio e a
    // página 2 simplesmente não é gerada.
    const pagina2Html = modulos.length > 0 ? `
  <div class="folha pagina2">
    <div class="conteudo-prog">
      <div class="cp-titulo">CONTEÚDO PROGRAMÁTICO:</div>
      <div class="${classeColunas}">${modulosHtml}
      </div>
    </div>
  </div>` : ''

    janela.document.open()
    janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Certificado — ${esc(cert.aluno_nome)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size: A4 landscape; margin: 0; }
    /* Sem altura fixa nem overflow:hidden aqui — isso travava o documento numa
       folha só e cortava a página 2. Cada .folha abaixo é que tem 210mm fixos. */
    html, body {
      width:297mm; margin:0; padding:0;
    }
    body {
      font-family:'Montserrat',Arial,sans-serif; background:#e9edf2;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    /* Uma folha = uma página impressa. break-after:page separa as folhas; a
       última não quebra, senão sai uma página em branco no fim. */
    .folha {
      width:297mm; height:210mm; overflow:hidden; position:relative;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
      break-after:page; page-break-after:always;
    }
    .folha:last-of-type { break-after:auto; page-break-after:auto; }

    /* ── Página 1 (igual à de antes, só o texto do corpo mudou) ── */
    .certificado {
      position:relative; width:297mm; height:205.6mm; flex-shrink:0;
      background-image:url('${fundo}');
      background-size:100% 100%; background-repeat:no-repeat; background-position:center;
      box-shadow:0 8px 40px rgba(0,0,0,0.20);
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    .corpo {
      position:absolute; left:12%; right:12%; top:27%; height:50%;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; color:#1f2937;
    }
    .certifica       { font-size:12pt; margin-bottom:14pt; }
    .nome            { font-size:16pt; font-weight:700; color:#0d2550;
                       text-transform:uppercase; letter-spacing:0.5pt; margin-bottom:16pt; }
    /* 11pt (era 12pt): a frase da página 1 ficou mais longa (carga horária +
       validade) e precisa de uma linha a mais sem invadir código/assinatura. */
    .texto           { font-size:11pt; line-height:1.75; max-width:88%; margin-bottom:12pt; }
    .texto strong    { font-weight:700; color:#0d2550; }
    .local-data      { font-size:12pt; margin-top:6pt; }
    .codigo          { position:absolute; left:0; right:0; top:77%; text-align:center;
                       font-size:8pt; color:#9aa4b2; font-family:monospace; }
    .assinatura-nome {
      position:absolute; left:52%; transform:translateX(-50%); bottom:9%;
      font-family:'Great Vibes',cursive; font-size:14pt; color:#1f2937; white-space:nowrap;
    }
    .assinatura-cargo {
      position:absolute; left:52%; transform:translateX(-50%); bottom:4.6%;
      font-size:12pt; color:#1f2937; white-space:nowrap;
    }

    /* ── Página 2 — conteúdo programático ── */
    .folha.pagina2 {
      display:block;
      background-image:url('${fundoVerso}');
      background-size:cover; background-position:center;
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    .conteudo-prog {
      position:absolute; left:18mm; right:18mm; top:16mm; bottom:14mm;
    }
    .cp-titulo {
      font-family:'Montserrat',Arial,sans-serif; font-weight:800; font-size:20pt;
      color:#1B54DA; margin-bottom:10mm;
    }
    .cp-colunas { column-count:1; column-gap:10mm; font-family:'Montserrat',Arial,sans-serif; color:#1f2937; }
    .cp-colunas.duas { column-count:2; }
    .cp-modulo { break-inside:avoid; margin-bottom:3mm; }
    .cp-modulo-titulo { font-weight:700; font-size:11pt; line-height:1.35; }
    .cp-aula          { font-weight:400; font-size:10.5pt; line-height:1.35; padding-left:4mm; }
    /* Acima de 60 linhas, além de 2 colunas, reduz ~15% para caber. */
    .cp-colunas.compacta .cp-modulo-titulo { font-size:9.5pt; }
    .cp-colunas.compacta .cp-aula          { font-size:9pt; }

    @media print {
      body { background:#fff; }
      .certificado { box-shadow:none; }
    }
  </style>
</head>
<body>
  <div class="folha">
    <div class="certificado">
      <div class="corpo">
        <p class="certifica">A Edeconsil certifica que</p>
        <div class="nome">${esc(cert.aluno_nome)}</div>
        <p class="texto">
          Concluiu com êxito o treinamento <strong>${esc(cert.curso_titulo)}</strong>,${cargaParte}, realizado em ${dataEmissao},
          demonstrando comprometimento e excelência.
        </p>
        <p class="texto">
          Este certificado é concedido como reconhecimento pelo desempenho e dedicação apresentados.
        </p>
        <p class="local-data">São Luís, ${dataEmissao}.</p>
      </div>
      <div class="codigo">Código de verificação: ${esc(cert.codigo)}</div>
      ${instrutorNome ? `<div class="assinatura-nome">${esc(instrutorNome)}</div><div class="assinatura-cargo">Instrutor</div>` : ''}
    </div>
  </div>
${pagina2Html}
  <script>
    // Sem esperar as fontes, o print sai em Arial e a caligrafia se perde.
    // O timeout é rede de segurança: se o Google Fonts não responder, imprime assim mesmo.
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
  } catch (err) {
    console.error('Erro ao gerar certificado:', err)
    janela.close()
  }
}
