"use client";

import {
  ArrowDownToLine,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Download,
  Expand,
  Grid3X3,
  Home,
  ListFilter,
  ListVideo,
  Menu as MenuIcon,
  Monitor,
  MoreHorizontal,
  Newspaper,
  PictureInPicture,
  Play,
  Search,
  Settings,
  SkipForward,
  Smartphone,
  Sparkles,
  Star,
  Tv,
  UserRound,
  Users,
  Volume2,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import styles from "./mobile-tv-demo.module.css";

type Device = "phone" | "tv";
type Screen =
  | "home" | "catalog" | "schedule" | "news" | "search" | "detail" | "player"
  | "downloads" | "favorites" | "rooms" | "profile" | "menu";

/** Разделы приложения повторяют структуру нативного продукта. */
const screens: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "catalog", label: "Каталог", icon: Grid3X3 },
  { id: "schedule", label: "Расписание", icon: CalendarDays },
  { id: "news", label: "Новости", icon: Newspaper },
  { id: "search", label: "Поиск", icon: Search },
  { id: "detail", label: "Карточка", icon: ListFilter },
  { id: "player", label: "Плеер", icon: Play },
  { id: "downloads", label: "Загрузки", icon: Download },
  { id: "favorites", label: "Избранное", icon: Star },
  { id: "rooms", label: "Совместный просмотр", icon: Users },
  { id: "profile", label: "Профиль", icon: UserRound },
  { id: "menu", label: "Меню", icon: MenuIcon },
];

/** Телевизионный рейл: пять основных разделов, остальное — в меню. */
const tvRailItems: Screen[] = ["home", "search", "catalog", "schedule", "favorites"];

const tvMenuItems = [
  "Главная", "Поиск", "Каталог", "Расписание", "Новости", "Настройки",
  "Совместный просмотр", "Избранное", "История", "Загрузки", "Подборки", "Топы",
  "Уведомления", "Сообщения", "Вход", "Меню",
];

const entries = [
  { title: "Северная станция", meta: "Сериал · 8 эпизодов", image: "/demo-assets/poster-observatory.webp", progress: 68 },
  { title: "Красный маяк", meta: "Фильм · 1 ч 52 мин", image: "/demo-assets/poster-beacon.webp", progress: 34 },
  { title: "Ночной маршрут", meta: "Мини-сериал · 6 эпизодов", image: "/demo-assets/poster-night-train.webp", progress: 0 },
  { title: "Контур сигнала", meta: "Триллер · 1 ч 44 мин", image: "/demo-assets/poster-signal.webp", progress: 0 },
];

const releases = [
  { day: "ПН", title: "Первый импульс", time: "20:00", status: "Вышел" },
  { day: "ВТ", title: "Точка приема", time: "20:00", status: "Вышел" },
  { day: "СР", title: "Граница шума", time: "21:30", status: "Ожидается" },
  { day: "ЧТ", title: "Слепая зона", time: "21:30", status: "Скоро" },
  { day: "ПТ", title: "Пятый контур", time: "22:00", status: "Скоро" },
];

const news = [
  { category: "РЕЛИЗ", title: "Сезон «Северной станции» выходит в эфир", date: "12 октября", image: "/demo-assets/poster-observatory.webp" },
  { category: "ИНДУСТРИЯ", title: "Как устроен каталог: от парсера до витрины", date: "9 октября", image: "/demo-assets/poster-signal.webp" },
  { category: "ПОДБОРКИ", title: "Ночной маршрут: пять тайтлов про дорогу", date: "4 октября", image: "/demo-assets/poster-night-train.webp" },
];

const rooms = [
  { title: "Ночной просмотр", people: "4 участника", state: "Идёт" },
  { title: "Северная станция", people: "2 участника", state: "Открыта" },
  { title: "Пятничный слот", people: "—", state: "Ожидает" },
];

function DeviceSwitch({ device, onChange }: { device: Device; onChange: (device: Device) => void }) {
  return <div className={styles.deviceSwitch} aria-label="Форм-фактор"><button type="button" className={device === "phone" ? styles.active : ""} onClick={() => onChange("phone")} aria-pressed={device === "phone"}><Smartphone aria-hidden="true" /> Смартфон</button><button type="button" className={device === "tv" ? styles.active : ""} onClick={() => onChange("tv")} aria-pressed={device === "tv"}><Monitor aria-hidden="true" /> Android TV</button></div>;
}

