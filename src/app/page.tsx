import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AnimatedProjectList } from "@/components/animated-project-list";
import { HeroReel } from "@/components/hero-reel";
import { Workbench } from "@/components/workbench";
import { RevealSection } from "@/components/reveal-section";
import { DeliveryRail } from "@/components/delivery-rail";
import { getProject } from "@/lib/projects";
import { GlassLayer } from "@/components/glass-layer";

export default function Home() {
  return <main className="redesign-home">
    <HeroReel />
    <AnimatedProjectList />
    <RevealSection><Workbench /></RevealSection>
    <section className="redesign-pipeline" id="approach" aria-labelledby="pipeline-title">
      <div className="redesign-pipeline-heading">
        <span className="section-kicker redesign-mono">Полный цикл / 06</span>
        <h2 id="pipeline-title">До production<br /><span>и дальше.</span></h2>
        <p>Разработка не заканчивается на интерфейсе: важны данные, проверки, запуск и возможность восстановить работу.</p>
        <Link href="/how-built">Как я разрабатываю <ArrowUpRight aria-hidden="true" /></Link>
      </div>
      <DeliveryRail />
    </section>
    <section className="redesign-experience" aria-labelledby="experience-title">
      <h2 id="experience-title">Опыт</h2>
      <div>
        <p><span>2023 — сейчас</span><strong>Специалист по ИТ</strong><em>Инфраструктура, автоматизация, внутренние инструменты и web-продукты.</em></p>
        <p><span>2023</span><strong>Инженер по радионавигации и связи</strong><em>Системы связи, локальная сеть и серверы.</em></p>
        <Link href="/experience">Подробнее об опыте <ArrowUpRight aria-hidden="true" /></Link>
      </div>
    </section>
    <section className="redesign-contact" id="contact" aria-labelledby="contact-title">
      <div className="contact-projects" aria-hidden="true">{["chessrise", "pioner", "revalib"].map((slug) => <Image key={slug} src={getProject(slug)!.cover} alt="" width={720} height={450} sizes="(max-width: 860px) 75vw, 440px" />)}</div>
      <span className="section-kicker redesign-mono">Открыт к удалённой работе</span>
      <h2 id="contact-title">Обсудим<br /><span>проект?</span></h2>
      <div><a className="contact-link liquid-surface" href="mailto:im@angelius.ru"><GlassLayer /><span>im@angelius.ru</span><ArrowUpRight aria-hidden="true" /></a></div>
    </section>
  </main>;
}
