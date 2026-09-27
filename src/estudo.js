// O estudo acontece no próprio Claude (claude.ai ou app), usando a assinatura
// da pessoa: o app só monta o pedido e abre o Claude com ele. Sem chave de API.

const INSTRUCOES = `Você é um professor de estudos bíblicos. Responda em português do Brasil, com estes títulos:

## Contexto histórico e literário
Quem escreveu, para quem, quando, em que situação; gênero literário e lugar da passagem no livro.

## Palavras no original
As 2 a 4 palavras mais importantes no hebraico (AT) ou grego (NT): original, transliteração, significado e por que muda a leitura. Não invente detalhes de que não tenha certeza.

## Referências cruzadas
De 3 a 6 passagens relacionadas, cada uma com uma frase explicando a ligação.

## Como diferentes tradições leem este texto
Leituras católica, protestante/evangélica, ortodoxa e, no AT, judaica, com respeito e equilíbrio, sem declarar uma vencedora. Omita as que não tenham leitura distinta.

## Para refletir
Duas ou três perguntas de aplicação pessoal ou para grupo.

Seja preciso: diga quando algo é debatido entre estudiosos e não apresente interpretação como fato.`;

const MAX_CARACTERES = 8000;
// Links muito longos podem ser cortados pelo navegador ou pelo celular.
const MAX_LINK = 7000;

/** Monta o pedido completo que vai para o Claude. */
export function montarPedido({ referencia, texto, pergunta = "" }) {
  if (typeof referencia !== "string" || !referencia.trim()) throw new Error("Referência ausente.");
  if (typeof texto !== "string" || !texto.trim()) throw new Error("Texto da passagem ausente.");
  if (texto.length > MAX_CARACTERES) throw new Error("Passagem longa demais; selecione menos versículos.");

  let pedido = `${INSTRUCOES}\n\nPassagem para estudar: ${referencia.trim()} (tradução Almeida)\n\n"${texto.trim()}"`;
  if (pergunta.trim()) pedido += `\n\nAlém do estudo, responda também a esta pergunta: ${pergunta.trim()}`;
  return pedido;
}

/**
 * Link que abre uma conversa nova no Claude já com o pedido escrito.
 * Devolve só o endereço base quando o pedido é longo demais para caber no link;
 * nesse caso a pessoa cola o pedido, que o app copia antes.
 */
export function linkClaude(pedido) {
  const link = `https://claude.ai/new?q=${encodeURIComponent(pedido)}`;
  return link.length <= MAX_LINK ? link : "https://claude.ai/new";
}
