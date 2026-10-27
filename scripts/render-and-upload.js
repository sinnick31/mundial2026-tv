function limpiarTextoVisible(valor) {
  if (typeof valor !== 'string') return valor;
  const entidades = {
    amp: '&', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
    hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    bull: '•', copy: '©', reg: '®',
  };

  let texto = valor;
  let anterior = '';
  let passes = 0;

  while (texto !== anterior && passes < 5) {
    anterior = texto;
    texto = texto
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
      .replace(/<\/?[a-z][^>]*>/gi, ' ')
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entidad, codigo) => {
        if (codigo[0] === '#') {
          const hexadecimal = codigo[1]?.toLowerCase() === 'x';
          const numero = Number.parseInt(codigo.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
          if (!Number.isFinite(numero) || numero <= 0 || numero > 0x10ffff
            || (numero >= 0xd800 && numero <= 0xdfff)) return ' ';
          try { return String.fromCodePoint(numero); } catch { return ' '; }
        }
        if (codigo.toLowerCase() === 'lt') return '‹';
        if (codigo.toLowerCase() === 'gt') return '›';
        return Object.prototype.hasOwnProperty.call(entidades, codigo.toLowerCase())
          ? entidades[codigo.toLowerCase()] : entidad;
      });
    texto = texto.replace(/<\/?[a-z][^>]*>/gi, ' ');
    texto = texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').replace(/\s+/g, ' ').trim();
    passes += 1;
  }

  return texto;
}
