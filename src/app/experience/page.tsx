import type { Metadata } from "next";

export const metadata: Metadata = { title: "Опыт", description: "Опыт разработки, автоматизации и эксплуатации ИТ-систем." };

const tracks = [
  { period: "2023 — сейчас", company: "Коммерческая организация", role: "Специалист по ИТ", text: "Поддержка инфраструктуры и бизнес-систем, автоматизация повторяющихся операций, разработка внутренних инструментов и web-продуктов.", points: ["Windows Server, Active Directory, 1С, резервное копирование", "MikroTik/OpenWrt, VPN, маршрутизация и контроль изменений", "Python, PowerShell, PHP, REST API и обработка данных"] },
  { period: "2023", company: "АО «ГК Северавтодор», филиал №4", role: "Инженер по радионавигации, радиолокации и связи II категории", text: "Эксплуатация ГЛОНАСС, локальной сети, рабочих мест, серверов Windows и сетевого оборудования.", points: ["Диагностика аппаратных и программных неисправностей", "Администрирование рабочих мест и серверов", "Сопровождение TRASSIR и интернет-доступа"] },
];

export default function ExperiencePage() {
  return <main className="inner-page"><section className="page-hero"><div className="eyebrow"><span>EXPERIENCE</span><span>ИТ + разработка</span></div><h1>Опыт</h1><p>Практический путь от эксплуатации инфраструктуры к разработке продуктов и автоматизации рабочих процессов.</p></section><section className="section timeline">{tracks.map((track) => <article key={track.period}><div className="timeline-period">{track.period}</div><div><p className="kicker">{track.company}</p><h2>{track.role}</h2><p>{track.text}</p><ul>{track.points.map((point) => <li key={point}>{point}</li>)}</ul></div></article>)}<article id="infrastructure"><div className="timeline-period">Постоянно</div><div><p className="kicker">Production practice</p><h2>Инфраструктура как часть продукта</h2><p>Не отделяю разработку от запуска: конфигурация окружения, health checks, журналы, резервные копии и понятный rollback входят в определение готовности.</p></div></article></section></main>;
}
