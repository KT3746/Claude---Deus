import { test } from "node:test";
import assert from "node:assert/strict";
import { LIVROS, validarCapitulo } from "../src/livros.js";
import { buscarCapitulo } from "../src/biblia.js";
import { linkClaude, montarPedido } from "../src/estudo.js";

test("cânon tem 66 livros com 1189 capítulos e ids únicos", () => {
  assert.equal(LIVROS.length, 66);
  assert.equal(LIVROS.reduce((s, l) => s + l.capitulos, 0), 1189);
  assert.equal(new Set(LIVROS.map((l) => l.id)).size, 66);
});

test("validarCapitulo aceita limites e rejeita fora do intervalo", () => {
  assert.equal(validarCapitulo("psa", "150").capitulo, 150);
  assert.throws(() => validarCapitulo("PSA", 151), /1 a 150/);
  assert.throws(() => validarCapitulo("JHN", 0));
  assert.throws(() => validarCapitulo("XYZ", 1), /desconhecido/);
});

test("buscarCapitulo usa a alternativa quando o primeiro endpoint falha", async () => {
  const chamadas = [];
  const fetchFalso = async (url) => {
    chamadas.push(url);
    if (url.includes("/data/")) return { ok: false, status: 404 };
    return {
      ok: true,
      json: async () => ({ verses: [{ verse: 1, text: "No princípio\n era o Verbo" }] }),
    };
  };
  const livro = LIVROS.find((l) => l.id === "JHN");
  const vs = await buscarCapitulo(livro, 1, fetchFalso);
  assert.deepEqual(vs, [{ numero: 1, texto: "No princípio era o Verbo" }]);
  assert.equal(chamadas.length, 2);
  // Segunda chamada vem do cache.
  await buscarCapitulo(livro, 1, fetchFalso);
  assert.equal(chamadas.length, 2);
});

test("montarPedido inclui instruções, passagem e pergunta opcional", () => {
  const base = { referencia: "João 3:16", texto: "16 Porque Deus amou o mundo…" };
  const pedido = montarPedido(base);
  assert.match(pedido, /Contexto histórico/);
  assert.match(pedido, /João 3:16 \(tradução Almeida\)/);
  assert.doesNotMatch(pedido, /Além do estudo/);
  assert.match(montarPedido({ ...base, pergunta: "E o grego?" }), /responda também a esta pergunta: E o grego\?/);
  assert.throws(() => montarPedido({ referencia: "", texto: "x" }));
  assert.throws(() => montarPedido({ ...base, texto: "x".repeat(8001) }), /longa/);
});

test("linkClaude leva o pedido no link, exceto quando é longo demais", () => {
  const curto = linkClaude("Estude João 3:16 & ação");
  assert.equal(new URL(curto).searchParams.get("q"), "Estude João 3:16 & ação");
  assert.equal(linkClaude("x".repeat(7000)), "https://claude.ai/new");
});
