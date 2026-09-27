import { marked } from "marked";
import { LIVROS, validarCapitulo } from "./livros.js";
import { buscarCapitulo } from "./biblia.js";
import { estudar, explicarErro, montarMensagens } from "./estudo.js";

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

// ---------- Elementos ----------
const $ = (id) => document.getElementById(id);
const el = {
  livro: $("livro"), capitulo: $("capitulo"), anterior: $("anterior"), proximo: $("proximo"),
  titulo: $("titulo-cap"), texto: $("texto"),
  selecao: $("selecao"), selecaoRef: $("selecao-ref"), limpar: $("limpar"), estudar: $("estudar"),
  conversa: $("conversa"), form: $("pergunta-form"), pergunta: $("pergunta"), enviar: $("enviar"),
  qtdSalvos: $("qtd-salvos"), listaSalvos: $("lista-salvos"),
  abrirConfig: $("abrir-config"), config: $("config"), configForm: $("config-form"),
  chave: $("chave"), apagarChave: $("apagar-chave"), statusChave: $("status-chave"),
  avisoChave: $("aviso-chave"),
};

// ---------- Armazenamento local (fica só neste aparelho) ----------
const armazenamento = {
  ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado etc. */ }
  },
  apagar(chave) {
    try { localStorage.removeItem(chave); } catch { /* ignora */ }
  },
};

// ---------- Estado ----------
let atual = { livro: null, capitulo: 1, versiculos: [] };
const selecionados = new Set();
// Sessão de estudo: `historico` guarda as trocas depois da passagem (assistant, user, assistant, …).
let sessao = null;
let ocupado = false;

// ---------- Configurações (chave da API) ----------
const chaveApi = () => armazenamento.ler("chaveApi", "");

function atualizarStatusChave() {
  const chave = chaveApi();
  el.statusChave.textContent = chave
    ? `Chave salva neste aparelho (termina em …${chave.slice(-4)}).`
    : "Nenhuma chave salva ainda.";
  el.apagarChave.hidden = !chave;
  el.avisoChave.hidden = Boolean(chave);
}

function abrirConfiguracoes() {
  el.chave.value = "";
  atualizarStatusChave();
  el.config.showModal();
}

// ---------- Leitura ----------
function preencherCapitulos() {
  el.capitulo.innerHTML = "";
  for (let c = 1; c <= atual.livro.capitulos; c++) el.capitulo.add(new Option(String(c), String(c)));
  el.capitulo.value = String(atual.capitulo);
}

async function carregarCapitulo(livroId, capitulo) {
  let alvo;
  try {
    alvo = validarCapitulo(livroId, capitulo);
  } catch {
    alvo = { livro: LIVROS.find((l) => l.id === "JHN"), capitulo: 3 };
  }
  atual = { livro: alvo.livro, capitulo: alvo.capitulo, versiculos: [] };
  el.livro.value = atual.livro.id;
  preencherCapitulos();
  limparSelecao();
  armazenamento.gravar("ultimaLeitura", { livro: atual.livro.id, capitulo: atual.capitulo });

  el.titulo.textContent = `${atual.livro.nome} ${atual.capitulo}`;
  el.texto.innerHTML = '<p class="carregando">Carregando…</p>';
  el.anterior.disabled = atual.livro === LIVROS[0] && atual.capitulo === 1;
  el.proximo.disabled = atual.livro === LIVROS.at(-1) && atual.capitulo === atual.livro.capitulos;

  const pedido = atual;
  try {
    const versiculos = await buscarCapitulo(pedido.livro, pedido.capitulo);
    if (pedido !== atual) return; // a pessoa já trocou de capítulo
    atual.versiculos = versiculos;
    el.texto.innerHTML = "";
    for (const v of versiculos) {
      const span = document.createElement("span");
      span.className = "versiculo";
      span.dataset.numero = v.numero;
      span.tabIndex = 0;
      span.innerHTML = `<sup>${v.numero}</sup>${escapar(v.texto)} `;
      el.texto.append(span);
    }
  } catch (err) {
    if (pedido !== atual) return;
    const offline = !navigator.onLine ? " Você está sem internet e este capítulo ainda não foi aberto antes." : "";
    el.texto.innerHTML = `<p class="erro">${escapar(err.message)}${offline}</p>`;
  }
}

