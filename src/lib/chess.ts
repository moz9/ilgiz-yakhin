/**
 * Just enough chess for tactics puzzles: a position from FEN and the legal moves of a piece
 * (no castling, en passant or promotion: the puzzles do not need them). Squares are 0..63,
 * a8 = 0, h1 = 63, as FEN lists them.
 */
export type Color = "w" | "b";
export type Kind = "k" | "q" | "r" | "b" | "n" | "p";
export type Piece = { id: string; kind: Kind; color: Color; square: number };

export const file = (square: number) => square % 8;
export const rank = (square: number) => Math.floor(square / 8);
/** "e4" → square index. */
export const at = (name: string) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);
export const squareName = (square: number) => `${String.fromCharCode(97 + file(square))}${8 - rank(square)}`;

export function fromFen(fen: string): Piece[] {
  const pieces: Piece[] = [];
  fen.split(" ")[0].split("/").forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += Number(ch); continue; }
      const color: Color = ch === ch.toUpperCase() ? "w" : "b";
      pieces.push({ id: `${ch}${r * 8 + f}`, kind: ch.toLowerCase() as Kind, color, square: r * 8 + f });
      f++;
    }
  });
  return pieces;
}

const LINES: Record<"r" | "b", number[][]> = { r: [[1, 0], [-1, 0], [0, 1], [0, -1]], b: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const AROUND = [...LINES.r, ...LINES.b];

/** Squares a piece could move to if checks did not matter. `attacksOnly` asks which squares it attacks. */
function reach(pieces: Piece[], piece: Piece, attacksOnly = false) {
  const on = (square: number) => pieces.find((p) => p.square === square);
  const out: number[] = [];
  const f = file(piece.square), r = rank(piece.square);
  const step = (df: number, dr: number, far: boolean) => {
    for (let x = f + df, y = r + dr; x >= 0 && x < 8 && y >= 0 && y < 8; x += df, y += dr) {
      const other = on(y * 8 + x);
      if (!other || other.color !== piece.color) out.push(y * 8 + x);
      if (other || !far) break;
    }
  };
  if (piece.kind === "n") KNIGHT.forEach(([df, dr]) => step(df, dr, false));
  else if (piece.kind === "k") AROUND.forEach(([df, dr]) => step(df, dr, false));
  else if (piece.kind === "r" || piece.kind === "b") LINES[piece.kind].forEach(([df, dr]) => step(df, dr, true));
  else if (piece.kind === "q") AROUND.forEach(([df, dr]) => step(df, dr, true));
  else {
    const dir = piece.color === "w" ? -1 : 1, y = r + dir;
    if (y < 0 || y > 7) return out;
    for (const df of [-1, 1]) {
      const x = f + df;
      if (x < 0 || x > 7) continue;
      const other = on(y * 8 + x);
      if (attacksOnly || (other && other.color !== piece.color)) out.push(y * 8 + x);
    }
    if (!attacksOnly && !on(y * 8 + f)) {
      out.push(y * 8 + f);
      const home = piece.color === "w" ? 6 : 1;
      if (r === home && !on((y + dir) * 8 + f)) out.push((y + dir) * 8 + f);
    }
  }
  return out;
}

/** The position after a move; a piece standing on the target square is captured. */
export function move(pieces: Piece[], from: number, to: number): Piece[] {
  return pieces.filter((p) => p.square !== to).map((p) => (p.square === from ? { ...p, square: to } : p));
}

export function inCheck(pieces: Piece[], color: Color) {
  const king = pieces.find((p) => p.kind === "k" && p.color === color);
  return Boolean(king && pieces.some((p) => p.color !== color && reach(pieces, p, true).includes(king.square)));
}

/** Legal targets of the piece on a square: its reach minus the moves that leave its own king in check. */
export function legalMoves(pieces: Piece[], square: number) {
  const piece = pieces.find((p) => p.square === square);
  return piece ? reach(pieces, piece).filter((to) => !inCheck(move(pieces, square, to), piece.color)) : [];
}

export const isMate = (pieces: Piece[], color: Color) => inCheck(pieces, color) && pieces.filter((p) => p.color === color).every((p) => legalMoves(pieces, p.square).length === 0);
