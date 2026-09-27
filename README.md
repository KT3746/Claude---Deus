# Estudo Bíblico com IA

App pessoal para ler a Bíblia (tradução João Ferreira de Almeida) e estudar passagens com o Claude. Toque nos versículos e peça um estudo com:

- **Contexto histórico e literário**: quem escreveu, para quem, quando e o gênero do texto;
- **Palavras no original**: termos-chave em hebraico ou grego, com transliteração e significado;
- **Referências cruzadas**: passagens relacionadas e o que as liga;
- **Leituras de diferentes tradições**: católica, protestante/evangélica, ortodoxa e judaica;
- **Perguntas para refletir**.

Depois dá para fazer perguntas livres e salvar os estudos. Funciona no celular e pode ser instalado na tela inicial. Os capítulos já abertos continuam disponíveis sem internet.

**Endereço:** https://kt3746.github.io/Claude---Deus/

## Como funciona (resumo)

- O site é publicado pelo **GitHub Pages** a partir da pasta `docs/`, sem servidor.
- O texto bíblico vem da [bible-api.com](https://bible-api.com), que é gratuita.
- O estudo usa a **API do Claude** com a **sua chave**, que você cola em ⚙️ Configurações. A chave fica guardada só no navegador do seu aparelho e nunca vai para o GitHub. Cada estudo gasta um pouco dos créditos da sua conta na Anthropic.

## Para quem for mexer no código

```bash
npm install
npm test        # testes
npm run build   # gera docs/ a partir de src/ e public/
npm run dev     # gera e abre em http://localhost:3000
```

| Pasta ou arquivo | O que tem |
|---|---|
| `src/app.js` | A tela: leitura, seleção de versículos, conversa e estudos salvos |
| `src/estudo.js` | O prompt do professor e a chamada ao Claude |
| `src/biblia.js` | Busca dos capítulos na bible-api.com |
| `src/livros.js` | Os 66 livros e o número de capítulos de cada um |
| `public/` | HTML, CSS, ícones, manifesto e o `sw.js` (modo offline) |
| `docs/` | O site pronto, **gerado** pelo `npm run build`. Não edite à mão |
