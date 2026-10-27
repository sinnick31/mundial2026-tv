#!/usr/bin/env node
'use strict';

// Reconcile generated editorial state with the newest state already on origin/main.
// Never discard remote entries merely because this run started from an older checkout.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function itemKey(item, path) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    if ((path === 'noticias' || (path === 'noticias' || path.endsWith('.noticias')))) return String(item.link || item.url || item.id || item.title || stable(item));
    if ((path === 'items' || (path === 'items' || path.endsWith('.items')))) return stable(item);
    if (item.id != null) return 'id:' + item.id;
    if (item.link || item.url) return 'url:' + (item.link || item.url);
  }
  return stable(item);
}

function mergeJson(remote, local, path = '') {
  if (Array.isArray(remote) && Array.isArray(local)) {
    const merged = new Map();
    for (const item of [...remote, ...local]) merged.set(itemKey(item, path), item);
    let result = [...merged.values()];
    if ((path === 'items' || path.endsWith('.items'))) {
      result.sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
      result = result.slice(-500);
    } else if ((path === 'noticias' || path.endsWith('.noticias'))) {
      result.sort((a, b) => String(a.timestamp || a.pubDate || '').localeCompare(String(b.timestamp || b.pubDate || '')));
      result = result.slice(-1000);
    }
    return result;
  }
  if (remote && local && typeof remote === 'object' && typeof local === 'object'
      && !Array.isArray(remote) && !Array.isArray(local)) {
    const result = { ...remote };
    for (const key of Object.keys(local)) {
      result[key] = key in remote
        ? mergeJson(remote[key], local[key], path ? path + '.' + key : key)
        : local[key];
    }
    if (typeof result.ultima_actualizacion === 'string'
        && typeof remote.ultima_actualizacion === 'string'
        && typeof local.ultima_actualizacion === 'string') {
      result.ultima_actualizacion = remote.ultima_actualizacion > local.ultima_actualizacion
        ? remote.ultima_actualizacion : local.ultima_actualizacion;
    }
    return result;
  }
  return local === undefined ? remote : local;
}

function mergeEditorialStates(remoteHistory, localHistory, remoteCache, localCache) {
  const history = mergeJson(remoteHistory, localHistory);
  const cache = mergeJson(remoteCache, localCache);
  // Counters describe the newly ingested run, not the union of cached articles.
  for (const key of ['total_hoy', 'total_reciente', 'por_categoria']) {
    if (localCache && key in localCache) cache[key] = localCache[key];
  }
  return { history, cache };
}

function readRemoteJson(path) {
  let raw;
  try {
    // news-cache.json can exceed Node's default 1 MiB execFileSync output buffer.
    // Bound the buffer explicitly so the reconciliation step can read the full JSON.
    raw = execFileSync('git', ['show', 'origin/main:' + path], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    if (error && error.code === 'ENOBUFS') {
      throw new Error('La lectura de origin/main:' + path + ' superó el búfer de 64 MiB; revisar el tamaño del archivo editorial remoto.');
    }
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('JSON inválido en origin/main:' + path + ': ' + error.message);
  }
}

function main() {
  const historyPath = 'content-history.json';
  const cachePath = 'news-cache.json';
  const localHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  const localCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const remoteHistory = readRemoteJson(historyPath);
  const remoteCache = readRemoteJson(cachePath);
  if (!Array.isArray(localHistory.items) || !Array.isArray(remoteHistory.items)) {
    throw new Error('content-history.json debe contener items[] en ambos estados');
  }
  if (!Array.isArray(localCache.noticias) || !Array.isArray(remoteCache.noticias)) {
    throw new Error('news-cache.json debe contener noticias[] en ambos estados');
  }
  const merged = mergeEditorialStates(remoteHistory, localHistory, remoteCache, localCache);
  fs.writeFileSync(historyPath, JSON.stringify(merged.history, null, 2) + '\n');
  fs.writeFileSync(cachePath, JSON.stringify(merged.cache, null, 2) + '\n');
  console.log('Memoria reconciliada: historial=' + merged.history.items.length
    + ', noticias=' + merged.cache.noticias.length);
}

module.exports = { mergeJson, mergeEditorialStates };
if (require.main === module) main();
