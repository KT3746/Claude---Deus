import { LIVROS, validarCapitulo } from "./livros.js";
import { buscarCapitulo } from "./biblia.js";
import { linkClaude, montarPedido } from "./estudo.js";

const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Elementos ----------
const $ = (id) => document.getElementById(id);
const el = {
  livro: $("livro"), capitulo: $("capitulo"), anterior: $("anterior"), proximo: $("proximo"),
  titulo: $("titulo-cap"), texto: $("texto"),
  selecao: $("selecao"), selecaoRef: $("selecao-ref"), limpar: $("limpar"),
  pergunta: $("pergunta"), estudar: $("estudar"), status: $("status"),
};

// ---------- Armazenamento local (fica só neste aparelho) ----------
const armazenamento = {
  ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado etc. */ }
  },
};

// ---------- Estado ----------
let atual = { livro: null, capitulo: 1, versiculos: [] };
const selecionados = new Set();
let pedidoAtual = "";

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

// ---------- Seleção e pedido de estudo ----------
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

/** Recalcula o pedido e o link do botão sempre que a seleção ou a pergunta mudam. */
function atualizarPedido() {
  pedidoAtual = "";
  el.estudar.href = "https://claude.ai/new";
  el.estudar.setAttribute("aria-disabled", "true");
  if (selecionados.size === 0) return;
  try {
    pedidoAtual = montarPedido({
      referencia: referenciaSelecionada(),
      texto: atual.versiculos
        .filter((v) => selecionados.has(v.numero))
        .map((v) => `${v.numero} ${v.texto}`)
        .join(" "),
      pergunta: el.pergunta.value,
    });
    el.estudar.href = linkClaude(pedidoAtual);
    el.estudar.removeAttribute("aria-disabled");
  } catch (err) {
    el.status.textContent = err.message;
  }
}

function atualizarSelecao() {
  for (const span of el.texto.querySelectorAll(".versiculo")) {
    span.classList.toggle("sel", selecionados.has(Number(span.dataset.numero)));
  }
  const vazio = selecionados.size === 0;
  el.selecao.classList.toggle("vazio", vazio);
  el.selecaoRef.textContent = vazio ? "Nenhum versículo selecionado" : referenciaSelecionada();
  el.status.textContent = "";
  atualizarPedido();
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

// O link abre o Claude sozinho; aqui só copiamos o pedido, caso ele não apareça escrito.
function aoEstudar(evento) {
  if (!pedidoAtual) {
    evento.preventDefault();
    el.status.textContent = "Primeiro toque em um ou mais versículos.";
    return;
  }
  const longo = el.estudar.href === "https://claude.ai/new";
  navigator.clipboard?.writeText(pedidoAtual).then(
    () => {
      el.status.textContent = longo
        ? "Pedido copiado. No Claude, toque na caixa de mensagem, escolha Colar e envie."
        : "Pedido copiado. Se não aparecer escrito no Claude, é só colar e enviar.";
    },
    () => {
      el.status.textContent = longo
        ? "Não consegui copiar. Selecione menos versículos e tente de novo."
        : "";
    },
  );
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
  el.pergunta.addEventListener("input", atualizarPedido);
  el.estudar.addEventListener("click", aoEstudar);

  const ultima = armazenamento.ler("ultimaLeitura", { livro: "JHN", capitulo: 3 });
  carregarCapitulo(ultima.livro, ultima.capitulo);

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* sem modo offline */ });
  }
}

iniciar();
