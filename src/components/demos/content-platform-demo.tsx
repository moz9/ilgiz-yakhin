"use client";

import {
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Film,
  Grid2X2,
  Heart,
  List,
  Menu,
  MessageSquareText,
  Newspaper,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Table2,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./content-platform-demo.module.css";

type Surface = "modern" | "editorial";
type Section = "home" | "catalog" | "schedule" | "news" | "detail" | "discover" | "profile" | "ai" | "operations" | "release";
type ViewMode = "grid" | "compact" | "list";

const sections: { id: Section; label: string }[] = [
  { id: "home", label: "Витрина" },
  { id: "catalog", label: "Каталог" },
  { id: "schedule", label: "Расписание" },
  { id: "news", label: "Новости" },
  { id: "detail", label: "Карточка" },
  { id: "discover", label: "Разделы" },
  { id: "profile", label: "Профиль" },
  { id: "ai", label: "AI-подбор" },
  { id: "operations", label: "Контент" },
  { id: "release", label: "Релиз" },
];

const titles = [
  { title: "Северная станция", meta: "Сериал · 8 серий", score: "8.7", image: "/demo-assets/poster-observatory.webp" },
  { title: "Ночной маршрут", meta: "Мини-сериал · 6 серий", score: "8.4", image: "/demo-assets/poster-night-train.webp" },
  { title: "Красный маяк", meta: "Драма · 10 серий", score: "8.1", image: "/demo-assets/poster-beacon.webp" },
  { title: "Перевал", meta: "Фильм · 2026", score: "7.9", image: "/demo-assets/poster-passage.webp" },
  { title: "Контур сигнала", meta: "Триллер · 12 серий", score: "8.3", image: "/demo-assets/poster-signal.webp" },
  { title: "Тихая орбита", meta: "Фантастика · 9 серий", score: "8.0", image: "/demo-assets/stream-hero.webp" },
  { title: "Последний рейс", meta: "Драма · 2026", score: "7.8", image: "/demo-assets/poster-night-train.webp" },
];

function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return <strong className={`${styles.wordmark} ${inverse ? styles.inverse : ""}`}>Media<span>GO</span></strong>;
}

function DemoToolbar({ surface, section, onSurface, onSection }: {
  surface: Surface;
  section: Section;
  onSurface: (surface: Surface) => void;
  onSection: (section: Section) => void;
}) {
  return <header className={styles.demoToolbar}>
    <div><span>ANONYMIZED PRODUCT RECONSTRUCTION</span><strong>DLE CMS · две темы · плагины · content operations</strong></div>
    <div className={styles.surfaceSwitch} aria-label="Выбор интерфейса">
      <button className={surface === "modern" ? styles.active : ""} onClick={() => onSurface("modern")} type="button">Modern UI</button>
      <button className={surface === "editorial" ? styles.active : ""} onClick={() => onSurface("editorial")} type="button">Editorial UI</button>
    </div>
    <nav aria-label="Разделы демонстрации">{sections.map((item) => <button className={section === item.id ? styles.active : ""} key={item.id} onClick={() => onSection(item.id)} type="button">{item.label}</button>)}</nav>
  </header>;
}

function ModernHeader() {
  return <header className={styles.modernHeader}>
    <Wordmark />
    <nav><button>Жанр <ChevronDown /></button><button>Тип <ChevronDown /></button><button>Статус <ChevronDown /></button><button>Подборки</button><button>Новости</button></nav>
    <label><input aria-label="Поиск" placeholder="Поиск" /><Search /></label>
    <button className={styles.aiButton}>ИИ</button><button aria-label="Профиль"><CircleUserRound /></button><button className={styles.mobileMenu} aria-label="Меню"><Menu /></button>
  </header>;
}

function ModernBottomNav() {
  return <nav className={styles.modernBottomNav} aria-label="Мобильная навигация"><button className={styles.active}><Film />Главная</button><button><CalendarDays />Расписание</button><button><CircleUserRound />Войти</button><button><Menu />Меню</button></nav>;
}

function PosterShelf({ compact = false, onOpen }: { compact?: boolean; onOpen: () => void }) {
  return <div className={`${styles.posterShelf} ${compact ? styles.compactShelf : ""}`}>{titles.map((item, index) => <button key={item.title} onClick={onOpen} type="button"><div><Image src={item.image} alt="" fill sizes="(max-width: 720px) 42vw, 15vw" /><span>{index < 2 ? "NEW" : item.score}</span></div><strong>{item.title}</strong><small>{item.meta}</small></button>)}</div>;
}

