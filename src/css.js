// Bir CSS deklarasyon string'ini React'in style objesine çevirir.
// Böylece orijinal inline stilleri neredeyse birebir koruyabiliyoruz:
//   <div style={css('position:absolute;inset:0;color:#fff;')} />
// Dinamik değerler için css() sonucunu yayıp üzerine yazabilirsin:
//   <div style={{ ...css('height:100%;'), width: `${pct}%` }} />
export function css(str) {
  const obj = {}
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1) continue
    const prop = decl.slice(0, i).trim()
    const val = decl.slice(i + 1).trim()
    if (!prop) continue
    // CSS custom property'leri (--pf gibi) olduğu gibi bırak; gerisini camelCase yap
    const key = prop.startsWith('--')
      ? prop
      : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    obj[key] = val
  }
  return obj
}