function mudarCapitulo(delta) {
  let i = LIVROS.indexOf(atual.livro);
  let cap = atual.capitulo + delta;
  if (cap < 1 && i > 0) { i--; cap = LIVROS[i].capitulos; }
  else if (cap > atual.livro.capitulos && i < LIVROS.length - 1) { i++; cap = 1; }
  carregarCapitulo(LIVROS[i].id, cap);
  el.texto.parentElement.scrollTo?.({ top: 0 });
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
    const mensagens = montarMensagens(sessao);
    const motivo = await estudar(
      mensagens,
      (trecho) => {
        texto += trecho;
        div.innerHTML = marked.parse(texto);
      },
      { apiKey: chaveApi() },
    );
    if (motivo === "refusal") texto += "\n\n> Não foi possível responder a esta pergunta. Tente reformulá-la.";
    if (motivo === "max_tokens") texto += "\n\n> A resposta foi interrompida por ser longa demais.";
    div.innerHTML = marked.parse(texto);
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
    div.innerHTML = `<p class="erro">${escapar(explicarErro(err))}</p>`;
    // Desfaz a pergunta que falhou, para o histórico continuar alternando user/assistant.
    if (sessao.historico.at(-1)?.role === "user") sessao.historico.pop();
  } finally {
    div.classList.remove("digitando");
    definirOcupado(false);
  }
}

function iniciarEstudo() {
  if (selecionados.size === 0 || ocupado) return;
  if (!chaveApi()) return abrirConfiguracoes();
  const texto = atual.versiculos
    .filter((v) => selecionados.has(v.numero))
    .map((v) => `${v.numero} ${v.texto}`)
    .join(" ");
  sessao = { referencia: referenciaSelecionada(), texto, historico: [] };
  el.conversa.innerHTML = "";
  adicionarMensagem("usuario", `Estudar ${sessao.referencia}`);
  el.form.hidden = false;
  el.conversa.scrollIntoView({ behavior: "smooth", block: "start" });
  pedirEstudo();
}

function enviarPergunta(evento) {
  evento.preventDefault();
  const pergunta = el.pergunta.value.trim();
  if (!pergunta || !sessao || ocupado) return;
  if (!chaveApi()) return abrirConfiguracoes();
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
  sessao = { referencia: estudo.referencia, texto: estudo.texto, historico: [...estudo.historico] };
  el.conversa.innerHTML = "";
  adicionarMensagem("usuario", `Estudar ${estudo.referencia}`);
  for (const m of estudo.historico) adicionarMensagem(m.role === "user" ? "usuario" : "claude", m.content);
  el.form.hidden = false;
  el.conversa.scrollIntoView({ behavior: "smooth", block: "start" });
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
function iniciar() {
  for (const [grupo, rotulo] of [["AT", "Antigo Testamento"], ["NT", "Novo Testamento"]]) {
    const og = document.createElement("optgroup");
    og.label = rotulo;
    for (const l of LIVROS.filter((x) => x.testamento === grupo)) og.append(new Option(l.nome, l.id));
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

  el.abrirConfig.addEventListener("click", abrirConfiguracoes);
  $("aviso-config").addEventListener("click", abrirConfiguracoes);
  el.configForm.addEventListener("submit", (e) => {
    const chave = el.chave.value.trim();
    if (e.submitter?.value !== "salvar") return; // "Fechar"
    if (!chave) return;
    if (!chave.startsWith("sk-ant-")) {
      e.preventDefault();
      el.statusChave.textContent = "Essa chave não parece certa: ela deve começar com sk-ant-";
      return;
    }
    armazenamento.gravar("chaveApi", chave);
    atualizarStatusChave();
  });
  el.apagarChave.addEventListener("click", () => {
    armazenamento.apagar("chaveApi");
    atualizarStatusChave();
  });

  atualizarStatusChave();
  renderizarSalvos();
  const ultima = armazenamento.ler("ultimaLeitura", { livro: "JHN", capitulo: 3 });
  carregarCapitulo(ultima.livro, ultima.capitulo);

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* sem modo offline */ });
  }
}

iniciar();