function ModernHome({ onOpen }: { onOpen: (section: Section) => void }) {
  const [view, setView] = useState<ViewMode>("list");
  return <div className={styles.modernPage}>
    <ModernHeader />
    <main className={styles.modernContent}>
      <div className={styles.modernIntro}><span>MEDIA CATALOG / DLE CMS</span><h1>Смотреть фильмы и сериалы онлайн в хорошем качестве</h1><p>Каталог, расписание выпусков, редакционные материалы и персональные списки в одной витрине.</p></div>
      <section className={styles.glassPanel}>
        <header><div><Sparkles /><h2>Новинки сезона</h2></div><button onClick={() => onOpen("catalog")}>Все новинки <ArrowRight /></button></header>
        <PosterShelf onOpen={() => onOpen("detail")} />
      </section>
      <section className={styles.glassPanel}>
        <header><div><RefreshCw /><h2>Обновления каталога</h2></div><div className={styles.viewSwitch}><button className={view === "grid" ? styles.active : ""} onClick={() => setView("grid")} aria-label="Сетка"><Grid2X2 /></button><button className={view === "compact" ? styles.active : ""} onClick={() => setView("compact")} aria-label="Компактно"><Table2 /></button><button className={view === "list" ? styles.active : ""} onClick={() => setView("list")} aria-label="Список"><List /></button></div></header>
        {view === "list" ? <div className={styles.updateList}>{titles.slice(0, 7).map((item, index) => <button key={item.title} onClick={() => onOpen("detail")}><Image src={item.image} alt="" width={42} height={56} /><span><strong>{item.title}</strong><small>{item.meta}</small></span><i>{index + 1} сезон · {index + 3} серия</i><ChevronRight /></button>)}</div> : <PosterShelf compact={view === "compact"} onOpen={() => onOpen("detail")} />}
      </section>
      <section className={`${styles.glassPanel} ${styles.newsModule}`}><header><div><Newspaper /><h2>Новости и редакционные материалы</h2></div><button onClick={() => onOpen("news")}>Все новости <ArrowRight /></button></header><div><button className={styles.newsLead} onClick={() => onOpen("news")}><Image src="/demo-assets/stream-hero.webp" alt="" fill sizes="55vw" /><span>РЕДАКЦИЯ / СЕГОДНЯ</span><strong>Как устроен новый сезон: даты, продолжения и главные премьеры</strong><p>Большой материал объединяет факты, связанные карточки и быстрые переходы в каталог.</p></button><div className={styles.newsList}>{["Обновлён график премьер на неделю", "Пять коротких историй для вечернего просмотра", "Новые коллекции по жанрам и настроению", "Что изменилось в каталоге за месяц"].map((item,index)=><button key={item} onClick={() => onOpen("news")}><span>0{index+1}</span><strong>{item}</strong><small>{index+2} августа · 6 мин</small></button>)}</div></div></section>
      <section className={styles.modernDirectory}><article><span>ПО ФОРМАТУ</span><h3>Сериалы, фильмы и специальные выпуски</h3><div><button>Сериалы</button><button>Фильмы</button><button>Мини-сериалы</button></div></article><article><span>ПО СОСТОЯНИЮ</span><h3>Премьеры, продолжающиеся и завершённые</h3><div><button>Новинки</button><button>Выходит сейчас</button><button>Завершено</button></div></article><article><span>СООБЩЕСТВО</span><h3>Топ, подборки, персоны и комментарии</h3><div><button onClick={() => onOpen("discover")}>Топ 100</button><button onClick={() => onOpen("discover")}>Подборки</button><button onClick={() => onOpen("profile")}>Мои списки</button></div></article></section>
    </main>
    <ModernBottomNav />
  </div>;
}

function EditorialHeader() {
  return <header className={styles.editorialHeader}><div><Wordmark inverse /><small>ФИЛЬМЫ И СЕРИАЛЫ ОНЛАЙН</small></div><nav><button>Расписание</button><button>Популярное</button><button>Подборки</button><button>Новости</button><button>Каталог <ChevronDown /></button></nav><button aria-label="Поиск"><Search /></button><button><CircleUserRound /> Войти</button><button className={styles.editorialMenu} aria-label="Меню"><Menu /></button></header>;
}

