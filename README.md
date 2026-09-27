# Estudo Bíblico com IA

Leia a Bíblia (tradução João Ferreira de Almeida) e toque nos versículos que quer estudar. O Claude gera um estudo com:

- **Contexto histórico e literário**: quem escreveu, para quem, quando e o gênero do texto;
- **Palavras no original**: termos-chave em hebraico ou grego, com transliteração e significado;
- **Referências cruzadas**: passagens relacionadas e o que as liga;
- **Leituras de diferentes tradições**: católica, protestante/evangélica, ortodoxa e judaica, onde houver diferença;
- **Perguntas para refletir**: aplicação pessoal ou discussão em grupo.

Depois dá para continuar a conversa com perguntas livres ("e o grego de *amou*?") e salvar os estudos no navegador.

## Como rodar

Requisitos: Node.js 20 ou mais recente e uma chave da API do Claude ([console.anthropic.com](https://console.anthropic.com)).

```bash
npm install
cp .env.example .env   # e preencha ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```

`npm run dev` reinicia o servidor a cada alteração, e `npm test` roda os testes.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `src/server.js` | Servidor Express: arquivos estáticos, `/api/livros`, `/api/capitulo/:livro/:cap` e `/api/estudo` (resposta em streaming) |
| `src/estudo.js` | Prompt do professor, validação do histórico e chamada ao Claude |
| `src/biblia.js` | Busca os capítulos na [bible-api.com](https://bible-api.com) (Almeida, domínio público) e guarda em cache |
| `src/livros.js` | Os 66 livros, com os nomes em português e o número de capítulos |
| `public/` | Interface (HTML, CSS e JS puros; o Markdown é renderizado com `marked`, sem HTML bruto) |

A chave da API fica só no servidor. O navegador envia a passagem e o histórico da conversa, e o servidor valida tudo antes de chamar o Claude.

## Próximos passos possíveis

- Mais traduções (ARC, ACF, NVI, conforme a licença de cada uma)
- Contas de usuário e sincronização dos estudos salvos
- Modo "grupo": gerar um roteiro de estudo para uma célula
- Versão PWA/app móvel
