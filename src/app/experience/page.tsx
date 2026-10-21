import type { Metadata } from "next";
import { RevealSection } from "@/components/reveal-section";
import { FieldBackdrop } from "@/components/field-backdrop";

export const metadata: Metadata = { title: "Опыт", description: "Опыт разработки, автоматизации и эксплуатации ИТ-систем." };

const tracks = [
  { period: "2023 — сейчас", company: "Коммерческая организация", role: "Специалист по ИТ", text: "Поддержка инфраструктуры и бизнес-систем, автоматизация повторяющихся операций, разработка внутренних инструментов и web-продуктов.", points: ["Windows Server, Active Directory, 1С, резервное копирование", "MikroTik/OpenWrt, VPN, маршрутизация и контроль изменений", "Python, PowerShell, PHP, REST API и обработка данных"] },
  { period: "2023", company: "АО «ГК Северавтодор», филиал №4", role: "Инженер по радионавигации, радиолокации и связи II категории", text: "Эксплуатация ГЛОНАСС, локальной сети, рабочих мест, серверов Windows и сетевого оборудования.", points: ["Диагностика аппаратных и программных неисправностей", "Администрирование рабочих мест и серверов", "Сопровождение TRASSIR и интернет-доступа"] },
];

const stats = [
  { number: "01", value: "3+", label: "года коммерческой практики в ИТ и инфраструктуре" },
  { number: "02", value: "14", label: "кейсов в портфолио: web, desktop, mobile, автоматизация" },
  { number: "03", value: "6", label: "направлений: интерфейсы, данные, инфраструктура, AI-контур" },
];

export default function ExperiencePage() {
  return (
    <main className="inner-page experience-page">
      <FieldBackdrop tone="teal" />
      <section className="page-hero">
        <div className="eyebrow"><span>EXPERIENCE</span><span>ИТ + разработка</span></div>
        <h1>Опыт</h1>
        <p>Практический путь от эксплуатации инфраструктуры к разработке продуктов и автоматизации рабочих процессов.</p>
      </section>
      <RevealSection>
        <section className="section experience-stats">
          {stats.map((stat) => (
            <div className="exp-stat" key={stat.number} data-spotlight>
              <span>{stat.number}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          ))}
        </section>
      </RevealSection>
      <RevealSection>
        <section className="section exp-timeline">
          {tracks.map((track) => (
            <article className="exp-card" key={track.period} data-spotlight>
              <div className="exp-period">{track.period}</div>
              <div className="exp-body">
                <p className="kicker">{track.company}</p>
                <h2>{track.role}</h2>
                <p>{track.text}</p>
                <ul className="exp-points">{track.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </div>
            </article>
          ))}
          <article className="exp-card" id="infrastructure" data-spotlight>
            <div className="exp-period">Постоянно</div>
            <div className="exp-body">
              <p className="kicker">Production practice</p>
              <h2>Инфраструктура как часть продукта</h2>
              <p>Не отделяю разработку от запуска: конфигурация окружения, health checks, журналы, резервные копии и понятный rollback входят в определение готовности.</p>
              <ul className="exp-points">
                <li>Health checks и наблюдаемость</li>
                <li>Резервные копии и проверка отката</li>
                <li>Понятный release и журнал изменений</li>
              </ul>
            </div>
          </article>
        </section>
      </RevealSection>
    </main>
  );
}
