import { marked } from "/vendor/marked/marked.esm.js";

// ---------- Markdown seguro (a resposta do modelo nunca vira HTML bruto) ----------
const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
marked.use({
  renderer: {
    html: (t) => escapar(t.text),
    image: (t) => escapar(t.text || ""),
    link(t) {
      const texto = this.parser.parseInline(t.tokens);
      return /^https?:\/\//i.test(t.href)
        ? `<a href="${escapar(t.href)}" target="_blank" rel="noopener noreferrer">${texto}</a>`
        : texto;
    },
  },
});

// ---------- Estado ----------
const $ = (id) => document.getElementById(id);
const el = {
  livro: $("livro"), capitulo: $("capitulo"), anterior: $("anterior"), proximo: $("proximo"),
  titulo: $("titulo-cap"), texto: $("texto"),
  selecao: $("selecao"), selecaoRef: $("selecao-ref"), limpar: $("limpar"), estudar: $("estudar"),
  conversa: $("conversa"), form: $("pergunta-form"), pergunta: $("pergunta"), enviar: $("enviar"),
  qtdSalvos: $("qtd-salvos"), listaSalvos: $("lista-salvos"),
};

let livros = [];
let atual = { livro: null, capitulo: 1, versiculos: [] };
const selecionados = new Set();
// Sessão de estudo: a primeira mensagem do usuário é montada no servidor a partir
// da passagem; `historico` guarda as trocas seguintes (assistant, user, assistant, …).
let sessao = null;
let ocupado = false;

// ---------- Armazenamento local (estudos salvos e última leitura) ----------
const armazenamento = {
  ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado etc. */ }
  },
};

// ---------- Leitura ----------
function preencherCapitulos() {
  el.capitulo.innerHTML = "";
  for (let c = 1; c <= atual.livro.capitulos; c++) {
    el.capitulo.add(new Option(String(c), String(c)));
  }
  el.capitulo.value = String(atual.capitulo);
}

async function carregarCapitulo(livroId, capitulo) {
  atual.livro = livros.find((l) => l.id === livroId) ?? livros[0];
  atual.capitulo = Math.min(Math.max(1, capitulo), atual.livro.capitulos);
  el.livro.value = atual.livro.id;
  preencherCapitulos();
  limparSelecao();
  armazenamento.gravar("ultimaLeitura", { livro: atual.livro.id, capitulo: atual.capitulo });

  el.titulo.textContent = `${atual.livro.nome} ${atual.capitulo}`;
  el.texto.innerHTML = '<p class="carregando">Carregando…</p>';
  el.anterior.disabled = atual.livro === livros[0] && atual.capitulo === 1;
  el.proximo.disabled = atual.livro === livros.at(-1) && atual.capitulo === atual.livro.capitulos;

  const pedido = `${atual.livro.id}.${atual.capitulo}`;
  try {
    const res = await fetch(`/api/capitulo/${atual.livro.id}/${atual.capitulo}`);
    const dados = await res.json();
    if (pedido !== `${atual.livro.id}.${atual.capitulo}`) return; // usuário já trocou de capítulo
    if (!res.ok) throw new Error(dados.erro);
    atual.versiculos = dados.versiculos;
    el.texto.innerHTML = "";
    for (const v of atual.versiculos) {
      const span = document.createElement("span");
      span.className = "versiculo";
      span.dataset.numero = v.numero;
      span.tabIndex = 0;
      span.innerHTML = `<sup>${v.numero}</sup>${escapar(v.texto)} `;
      el.texto.append(span);
    }
  } catch (err) {
    el.texto.innerHTML = `<p class="erro">${escapar(err.message || "Erro ao carregar o capítulo.")}</p>`;
  }
}

function mudarCapitulo(delta) {
  let i = livros.indexOf(atual.livro);
  let cap = atual.capitulo + delta;
  if (cap < 1 && i > 0) { i--; cap = livros[i].capitulos; }
  else if (cap > atual.livro.capitulos && i < livros.length - 1) { i++; cap = 1; }
  carregarCapitulo(livros[i].id, cap);
}

// ---------- Seleção de versículos ----------
function referenciaSelecionada() {
  const nums = [...selecionados].sort((a, b) => a - b);
  const partes = [];
  for (let i = 0; i < nums.length; i++) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    partes.push(i === j ? `${nums[i]}` : `${nums[i]}-${nums[j]}`);
    i = j;
  }
  return `${atual.livro.nome} ${atual.capitulo}:${partes.join(",")}`;
}

function atualizarSelecao() {
  for (const span of el.texto.querySelectorAll(".versiculo")) {
    span.classList.toggle("sel", selecionados.has(Number(span.dataset.numero)));
  }
  const vazio = selecionados.size === 0;
  el.selecao.classList.toggle("vazio", vazio);
  el.selecaoRef.textContent = vazio ? "Nenhum versículo selecionado" : referenciaSelecionada();
  el.estudar.disabled = vazio || ocupado;
}

function limparSelecao() {
  selecionados.clear();
  atualizarSelecao();
}

function alternarVersiculo(alvo) {
  const span = alvo.closest(".versiculo");
  if (!span) return;
  const n = Number(span.dataset.numero);
  selecionados.has(n) ? selecionados.delete(n) : selecionados.add(n);
  atualizarSelecao();
}

// ---------- Conversa com o Claude ----------
function adicionarMensagem(papel, conteudo) {
  const div = document.createElement("div");
  div.className = `msg ${papel}`;
  if (papel === "usuario") div.textContent = conteudo;
  else div.innerHTML = marked.parse(conteudo);
  el.conversa.append(div);
  return div;
}

function definirOcupado(valor) {
  ocupado = valor;
  el.enviar.disabled = valor;
  el.estudar.disabled = valor || selecionados.size === 0;
}

