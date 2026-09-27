import { test } from "node:test";
import assert from "node:assert/strict";
import { LIVROS, validarCapitulo } from "../src/livros.js";
import { buscarCapitulo } from "../src/biblia.js";
import Anthropic from "@anthropic-ai/sdk";
import { explicarErro, montarMensagens } from "../src/estudo.js";

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

test("montarMensagens monta a passagem e valida a alternância do histórico", () => {
  const base = { referencia: "João 3:16", texto: "Porque Deus amou o mundo…" };
  const [primeira] = montarMensagens(base);
  assert.equal(primeira.role, "user");
  assert.match(primeira.content, /João 3:16/);

  const ok = montarMensagens({
    ...base,
    historico: [
      { role: "assistant", content: "estudo" },
      { role: "user", content: "e o grego?" },
    ],
  });
  assert.equal(ok.length, 3);

  assert.throws(() => montarMensagens({ ...base, historico: [{ role: "assistant", content: "x" }] }), /última/);
  assert.throws(() => montarMensagens({ ...base, historico: [{ role: "user", content: "x" }] }), /inválido/);
  assert.throws(() => montarMensagens({ ...base, historico: [{ role: "system", content: "x" }] }), /inválido/);
  assert.throws(() => montarMensagens({ referencia: "", texto: "x" }));
});

test("explicarErro dá mensagens compreensíveis", () => {
  const erro = (Classe, status, msg) => new Classe(status, { error: { message: msg } }, msg, new Headers());
  assert.match(explicarErro(erro(Anthropic.AuthenticationError, 401, "invalid x-api-key")), /chave/);
  assert.match(explicarErro(erro(Anthropic.BadRequestError, 400, "Your credit balance is too low")), /créditos/);
  assert.match(explicarErro(new Anthropic.APIConnectionError({ message: "fetch failed" })), /internet/);
  assert.match(explicarErro(new Error("boom")), /boom/);
});
