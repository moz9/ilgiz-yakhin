/**
 * Three composed positions, white to move. `line` is the solution: white's moves at even
 * indexes, black's forced replies at odd ones. Every line is verified by chess.test.ts.
 */
export type Puzzle = { title: string; goal: string; fen: string; line: [string, string][]; mate: boolean; lesson: string };

export const PUZZLES: Puzzle[] = [
  {
    title: "Мат в один ход", goal: "Король чёрных заперт своими пешками. Найдите мат.",
    fen: "6k1/5ppp/8/8/8/8/1r3PPP/3R2K1 w", line: [["d1", "d8"]], mate: true,
    lesson: "Мат по последней горизонтали: королю некуда уйти из-за собственных пешек.",
  },
  {
    title: "Двойной удар", goal: "Один ход коня нападает сразу на короля и ферзя. Найдите его и заберите ферзя.",
    fen: "2q3k1/pp3ppp/8/3N4/8/8/PP3PPP/6K1 w", line: [["d5", "e7"], ["g8", "h8"], ["e7", "c8"]], mate: false,
    lesson: "Вилка: конь бьёт две фигуры сразу. Король обязан уйти от шаха, и ферзь достаётся коню.",
  },
  {
    title: "Мат в два хода", goal: "Пожертвуйте ферзя, чтобы запереть короля, и поставьте мат конём.",
    fen: "5r1k/6pp/7N/8/2Q5/8/5PPP/6K1 w", line: [["c4", "g8"], ["f8", "g8"], ["h6", "f7"]], mate: true,
    lesson: "Спёртый мат: ладья вынуждена взять ферзя и занять последнюю свободную клетку у короля.",
  },
];