async function pedirEstudo() {
  const div = adicionarMensagem("claude", "");
  div.classList.add("digitando");
  definirOcupado(true);
  let texto = "";
  try {
    const res = await fetch("/api/estudo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referencia: sessao.referencia, texto: sessao.texto, historico: sessao.historico }),
    });
    if (!res.ok) {
      const dados = await res.json().catch(() => ({}));
      throw new Error(dados.erro || `Erro ${res.status}`);
    }
    const leitor = res.body.getReader();
    const decodificador = new TextDecoder();
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      texto += decodificador.decode(value, { stream: true });
      div.innerHTML = marked.parse(texto);
    }
    sessao.historico.push({ role: "assistant", content: texto });
    const salvar = document.createElement("button");
    salvar.className = "salvar secundario";
    salvar.type = "button";
    salvar.textContent = "Salvar estudo";
    salvar.addEventListener("click", () => {
      salvarEstudo();
      salvar.textContent = "Salvo ✓";
      salvar.disabled = true;
    });
    div.append(salvar);
  } catch (err) {
    div.innerHTML = `<p class="erro">${escapar(err.message)}</p>`;
    // Desfaz a pergunta que falhou, para o histórico continuar alternando user/assistant.
    if (sessao.historico.at(-1)?.role === "user") sessao.historico.pop();
  } finally {
    div.classList.remove("digitando");
    definirOcupado(false);
  }
}

function iniciarEstudo() {
  if (selecionados.size === 0 || ocupado) return;
  const nums = [...selecionados].sort((a, b) => a - b);
  const texto = atual.versiculos
    .filter((v) => selecionados.has(v.numero))
    .map((v) => `${v.numero} ${v.texto}`)
    .join(" ");
  sessao = { referencia: referenciaSelecionada(), texto, historico: [], livro: atual.livro.id, capitulo: atual.capitulo, versiculos: nums };
  el.conversa.innerHTML = "";
  adicionarMensagem("usuario", `Estudar ${sessao.referencia}`);
  el.form.hidden = false;
  pedirEstudo();
}

function enviarPergunta(evento) {
  evento.preventDefault();
  const pergunta = el.pergunta.value.trim();
  if (!pergunta || !sessao || ocupado) return;
  el.pergunta.value = "";
  adicionarMensagem("usuario", pergunta);
  sessao.historico.push({ role: "user", content: pergunta });
  pedirEstudo();
}

// ---------- Estudos salvos ----------
function salvarEstudo() {
  const salvos = armazenamento.ler("estudos", []);
  const semEste = salvos.filter((s) => s.referencia !== sessao.referencia);
  semEste.unshift({ ...sessao, historico: [...sessao.historico], salvoEm: new Date().toISOString() });
  armazenamento.gravar("estudos", semEste.slice(0, 50));
  renderizarSalvos();
}

function abrirEstudo(estudo) {
  sessao = { ...estudo, historico: [...estudo.historico] };
  el.conversa.innerHTML = "";
  adicionarMensagem("usuario", `Estudar ${estudo.referencia}`);
  for (const m of estudo.historico) adicionarMensagem(m.role === "user" ? "usuario" : "claude", m.content);
  el.form.hidden = false;
  el.conversa.scrollIntoView({ behavior: "smooth" });
}

function renderizarSalvos() {
  const salvos = armazenamento.ler("estudos", []);
  el.qtdSalvos.textContent = salvos.length;
  el.listaSalvos.innerHTML = "";
  for (const estudo of salvos) {
    const li = document.createElement("li");
    const abrir = document.createElement("button");
    abrir.className = "abrir";
    abrir.type = "button";
    abrir.textContent = estudo.referencia;
    abrir.addEventListener("click", () => abrirEstudo(estudo));
    const remover = document.createElement("button");
    remover.className = "secundario";
    remover.type = "button";
    remover.textContent = "Remover";
    remover.setAttribute("aria-label", `Remover ${estudo.referencia}`);
    remover.addEventListener("click", () => {
      armazenamento.gravar("estudos", armazenamento.ler("estudos", []).filter((s) => s.referencia !== estudo.referencia));
      renderizarSalvos();
    });
    li.append(abrir, remover);
    el.listaSalvos.append(li);
  }
}

// ---------- Início ----------
async function iniciar() {
  livros = await (await fetch("/api/livros")).json();
  for (const [grupo, rotulo] of [["AT", "Antigo Testamento"], ["NT", "Novo Testamento"]]) {
    const og = document.createElement("optgroup");
    og.label = rotulo;
    for (const l of livros.filter((x) => x.testamento === grupo)) og.append(new Option(l.nome, l.id));
    el.livro.append(og);
  }

  el.livro.addEventListener("change", () => carregarCapitulo(el.livro.value, 1));
  el.capitulo.addEventListener("change", () => carregarCapitulo(atual.livro.id, Number(el.capitulo.value)));
  el.anterior.addEventListener("click", () => mudarCapitulo(-1));
  el.proximo.addEventListener("click", () => mudarCapitulo(1));
  el.texto.addEventListener("click", (e) => alternarVersiculo(e.target));
  el.texto.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternarVersiculo(e.target); }
  });
  el.limpar.addEventListener("click", limparSelecao);
  el.estudar.addEventListener("click", iniciarEstudo);
  el.form.addEventListener("submit", enviarPergunta);
  el.pergunta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit(); }
  });

  renderizarSalvos();
  const ultima = armazenamento.ler("ultimaLeitura", { livro: "JHN", capitulo: 3 });
  await carregarCapitulo(ultima.livro, ultima.capitulo);
}

iniciar().catch((err) => {
  el.texto.innerHTML = `<p class="erro">${escapar(err.message)}</p>`;
});
