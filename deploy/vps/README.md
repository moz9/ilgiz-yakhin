# Портфолио на VPS

Второй хостинг портфолио рядом с Vercel. Vercel по-прежнему собирает сайт на каждый push в `main`, а VPS получает готовый архив и сам ничего не собирает.

- **Сервер.** Ubuntu 24.04, 4 vCPU, 2 ГБ RAM, 20 ГБ SSD.
- **Схема.** Caddy (порты 80 и 443) отдаёт `/_next/static`, `/cases`, `/fonts` и `/demo-assets` прямо с диска, остальное проксирует в Next.js standalone на `127.0.0.1:3000` (systemd-юнит `portfolio`).
- **Память.** Под нагрузкой Node держит около 115 МБ RSS. Куча ограничена 640 МБ, systemd обрывает процесс на 1,2 ГБ.

## Файлы

| Файл | Где запускать | Что делает |
|---|---|---|
| `build-release.sh [ref]` | WSL Ubuntu или CI | Собирает standalone из закоммиченного дерева в `out/portfolio-<rev>.tar.gz` и пишет рядом SHA-256 |
| `deploy.sh [--bootstrap] [архив]` | Git Bash на Windows | Загружает архив по SSH, активирует его и запускает smoke-проверку |
| `bootstrap.sh` | сервер, root, один раз | Обновления, swap 1 ГБ, Node 24, Caddy, пользователь `portfolio`, юнит, Caddyfile, ufw |
| `activate-release.sh` | сервер, root | Атомарно переключает `current`, при ошибке откатывает, хранит 5 последних релизов |
| `smoke.mjs <url> [--browser]` | где угодно | Проверяет маршруты, ассеты, шрифты, видео (Range и faststart), 3D-модели, API и редиректы. С `--browser` ещё проверяет WebGL и воспроизведение видео в Chromium |
| `.github/workflows/vps-release.yml` | GitHub Actions, вручную | Та же сборка; архив сохраняется как артефакт на 14 дней |

## Первый запуск

1. **Сборка.** В WSL из корня репозитория:

   ```bash
   bash deploy/vps/build-release.sh
   ```

   Пока домен не выбран, `SITE_URL` по умолчанию указывает на Vercel. Так каноникал и sitemap смотрят на прод, а зеркало не спорит с ним в поиске.

2. **Выкладка.** В Git Bash, когда вход по ключу работает:

   ```bash
   VPS_HOST=31.77.222.201 deploy/vps/deploy.sh --bootstrap
   ```

   Ключ по умолчанию лежит в `~/.ssh/id_ed25519_xipher_ilgiz_portfolio`. Скрипт передаёт ssh только путь к нему.

3. **Сайт по IP.** Открывается на `http://31.77.222.201`, без HTTPS, с заголовком `X-Robots-Tag: noindex`.

Следующие выкладки: `build-release.sh`, затем `deploy.sh` без `--bootstrap`. Откат на сервере: `bash /tmp/portfolio-deploy/activate-release.sh --rollback`.

## Когда появится домен

1. **DNS.** В REG.RU создать A-записи `@` и `www` на IP сервера.
2. **Сборка.** Пересобрать с адресом домена:

   ```bash
   SITE_URL=https://<домен> bash deploy/vps/build-release.sh
   ```

3. **Выкладка.** Выложить сборку с настройками домена:

   ```bash
   SITE_ADDRESS="<домен>, www.<домен>" INDEXABLE=1 VPS_HOST=... deploy/vps/deploy.sh --bootstrap
   ```

   Caddy сам получит сертификаты Let's Encrypt, `noindex` снимется.

4. **Vercel.** Если основным становится VPS, задать на Vercel `NEXT_PUBLIC_SITE_URL` тем же доменом, чтобы обе копии указывали один каноникал.

## Что учесть

- **Обложки.** Картинки кейсов грузятся с `raw.githubusercontent.com` (`caseAssetBase`), поэтому новый кадр появится и на VPS только после push. Видео и 3D-модели лежат в архиве.
- **Курсы ЦБ.** `/api/rates` обновляется раз в час на самом сервере. Кэш ISR свой у каждого релиза.
- **Секреты.** Сборке они не нужны; `.env*` в архив не попадают, потому что сборка идёт из `git archive`.
