interface BarraProgressoProps {
  valor: number
  altura?: number
  mostrarRotulo?: boolean
}

// Padrão novo de barra de progresso (Cursos + Indicadores). Não refatora as
// barras antigas já desenhadas inline em outras telas — risco desnecessário
// a poucos dias da estreia.
export function BarraProgresso({ valor, altura = 6, mostrarRotulo = false }: BarraProgressoProps) {
  const pct = Math.min(100, Math.max(0, Number(valor) || 0))
  const cor = pct >= 80 ? '#F5C400' : '#0d2550'

  return (
    <div style={{ width: '100%' }}>
      {mostrarRotulo && (
        <div style={{ fontSize: '11px', fontWeight: 700, color: cor, marginBottom: '3px', textAlign: 'right' }}>
          {pct}%
        </div>
      )}
      <div style={{ width: '100%', height: `${altura}px`, background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: cor,
            borderRadius: '999px',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  )
}
