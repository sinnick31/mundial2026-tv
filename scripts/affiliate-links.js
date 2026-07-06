const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = process.env.AFFILIATE_LINKS_FILE
  ? path.resolve(process.env.AFFILIATE_LINKS_FILE)
  : path.join(ROOT, 'config', 'affiliate-links.json');

function normalizarLink(link) {
  if (!link || link.enabled === false) return null;
  const label = String(link.label || '').trim();
  const url = String(link.url || '').trim();
  if (!label || !/^https?:\/\//i.test(url)) return null;
  return { label, url };
}

function loadAffiliateConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { intro: '', disclaimer: '', links: [] };
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const links = Array.isArray(config.links)
      ? config.links.map(normalizarLink).filter(Boolean)
      : [];

    return {
      intro: String(config.intro || 'Links recomendados').trim(),
      disclaimer: String(config.disclaimer || '').trim(),
      links,
    };
  } catch (err) {
    console.warn(`⚠️ No se pudo leer ${CONFIG_PATH}: ${err.message}`);
    return { intro: '', disclaimer: '', links: [] };
  }
}

function affiliateFooter() {
  const config = loadAffiliateConfig();
  if (!config.links.length) return '';

  const lines = [
    '',
    config.intro || 'Links recomendados:',
    ...config.links.map((link) => `• ${link.label}: ${link.url}`),
  ];

  if (config.disclaimer) {
    lines.push('', config.disclaimer);
  }

  return lines.join('\n');
}

function appendAffiliateFooter(description) {
  const footer = affiliateFooter();
  if (!footer) return description || '';
  const base = String(description || '').trim();
  if (base.includes('Links recomendados:') || base.includes('Herramientas que uso')) return base;
  return `${base}\n${footer}`.trim();
}

module.exports = {
  CONFIG_PATH,
  loadAffiliateConfig,
  affiliateFooter,
  appendAffiliateFooter,
};
