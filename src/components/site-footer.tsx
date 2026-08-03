import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><strong>ILGIZ YAKHIN</strong><span>Full-stack / AI-разработчик</span></div>
      <div className="footer-links"><Link href="/how-built">Как создан сайт</Link><a href="mailto:im@angelius.ru">im@angelius.ru</a></div>
      <span>Барнаул · удаленно</span>
    </footer>
  );
}
