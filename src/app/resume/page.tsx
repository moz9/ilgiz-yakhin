import type { Metadata } from "next";
import { Download, FileText, Mail } from "lucide-react";

export const metadata: Metadata = { title: "Резюме" };

export default function ResumePage() {
  return <main className="inner-page"><section className="page-hero"><div className="eyebrow"><span>RESUME</span><span>Обновлено в 2026</span></div><h1>Резюме</h1><p>Компактная версия для быстрого просмотра и расширенная — с дополнительным техническим контекстом.</p></section><section className="section resume-grid"><article><div className="document-preview compact-document"><FileText aria-hidden="true" /><span>01</span><strong>КОМПАКТНОЕ</strong><small>1 страница</small></div><h2>Основное за минуту</h2><p>Профиль, опыт, образование, ключевой стек и практические результаты.</p><a className="button button-primary" href="/resume/ilgiz-yakhin-compact.pdf" download><Download aria-hidden="true" /> Скачать PDF</a></article><article><div className="document-preview extended-document"><FileText aria-hidden="true" /><span>02</span><strong>РАСШИРЕННОЕ</strong><small>2 страницы</small></div><h2>Больше технического контекста</h2><p>Расширенные навыки, практика, инструменты и опыт эксплуатации.</p><a className="button button-primary" href="/resume/ilgiz-yakhin-extended.pdf" download><Download aria-hidden="true" /> Скачать PDF</a></article></section><section className="section resume-contact"><Mail aria-hidden="true" /><div><p className="kicker">Прямой контакт</p><h2>im@angelius.ru</h2></div><a className="button button-ghost" href="mailto:im@angelius.ru">Написать</a></section></main>;
}
