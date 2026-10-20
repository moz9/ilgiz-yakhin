"use client";

import {
  Check,
  ChevronDown,
  CircleAlert,
  FileText,
  FolderOpen,
  Gauge,
  History,
  Home,
  Keyboard,
  MessageSquareWarning,
  Monitor,
  Play,
  RefreshCw,
  RotateCw,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import styles from "./launcher-demo.module.css";

const sections = [
  { id: "start", label: "Старт", icon: Home },
  { id: "status", label: "Статус", icon: Wrench },
  { id: "game", label: "Настройки игры", icon: SlidersHorizontal },
  { id: "keys", label: "Клавиши", icon: Keyboard },
  { id: "video", label: "Видео", icon: Monitor },
  { id: "updates", label: "Обновления", icon: RefreshCw },
  { id: "logs", label: "Журналы", icon: ScrollText },
  { id: "settings", label: "Настройки", icon: Settings },
] as const;

type SectionId = (typeof sections)[number]["id"];

const statusChecks = [
  { label: "Окружение и версия оболочки", value: "Совпадает с каналом", state: "ok" },
  { label: "Пути игры и права доступа", value: "Папка доступна для записи", state: "ok" },
  { label: "Канал обновлений", value: "Стабильный, отставание отсутствует", state: "ok" },
  { label: "Лицензия и режим запуска", value: "Подтверждена · администратор", state: "ok" },
  { label: "Сторонние демоны", value: "Проверка не завершена", state: "wait" },
];

const bindings = [
  ["Запуск игры", "F5"],
  ["Остановка игры", "Shift + F5"],
  ["Открыть настройки игры", "Ctrl + ,"],
  ["Проверка входа", "Ctrl + Shift + V"],
  ["Журнал событий", "Ctrl + L"],
  ["Отчёт о проблеме", "Ctrl + R"],
];

const logLines = [
  ["09:41:02", "Канал обновлений: стабильный, проверка подписи пакета"],
  ["09:41:03", "Набор настроек «Обычный» загружен из профиля пользователя"],
  ["09:41:05", "Проверка входа: окружение готово, ожидание запуска"],
  ["09:41:07", "Ограничение частоты кадров: 60 FPS, режим отрисовки по умолчанию"],
  ["09:41:09", "Демон обновления: фоновая проверка очереди"],
  ["09:41:12", "Журнал записан в каталог диагностики"],
];

function StartScreen() {
  return <>
    <div className={styles.head}>
      <div><span>ГЛАВНАЯ</span><h2>Лаунчер готов</h2><p>Лицензия подтверждена · администратор</p></div>
      <div className={styles.headActions}><button type="button" aria-label="Обновить состояние"><RotateCw aria-hidden="true" /></button><button type="button" aria-label="Открыть журнал"><FileText aria-hidden="true" /></button><button type="button" aria-label="История запусков"><History aria-hidden="true" /></button></div>
    </div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Запуск</strong><span>Сеть: обычный</span></div>
      <div className={styles.launchRow}>
        <div className={styles.launchButtons}>
          <span><button type="button" className={styles.primary}><Play aria-hidden="true" /> Запустить</button><button type="button"><RotateCw aria-hidden="true" /></button><button type="button"><X aria-hidden="true" /></button></span>
          <span><button type="button">Проверка входа</button><button type="button">Закрыть витрину</button></span>
          <span><button type="button" className={styles.muted}>Демоны</button><button type="button" className={styles.muted}>ЛК</button></span>
          <button type="button" className={styles.wide}>Закрыть игру и витрину</button>
        </div>
        <ul className={styles.options}>
          <li><span className={styles.check} /><span>Запускать игру сразу, без окна витрины</span></li>
          <li><span className={styles.checkOn}><Check aria-hidden="true" /></span><span>Пропуск выбора персонажа</span></li>
          <li><span className={styles.check} /><span>Подробная запись работы игры</span></li>
          <li><span className={styles.check} /><span>Проверка входа</span></li>
        </ul>
      </div>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Игра и пути</span><small>Рабочий каталог, профили запуска и наборы настроек</small></div>
  </>;
}

function StatusScreen() {
  return <>
    <div className={styles.head}><div><span>СТАТУС</span><h2>Проверка готовности</h2><p>Пять проверок окружения перед запуском</p></div></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Готовность к запуску</strong><span>4 из 5 подтверждено</span></div>
      <ul className={styles.checks}>
        {statusChecks.map((item) => <li key={item.label}><span className={item.state === "ok" ? styles.badgeOk : styles.badgeWait}>{item.state === "ok" ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}</span><span>{item.label}</span><small>{item.value}</small></li>)}
      </ul>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Диагностика и расположение файлов</span><small>Путь журнала и состав отчёта</small></div>
  </>;
}

function GameScreen() {
  return <>
    <div className={styles.head}><div><span>НАСТРОЙКИ ИГРЫ</span><h2>Наборы и параметры</h2><p>Сохранённые настройки интерфейса и клавиш</p></div></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Сохранённые настройки интерфейса и клавиш</strong><span>Профиль пользователя</span></div>
      <div className={styles.form}>
        <label><span>Набор настроек</span><button type="button">Обычный <ChevronDown aria-hidden="true" /></button></label>
        <label><span>Название набора</span><input type="text" placeholder="Новый набор" readOnly value="" /></label>
      </div>
      <div className={styles.formActions}><button type="button">Сохранить текущее</button><button type="button">Применить</button></div>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Загрузка и управление наборами</span><small>Импорт, экспорт и синхронизация</small></div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Параметры игры</span><small>Разрешения и поведение при запуске</small></div>
  </>;
}

function KeysScreen() {
  return <>
    <div className={styles.head}><div><span>КЛАВИШИ</span><h2>Горячие клавиши</h2><p>Действия оболочки и их сочетания</p></div></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Управление без мыши</strong><span>6 действий</span></div>
      <ul className={styles.bindings}>
        {bindings.map(([action, keys]) => <li key={action}><span>{action}</span><kbd>{keys}</kbd></li>)}
      </ul>
    </div>
  </>;
}

function VideoScreen() {
  return <>
    <div className={styles.head}><div><span>ВИДЕО</span><h2>Частота кадров и способы отрисовки</h2><p>Профиль производительности для текущего железа</p></div></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Профиль видео</strong><span>Применяется к следующему запуску</span></div>
      <div className={styles.form}>
        <label><span>Ограничение FPS</span><button type="button">Авто — по монитору <ChevronDown aria-hidden="true" /></button></label>
        <label><span>Режим отрисовки</span><button type="button">По умолчанию <ChevronDown aria-hidden="true" /></button></label>
      </div>
      <p className={styles.note}><Gauge aria-hidden="true" /> Обнаружено: 60 Гц · рекомендовано 60 FPS · применяется 60 FPS</p>
      <div className={styles.formActions}><button type="button">Сохранить и применить</button></div>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Дополнительные параметры</span><small>Профиль и текстуры</small></div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Проверка плавности</span><small>Замер кадров перед запуском</small></div>
  </>;
}

function UpdatesScreen() {
  return <>
    <div className={styles.head}><div><span>ОБНОВЛЕНИЯ</span><h2>Версия и обновления</h2><p>Релизная версия · сборка 0.3.320</p></div><button type="button" className={styles.iconButton}><RefreshCw aria-hidden="true" /></button></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Релизная версия</strong><span>Проверка…</span></div>
      <div className={styles.formActions}><button type="button">Скачать полный установщик</button><button type="button">Обновить лаунчер</button><button type="button">Показать файл</button></div>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Ссылка на обновление</span><small>Канал и подпись пакета</small></div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Что нового</span><small>Изменения последнего выпуска</small></div>
  </>;
}

function LogsScreen() {
  return <>
    <div className={styles.head}><div><span>ЖУРНАЛЫ</span><h2>Журнал событий</h2><p>Последние записи оболочки</p></div></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Последние события</strong><span>6 строк</span></div>
      <ul className={styles.logs}>
        {logLines.map(([time, message]) => <li key={time}><time>{time}</time><span>{message}</span></li>)}
      </ul>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Диагностика и расположение файлов</span><small>Куда писать отчёт о проблеме</small></div>
  </>;
}

function SettingsScreen() {
  return <>
    <div className={styles.head}><div><span>НАСТРОЙКИ</span><h2>Пути и поведение</h2><p>Рабочий каталог и параметры запуска</p></div></div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Папка игры</strong><span>Проверена</span></div>
      <div className={styles.path}><FolderOpen aria-hidden="true" /><span>C:\Games\Synthetic\workspace</span></div>
      <div className={styles.formActions}><button type="button">Обзор…</button><button type="button">Применить путь</button></div>
    </div>
    <div className={styles.card}>
      <div className={styles.cardHead}><strong>Поведение при запуске</strong><span>4 параметра</span></div>
      <ul className={styles.options}>
        <li><span className={styles.check} /><span>Запускать игру сразу, без окна витрины</span></li>
        <li><span className={styles.check} /><span>Проверять обновление при запуске</span></li>
        <li><span className={styles.checkOn}><Check aria-hidden="true" /></span><span>Пропуск выбора персонажа</span></li>
        <li><span className={styles.check} /><span>Отключать встроенный ролик</span></li>
      </ul>
    </div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Фоновые сборки</span><small>Задачи вне игрового процесса</small></div>
    <div className={styles.accordion}><ChevronDown aria-hidden="true" /><span>Отображение персонажей</span><small>Список и порядок</small></div>
  </>;
}

const screens: Record<SectionId, () => React.JSX.Element> = {
  start: StartScreen,
  status: StatusScreen,
  game: GameScreen,
  keys: KeysScreen,
  video: VideoScreen,
  updates: UpdatesScreen,
  logs: LogsScreen,
  settings: SettingsScreen,
};

export function LauncherDemo() {
  const [section, setSection] = useState<SectionId>("start");
  const Screen = screens[section];

  return <div className={styles.demo}>
    <header className={styles.header}>
      <div>
        <span>ANONYMIZED PRODUCT RECONSTRUCTION</span>
        <h1>Нативная оболочка лаунчера</h1>
        <p>Структура, навигация и сценарии повторяют реальный продукт. Бренд, названия модулей и данные синтетические.</p>
      </div>
      <span className={styles.badge}><ShieldCheck aria-hidden="true" /> Обезличено</span>
    </header>

    <div className={styles.stage}>
      <div className={styles.shell}>
        <div className={styles.titleBar}>
          <span className={styles.mark}>L</span>
          <strong>Launcher</strong>
          <span>Стенд-реконструкция</span>
        </div>
        <div className={styles.shellBody}>
          <nav className={styles.rail} aria-label="Разделы оболочки">
            {sections.map((item) => {
              const Icon = item.icon;
              return <button type="button" key={item.id} className={section === item.id ? styles.active : ""} onClick={() => setSection(item.id)} aria-label={item.label} aria-current={section === item.id ? "page" : undefined}><Icon aria-hidden="true" /><span>{item.label}</span></button>;
            })}
            <button type="button" className={styles.report}><MessageSquareWarning aria-hidden="true" /><span>Репорт</span></button>
          </nav>
          <div className={styles.content}><Screen /></div>
        </div>
      </div>

      <aside className={styles.technical}>
        <span>Подтверждённые решения</span>
        <ul>
          <li><strong>WinUI 3 + .NET 9</strong><small>Нативная Windows-оболочка, self-contained canary</small></li>
          <li><strong>Модульный контур</strong><small>Оболочка, игровые модули и нативные сервисы разделены</small></li>
          <li><strong>Профили и клавиши</strong><small>Наборы настроек сохраняются, применяются и откатываются</small></li>
          <li><strong>Видео-профиль</strong><small>Ограничение FPS, режим отрисовки и проверка плавности</small></li>
          <li><strong>Каналы обновлений</strong><small>Подпись пакета, версия и откат на предыдущий выпуск</small></li>
          <li><strong>Диагностика</strong><small>Журнал событий, отчёт о проблеме и путь файлов</small></li>
        </ul>
        <p className={styles.technicalNote}><Sparkles aria-hidden="true" /> Все имена, пути и версии заменены на синтетические.</p>
      </aside>
    </div>
  </div>;
}
