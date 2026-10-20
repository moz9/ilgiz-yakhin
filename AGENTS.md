<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Liquid Glass

- Стекло несёт функциональную роль: навигация, профильная карточка, бейджи фактов, CTA. Текстовые секции остаются редакционными, без стеклянной мозаики.
- Настройка одна: ползунок «Liquid Glass» в доке (`portfolio-appearance`) двигает `--glass-tint` и `--glass-blur` для всех поверхностей сразу. Прозрачный конец диапазона сохраняет материал.
- `opacity`, `filter` или `mask` на предке стекла ломают выборку backdrop — стекло перестаёт преломлять фон. Не оборачивать `GlassLayer` в такие контейнеры и не гасить прозрачность родителя.
- Текст стеклянного элемента должен быть элементом, а не текстовым узлом: `.liquid-surface > :not(.glass-layer)` поднимает над слоем только элементы, а голый текст оказывается под стеклом и размывается вместе с фоном.
- Преломление (T2) работает только в Chromium через SVG-фильтр в `GlassLayer`; остальные движки остаются на T1 (blur). Проверять фактический рендер, а не наличие CSS-класса.
- В публичном портфолио нет фотографии: карточка строится на типографике и статусе. Не возвращать портрет без прямого запроса пользователя — `tests/e2e/portfolio.spec.ts` фиксирует отсутствие изображений на `/resume`.

