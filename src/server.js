import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { LIVROS, validarCapitulo } from "./livros.js";
import { buscarCapitulo } from "./biblia.js";
import { estudar, montarMensagens } from "./estudo.js";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function criarApp() {
  const app = express();
  app.use(express.json({ limit: "200kb" }));
  app.use(express.static(path.join(raiz, "public")));
  app.use("/vendor/marked", express.static(path.join(raiz, "node_modules/marked/lib")));

  app.get("/api/livros", (_req, res) => res.json(LIVROS));

  app.get("/api/capitulo/:livro/:capitulo", async (req, res) => {
    let alvo;
    try {
      alvo = validarCapitulo(req.params.livro, req.params.capitulo);
    } catch (err) {
      return res.status(400).json({ erro: err.message });
    }
    try {
      const versiculos = await buscarCapitulo(alvo.livro, alvo.capitulo);
      res.json({ livro: alvo.livro, capitulo: alvo.capitulo, versiculos });
    } catch (err) {
      res.status(502).json({ erro: err.message });
    }
  });

  // Responde em texto puro transmitido em partes; o navegador lê com fetch + ReadableStream.
  app.post("/api/estudo", async (req, res) => {
    let mensagens;
    try {
      mensagens = montarMensagens(req.body ?? {});
    } catch (err) {
      return res.status(400).json({ erro: err.message });
    }

    const controle = new AbortController();
    res.on("close", () => controle.abort());
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");

    try {
      const motivo = await estudar(mensagens, (t) => res.write(t), { signal: controle.signal });
      if (motivo === "refusal") {
        res.write("\n\n> Não foi possível responder a esta pergunta. Tente reformulá-la.");
      } else if (motivo === "max_tokens") {
        res.write("\n\n> A resposta foi interrompida por ser longa demais.");
      }
    } catch (err) {
      if (controle.signal.aborted) return;
      console.error(err);
      const msg =
        err instanceof Anthropic.AuthenticationError
          ? "Chave da API do Claude ausente ou inválida. Configure ANTHROPIC_API_KEY."
          : err instanceof Anthropic.RateLimitError
            ? "Muitas requisições no momento. Aguarde um pouco e tente de novo."
            : "Erro ao gerar o estudo. Tente novamente.";
      if (!res.headersSent) return res.status(500).json({ erro: msg });
      res.write(`\n\n> ⚠️ ${msg}`);
    }
    res.end();
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const porta = Number(process.env.PORT) || 3000;
  criarApp().listen(porta, () => console.log(`Estudo Bíblico em http://localhost:${porta}`));
}
