import { ArrowDown, ArrowRight, Download, Mail } from "lucide-react";
import Link from "next/link";
import { AnimatedProjectList } from "@/components/animated-project-list";

export default function Home() {
  return (
    <main>
      <section className="portfolio-hero" aria-labelledby="hero-title">
        <div className="portfolio-hero-meta"><span>Портфолио · 2026</span><span>Барнаул · удаленно</span></div>
        <div className="portfolio-hero-title">
          <h1 id="hero-title"><span>ILGIZ</span><span>YAKHIN</span></h1>
          <p>Full-stack<br />AI-разработчик</p>
        </div>
        <div className="portfolio-hero-bottom">
          <p>Web-продукты, desktop-приложения,<br />автоматизация и инфраструктура.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#projects">Проекты <ArrowDown aria-hidden="true" /></a>
            <a className="button button-ghost" href="/resume/ilgiz-yakhin-compact.pdf" download>Резюме <Download aria-hidden="true" /></a>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true"><div>Next.js · React · TypeScript · Python · PostgreSQL · Electron · Docker · CI/CD · Next.js · React · TypeScript · Python · PostgreSQL · Electron · Docker · CI/CD ·</div></div>
      </section>

      <AnimatedProjectList />

      <section className="home-contact" aria-labelledby="contact-title">
        <div><p>Открыт к удаленной работе</p><h2 id="contact-title">Связаться</h2></div>
        <div className="home-contact-links">
          <a href="mailto:im@angelius.ru"><Mail aria-hidden="true" /> im@angelius.ru</a>
          <Link href="/about">Обо мне <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
