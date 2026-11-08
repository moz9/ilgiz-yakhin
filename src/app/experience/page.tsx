import type { Metadata } from "next";
import { RevealSection } from "@/components/reveal-section";
import { ContactBlock } from "@/components/contact-block";

export const metadata: Metadata = { title: "Опыт", description: "Опыт разработки, автоматизации и эксплуатации ИТ-систем." };

const tracks = [
  { period: "2023 — сейчас", company: "Коммерческая организация", role: "Специалист по ИТ", text: "Поддержка инфраструктуры и бизнес-систем, автоматизация повторяющихся операций, разработка внутренних инструментов и web-продуктов.", points: ["Windows Server, Active Directory, 1С, резервное копирование", "MikroTik и OpenWrt, VPN, маршрутизация и контроль изменений", "Python, PowerShell, PHP, REST API и обработка данных"] },
  { period: "2023", company: "АО «ГК Северавтодор», филиал №4", role: "Инженер по радионавигации, радиолокации и связи II категории", text: "Эксплуатация ГЛОНАСС, локальной сети, рабочих мест, серверов Windows и сетевого оборудования.", points: ["Диагностика аппаратных и программных неисправностей", "Администрирование рабочих мест и серверов", "Сопровождение TRASSIR и интернет-доступа"] },
  { period: "Всегда", company: "Практика, которая идёт через все проекты", role: "Инфраструктура как часть продукта", text: "Не отделяю разработку от запуска: окружение, health checks, журналы, резервные копии и понятный откат входят в определение готовности.", points: ["Health checks и наблюдаемость", "Резервные копии и проверка отката", "Понятный релиз и журнал изменений"] },
];

export default function ExperiencePage() {
  return <main className="page">
    <header className="page-head">
      <div className="page-lights" aria-hidden="true"><i /><i /></div>
      <h1>Опыт</h1>
      <p>Больше трёх лет коммерческой практики в ИТ: от эксплуатации инфраструктуры к разработке продуктов и автоматизации. В портфолио 14 кейсов, от web до Android и Windows.</p>
    </header>
    <RevealSection>
      <ol className="page-section timeline" id="infrastructure">
        {tracks.map((track) => <li key={track.role}>
          <span className="timeline-period">{track.period}</span>
          <div className="timeline-body">
            <p className="timeline-company">{track.company}</p>
            <h2>{track.role}</h2>
            <p>{track.text}</p>
            <ul>{track.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
        </li>)}
      </ol>
    </RevealSection>
    <ContactBlock />
  </main>;
}
