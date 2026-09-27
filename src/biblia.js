// Busca o texto bíblico na tradução João Ferreira de Almeida (domínio público)
// usando a bible-api.com. Os capítulos ficam em cache na memória.
const BASE = "https://bible-api.com";
const TRADUCAO = "almeida";
const cache = new Map();

function normalizar(json) {
  const verses = Array.isArray(json?.verses) ? json.verses : [];
  return verses
    .map((v) => ({ numero: Number(v.verse), texto: String(v.text ?? "").replace(/\s+/g, " ").trim() }))
    .filter((v) => Number.isInteger(v.numero) && v.texto);
}

async function tentar(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`bible-api respondeu ${res.status}`);
  const versiculos = normalizar(await res.json());
  if (versiculos.length === 0) throw new Error("capítulo sem versículos");
  return versiculos;
}

export async function buscarCapitulo(livro, capitulo, fetchImpl = fetch) {
  const chave = `${livro.id}.${capitulo}`;
  if (cache.has(chave)) return cache.get(chave);

  const urls = [
    `${BASE}/data/${TRADUCAO}/${livro.id}/${capitulo}`,
    `${BASE}/${encodeURIComponent(`${livro.en} ${capitulo}`)}?translation=${TRADUCAO}`,
  ];
  let ultimoErro;
  for (const url of urls) {
    try {
      const versiculos = await tentar(url, fetchImpl);
      cache.set(chave, versiculos);
      return versiculos;
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw new Error(`Não foi possível carregar ${livro.nome} ${capitulo}: ${ultimoErro?.message}`);
}
