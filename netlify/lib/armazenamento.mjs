// Armazenamento em Netlify Blobs: cada coleção é um arquivo JSON.
// Gravações usam controle de versão (etag) para duas pessoas não apagarem
// a alteração uma da outra quando salvam ao mesmo tempo.
import { getStore } from '@netlify/blobs';

export function loja(nome) {
  const local = process.env.JCR_BLOBS_LOCAL; // só nos testes locais: "url|token"
  if (local) {
    const [apiURL, token] = local.split('|');
    return getStore({ name: nome, siteID: 'jcr-local', token, apiURL });
  }
  return getStore({ name: nome, consistency: 'strong' });
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

export async function ler(store, chave, padrao) {
  const r = await store.getWithMetadata(chave, { type: 'json' });
  if (!r || r.data == null) return { dados: structuredClone(padrao), etag: null, existe: false };
  return { dados: r.data, etag: r.etag, existe: true };
}

export async function lerVarios(store, chaves, padroes) {
  const res = await Promise.all(chaves.map(c => ler(store, c, padroes[c])));
  return Object.fromEntries(chaves.map((c, i) => [c, res[i].dados]));
}

// fn recebe os dados atuais e devolve os novos (ou undefined para não gravar).
export async function atualizar(store, chave, padrao, fn) {
  for (let i = 0; i < 8; i++) {
    const { dados, etag, existe } = await ler(store, chave, padrao);
    const novo = await fn(dados);
    if (novo === undefined) return dados;
    // sem etag (só acontece no servidor local de testes) grava direto
    const r = await store.setJSON(chave, novo, etag ? { onlyIfMatch: etag } : existe ? {} : { onlyIfNew: true });
    if (r.modified !== false) return novo;
    await esperar(40 * (i + 1) + Math.random() * 60);
  }
  throw new Error('Outra pessoa salvou ao mesmo tempo. Tente novamente.');
}
