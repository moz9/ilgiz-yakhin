"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Lightbulb, RotateCcw } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { at, file, fromFen, legalMoves, move, rank, squareName, type Kind, type Piece } from "@/lib/chess";
import { PUZZLES } from "@/lib/chess-puzzles";
import type { ShowcaseProps } from "./registry";

// The filled glyphs for both sides, forced to text: the pawn would otherwise turn into an emoji.
const GLYPH: Record<Kind, string> = { k: "♚︎", q: "♛︎", r: "♜︎", b: "♝︎", n: "♞︎", p: "♟︎" };
const NAME: Record<Kind, string> = { k: "король", q: "ферзь", r: "ладья", b: "слон", n: "конь", p: "пешка" };
const SQUARES = Array.from({ length: 64 }, (_, i) => i);
type Note = { tone: "idle" | "wrong" | "good"; text: string };

/**
 * A tactics trainer in the spirit of the puzzle on the school's site: three positions, white
 * to move. Pieces move by tap-tap or by dragging, only legal moves are offered, a wrong move
 * is refused with a nudge, and black answers on its own. The rules are in src/lib/chess.ts.
 */
export default function ChessTrainer({ mode }: ShowcaseProps) {
  const board = useRef<HTMLDivElement>(null);
  const reply = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>(() => fromFen(PUZZLES[0].fen));
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [last, setLast] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState<boolean[]>(() => PUZZLES.map(() => false));
  const [note, setNote] = useState<Note>({ tone: "idle", text: "Ход белых." });
  const puzzle = PUZZLES[index];
  const done = step >= puzzle.line.length;
  const waiting = step % 2 === 1;
  const targets = selected === null ? [] : legalMoves(pieces, selected);
  const hintSquare = hint && !done && !waiting ? at(puzzle.line[step][0]) : -1;

  useEffect(() => () => { if (reply.current) clearTimeout(reply.current); }, []);

  const load = (next: number) => {
    if (reply.current) clearTimeout(reply.current);
    setIndex(next); setPieces(fromFen(PUZZLES[next].fen)); setStep(0); setSelected(null); setLast([]); setHint(false);
    setNote({ tone: "idle", text: "Ход белых." });
  };

  const play = (from: number, to: number) => {
    setSelected(null);
    const [wantFrom, wantTo] = puzzle.line[step];
    if (from !== at(wantFrom) || to !== at(wantTo)) {
      setNote({ tone: "wrong", text: `${squareName(from)}–${squareName(to)} — возможный ход, но задачу он не решает. Попробуйте ещё.` });
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.fromTo(board.current, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    const after = move(pieces, from, to);
    setPieces(after); setLast([from, to]); setHint(false);
    if (step + 1 >= puzzle.line.length) {
      setStep(step + 1);
      setSolved((list) => list.map((v, i) => v || i === index));
      setNote({ tone: "good", text: puzzle.mate ? "Мат!" : "Ферзь выигран!" });
      return;
    }
    // Black's forced reply plays itself after a beat.
    setStep(step + 1);
    setNote({ tone: "good", text: "Верно. Чёрные отвечают…" });
    const [replyFrom, replyTo] = puzzle.line[step + 1];
    reply.current = setTimeout(() => {
      setPieces(move(after, at(replyFrom), at(replyTo)));
      setLast([at(replyFrom), at(replyTo)]);
      setStep(step + 2);
      setNote({ tone: "idle", text: "Ваш ход: доведите до конца." });
    }, 750);
  };

  const press = (square: number) => {
    if (done || waiting) return;
    if (selected !== null && targets.includes(square)) return play(selected, square);
    setSelected(pieces.some((p) => p.square === square && p.color === "w") && square !== selected ? square : null);
  };
  // Dragging: the piece picked on pointer-down is dropped on the square under the pointer.
  const drop = (event: React.PointerEvent) => {
    const square = Number((document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)?.dataset.square ?? -1);
    if (selected !== null && square !== selected && targets.includes(square)) play(selected, square);
  };

  const all = solved.every(Boolean);
  return <div className={`ch ch-${mode}`}>
    <div className="ch-board-wrap">
      <div className="ch-board" ref={board} onPointerUp={drop}>
        {SQUARES.map((square) => {
          const piece = pieces.find((p) => p.square === square);
          return <button key={square} type="button" className="ch-square" data-square={square} data-dark={(file(square) + rank(square)) % 2 === 1 || undefined}
            data-selected={selected === square || undefined} data-target={targets.includes(square) || undefined} data-capture={(targets.includes(square) && Boolean(piece)) || undefined}
            data-last={last.includes(square) || undefined} data-hint={hintSquare === square || undefined}
            aria-label={`${squareName(square)}${piece ? `, ${piece.color === "w" ? "белый" : "чёрный"} ${NAME[piece.kind]}` : ""}`}
            onPointerDown={(e) => { e.currentTarget.releasePointerCapture?.(e.pointerId); press(square); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); press(square); } }}>
            {file(square) === 0 && <i className="ch-rank">{8 - rank(square)}</i>}
            {rank(square) === 7 && <i className="ch-file">{String.fromCharCode(97 + file(square))}</i>}
          </button>;
        })}
        {pieces.map((piece) => <span key={piece.id} className="ch-piece" data-color={piece.color} aria-hidden="true"
          style={{ transform: `translate(${file(piece.square) * 100}%, ${rank(piece.square) * 100}%)` }}>{GLYPH[piece.kind]}</span>)}
      </div>
    </div>

    <aside className="ch-side">
      <p className="ch-brand">Шахматный тренажёр · белые начинают</p>
      <ol className="ch-steps" aria-label="Задачи">
        {PUZZLES.map((item, i) => <li key={item.title}><button type="button" aria-current={i === index || undefined} data-solved={solved[i] || undefined} onClick={() => load(i)} aria-label={`Задача ${i + 1}: ${item.title}${solved[i] ? ", решена" : ""}`}>{solved[i] ? <Check aria-hidden="true" /> : i + 1}</button></li>)}
      </ol>
      <h3>{puzzle.title}</h3>
      <p className="ch-goal">{puzzle.goal}</p>
      <p className="ch-note" data-tone={note.tone} role="status">{note.text}</p>
      {done && <p className="ch-lesson">{puzzle.lesson}</p>}
      <div className="ch-actions">
        {done
          ? all && index === PUZZLES.length - 1
            ? <button type="button" className="ch-main" onClick={() => { setSolved(PUZZLES.map(() => false)); load(0); }}><RotateCcw aria-hidden="true" />Решить заново</button>
            : <button type="button" className="ch-main" onClick={() => load((index + 1) % PUZZLES.length)}>Следующая задача<ArrowRight aria-hidden="true" /></button>
          : <button type="button" onClick={() => setHint(true)} disabled={waiting}><Lightbulb aria-hidden="true" />Подсказка</button>}
        <button type="button" onClick={() => load(index)}><RotateCcw aria-hidden="true" />Сначала</button>
      </div>
      {all && <p className="ch-all"><Check aria-hidden="true" />Все три задачи решены.</p>}
    </aside>
  </div>;
}
