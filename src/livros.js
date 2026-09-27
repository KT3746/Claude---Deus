// Os 66 livros do cânon protestante, com o código USFM usado pela bible-api.com,
// o nome em inglês (usado como alternativa na busca) e o número de capítulos.
export const LIVROS = [
  // Antigo Testamento
  { id: "GEN", nome: "Gênesis", en: "genesis", capitulos: 50, testamento: "AT" },
  { id: "EXO", nome: "Êxodo", en: "exodus", capitulos: 40, testamento: "AT" },
  { id: "LEV", nome: "Levítico", en: "leviticus", capitulos: 27, testamento: "AT" },
  { id: "NUM", nome: "Números", en: "numbers", capitulos: 36, testamento: "AT" },
  { id: "DEU", nome: "Deuteronômio", en: "deuteronomy", capitulos: 34, testamento: "AT" },
  { id: "JOS", nome: "Josué", en: "joshua", capitulos: 24, testamento: "AT" },
  { id: "JDG", nome: "Juízes", en: "judges", capitulos: 21, testamento: "AT" },
  { id: "RUT", nome: "Rute", en: "ruth", capitulos: 4, testamento: "AT" },
  { id: "1SA", nome: "1 Samuel", en: "1 samuel", capitulos: 31, testamento: "AT" },
  { id: "2SA", nome: "2 Samuel", en: "2 samuel", capitulos: 24, testamento: "AT" },
  { id: "1KI", nome: "1 Reis", en: "1 kings", capitulos: 22, testamento: "AT" },
  { id: "2KI", nome: "2 Reis", en: "2 kings", capitulos: 25, testamento: "AT" },
  { id: "1CH", nome: "1 Crônicas", en: "1 chronicles", capitulos: 29, testamento: "AT" },
  { id: "2CH", nome: "2 Crônicas", en: "2 chronicles", capitulos: 36, testamento: "AT" },
  { id: "EZR", nome: "Esdras", en: "ezra", capitulos: 10, testamento: "AT" },
  { id: "NEH", nome: "Neemias", en: "nehemiah", capitulos: 13, testamento: "AT" },
  { id: "EST", nome: "Ester", en: "esther", capitulos: 10, testamento: "AT" },
  { id: "JOB", nome: "Jó", en: "job", capitulos: 42, testamento: "AT" },
  { id: "PSA", nome: "Salmos", en: "psalms", capitulos: 150, testamento: "AT" },
  { id: "PRO", nome: "Provérbios", en: "proverbs", capitulos: 31, testamento: "AT" },
  { id: "ECC", nome: "Eclesiastes", en: "ecclesiastes", capitulos: 12, testamento: "AT" },
  { id: "SNG", nome: "Cânticos", en: "song of solomon", capitulos: 8, testamento: "AT" },
  { id: "ISA", nome: "Isaías", en: "isaiah", capitulos: 66, testamento: "AT" },
  { id: "JER", nome: "Jeremias", en: "jeremiah", capitulos: 52, testamento: "AT" },
  { id: "LAM", nome: "Lamentações", en: "lamentations", capitulos: 5, testamento: "AT" },
  { id: "EZK", nome: "Ezequiel", en: "ezekiel", capitulos: 48, testamento: "AT" },
  { id: "DAN", nome: "Daniel", en: "daniel", capitulos: 12, testamento: "AT" },
  { id: "HOS", nome: "Oséias", en: "hosea", capitulos: 14, testamento: "AT" },
  { id: "JOL", nome: "Joel", en: "joel", capitulos: 3, testamento: "AT" },
  { id: "AMO", nome: "Amós", en: "amos", capitulos: 9, testamento: "AT" },
  { id: "OBA", nome: "Obadias", en: "obadiah", capitulos: 1, testamento: "AT" },
  { id: "JON", nome: "Jonas", en: "jonah", capitulos: 4, testamento: "AT" },
  { id: "MIC", nome: "Miquéias", en: "micah", capitulos: 7, testamento: "AT" },
  { id: "NAM", nome: "Naum", en: "nahum", capitulos: 3, testamento: "AT" },
  { id: "HAB", nome: "Habacuque", en: "habakkuk", capitulos: 3, testamento: "AT" },
  { id: "ZEP", nome: "Sofonias", en: "zephaniah", capitulos: 3, testamento: "AT" },
  { id: "HAG", nome: "Ageu", en: "haggai", capitulos: 2, testamento: "AT" },
  { id: "ZEC", nome: "Zacarias", en: "zechariah", capitulos: 14, testamento: "AT" },
  { id: "MAL", nome: "Malaquias", en: "malachi", capitulos: 4, testamento: "AT" },
  // Novo Testamento
  { id: "MAT", nome: "Mateus", en: "matthew", capitulos: 28, testamento: "NT" },
  { id: "MRK", nome: "Marcos", en: "mark", capitulos: 16, testamento: "NT" },
  { id: "LUK", nome: "Lucas", en: "luke", capitulos: 24, testamento: "NT" },
  { id: "JHN", nome: "João", en: "john", capitulos: 21, testamento: "NT" },
  { id: "ACT", nome: "Atos", en: "acts", capitulos: 28, testamento: "NT" },
  { id: "ROM", nome: "Romanos", en: "romans", capitulos: 16, testamento: "NT" },
  { id: "1CO", nome: "1 Coríntios", en: "1 corinthians", capitulos: 16, testamento: "NT" },
  { id: "2CO", nome: "2 Coríntios", en: "2 corinthians", capitulos: 13, testamento: "NT" },
  { id: "GAL", nome: "Gálatas", en: "galatians", capitulos: 6, testamento: "NT" },
  { id: "EPH", nome: "Efésios", en: "ephesians", capitulos: 6, testamento: "NT" },
  { id: "PHP", nome: "Filipenses", en: "philippians", capitulos: 4, testamento: "NT" },
  { id: "COL", nome: "Colossenses", en: "colossians", capitulos: 4, testamento: "NT" },
  { id: "1TH", nome: "1 Tessalonicenses", en: "1 thessalonians", capitulos: 5, testamento: "NT" },
  { id: "2TH", nome: "2 Tessalonicenses", en: "2 thessalonians", capitulos: 3, testamento: "NT" },
  { id: "1TI", nome: "1 Timóteo", en: "1 timothy", capitulos: 6, testamento: "NT" },
  { id: "2TI", nome: "2 Timóteo", en: "2 timothy", capitulos: 4, testamento: "NT" },
  { id: "TIT", nome: "Tito", en: "titus", capitulos: 3, testamento: "NT" },
  { id: "PHM", nome: "Filemom", en: "philemon", capitulos: 1, testamento: "NT" },
  { id: "HEB", nome: "Hebreus", en: "hebrews", capitulos: 13, testamento: "NT" },
  { id: "JAS", nome: "Tiago", en: "james", capitulos: 5, testamento: "NT" },
  { id: "1PE", nome: "1 Pedro", en: "1 peter", capitulos: 5, testamento: "NT" },
  { id: "2PE", nome: "2 Pedro", en: "2 peter", capitulos: 3, testamento: "NT" },
  { id: "1JN", nome: "1 João", en: "1 john", capitulos: 5, testamento: "NT" },
  { id: "2JN", nome: "2 João", en: "2 john", capitulos: 1, testamento: "NT" },
  { id: "3JN", nome: "3 João", en: "3 john", capitulos: 1, testamento: "NT" },
  { id: "JUD", nome: "Judas", en: "jude", capitulos: 1, testamento: "NT" },
  { id: "REV", nome: "Apocalipse", en: "revelation", capitulos: 22, testamento: "NT" },
];

const POR_ID = new Map(LIVROS.map((l) => [l.id, l]));

export function buscarLivro(id) {
  return POR_ID.get(String(id).toUpperCase()) ?? null;
}

/** Valida livro + capítulo; devolve o livro ou lança um erro com mensagem amigável. */
export function validarCapitulo(id, capitulo) {
  const livro = buscarLivro(id);
  if (!livro) throw new Error(`Livro desconhecido: ${id}`);
  const cap = Number(capitulo);
  if (!Number.isInteger(cap) || cap < 1 || cap > livro.capitulos) {
    throw new Error(`${livro.nome} tem capítulos de 1 a ${livro.capitulos}.`);
  }
  return { livro, capitulo: cap };
}

