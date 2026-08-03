import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { AnimatedProjectList } from "@/components/animated-project-list";
import { HeroReel } from "@/components/hero-reel";

export default function Home() {
  return (
    <main>
      <HeroReel />

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
