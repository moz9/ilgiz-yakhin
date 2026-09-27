"use client";

import {
  ArrowDownToLine,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Download,
  Expand,
  Grid3X3,
  Home,
  Library,
  ListFilter,
  ListVideo,
  Monitor,
  MoreHorizontal,
  PictureInPicture,
  Play,
  RefreshCw,
  Search,
  Settings,
  SkipForward,
  Smartphone,
  Sparkles,
  Star,
  UserRound,
  Volume2,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import styles from "./mobile-tv-demo.module.css";

type Device = "phone" | "tv";
type Screen = "home" | "catalog" | "search" | "detail" | "player" | "library" | "downloads" | "updates";

const screens: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "catalog", label: "Каталог", icon: Grid3X3 },
  { id: "search", label: "Поиск", icon: Search },
  { id: "detail", label: "Карточка", icon: ListFilter },
  { id: "player", label: "Плеер", icon: Play },
  { id: "library", label: "Библиотека", icon: Library },
  { id: "downloads", label: "Офлайн", icon: Download },
  { id: "updates", label: "Обновление", icon: RefreshCw },
];

const entries = [
  { title: "Северная станция", meta: "Сериал · 8 эпизодов", image: "/demo-assets/poster-observatory.webp", progress: 68 },
  { title: "Красный маяк", meta: "Фильм · 1 ч 52 мин", image: "/demo-assets/poster-beacon.webp", progress: 34 },
  { title: "Ночной маршрут", meta: "Мини-сериал · 6 эпизодов", image: "/demo-assets/poster-night-train.webp", progress: 0 },
  { title: "Контур сигнала", meta: "Триллер · 1 ч 44 мин", image: "/demo-assets/poster-signal.webp", progress: 0 },
];

function DeviceSwitch({ device, onChange }: { device: Device; onChange: (device: Device) => void }) {
  return <div className={styles.deviceSwitch} aria-label="Форм-фактор"><button type="button" className={device === "phone" ? styles.active : ""} onClick={() => onChange("phone")} aria-pressed={device === "phone"}><Smartphone aria-hidden="true" /> Смартфон</button><button type="button" className={device === "tv" ? styles.active : ""} onClick={() => onChange("tv")} aria-pressed={device === "tv"}><Monitor aria-hidden="true" /> Android TV</button></div>;
}

