import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, Download } from "lucide-react";

const fragments = [
  { className: "cover-fragment cover-fragment-chess", src: "/cases/chessrise.webp", alt: "Фрагмент интерфейса ChessRise" },
  { className: "cover-fragment cover-fragment-pioner", src: "/cases/pioner.webp", alt: "Фрагмент сайта ТРЦ Пионер" },
  { className: "cover-fragment cover-fragment-worktime", src: "/cases/worktime.webp", alt: "Фрагмент программы подготовки отчетности" },
  { className: "cover-fragment cover-fragment-sysinvent", src: "/cases/sysinvent.webp", alt: "Фрагмент системы учета инфраструктуры" },
] as const;

export function HeroReel() {
  return (
    <section className="liquid-cover" aria-labelledby="hero-title">
      <div className="cover-grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>

      <div className="cover-fragments" aria-hidden="true">
        {fragments.map((fragment, index) => (
          <div className={fragment.className} key={fragment.src}>
            <Image src={fragment.src} alt={fragment.alt} fill sizes="(max-width: 760px) 42vw, 24vw" priority={index < 2} />
          </div>
        ))}
      </div>

      <div className="cover-copy">
        <p className="cover-kicker">
          Portfolio / 2026
        </p>
        <h1 id="hero-title">
          <span>ILGIZ</span>
          <span>YAKHIN</span>
        </h1>
        <p className="cover-role">
          Full-stack / AI-разработчик
        </p>
      </div>

      <div className="cover-actions glass-surface">
        <Link href="#projects">Смотреть проекты <ArrowDownRight aria-hidden="true" /></Link>
        <a href="/resume/ilgiz-yakhin-compact.pdf" download>Резюме <Download aria-hidden="true" /></a>
      </div>
    </section>
  );
}
