# Estudo Bíblico com IA

App pessoal para ler a Bíblia (tradução João Ferreira de Almeida) e estudar passagens com o Claude. Toque nos versículos e toque em **Estudar no Claude**: o Claude abre com um pedido de estudo pronto, que inclui:

- **Contexto histórico e literário**: quem escreveu, para quem, quando e o gênero do texto;
- **Palavras no original**: termos-chave em hebraico ou grego, com transliteração e significado;
- **Referências cruzadas**: passagens relacionadas e o que as liga;
- **Leituras de diferentes tradições**: católica, protestante/evangélica, ortodoxa e judaica;
- **Perguntas para refletir**.

A conversa continua no Claude, que guarda o estudo no histórico. Funciona no celular e pode ser instalado na tela inicial. Os capítulos já abertos continuam disponíveis sem internet.

**Endereço:** https://kt3746.github.io/Claude---Deus/

## Como funciona (resumo)

- O site é publicado pelo **GitHub Pages** a partir da pasta `docs/`, sem servidor.
- O texto bíblico vem da [bible-api.com](https://bible-api.com), que é gratuita.
- O estudo usa a **sua assinatura do Claude**, sem chave de API. O app monta o pedido, abre `claude.ai/new?q=<pedido>` e também copia o pedido, para o caso de ele não aparecer escrito (por exemplo, no app do Claude).

## Para quem for mexer no código

```bash
npm install
npm test        # testes
npm run build   # gera docs/ a partir de src/ e public/
npm run dev     # gera e abre em http://localhost:3000
```

| Pasta ou arquivo | O que tem |
|---|---|
| `src/app.js` | A tela: leitura, seleção de versículos e botão de estudo |
| `src/estudo.js` | O pedido de estudo e o link que abre o Claude |
| `src/biblia.js` | Busca dos capítulos na bible-api.com |
| `src/livros.js` | Os 66 livros e o número de capítulos de cada um |
| `public/` | HTML, CSS, ícones, manifesto e o `sw.js` (modo offline) |
| `docs/` | O site pronto, **gerado** pelo `npm run build`. Não edite à mão |