function PhoneHome({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <>
    <div className={styles.phoneTop}><strong className={styles.mediaMark}>Media<span>GO</span></strong><button type="button" aria-label="Уведомления"><Bell aria-hidden="true" /></button><button type="button" aria-label="Профиль"><UserRound aria-hidden="true" /></button></div>
    <div className={styles.phoneScroll}>
      <div className={styles.phoneSearch}><Search aria-hidden="true" /><span>Быстрый поиск по каталогу</span><button type="button" onClick={() => onOpen("search")}><Sparkles aria-hidden="true" /> ИИ</button></div>
      <div className={styles.phonePageTitle}><div><small>СЕЗОН / 2026</small><h2>Новинки</h2></div><button type="button" onClick={() => onOpen("catalog")}>Все <ChevronRight aria-hidden="true" /></button></div>
      <div className={styles.phoneCards}>{entries.slice(0, 3).map((entry, index) => <button type="button" onClick={() => onOpen("detail")} key={entry.title}><div><Image src={entry.image} alt="" fill sizes="160px" /><span>{index ? entry.progress || "NEW" : "NEW"}</span></div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div>
      <div className={styles.continueTitle}><strong>Обновления</strong><button type="button" onClick={() => onOpen("catalog")}>Все</button></div>
      <div className={styles.resultList}>{entries.slice(0, 3).map((entry, index) => <button type="button" key={entry.title} onClick={() => onOpen("detail")}><Image src={entry.image} alt="" width={48} height={60} /><span><strong>{entry.title}</strong><small>{entry.meta}</small></span><b>{index + 1} сезон · {index + 3} серия</b><ChevronRight aria-hidden="true" /></button>)}</div>
    </div>
  </>;
}

function PhoneCatalog({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><Grid3X3 aria-hidden="true" /><h2>Каталог</h2><ListFilter aria-hidden="true" /></div><div className={styles.catalogChips}><button className={styles.active}>Все</button><button>Сериалы</button><button>Фильмы</button><button>Новинки</button></div><div className={styles.phoneCatalogGrid}>{entries.map((entry, index) => <button type="button" key={entry.title} onClick={() => onOpen("detail")}><div><Image src={entry.image} alt="" fill sizes="140px" /><span>{index ? "16+" : "NEW"}</span>{entry.progress > 0 && <i><b style={{ width: `${entry.progress}%` }} /></i>}</div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div></div>;
}

function PhoneDetail({ onOpen }: { onOpen: (screen: Screen) => void }) {
  const [episode, setEpisode] = useState(3);
  return <div className={styles.phoneScroll}><div className={styles.phoneDetailHero}><Image src="/demo-assets/poster-observatory.webp" alt="Постер вымышленного сериала Северная станция" fill sizes="338px" /><div /><button type="button" aria-label="Назад"><ChevronLeft aria-hidden="true" /></button><span>ПРЕМЬЕРА / 2026</span><h2>Северная станция</h2><p>2026 · 1 сезон · 16+</p></div><div className={styles.phoneDetailBody}><div className={styles.phoneDetailActions}><button type="button" onClick={() => onOpen("player")}><Play aria-hidden="true" /> Смотреть</button><button type="button"><Download aria-hidden="true" /> Офлайн</button><button type="button"><Star aria-hidden="true" /> В список</button></div><p>Исследователи ночной обсерватории фиксируют сигнал и пытаются понять его происхождение раньше, чем меняется вся цепочка связи.</p><div className={styles.phoneEpisodeHead}><strong>Эпизоды</strong><button type="button">Сезон 1 <ChevronRight aria-hidden="true" /></button></div><div className={styles.phoneEpisodes}>{[1,2,3,4].map((item) => <button type="button" className={episode === item ? styles.active : ""} onClick={() => setEpisode(item)} key={item}><span>0{item}</span><div><strong>{["Первый импульс","Точка приема","Граница шума","Слепая зона"][item-1]}</strong><small>48 мин · до 1080p</small></div>{item < 3 ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}</button>)}</div></div></div>;
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

function PhoneLibrary() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><Library aria-hidden="true" /><h2>Моя библиотека</h2><MoreHorizontal aria-hidden="true" /></div><div className={styles.phoneStatRow}><article><strong>18</strong><span>Сохранено</span></article><article><strong>6</strong><span>В процессе</span></article><article><strong>24</strong><span>Завершено</span></article></div><div className={styles.libraryTabs}><button className={styles.active}>Последние</button><button>Коллекции</button><button>История</button></div><div className={styles.libraryList}>{entries.map((entry) => <article key={entry.title}><Image src={entry.image} alt="" width={72} height={72} /><div><strong>{entry.title}</strong><small>{entry.meta}</small><span><i style={{ width: `${entry.progress || 8}%` }} /></span></div><MoreHorizontal aria-hidden="true" /></article>)}</div></div>;
}

function PhoneDownloads() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><CloudOff aria-hidden="true" /><h2>Офлайн</h2><Settings aria-hidden="true" /></div><div className={styles.storageCard}><div><span>Занято на устройстве</span><strong>1,8 ГБ <small>из 12 ГБ</small></strong></div><i><b /></i><p><Wifi aria-hidden="true" /> Загрузка только по Wi-Fi</p></div><div className={styles.downloadList}>{entries.slice(0, 2).map((entry, index) => <article key={entry.title}><Image src={entry.image} alt="" width={64} height={64} /><div><strong>{entry.title}</strong><small>{index ? "382 МБ · готово" : "742 МБ · 68%"}</small><span><i style={{ width: index ? "100%" : "68%" }} /></span></div>{index ? <Check aria-hidden="true" /> : <ArrowDownToLine aria-hidden="true" />}</article>)}</div></div>;
}

function PhoneUpdate() {
  return <div className={styles.phoneScroll}><div className={styles.phonePageTitle}><RefreshCw aria-hidden="true" /><h2>Обновление</h2><MoreHorizontal aria-hidden="true" /></div><div className={styles.updateCard}><span>Доступна новая версия</span><strong>0.4.10</strong><small>Стабильный канал · 48 МБ</small><div className={styles.updateArtwork}><RefreshCw aria-hidden="true" /><i /><i /><i /></div><h3>Быстрее возвращение к экрану</h3><p>Состояние, позиция списка и результаты поиска сохраняются при навигации назад.</p><ul><li><Check aria-hidden="true" /> Оптимизация навигации</li><li><Check aria-hidden="true" /> Единые состояния загрузки</li><li><Check aria-hidden="true" /> Проверка пакета перед установкой</li></ul><button type="button"><ArrowDownToLine aria-hidden="true" /> Скачать и установить</button></div></div>;
}

function PhoneFrame({ screen, onOpen }: { screen: Screen; onOpen: (screen: Screen) => void }) {
  return <div className={styles.phoneFrame}><div className={styles.phoneHardware}><span>9:41</span><i /><b><Wifi aria-hidden="true" /> 87%</b></div><div className={`${styles.phoneScreen} ${screen === "player" ? styles.playerPhoneScreen : ""}`}>{screen === "home" && <PhoneHome onOpen={onOpen} />}{screen === "catalog" && <PhoneCatalog onOpen={onOpen} />}{screen === "search" && <PhoneSearch />}{screen === "detail" && <PhoneDetail onOpen={onOpen} />}{screen === "player" && <PhonePlayer />}{screen === "library" && <PhoneLibrary />}{screen === "downloads" && <PhoneDownloads />}{screen === "updates" && <PhoneUpdate />}</div>{screen !== "player" && <nav className={styles.phoneNav} aria-label="Навигация смартфона">{[screens[0], screens[1], screens[2], screens[5]].map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={screen === item.id ? styles.active : ""} onClick={() => onOpen(item.id)}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>}</div>;
}

function TvHome({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvHome}><div className={styles.tvPageHead}><div><span>ГЛАВНАЯ / 2026</span><h2>Смотрите на большом экране</h2></div><Search aria-hidden="true" /></div><div className={styles.tvQuery}><Sparkles aria-hidden="true" /><strong>Новинки сезона и продолжение просмотра</strong><span>Профиль синхронизирован</span></div><div className={styles.tvPosterGrid}>{entries.map((entry,index)=><button type="button" key={entry.title} className={index===0?styles.focused:""} onClick={()=>onOpen(index === 0 ? "detail" : "player")}><div><Image src={entry.image} alt="" fill priority={index === 0} sizes="18vw" /><span>{index ? "16+" : "NEW"}</span>{entry.progress > 0 && <i><b style={{ width: `${entry.progress}%` }} /></i>}</div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div><div className={styles.tvProgress}><span><i /></span><small>D-pad focus · прогресс и профиль синхронизированы</small></div></div>;
}

function TvCatalog({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>CATALOG</span><h2>Фильмы и сериалы</h2></div><ListFilter aria-hidden="true" /></div><div className={styles.tvCategoryRow}><button className={styles.focused}>Все</button><button>Сериалы</button><button>Фильмы</button><button>Новинки</button><button>Завершенные</button></div><div className={styles.tvPosterGrid}>{entries.map((entry,index)=><button type="button" key={entry.title} className={index===0?styles.focused:""} onClick={()=>onOpen("detail")}><div><Image src={entry.image} alt="" fill sizes="18vw" /><span>{index?"16+":"NEW"}</span></div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div></div>;
}

function TvDetail({ onOpen }: { onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvDetail}><Image src="/demo-assets/stream-hero.webp" alt="Кадр вымышленного сериала Северная станция" fill sizes="80vw" /><div className={styles.tvDetailShade} /><div className={styles.tvDetailCopy}><span>ПРЕМЬЕРА / 2026</span><h2>Северная станция</h2><p>2026 · 1 сезон · 16+ · триллер</p><small>Исследователи ночной обсерватории фиксируют сигнал и пытаются понять его происхождение.</small><div><button type="button" className={styles.focused} onClick={()=>onOpen("player")}><Play aria-hidden="true" /> Продолжить</button><button type="button"><Star aria-hidden="true" /> В избранное</button></div></div><div className={styles.tvEpisodeStrip}>{[1,2,3,4].map((item)=><button type="button" className={item===3?styles.focused:""} key={item}><span>0{item}</span><strong>{["Первый импульс","Точка приема","Граница шума","Слепая зона"][item-1]}</strong><small>48 мин</small></button>)}</div></div>;
}

function TvPlayer() {
  const [quality,setQuality]=useState("1080p");
  return <div className={styles.tvPlayer}><Image src="/demo-assets/stream-hero.webp" alt="Кадр вымышленного сериала Северная станция" fill sizes="80vw" /><div className={styles.tvPlayerShade} /><div className={styles.tvPlayerHead}><div><strong>Северная станция</strong><small>Сезон 1 · Серия 3 · Граница шума</small></div><PictureInPicture aria-hidden="true" /></div><button type="button" className={`${styles.tvCenterPlay} ${styles.focused}`} aria-label="Пауза"><Play aria-hidden="true" /></button><button type="button" className={styles.tvSkip}><SkipForward aria-hidden="true" /> Пропустить заставку</button><div className={styles.tvPlayerBottom}><span><i /></span><div><small>18:24</small><strong>Осталось 29:46</strong><small>48:10</small></div><nav><button type="button"><ListVideo aria-hidden="true" /> Эпизоды</button><button type="button" onClick={()=>setQuality((value)=>value==="1080p"?"720p":"1080p")}>{quality}</button><button type="button"><Expand aria-hidden="true" /></button></nav></div></div>;
}

function TvSearch() {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>AI SEARCH</span><h2>Подбор по описанию</h2></div><Sparkles aria-hidden="true" /></div><div className={styles.tvQuery}><Search aria-hidden="true" /><strong>Технологический триллер без жестоких сцен</strong><span>Найдено 4 тайтла</span></div><div className={styles.tvResultGrid}>{entries.slice(0,3).map((entry, index) => <button type="button" className={index === 0 ? styles.focused : ""} key={entry.title}><div><Image src={entry.image} alt="" fill sizes="25vw" /><span>0{index + 1}</span></div><strong>{entry.title}</strong><small>{entry.meta}</small></button>)}</div></div>;
}

function TvLibrary() {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>LIBRARY</span><h2>Продолжить на телевизоре</h2></div><Library aria-hidden="true" /></div><div className={styles.tvWideList}>{entries.map((entry, index) => <article className={index === 1 ? styles.focused : ""} key={entry.title}><div><Image src={entry.image} alt="" fill sizes="30vw" /><span><i style={{ width: `${entry.progress || 8}%` }} /></span></div><small>{entry.meta}</small><h3>{entry.title}</h3><p>{entry.progress ? `${entry.progress}% завершено` : "Добавлено сегодня"}</p></article>)}</div></div>;
}

function TvDownloads() {
  return <div className={styles.tvPage}><div className={styles.tvPageHead}><div><span>OFFLINE</span><h2>Загрузки на устройстве</h2></div><CloudOff aria-hidden="true" /></div><div className={styles.tvOffline}><div className={styles.tvStorage}><span>Свободно</span><strong>10,2 ГБ</strong><i><b /></i><small>2 материала доступны без сети</small></div>{entries.slice(0, 2).map((entry, index) => <article key={entry.title} className={index === 0 ? styles.focused : ""}><Image src={entry.image} alt="" width={180} height={112} /><div><small>ГОТОВО</small><strong>{entry.title}</strong><span>{index ? "382 МБ" : "742 МБ"}</span></div><Check aria-hidden="true" /></article>)}</div></div>;
}

function TvUpdate() {
  return <div className={styles.tvPage}><div className={styles.tvUpdate}><div><span>SYSTEM UPDATE</span><h2>Версия 0.4.10 готова</h2><p>Пакет загружен и проверен. Обновление сохранит локальные данные и вернет приложение на текущий экран.</p><ul><li><Check aria-hidden="true" /> Проверена подпись пакета</li><li><Check aria-hidden="true" /> Данные совместимы</li><li><Check aria-hidden="true" /> Доступно восстановление</li></ul><button type="button" className={styles.focused}><RefreshCw aria-hidden="true" /> Установить обновление</button></div><div className={styles.tvUpdateArt}><RefreshCw aria-hidden="true" /><span>0.4.10</span><small>48 МБ</small></div></div></div>;
}

function TvFrame({ screen, onOpen }: { screen: Screen; onOpen: (screen: Screen) => void }) {
  return <div className={styles.tvFrame}><aside className={styles.tvRail}><strong className={styles.mediaMark}>Media<span>GO</span></strong>{screens.slice(0, 6).map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={screen === item.id ? styles.active : ""} onClick={() => onOpen(item.id)} aria-label={item.label}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}<button type="button" aria-label="Профиль"><UserRound aria-hidden="true" /><span>Профиль</span></button></aside><div className={styles.tvScreen}>{screen === "home" && <TvHome onOpen={onOpen} />}{screen === "catalog" && <TvCatalog onOpen={onOpen} />}{screen === "search" && <TvSearch />}{screen === "detail" && <TvDetail onOpen={onOpen} />}{screen === "player" && <TvPlayer />}{screen === "library" && <TvLibrary />}{screen === "downloads" && <TvDownloads />}{screen === "updates" && <TvUpdate />}</div></div>;
}

export function MobileTvDemo() {
  const [device, setDevice] = useState<Device>("phone");
  const [screen, setScreen] = useState<Screen>("home");
  return <div className={styles.demo}>
    <header className={styles.header}><div><span>ANDROID PRODUCT DEMO</span><h1>Один продукт. Два способа взаимодействия.</h1></div><DeviceSwitch device={device} onChange={(next) => { setDevice(next); setScreen("home"); }} /></header>
    <div className={`${styles.stage} ${device === "tv" ? styles.tvStage : styles.phoneStage}`} data-testid="mobile-tv-demo-stage">
      <div className={styles.stageGrid} aria-hidden="true" />
      <aside className={styles.context}><span>Текущий режим</span><strong>{device === "phone" ? "Touch / portrait" : "D-pad / 10-foot UI"}</strong><p>{device === "phone" ? "Компактная навигация, жесты, локальное состояние и фоновые загрузки." : "Крупные зоны, предсказуемый focus и управление с пульта без сенсорных жестов."}</p><div>{screens.map((item) => <button type="button" key={item.id} className={screen === item.id ? styles.active : ""} onClick={() => setScreen(item.id)}>{item.label}<ChevronRight aria-hidden="true" /></button>)}</div></aside>
      <div className={styles.deviceArea}>{device === "phone" ? <PhoneFrame screen={screen} onOpen={setScreen} /> : <TvFrame screen={screen} onOpen={setScreen} />}</div>
      <aside className={styles.technical}><span>Подтвержденные решения</span><ul><li><strong>Compose-first UI</strong><small>Нативные экраны и изолированные legacy-адаптеры</small></li><li><strong>Media3 + adapters</strong><small>HLS/MP4, skip, PiP и отдельные embedded-сценарии</small></li><li><strong>Room + DataStore</strong><small>Кэш, прогресс и состояние</small></li><li><strong>WorkManager</strong><small>Очередь загрузок и офлайн</small></li><li><strong>Device profiles</strong><small>Phone, tablet, foldable и TV</small></li></ul></aside>
    </div>
    <footer className={styles.footer}><span>Обезличенная web-реконструкция нативного продукта</span><strong>Синтетические данные · без API и production-доступа</strong></footer>
  </div>;
}