function PhoneHome({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <>
    <div className={styles.phoneTop}><strong className={styles.mediaMark}>Media<span>GO</span></strong><button type="button" aria-label="Уведомления"><Bell aria-hidden="true" /></button><button type="button" aria-label="Профиль" onClick={() => onOpen("profile")}><UserRound aria-hidden="true" /></button></div>
    <div className={styles.phoneScroll}>
      <div className={styles.phoneSearch}><Search aria-hidden="true" /><span>Быстрый поиск по каталогу</span><button type="button" onClick={() => onOpen("search")}><Sparkles aria-hidden="true" /> ИИ</button></div>
      <div className={styles.phonePageTitle}><div><small>СЕЗОН / 2026</small><h2>Новинки</h2></div><button type="button" onClick={() => onOpen("catalog")}>Все <ChevronRight aria-hidden="true" /></button></div>
      <div className={styles.phoneCards}>{entries.slice(0, 3).map((entry, index) => <button type="button" onClick={() => onOpen("detail")} key={entry.title}><div><Image src={entry.image} alt="" fill sizes="160px" /><span>{index ? entry.progress || "NEW" : "NEW"}</span></div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div>
      <div className={styles.continueTitle}><strong>Продолжить просмотр</strong><button type="button" onClick={() => onOpen("favorites")}>Все</button></div>
      <div className={styles.resultList}>{entries.slice(0, 3).map((entry, index) => <button type="button" key={entry.title} onClick={() => onOpen("detail")}><Image src={entry.image} alt="" width={48} height={60} /><span><strong>{entry.title}</strong><small>{entry.meta}</small></span><b>{index + 1} сезон · {index + 3} серия</b><ChevronRight aria-hidden="true" /></button>)}</div>
    </div>
  </>;
}

function PhoneCatalog({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><Grid3X3 aria-hidden="true" /><h2>Каталог</h2><ListFilter aria-hidden="true" /></div><div className={styles.catalogChips}><button className={styles.active}>Все</button><button>Сериалы</button><button>Фильмы</button><button>Новинки</button></div><div className={styles.phoneCatalogGrid}>{entries.map((entry, index) => <button type="button" key={entry.title} onClick={() => onOpen("detail")}><div><Image src={entry.image} alt="" fill sizes="140px" /><span>{index ? "16+" : "NEW"}</span>{entry.progress > 0 && <i><b style={{ width: `${entry.progress}%` }} /></i>}</div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div></div>;
}

function PhoneSchedule() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><CalendarDays aria-hidden="true" /><h2>Расписание</h2><MoreHorizontal aria-hidden="true" /></div><div className={styles.scheduleDays}>{["ПН", "ВТ", "СР", "ЧТ", "ПТ"].map((day, index) => <button type="button" key={day} className={index === 2 ? styles.active : ""}>{day}</button>)}</div><div className={styles.scheduleList}>{releases.map((release) => <article key={release.day + release.title}><time>{release.day} · {release.time}</time><strong>{release.title}</strong><span className={release.status === "Вышел" ? styles.done : release.status === "Ожидается" ? styles.soon : styles.later}>{release.status}</span></article>)}</div></div>;
}

function PhoneNews() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><Newspaper aria-hidden="true" /><h2>Новости</h2><MoreHorizontal aria-hidden="true" /></div><div className={styles.newsList}>{news.map((item) => <button type="button" key={item.title}><div><Image src={item.image} alt="" fill sizes="110px" /></div><span><small>{item.category} · {item.date}</small><strong>{item.title}</strong></span><ChevronRight aria-hidden="true" /></button>)}</div></div>;
}

function PhoneRooms() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><Users aria-hidden="true" /><h2>Совместный просмотр</h2></div><button type="button" className={styles.roomCreate}><PlusIcon /> Создать комнату</button><div className={styles.roomList}>{rooms.map((room, index) => <article key={room.title} className={index === 0 ? styles.active : ""}><div><strong>{room.title}</strong><small>{room.people}</small></div><span>{room.state}</span></article>)}</div></div>;
}

function PhoneProfile({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><UserRound aria-hidden="true" /><h2>Профиль</h2></div><div className={styles.profileCard}><span>Гость</span><strong>Войдите, чтобы синхронизировать</strong><button type="button" onClick={() => onOpen("menu")}>Вход</button></div><div className={styles.phoneStatRow}><article><strong>18</strong><span>Избранное</span></article><article><strong>6</strong><span>В процессе</span></article><article><strong>24</strong><span>Завершено</span></article></div><div className={styles.profileLinks}>{[["Избранное", "favorites"], ["История", "favorites"], ["Загрузки", "downloads"], ["Сообщения", "rooms"], ["Уведомления", "news"], ["Настройки", "menu"]].map(([label, target]) => <button type="button" key={label} onClick={() => onOpen(target as Screen)}>{label}<ChevronRight aria-hidden="true" /></button>)}</div></div>;
}

function PhoneMenu({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><MenuIcon aria-hidden="true" /><h2>Меню</h2></div><div className={styles.menuGrid}>{[["Топы", "catalog"], ["Подборки", "catalog"], ["Персоны", "detail"], ["Сообщения", "rooms"], ["Уведомления", "news"], ["Настройки", "profile"]].map(([label, target]) => <button type="button" key={label} onClick={() => onOpen(target as Screen)}>{label}</button>)}</div><div className={styles.themeRow}><span>Тема оформления</span><button type="button" className={styles.active}>Системная</button><button type="button">Светлая</button><button type="button">Тёмная</button></div></div>;
}

function PhoneDetail({ onOpen }: { onOpen: (screen: Screen) => void }) {
  const [episode, setEpisode] = useState(3);
  return <div className={styles.phoneScroll}><div className={styles.phoneDetailHero}><Image src="/demo-assets/poster-observatory.webp" alt="Постер вымышленного сериала Северная станция" fill sizes="338px" /><div /><button type="button" aria-label="Назад"><ChevronLeft aria-hidden="true" /></button><span>ПРЕМЬЕРА / 2026</span><h2>Северная станция</h2><p>2026 · 1 сезон · 16+</p></div><div className={styles.phoneDetailBody}><div className={styles.phoneDetailActions}><button type="button" onClick={() => onOpen("player")}><Play aria-hidden="true" /> Смотреть</button><button type="button" onClick={() => onOpen("downloads")}><Download aria-hidden="true" /> Офлайн</button><button type="button" onClick={() => onOpen("favorites")}><Star aria-hidden="true" /> В список</button></div><p>Исследователи ночной обсерватории фиксируют сигнал и пытаются понять его происхождение раньше, чем меняется вся цепочка связи.</p><div className={styles.phoneEpisodeHead}><strong>Эпизоды</strong><button type="button">Сезон 1 <ChevronRight aria-hidden="true" /></button></div><div className={styles.phoneEpisodes}>{[1,2,3,4].map((item) => <button type="button" className={episode === item ? styles.active : ""} onClick={() => setEpisode(item)} key={item}><span>0{item}</span><div><strong>{["Первый импульс","Точка приема","Граница шума","Слепая зона"][item-1]}</strong><small>48 мин · до 1080p</small></div>{item < 3 ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}</button>)}</div></div></div>;
}

function PhonePlayer() {
  const [playing, setPlaying] = useState(true);
  const [quality, setQuality] = useState("1080p");
  return <div className={styles.phonePlayer}><Image src="/demo-assets/stream-hero.webp" alt="Кадр вымышленного сериала Северная станция" fill sizes="338px" /><div className={styles.playerShade} /><div className={styles.playerTop}><button type="button" aria-label="Назад"><ChevronLeft aria-hidden="true" /></button><div><strong>Северная станция</strong><small>Сезон 1 · Серия 3</small></div><button type="button" aria-label="Картинка в картинке"><PictureInPicture aria-hidden="true" /></button></div><button className={styles.centerPlay} type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Пауза" : "Продолжить"}><Play aria-hidden="true" /></button><button className={styles.skipIntro} type="button"><SkipForward aria-hidden="true" /> Пропустить заставку</button><div className={styles.playerControls}><span><i /></span><div><small>18:24</small><small>48:10</small></div><div><button type="button" aria-label="Громкость"><Volume2 aria-hidden="true" /></button><button type="button" onClick={() => setQuality((value) => value === "1080p" ? "720p" : "1080p")}>{quality}</button><button type="button" aria-label="Полный экран"><Expand aria-hidden="true" /></button></div></div></div>;
}

function PhoneSearch() {
  const [query, setQuery] = useState("Технологический триллер без жестоких сцен");
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><button type="button" aria-label="Назад"><ChevronLeft aria-hidden="true" /></button><h2>Поиск</h2><MoreHorizontal aria-hidden="true" /></div><label className={styles.phoneSearch}><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Поисковый запрос" /></label><div className={styles.phoneAiAnswer}><div><Sparkles aria-hidden="true" /><span>AI-подбор по каталогу</span></div><p>«Северная станция» сочетает технологический сюжет и атмосферное расследование. Для более камерной истории подойдет «Контур сигнала».</p><small>Найдено 3 подходящих материала</small></div><div className={styles.resultList}>{entries.map((entry) => <button type="button" key={entry.title}><Image src={entry.image} alt="" width={54} height={54} /><span><strong>{entry.title}</strong><small>{entry.meta}</small></span><ChevronRight aria-hidden="true" /></button>)}</div></div>;
}

function PhoneFavorites() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><Star aria-hidden="true" /><h2>Избранное</h2><MoreHorizontal aria-hidden="true" /></div><div className={styles.libraryTabs}><button className={styles.active}>Списки</button><button>Коллекции</button><button>История</button></div><div className={styles.libraryList}>{entries.map((entry) => <article key={entry.title}><Image src={entry.image} alt="" width={72} height={72} /><div><strong>{entry.title}</strong><small>{entry.meta}</small><span><i style={{ width: `${entry.progress || 8}%` }} /></span></div><MoreHorizontal aria-hidden="true" /></article>)}</div></div>;
}

function PhoneDownloads() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><CloudOff aria-hidden="true" /><h2>Загрузки</h2><Settings aria-hidden="true" /></div><div className={styles.storageCard}><div><span>Занято на устройстве</span><strong>1,8 ГБ <small>из 12 ГБ</small></strong></div><i><b /></i><p><Wifi aria-hidden="true" /> Загрузка только по Wi-Fi</p></div><div className={styles.downloadList}>{entries.slice(0, 2).map((entry, index) => <article key={entry.title}><Image src={entry.image} alt="" width={64} height={64} /><div><strong>{entry.title}</strong><small>{index ? "382 МБ · готово" : "742 МБ · 68%"}</small><span><i style={{ width: index ? "100%" : "68%" }} /></span></div>{index ? <Check aria-hidden="true" /> : <ArrowDownToLine aria-hidden="true" />}</article>)}</div></div>;
}

function PhoneFrame({ screen, onOpen }: { screen: Screen; onOpen: (screen: Screen) => void }) {
  const nav: Screen[] = ["home", "catalog", "schedule", "favorites", "menu"];
  return <div className={styles.phoneFrame}><div className={styles.phoneHardware}><span>9:41</span><i /><b><Wifi aria-hidden="true" /> 87%</b></div><div className={`${styles.phoneScreen} ${screen === "player" ? styles.playerPhoneScreen : ""}`}>{screen === "home" && <PhoneHome onOpen={onOpen} />}{screen === "catalog" && <PhoneCatalog onOpen={onOpen} />}{screen === "schedule" && <PhoneSchedule />}{screen === "news" && <PhoneNews />}{screen === "search" && <PhoneSearch />}{screen === "detail" && <PhoneDetail onOpen={onOpen} />}{screen === "player" && <PhonePlayer />}{screen === "downloads" && <PhoneDownloads />}{screen === "favorites" && <PhoneFavorites />}{screen === "rooms" && <PhoneRooms />}{screen === "profile" && <PhoneProfile onOpen={onOpen} />}{screen === "menu" && <PhoneMenu onOpen={onOpen} />}</div>{screen !== "player" && <nav className={styles.phoneNav} aria-label="Навигация смартфона">{nav.map((id) => { const item = screens.find((entry) => entry.id === id)!; const Icon = item.icon; return <button type="button" key={id} className={screen === id ? styles.active : ""} onClick={() => onOpen(id)}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>}</div>;
}

function TvHome({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvHome}><div className={styles.tvPageHead}><div><span>ГЛАВНАЯ / 2026</span><h2>Смотрите на большом экране</h2></div><Search aria-hidden="true" /></div><div className={styles.tvQuery}><Sparkles aria-hidden="true" /><strong>Новинки сезона и продолжение просмотра</strong><span>Профиль синхронизирован</span></div><div className={styles.tvPosterGrid}>{entries.map((entry,index)=><button type="button" key={entry.title} className={index===0?styles.focused:""} onClick={()=>onOpen(index === 0 ? "detail" : "player")}><div><Image src={entry.image} alt="" fill priority={index === 0} sizes="18vw" /><span>{index ? "16+" : "NEW"}</span>{entry.progress > 0 && <i><b style={{ width: `${entry.progress}%` }} /></i>}</div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div><div className={styles.tvProgress}><span><i /></span><small>D-pad focus · прогресс и профиль синхронизированы</small></div></div>;
}

function TvCatalog({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>КАТАЛОГ</span><h2>Фильмы и сериалы</h2></div><ListFilter aria-hidden="true" /></div><div className={styles.tvCategoryRow}><button className={styles.focused}>Все</button><button>Сериалы</button><button>Фильмы</button><button>Новинки</button><button>Завершенные</button></div><div className={styles.tvPosterGrid}>{entries.map((entry,index)=><button type="button" key={entry.title} className={index===0?styles.focused:""} onClick={()=>onOpen("detail")}><div><Image src={entry.image} alt="" fill sizes="18vw" /><span>{index?"16+":"NEW"}</span></div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div></div>;
}

function TvSchedule() {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>РАСПИСАНИЕ</span><h2>Релизы и новые серии</h2></div><CalendarDays aria-hidden="true" /></div><div className={styles.tvScheduleGrid}>{releases.map((release, index) => <article key={release.day + release.title} className={index === 2 ? styles.focused : ""}><small>{release.day} · {release.time}</small><strong>{release.title}</strong><span>{release.status}</span></article>)}</div></div>;
}

function TvFavorites() {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>ИЗБРАННОЕ</span><h2>Продолжить на телевизоре</h2></div><Star aria-hidden="true" /></div><div className={styles.tvWideList}>{entries.map((entry, index) => <article className={index === 1 ? styles.focused : ""} key={entry.title}><div><Image src={entry.image} alt="" fill sizes="30vw" /><span><i style={{ width: `${entry.progress || 8}%` }} /></span></div><small>{entry.meta}</small><h3>{entry.title}</h3><p>{entry.progress ? `${entry.progress}% завершено` : "Добавлено сегодня"}</p></article>)}</div></div>;
}

function TvSearch() {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>AI-ПОИСК</span><h2>Подбор по описанию</h2></div><Sparkles aria-hidden="true" /></div><div className={styles.tvQuery}><Search aria-hidden="true" /><strong>Технологический триллер без жестоких сцен</strong><span>Найдено 4 тайтла</span></div><div className={styles.tvResultGrid}>{entries.slice(0,3).map((entry, index) => <button type="button" key={entry.title} className={index === 0 ? styles.focused : ""}><div><Image src={entry.image} alt="" fill sizes="25vw" /><span>0{index + 1}</span></div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div></div>;
}

function TvDetail({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvDetail}><Image src="/demo-assets/stream-hero.webp" alt="Кадр вымышленного сериала Северная станция" fill sizes="80vw" /><div className={styles.tvDetailShade} /><div className={styles.tvDetailCopy}><span>ПРЕМЬЕРА / 2026</span><h2>Северная станция</h2><p>2026 · 1 сезон · 16+ · триллер</p><small>Исследователи ночной обсерватории фиксируют сигнал и пытаются понять его происхождение.</small><div><button type="button" className={styles.focused} onClick={()=>onOpen("player")}><Play aria-hidden="true" /> Продолжить</button><button type="button"><Star aria-hidden="true" /> В избранное</button></div></div><div className={styles.tvEpisodeStrip}>{[1,2,3,4].map((item)=><button type="button" className={item===3?styles.focused:""} key={item}><span>0{item}</span><strong>{["Первый импульс","Точка приема","Граница шума","Слепая зона"][item-1]}</strong><small>48 мин</small></button>)}</div></div>;
}

function TvPlayer() {
  const [quality,setQuality]=useState("1080p");
  return <div className={styles.tvPlayer}><Image src="/demo-assets/stream-hero.webp" alt="Кадр вымышленного сериала Северная станция" fill sizes="80vw" /><div className={styles.tvPlayerShade} /><div className={styles.tvPlayerHead}><div><strong>Северная станция</strong><small>Сезон 1 · Серия 3 · Граница шума</small></div><PictureInPicture aria-hidden="true" /></div><button type="button" className={`${styles.tvCenterPlay} ${styles.focused}`} aria-label="Пауза"><Play aria-hidden="true" /></button><button type="button" className={styles.tvSkip}><SkipForward aria-hidden="true" /> Пропустить заставку</button><div className={styles.tvPlayerBottom}><span><i /></span><div><small>18:24</small><strong>Осталось 29:46</strong><small>48:10</small></div><nav><button type="button"><ListVideo aria-hidden="true" /> Эпизоды</button><button type="button" onClick={()=>setQuality((value)=>value==="1080p"?"720p":"1080p")}>{quality}</button><button type="button"><Expand aria-hidden="true" /></button></nav></div></div>;
}

/** Меню на телевизоре открывает расширенный список разделов. */
function TvMenu() {
  return <div className={styles.tvMenu}><div className={styles.tvPageHead}><div><span>МЕНЮ</span><h2>Все разделы приложения</h2></div><Tv aria-hidden="true" /></div><div className={styles.tvMenuGrid}>{tvMenuItems.map((item, index) => <button type="button" key={item} className={index === 0 ? styles.focused : ""}>{item}</button>)}</div></div>;
}

function TvFrame({ screen, onOpen }: { screen: Screen; onOpen: (screen: Screen) => void }) {
  const rail = tvRailItems.map((id) => screens.find((entry) => entry.id === id)!);
  return <div className={styles.tvFrame}><aside className={styles.tvRail}><strong className={styles.mediaMark}>M<span>G</span></strong>{rail.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={screen === item.id ? styles.active : ""} onClick={() => onOpen(item.id)} aria-label={item.label}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}<button type="button" className={screen === "menu" ? styles.active : ""} onClick={() => onOpen("menu")} aria-label="Меню"><MenuIcon aria-hidden="true" /><span>Меню</span></button></aside><div className={styles.tvScreen}>{screen === "home" && <TvHome onOpen={onOpen} />}{screen === "catalog" && <TvCatalog onOpen={onOpen} />}{screen === "search" && <TvSearch />}{screen === "schedule" && <TvSchedule />}{screen === "favorites" && <TvFavorites />}{screen === "detail" && <TvDetail onOpen={onOpen} />}{screen === "player" && <TvPlayer />}{screen === "menu" && <TvMenu />}</div></div>;
}

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}

export function MobileTvDemo() {
  const [device, setDevice] = useState<Device>("phone");
  const [screen, setScreen] = useState<Screen>("home");
  return <div className={styles.demo}>
    <header className={styles.header}><div><span>ANONYMIZED PRODUCT RECONSTRUCTION</span><h1>Один продукт. Два способа взаимодействия.</h1><p>Навигация и разделы повторяют нативное Android-приложение. Бренд, названия тайтлов и данные синтетические.</p></div><DeviceSwitch device={device} onChange={(next) => { setDevice(next); setScreen("home"); }} /></header>
    <div className={`${styles.stage} ${device === "tv" ? styles.tvStage : styles.phoneStage}`} data-testid="mobile-tv-demo-stage">
      <div className={styles.stageGrid} aria-hidden="true" />
      <aside className={styles.context}><span>Текущий режим</span><strong>{device === "phone" ? "Touch / portrait" : "D-pad / 10-foot UI"}</strong><p>{device === "phone" ? "Компактная нижняя навигация, жесты, локальное состояние и фоновые загрузки." : "Рейл из пяти разделов, крупные зоны, предсказуемый focus и расширенное меню по кнопке MENU."}</p><div>{screens.map((item) => <button type="button" key={item.id} className={screen === item.id ? styles.active : ""} onClick={() => setScreen(item.id)}>{item.label}<ChevronRight aria-hidden="true" /></button>)}</div></aside>
      <div className={styles.deviceArea}>{device === "phone" ? <PhoneFrame screen={screen} onOpen={setScreen} /> : <TvFrame screen={screen} onOpen={setScreen} />}</div>
      <aside className={styles.technical}><span>Подтверждённые решения</span><ul><li><strong>Compose-first UI</strong><small>Нативные экраны и изолированные legacy-адаптеры</small></li><li><strong>Media3 + adapters</strong><small>HLS/MP4, skip, PiP и отдельные embedded-сценарии</small></li><li><strong>Room + DataStore</strong><small>Кэш, прогресс и состояние</small></li><li><strong>WorkManager</strong><small>Очередь загрузок и офлайн</small></li><li><strong>Device profiles</strong><small>Phone, tablet, foldable и TV</small></li></ul></aside>
    </div>
    <footer className={styles.footer}><span>Обезличенная web-реконструкция нативного продукта</span><strong>Синтетические данные · без API и production-доступа</strong></footer>
  </div>;
}