function EditorialHome({ onOpen }: { onOpen: (section: Section) => void }) {
  return <div className={styles.editorialPage}>
    <EditorialHeader />
    <main>
      <section className={styles.editorialHero}><Image src="/demo-assets/stream-hero.webp" alt="Нейтральный кадр технологического сериала" fill priority sizes="100vw" /><div /><span>ПРЕМЬЕРА / ТРИЛЛЕР / ДРАМА</span><h1>СЕВЕРНАЯ<br />СТАНЦИЯ</h1><strong>НОВЫЙ СЕЗОН УЖЕ В КАТАЛОГЕ</strong><p>Команда удалённой обсерватории получает сигнал, который меняет ход обычного ночного дежурства.</p><button onClick={() => onOpen("detail")}><Play /> Смотреть</button></section>
      <div className={styles.seasonTiles}><button><Sparkles /><span><strong>Весна 2026</strong><small>свежие премьеры и продолжения</small></span></button><button><Star /><span><strong>Лето 2026</strong><small>новые проекты сезона</small></span></button></div>
      <section className={styles.editorialDashboard}><div><header><span>01 / СЕЗОННЫЙ КАТАЛОГ</span><h2>Премьеры и продолжения</h2><div><button className={styles.active}>Сегодня</button><button>Сейчас выходит</button><button>Завершено</button></div></header><PosterShelf onOpen={() => onOpen("detail")} /><section className={styles.editorialFeature}><Image src="/demo-assets/stream-hero.webp" alt="" fill sizes="60vw" /><div><span>РЕДАКЦИОННЫЙ ВЫБОР</span><h3>Северная станция</h3><p>Карточка связывает расписание, рейтинги, эпизоды, комментарии и похожие материалы.</p><button onClick={() => onOpen("detail")}><Play /> Открыть карточку</button></div></section></div><aside><header><RefreshCw /><h3>Обновления</h3></header>{titles.slice(0,6).map((item,index)=><button key={item.title} onClick={() => onOpen("detail")}><Image src={item.image} alt="" width={52} height={68}/><span><strong>{item.title}</strong><small>{index+1} сезон · {index+2} серия</small><i>{12+index}:2{index}</i></span></button>)}<button className={styles.editorialAsideLink} onClick={() => onOpen("schedule")}>Открыть расписание <ArrowRight /></button></aside></section>
      <section className={styles.editorialCatalog}><header><div><span>02</span><h2>Каталог по сезонам</h2></div><button onClick={() => onOpen("catalog")}>Весь каталог <ArrowRight /></button></header><PosterShelf onOpen={() => onOpen("detail")} /></section>
      <section className={styles.editorialRows}><article><span>НОВОСТИ</span><h3>Обновления каталога и редакционные материалы</h3><p>Карточки, график выхода, подборки и новости собраны в одном информационном пространстве.</p></article><article><span>РАСПИСАНИЕ</span><h3>Премьеры по дням недели</h3><p>Отдельный маршрут с фильтрами, статусами и быстрым переходом к карточке.</p></article><article><span>ПОДБОРКИ</span><h3>Жанры, сезоны и пользовательские списки</h3><p>Плотная архитектура помогает работать с большим каталогом без бесконечного hero-экрана.</p></article></section>
    </main>
  </div>;
}

