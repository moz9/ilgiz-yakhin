import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { FeaturedWork } from "@/components/home/featured-work";
import { SkillBand } from "@/components/home/skill-band";
import { MoreWork } from "@/components/home/more-work";
import { Workbench } from "@/components/workbench";
import { DeliveryRail } from "@/components/delivery-rail";
import { RevealSection } from "@/components/reveal-section";
import { ContactBlock } from "@/components/contact-block";
import { otherProjects } from "@/lib/featured";

export default function Home() {
  return <main className="home">
    <Hero />
    <SkillBand />
    <FeaturedWork />
    <RevealSection><Workbench /></RevealSection>
    <RevealSection>
      <section className="process" id="approach" aria-labelledby="process-title">
        <div className="process-head">
          <h2 id="process-title">Довожу до продакшена и дальше</h2>
          <p>Интерфейс — только начало. Данные, проверки, запуск и возможность откатиться я считаю частью той же работы.</p>
          <Link className="text-link" href="/how-built">Как устроен этот сайт <ArrowUpRight aria-hidden="true" /></Link>
        </div>
        <DeliveryRail />
      </section>
    </RevealSection>
    <RevealSection><MoreWork projects={otherProjects} /></RevealSection>
    <RevealSection>
      <section className="track" aria-labelledby="track-title">
        <h2 id="track-title">Опыт</h2>
        <ol>
          <li><span>2023 — сейчас</span><strong>Специалист по ИТ</strong><p>Инфраструктура, автоматизация, внутренние инструменты и web-продукты в коммерческой компании.</p></li>
          <li><span>2023</span><strong>Инженер по радионавигации и связи</strong><p>Системы связи, локальная сеть, серверы и рабочие места.</p></li>
        </ol>
        <Link className="text-link" href="/experience">Подробнее об опыте <ArrowUpRight aria-hidden="true" /></Link>
      </section>
    </RevealSection>
    <ContactBlock />
  </main>;
}
