export const formatarDataSimples = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, '0')} de ${d.toLocaleDateString('pt-BR', { month: 'long' })} de ${d.getUTCFullYear()}`
}

export const imprimirCertificado = (cert: any) => {
  const janela = window.open('', '_blank', 'width=1200,height=900')
  if (!janela) return
  const dataEmissao = formatarDataSimples(cert.data_emissao)
  // A janela é about:blank, sem base URL — o caminho da imagem precisa ser
  // absoluto, senão o fundo não carrega.
  const fundo = `${window.location.origin}/certificados/modelo-certificado.png`
  const instrutorNome  = cert.instrutor ?? ''
  const instrutorEspec = cert.instrutor_especialidade ?? ''
  const esc = (s: string) => String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

  janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Certificado — ${esc(cert.aluno_nome)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Great+Vibes&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    /* A folha tem a proporção EXATA da imagem (5417x3750 = 1.4445), senão o
       fundo distorce. 297mm / 1.4445 = 205.6mm — cabe em A4 paisagem. */
    @page { size: A4 landscape; margin: 0; }
    body {
      font-family:'Montserrat',Arial,sans-serif; background:#e9edf2;
      display:flex; justify-content:center; align-items:center;
      min-height:100vh; padding:16px;
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    .certificado {
      position:relative; width:297mm; height:205.6mm; flex-shrink:0;
      background-image:url('${fundo}');
      background-size:100% 100%; background-repeat:no-repeat; background-position:center;
      box-shadow:0 8px 40px rgba(0,0,0,0.20);
      print-color-adjust:exact; -webkit-print-color-adjust:exact;
    }
    /* Área branca do modelo: ~25% a ~80% da altura. O bloco fica dentro dela. */
    .corpo {
      position:absolute; left:12%; right:12%; top:27%; height:50%;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; color:#1f2937;
    }
    .certifica       { font-size:12pt; margin-bottom:14pt; }
    .nome            { font-size:16pt; font-weight:700; color:#0d2550;
                       text-transform:uppercase; letter-spacing:0.5pt; margin-bottom:16pt; }
    .texto           { font-size:12pt; line-height:1.75; max-width:88%; margin-bottom:12pt; }
    .texto strong    { font-weight:700; color:#0d2550; }
    .local-data      { font-size:12pt; margin-top:6pt; }
    .codigo          { position:absolute; left:0; right:0; top:77%; text-align:center;
                       font-size:8pt; color:#9aa4b2; font-family:monospace; }
    /* Assinatura: a linha impressa no modelo está a ~91,5% da altura,
       centrada em ~52% da largura. O nome fica sobre ela; o cargo, abaixo. */
    .assinatura-nome {
      position:absolute; left:52%; transform:translateX(-50%); bottom:9%;
      font-family:'Great Vibes',cursive; font-size:14pt; color:#1f2937; white-space:nowrap;
    }
    .assinatura-cargo {
      position:absolute; left:52%; transform:translateX(-50%); bottom:4.6%;
      font-size:12pt; color:#1f2937; white-space:nowrap;
    }
    @media print {
      body { background:#fff; padding:0; }
      .certificado { box-shadow:none; }
    }
  </style>
</head>
<body>
  <div class="certificado">
    <div class="corpo">
      <p class="certifica">A Edeconsil certifica que</p>
      <div class="nome">${esc(cert.aluno_nome)}</div>
      <p class="texto">
        concluiu com êxito <strong>${esc(cert.curso_titulo)}</strong>, realizado em ${dataEmissao},
        demonstrando comprometimento e excelência.
      </p>
      <p class="texto">
        Este certificado é concedido como reconhecimento pelo desempenho e dedicação apresentados.
      </p>
      <p class="local-data">São Luís, ${dataEmissao}.</p>
    </div>
    <div class="codigo">Código de verificação: ${esc(cert.codigo)}</div>
    ${instrutorNome  ? `<div class="assinatura-nome">${esc(instrutorNome)}</div>`   : ''}
    ${instrutorEspec ? `<div class="assinatura-cargo">${esc(instrutorEspec)}</div>` : ''}
  </div>
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
}
