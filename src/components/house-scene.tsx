"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const rooms = [
  { label: "Проекты", detail: "6 проверяемых кейсов", href: "/projects", position: "room-work" },
  { label: "Full-stack", detail: "Web и backend", href: "/projects/lunafantasy", position: "room-gallery" },
  { label: "Автоматизация", detail: "Internal tools", href: "/projects/worktime-reporting", position: "room-lab" },
  { label: "Desktop", detail: "Electron и Windows", href: "/projects/infrastructure-inventory", position: "room-tools" },
  { label: "Infrastructure", detail: "CI, releases, recovery", href: "/experience#infrastructure", position: "room-infra" },
  { label: "Резюме", detail: "Опыт и контакты", href: "/resume", position: "room-resume" },
];

export function HouseScene() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div className="house-stage" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div className="house-image" animate={reduceMotion ? undefined : { y: [0, -5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
        <Image src="https://raw.githubusercontent.com/moz9/ilgiz-yakhin/main/public/images/portfolio-house.webp" alt="Архитектурный разрез дома с зонами проектов, автоматизации, desktop-разработки, инфраструктуры и резюме" fill sizes="(max-width: 900px) 100vw, 75vw" priority unoptimized />
      </motion.div>
      <nav className="room-hotspots" aria-label="Зоны портфолио">
        {rooms.map((room, index) => (
          <motion.div key={room.href} className={`room-hotspot ${room.position}`} initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + index * 0.07 }}>
            <Link href={room.href}>
              <span>{room.label}</span>
              <small>{room.detail}</small>
            </Link>
          </motion.div>
        ))}
      </nav>
    </motion.div>
  );
}
