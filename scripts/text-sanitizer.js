'use strict';

// Decodifica entidades simples y anidadas de feeds antes de crear texto visible.
// Se limita el número de pasadas para evitar ciclos con entradas malformadas.
function cleanVisibleText(value = '') {
  const named = {
    amp: '&', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
    hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    bull: '•', copy: '©', reg: '®', lt: '‹', gt: '›',
  };
  let text = String(value);
  for (let pass = 0; pass < 5; pass += 1) {
    const before = text;
    text = text
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
      .replace(/<\/?[a-z][^>]*>/gi, ' ')
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entity, code) => {
        if (code[0] === '#') {
          const hex = code[1]?.toLowerCase() === 'x';
          const number = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
          if (!Number.isFinite(number) || number <= 0 || number > 0x10ffff
            || (number >= 0xd800 && number <= 0xdfff)) return ' ';
          try { return String.fromCodePoint(number); } catch { return ' '; }
        }
        return Object.prototype.hasOwnProperty.call(named, code.toLowerCase())
          ? named[code.toLowerCase()] : entity;
      })
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text === before) break;
  }
  return text;
}

module.exports = { cleanVisibleText };
