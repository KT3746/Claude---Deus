import Anthropic from "@anthropic-ai/sdk";

export const MODELO = process.env.CLAUDE_MODEL || "claude-opus-5";

export const SYSTEM_PROMPT = `Você é um professor de estudos bíblicos que ajuda pessoas a entender a Bíblia em profundidade. Responda sempre em português do Brasil.

Quando receber uma passagem para estudar, organize a resposta com estes títulos em Markdown (##):

## Contexto histórico e literário
Quem escreveu, para quem, quando e em que situação. Onde a passagem se encaixa no livro e o gênero literário (narrativa, poesia, profecia, epístola etc.).

## Palavras no original
As 2 a 4 palavras mais importantes no hebraico (AT) ou grego (NT): a palavra original, a transliteração, o significado e por que isso muda a leitura. Não invente números de Strong nem detalhes gramaticais de que não tenha certeza.

## Referências cruzadas
De 3 a 6 passagens relacionadas, cada uma com uma frase explicando a ligação.

## Como diferentes tradições leem este texto
Apresente com respeito e equilíbrio as leituras relevantes: católica, protestante/evangélica, ortodoxa e, no Antigo Testamento, a judaica. Mostre onde concordam e onde divergem, sem declarar uma vencedora. Omita tradições que não tenham leitura distinta desta passagem.

## Para refletir
Duas ou três perguntas de aplicação pessoal ou para discussão em grupo.

Regras:
- Seja preciso. Quando algo for debatido entre estudiosos (autoria, datação, tradução), diga que é debatido.
- Não afirme como fato o que é interpretação.
- Nas perguntas de acompanhamento, responda diretamente, sem repetir a estrutura acima, a menos que seja útil.
- Se a pergunta fugir do estudo bíblico e religioso, redirecione com gentileza.`;

const MAX_MENSAGENS = 40;
const MAX_CARACTERES = 8000;

/**
 * Valida o histórico enviado pelo navegador. A primeira mensagem do usuário é
 * montada no servidor a partir da passagem; as seguintes são perguntas livres.
 */
export function montarMensagens({ referencia, texto, historico = [] }) {
  if (typeof referencia !== "string" || !referencia.trim()) throw new Error("Referência ausente.");
  if (typeof texto !== "string" || !texto.trim()) throw new Error("Texto da passagem ausente.");
  if (texto.length > MAX_CARACTERES) throw new Error("Passagem longa demais; selecione menos versículos.");
  if (!Array.isArray(historico) || historico.length > MAX_MENSAGENS) throw new Error("Histórico inválido.");

  const mensagens = [
    {
      role: "user",
      content: `Quero estudar ${referencia.trim()} (tradução Almeida):\n\n"${texto.trim()}"`,
    },
  ];
  for (const m of historico) {
    const esperado = mensagens.length % 2 === 1 ? "assistant" : "user";
    if (m?.role !== esperado || typeof m.content !== "string" || !m.content.trim()) {
      throw new Error("Histórico inválido.");
    }
    if (m.content.length > MAX_CARACTERES * 4) throw new Error("Mensagem longa demais.");
    mensagens.push({ role: m.role, content: m.content });
  }
  if (mensagens.at(-1).role !== "user") throw new Error("A última mensagem deve ser do usuário.");
  return mensagens;
}

let client;
function getClient() {
  client ??= new Anthropic();
  return client;
}

/**
 * Transmite a resposta do Claude chamando `aoTexto` para cada trecho.
 * Devolve o motivo de parada ("end_turn", "refusal", "max_tokens"...).
 */
export async function estudar(mensagens, aoTexto, { signal } = {}) {
  const stream = getClient().beta.messages.stream(
    {
      model: MODELO,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      messages: mensagens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    },
    { signal },
  );

  for await (const evento of stream) {
    if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
      aoTexto(evento.delta.text);
    }
  }
  const final = await stream.finalMessage();
  return final.stop_reason;
}
