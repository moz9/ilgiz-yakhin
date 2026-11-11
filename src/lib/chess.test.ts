import { describe, expect, it } from "vitest";
import { at, fromFen, inCheck, isMate, legalMoves, move, squareName } from "./chess";
import { PUZZLES } from "./chess-puzzles";

describe("chess rules", () => {
  it("lists legal moves and keeps the king out of check", () => {
    const start = fromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w");
    expect(legalMoves(start, at("e2")).map(squareName).sort()).toEqual(["e3", "e4"]);
    expect(legalMoves(start, at("g1")).map(squareName).sort()).toEqual(["f3", "h3"]);
    expect(legalMoves(start, at("a1"))).toEqual([]);
    // A pinned knight may not move: the rook behind it would give check.
    const pinned = fromFen("4r2k/8/8/8/8/8/4N3/4K3 w");
    expect(legalMoves(pinned, at("e2"))).toEqual([]);
  });
});

describe("puzzles", () => {
  it.each(PUZZLES.map((p) => [p.title, p] as const))("%s is solved by its line and ends as promised", (_, puzzle) => {
    let pieces = fromFen(puzzle.fen);
    puzzle.line.forEach(([from, to], i) => {
      const color = i % 2 === 0 ? "w" : "b";
      expect(pieces.find((p) => p.square === at(from))?.color).toBe(color);
      expect(legalMoves(pieces, at(from)).map(squareName)).toContain(to);
      pieces = move(pieces, at(from), at(to));
    });
    expect(inCheck(pieces, "w")).toBe(false);
    if (puzzle.mate) expect(isMate(pieces, "b")).toBe(true);
  });

  it("has no other mating first move in the mate-in-one", () => {
    const puzzle = PUZZLES.find((p) => p.mate && p.line.length === 1)!;
    const pieces = fromFen(puzzle.fen);
    const mates = pieces.filter((p) => p.color === "w").flatMap((p) => legalMoves(pieces, p.square).filter((to) => isMate(move(pieces, p.square, to), "b")).map((to) => squareName(p.square) + squareName(to)));
    expect(mates).toEqual([puzzle.line[0].join("")]);
  });
});