function Catalog({ surface, onOpen }: { surface: Surface; onOpen: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => titles.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={styles.catalogPage}><header><div><span>CATALOG / 2026</span><h1>Каталог</h1><p>Фильтры, статусы, сезоны и несколько режимов карточек.</p></div><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или жанр" /></label></header><div className={styles.catalogFilters}><button className={styles.active}>Все</button><button>Сериалы</button><button>Фильмы</button><button>Онгоинги</button><button>Завершённые</button><span>{filtered.length} материалов</span></div><div className={styles.catalogGrid}>{filtered.map((item) => <button key={item.title} onClick={onOpen}><div><Image src={item.image} alt="" fill sizes="(max-width: 720px) 44vw, 18vw" /><span>{item.score}</span></div><strong>{item.title}</strong><small>{item.meta}</small></button>)}</div></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function Schedule({ surface, onOpen }: { surface: Surface; onOpen: () => void }) {
  const [day, setDay] = useState(1);
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={`${styles.subPage} ${surface === "editorial" ? styles.editorialSubPage : ""}`}><header><div><span>SCHEDULE / DLE CONTENT</span><h1>Расписание выпусков</h1><p>Дни недели, ожидаемая серия, статус и быстрый переход к карточке материала.</p></div><div className={styles.viewSwitch}><button className={styles.active}><Grid2X2 /></button><button><Table2 /></button><button><List /></button></div></header><div className={styles.daySwitch}>{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((label,index)=><button className={day===index?styles.active:""} onClick={()=>setDay(index)} key={label}><strong>{label}</strong><small>{index+3} авг</small></button>)}</div><div className={styles.scheduleGrid}>{titles.slice(0,surface === "modern" ? 7 : 10).map((item,index)=><button key={`${item.title}-${index}`} onClick={onOpen}><div><Image src={item.image} alt="" fill sizes="18vw"/><span>{index+4} серий</span><b>{item.score}</b></div><strong>{item.title}</strong><small>2026 · сериал · {index%2?"завершён":"выходит"}</small><i>Следующая серия: {14+index}:2{index}</i></button>)}</div><section className={styles.scheduleNote}><h2>{surface === "modern" ? "Как читать расписание" : "Как пользоваться расписанием"}</h2><p>Дата берётся из карточки и обновляется вместе с каталожными полями. Если точного времени пока нет, материал остаётся в выбранном дне недели без выдуманной даты.</p><div><button>Премьеры</button><button>Сейчас выходит</button><button>Популярное</button><button>Лето 2026</button></div></section></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function News({ surface, onOpen }: { surface: Surface; onOpen: () => void }) {
  const stories = ["График главных премьер следующего месяца", "Большое обновление сезонного каталога", "Пять коротких историй для одного вечера", "Новые подборки по жанрам и настроению", "Как работает порядок просмотра франшизы", "Что пользователи чаще всего добавляют в списки"];
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={`${styles.subPage} ${styles.newsPage} ${surface === "editorial" ? styles.editorialSubPage : ""}`}><header><div><span>EDITORIAL / NEWS MANAGER</span><h1>Новости и материалы</h1><p>Редакционная лента, связанные карточки и отдельная страница публикации.</p></div></header><section className={styles.newsHero}><Image src="/demo-assets/stream-hero.webp" alt="" fill sizes="70vw"/><div/><article><span>ГЛАВНЫЙ МАТЕРИАЛ</span><h2>Премьеры сезона: даты, продолжения и новые истории</h2><p>Факты, иллюстрации, SEO-поля и связи с каталогом проходят отдельный редакционный контур.</p><button onClick={onOpen}>Читать материал <ArrowRight/></button></article></section><div className={styles.newsArchive}>{stories.map((story,index)=><article key={story}><div><Image src={titles[index].image} alt="" fill sizes="28vw"/><span>{index%2?"ГИД":"НОВОСТЬ"}</span></div><small>{index+1} августа 2026 · {4+index} мин</small><h2>{story}</h2><p>Краткий анонс материала, связанного с каталогом, расписанием и пользовательскими коллекциями.</p><button onClick={onOpen}>Открыть <ArrowRight/></button></article>)}</div></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function Discover({ surface, onOpen }: { surface: Surface; onOpen: () => void }) {
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={`${styles.subPage} ${styles.discoverPage} ${surface === "editorial" ? styles.editorialSubPage : ""}`}><header><div><span>DISCOVERY / INDEXES</span><h1>Подборки, топ и персоны</h1><p>Несколько самостоятельных маршрутов помогают исследовать большой каталог без единственного поискового поля.</p></div></header><section className={styles.collectionBand}><article><span>COLLECTION 01</span><h2>Короткие истории на вечер</h2><p>Материалы до восьми эпизодов с завершённым сюжетом.</p><PosterShelf compact onOpen={onOpen}/></article><article><span>COLLECTION 02</span><h2>Технологические триллеры</h2><p>Расследования, сигналы и научные станции.</p><PosterShelf compact onOpen={onOpen}/></article></section><section className={styles.topHundred}><header><div><span>TOP 100</span><h2>Рейтинг каталога</h2></div><strong>Обновляется по оценкам</strong></header>{titles.slice(0,7).map((item,index)=><button key={item.title} onClick={onOpen}><b>{String(index+1).padStart(2,"0")}</b><Image src={item.image} alt="" width={52} height={68}/><span><strong>{item.title}</strong><small>{item.meta}</small></span><i><Star/> {item.score}</i></button>)}</section><section className={styles.peopleIndex}><article><span>ПЕРСОНАЖИ</span><h3>Карточки героев и связи между материалами</h3><button>Открыть индекс <ArrowRight/></button></article><article><span>ПЕРСОНЫ</span><h3>Авторы, режиссёры, актёры и творческие команды</h3><button>Открыть индекс <ArrowRight/></button></article><article><span>КОММЕНТАРИИ</span><h3>Последние обсуждения и отзывы сообщества</h3><button>Открыть ленту <ArrowRight/></button></article></section></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function Profile({ surface, onOpen }: { surface: Surface; onOpen: () => void }) {
  const [tab,setTab]=useState("Смотрю");
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={`${styles.subPage} ${styles.profilePage} ${surface === "editorial" ? styles.editorialSubPage : ""}`}><header><div><span>ACCOUNT / PERSONALIZATION</span><h1>Моя библиотека</h1><p>Списки, история, оценки, подписки на новые эпизоды и уведомления.</p></div><CircleUserRound/></header><div className={styles.profileStats}><article><strong>18</strong><span>Смотрю</span></article><article><strong>42</strong><span>Запланировано</span></article><article><strong>67</strong><span>Завершено</span></article><article><strong>12</strong><span>Подписки</span></article></div><div className={styles.profileLayout}><section><nav>{["Смотрю","Запланировано","История","Оценки"].map(item=><button className={tab===item?styles.active:""} onClick={()=>setTab(item)} key={item}>{item}</button>)}</nav>{titles.slice(0,5).map((item,index)=><button className={styles.profileEntry} key={item.title} onClick={onOpen}><Image src={item.image} alt="" width={64} height={84}/><span><strong>{item.title}</strong><small>{item.meta}</small><i><b style={{width:`${25+index*14}%`}}/></i></span><em>{index+2}/{index+8}</em><ChevronRight/></button>)}</section><aside><header><Bell/><h2>Уведомления</h2></header>{["Вышел новый эпизод «Северной станции»", "Обновлена дата следующей серии", "Добавлена новая озвучка", "Материал из списка появился в расписании"].map((item,index)=><article key={item}><span className={index===0?styles.active:""}/><div><strong>{item}</strong><small>{index+1} ч назад</small></div></article>)}</aside></div></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function Detail({ surface }: { surface: Surface }) {
  const [followed, setFollowed] = useState(false);
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={`${styles.detailPage} ${surface === "editorial" ? styles.editorialDetail : ""}`}><section className={styles.detailCard}><div className={styles.detailPoster}><Image src="/demo-assets/poster-observatory.webp" alt="Постер вымышленного сериала Северная станция" fill sizes="340px" /><button><Play/> Смотреть</button></div><div className={styles.detailCopy}><span>ПРЕМЬЕРА · СЕРИАЛ · ТРИЛЛЕР</span><h1>Северная станция</h1><p>Другие названия: Northern Station · Signal Observatory</p><div className={styles.ratingRow}><b><Star /> 8.7</b><b>IM 8.4</b><b>КП 8.1</b></div><div className={styles.metaTable}><span>Год<strong>2026</strong></span><span>Тип<strong>Сериал</strong></span><span>Эпизоды<strong>5 / 8</strong></span><span>Статус<strong>Выходит</strong></span><span>Жанры<strong>Триллер, драма</strong></span><span>Студия<strong>Northline</strong></span></div><small>На удалённой научной станции фиксируют неизвестный сигнал. Команда пытается сохранить связь и понять, почему данные меняются после каждой передачи.</small><div className={styles.detailActions}><button><Play /> Смотреть</button><button onClick={() => setFollowed((value) => !value)}><Bell /> {followed ? "Уведомление включено" : "Сообщить о новой серии"}</button><button><Heart /> В список</button></div><div className={styles.countdown}><span>Следующая серия выйдет через</span><div><b>03<small>дня</small></b><b>12<small>часов</small></b><b>46<small>минут</small></b><b>08<small>секунд</small></b></div></div></div></section><section className={styles.detailSections}><button>Порядок просмотра</button><button>Эпизоды</button><button>Описание</button><button>Рейтинги</button><button>График</button><button>Персоны</button><button>Медиа</button><button>Комментарии</button></section><section className={styles.descriptionBlock}><header><h2>Описание сюжета</h2><button>Свернуть <ChevronDown/></button></header><p>Тихая смена на северной обсерватории заканчивается после появления неизвестной последовательности. Каждый новый пакет данных меняет журнал предыдущей передачи, а связь с городом становится всё менее надёжной.</p></section><section className={styles.playerBlock}><header><h2>Смотреть онлайн</h2><span>Плеер не работает?</span></header><div><Play/><strong>Демонстрационная область плеера</strong><small>Production-источник не подключён</small></div><footer><button className={styles.active}>Основной</button><button>Альтернативный</button><button>Комната просмотра</button></footer></section><section className={styles.episodes}><header><div><span>ТЕКУЩИЙ ЭПИЗОД</span><h2>Выберите серию</h2></div><strong>Обновлено сегодня</strong></header><div className={styles.episodeFilters}><button className={styles.active}>1 сезон</button><button>2 сезон</button><button>Спецвыпуски</button><button>Порядок просмотра</button></div>{[1, 2, 3, 4].map((episode) => <button key={episode}><span>0{episode}</span><div><strong>{["Ночной сигнал", "Белый шум", "Точка возврата", "За пределами карты"][episode - 1]}</strong><small>48 мин · доступно до 1080p</small></div>{episode < 4 ? <Check /> : <Play />}</button>)}</section><section className={styles.charactersBlock}><header><div><span>PERSONS / CAST</span><h2>Персонажи и команда</h2></div><button>Все персоны <ArrowRight/></button></header><div>{["Мира Орлова","Антон Северин","Лев Громов","Нина Вейль"].map((name,index)=><article key={name}><div>{name.split(" ").map(x=>x[0]).join("")}</div><strong>{name}</strong><small>{index%2?"Инженер связи":"Исследователь"}</small></article>)}</div></section><section className={styles.similarBlock}><header><h2>Похожие материалы</h2><button>Все рекомендации <ArrowRight/></button></header><PosterShelf compact onOpen={()=>{}}/></section><section className={styles.commentsBlock}><header><div><MessageSquareText/><h2>Комментарии</h2></div><strong>24 обсуждения</strong></header><div><CircleUserRound/><span><strong>Оставить комментарий или отзыв</strong><small>Войдите, чтобы участвовать в обсуждении</small></span><Send/></div></section></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function AiSearch({ surface }: { surface: Surface }) {
  const [query, setQuery] = useState("Хочу атмосферный технологический триллер без жестоких сцен");
  const [sent, setSent] = useState(false);
  return <div className={surface === "modern" ? styles.modernPage : styles.editorialPage}>{surface === "modern" ? <ModernHeader /> : <EditorialHeader />}<main className={styles.aiPage}><section className={styles.aiCard}><span>AI-ПОДБОР</span><h1>Опишите, что хотите посмотреть</h1><p>Подбор учитывает каталожные признаки, ваши списки, оценки и историю. Если запрос пока не сформулирован, можно пройти мини-анкету.</p><button className={styles.quizButton}>Не знаете, что выбрать? Ответьте на 5 вопросов <ChevronRight /></button><details><summary>Пресеты <b>+</b></summary><div><button>Короткий сериал на вечер</button><button>Без тяжёлых сцен</button><button>По любимым жанрам</button></div></details><div className={styles.aiMessage}><strong>MEDIA GO AI</strong><p>{sent ? "Подойдут «Северная станция» и «Контур сигнала»: в обоих проектах напряжение строится на расследовании и атмосфере, а не на жестоких сценах." : "Могу подобрать материал под настроение, жанр, длину или просто ваш текущий вкус. Напишите запрос своими словами."}</p></div><form onSubmit={(event) => { event.preventDefault(); setSent(true); }}><textarea value={query} onChange={(event) => { setQuery(event.target.value); setSent(false); }} aria-label="Запрос к AI-подбору" /><button aria-label="Подобрать"><Send /> Подобрать</button></form>{sent && <div className={styles.aiResults}>{titles.slice(0, 2).map((item) => <article key={item.title}><Image src={item.image} alt="" width={62} height={84} /><div><strong>{item.title}</strong><small>{item.meta}</small><span>Совпадение по запросу</span></div></article>)}</div>}<small className={styles.aiBoundary}>Пользовательский smart search. Серверный OmniRoute-конвейер редакции показан отдельно.</small></section></main>{surface === "modern" && <ModernBottomNav />}</div>;
}

function Operations() {
  const [running, setRunning] = useState(false);
  return <main className={styles.opsPage}><header><div><span>CONTENT OPERATIONS / VERIFIED SCOPE</span><h1>Каталог и редакция</h1><p>Два независимых контура: пользовательский smart search не выдается за серверный AI Contentmaker.</p></div><button onClick={() => setRunning((value) => !value)}><RefreshCw className={running ? styles.spin : ""} /> {running ? "Обработка" : "Показать цикл"}</button></header><div className={styles.opsLanes}><section><div><Workflow /><span>CATALOG PARSER</span><strong>bounded queue</strong></div><h2>Карточки и эпизоды</h2><p>Получение → нормализация → сопоставление → дополнительные поля → проверка.</p>{["Метаданные и версии", "Эпизоды и озвучки", "Постеры и media fields", "Дубли и журнал"].map((item, index) => <article className={running && index <= 2 ? styles.processing : ""} key={item}><span>0{index + 1}</span><strong>{item}</strong><i>{running && index === 2 ? "processing" : "validated"}</i></article>)}</section><section><div><Bot /><span>AI CONTENTMAKER</span><strong>OmniRoute</strong></div><h2>Новости и карточки</h2><p>Этапные модели готовят факты, черновик, русификацию и проверку риска. Проблема провайдера не разрешает скрытый fallback.</p>{["Fact pack", "Draft + language cleanup", "Duplicate / risk review", "Human decision + outbox"].map((item, index) => <article className={running && index <= 2 ? styles.processing : ""} key={item}><span>0{index + 1}</span><strong>{item}</strong><i>{index === 3 ? "human gate" : "checked"}</i></article>)}</section></div><div className={styles.opsProof}><article><strong>2</strong><span>production themes</span></article><article><strong>155</strong><span>staging plugin rules</span></article><article><strong>0</strong><span>compile / PHP errors</span></article><article><strong>backup</strong><span>before every release</span></article></div></main>;
}

function Release() {
  return <main className={styles.releasePage}><header><span>PRODUCTION ENGINEERING</span><h1>Изменения без ручной перезаписи production</h1><p>Шаблоны, route-specific CSS, плагины и обработчики проходят один контролируемый путь.</p></header><div className={styles.releaseGrid}><section><ShieldCheck /><span>RELEASE CANDIDATE</span><h2>TPL + plugins + runtime</h2><p>Кандидат собирается из проверенного состояния и не переключается, если исходные хэши уже изменились.</p><ul><li><Check /> Syntax и plugin rules</li><li><Check /> Expected source hashes</li><li><Check /> Public routes и cache</li><li><Check /> Prepared rollback</li></ul></section><div>{["Снять точный snapshot и backup", "Сверить исходные хэши и блокировки", "Проверить PHP, шаблоны и правила плагинов", "Применить точечную атомарную замену", "Проверить HTTP, cache, UI и журналы", "Наблюдать или вернуть предыдущую версию"].map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><i /><strong>{item}</strong><small>{index < 5 ? "required" : "rollback ready"}</small></article>)}</div></div><footer><Newspaper /><span>AI-публикация и обычный web-релиз имеют разные допуски, но одинаково требуют наблюдаемого результата.</span><MessageSquareText /><strong>Telegram outbox проверяется отдельно от факта публикации.</strong></footer></main>;
}

export function ContentPlatformDemo() {
  const [surface, setSurface] = useState<Surface>("modern");
  const [section, setSection] = useState<Section>("home");
  return <div className={styles.demo}><DemoToolbar surface={surface} section={section} onSurface={setSurface} onSection={setSection} /><div className={styles.stage} data-testid="content-demo-stage">{section === "home" && (surface === "modern" ? <ModernHome onOpen={setSection} /> : <EditorialHome onOpen={setSection} />)}{section === "catalog" && <Catalog surface={surface} onOpen={() => setSection("detail")} />}{section === "schedule" && <Schedule surface={surface} onOpen={() => setSection("detail")} />}{section === "news" && <News surface={surface} onOpen={() => setSection("detail")} />}{section === "detail" && <Detail surface={surface} />}{section === "discover" && <Discover surface={surface} onOpen={() => setSection("detail")} />}{section === "profile" && <Profile surface={surface} onOpen={() => setSection("detail")} />}{section === "ai" && <AiSearch surface={surface} />}{section === "operations" && <Operations />}{section === "release" && <Release />}</div><footer className={styles.demoFooter}><span>Обезличенная реконструкция реальных интерфейсов и подтвержденных технических контуров</span><strong>Нейтральный каталог · синтетические данные · без production-подключения</strong></footer></div>;
}
