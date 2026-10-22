/** Horas decimais -> texto: abaixo de 1h em minutos ("40min"); depois "12h" ou "12h30". */
export function formatarHoras(h: number): string {
  const totalMin = Math.round((Number(h) || 0) * 60)
  if (totalMin < 60) return `${totalMin}min`
  const horas = Math.floor(totalMin / 60)
  const min = totalMin % 60
  return min === 0 ? `${horas}h` : `${horas}h${String(min).padStart(2, '0')}`
}
