const pad = (n: number) => String(n).padStart(2, '0');

/** Data local no formato 'YYYY-MM-DD'. */
export function hojeISO(data = new Date()): string {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export function agoraISO(): string {
  return new Date().toISOString();
}

/** 'DD/MM/AAAA' -> 'YYYY-MM-DD' (null se inválida). */
export function brParaISO(valor: string): string | null {
  const m = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const data = new Date(Number(a), Number(mes) - 1, Number(d));
  if (data.getDate() !== Number(d) || data.getMonth() !== Number(mes) - 1) return null;
  return `${a}-${mes}-${d}`;
}

/** 'YYYY-MM-DD' -> 'DD/MM/AAAA'. */
export function isoParaBR(iso: string | null | undefined): string {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Idade legível a partir da data de nascimento ('2 anos', '5 meses'). */
export function idadeDe(dataNascimento: string | null): string | null {
  if (!dataNascimento) return null;
  const [a, m, d] = dataNascimento.split('-').map(Number);
  const hoje = new Date();
  let meses = (hoje.getFullYear() - a) * 12 + (hoje.getMonth() + 1 - m);
  if (hoje.getDate() < d) meses--;
  if (meses < 0) return null;
  if (meses < 12) return meses === 1 ? '1 mês' : `${meses} meses`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? '1 ano' : `${anos} anos`;
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** '16 de outubro'. */
export function diaPorExtenso(data = new Date()): string {
  return `${data.getDate()} de ${MESES[data.getMonth()]}`;
}

/** Hora local 'HH:MM' de uma data/hora ISO (ou de agora). */
export function horaDe(iso?: string | null): string {
  const data = iso ? new Date(iso) : new Date();
  return `${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

/** 'HH:MM' válido? */
export function horaValida(valor: string): boolean {
  const m = valor.match(/^(\d{2}):(\d{2})$/);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/** Minutos desde a meia-noite de um 'HH:MM'. */
export function minutosDe(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** '42 min', '2 h', '2 h 5 min'. */
export function duracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Dias de `de` até `ate` ('YYYY-MM-DD'); negativo se `ate` vier antes. */
export function diasEntre(de: string, ate: string): number {
  const utc = (iso: string) => {
    const [a, m, d] = iso.split('-').map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((utc(ate) - utc(de)) / 86_400_000);
}

/** Máscara de digitação HH:MM. */
export function mascaraHora(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 4);
  return n.length <= 2 ? n : `${n.slice(0, 2)}:${n.slice(2)}`;
}

/** Máscara de digitação DD/MM/AAAA. */
export function mascaraData(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}
