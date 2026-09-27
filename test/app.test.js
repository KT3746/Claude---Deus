import { test } from "node:test";
import assert from "node:assert/strict";
import { LIVROS, validarCapitulo } from "../src/livros.js";
import { buscarCapitulo } from "../src/biblia.js";
import { montarMensagens } from "../src/estudo.js";
import { criarApp } from "../src/server.js";

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

test("rotas validam entrada sem chamar serviços externos", async (t) => {
  const servidor = criarApp().listen(0);
  t.after(() => servidor.close());
  const base = `http://localhost:${servidor.address().port}`;

  const livros = await (await fetch(`${base}/api/livros`)).json();
  assert.equal(livros.length, 66);

  const cap = await fetch(`${base}/api/capitulo/JHN/99`);
  assert.equal(cap.status, 400);

  const estudo = await fetch(`${base}/api/estudo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referencia: "João 3:16" }),
  });
  assert.equal(estudo.status, 400);

  const pagina = await fetch(`${base}/`);
  assert.match(await pagina.text(), /Estudo Bíblico/);
  const marked = await fetch(`${base}/vendor/marked/marked.esm.js`);
  assert.equal(marked.status, 200);
});
