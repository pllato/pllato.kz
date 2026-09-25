# Графический PDF-редактор v493

Вход: «Работа в графическом формате». Векторные линии и контуры выбираются кликом,
двигаются/редактируются точками и удаляются по ID; соседние пересечения не стираются.
Слой для выбора задаётся справа. Alt + клик позволяет выбрать другой исходный объект
в том же месте. Заполненный составной контур (например кольцо с отверстием) — один объект.
Текст PDF и растровые изображения сохраняются при отображении, но не редактируются этим инструментом.

«Сохранить» сохраняет оригинальный PDF вместе с геометрией правок в проекте. Старые
проекты без исходного PDF остаются в прежнем режиме; для нового режима нужно открыть PDF.
«Скачать PDF» после изменения исходных объектов выдаёт растровый PDF для печати без масок.
Для дальнейшего объектного редактирования следует передавать проект. Режим «Линейка»
и его текстовый парсер не изменены.

`pdf-objects.js`: извлекает команды рисования и слои; ID = индекс оператора + под-контур.
Несколько пересекающихся под-контуров в одной операции stroke имеют разные ID.
Кривые хранят точный SVG path, а выбор/редактирование используют точки. Контуры,
одновременно задающие clipping, не предлагаются для редактирования, чтобы не менять
область отсечения соседей. Растеризация служит только кэшем отображения.

Фильтр создаёт копию operator list и исключает конкретные под-контуры. Фон не стирается
по цвету/координатам. Адаптер PDFPageProxy использует внутреннее состояние PDF.js,
поэтому намеренно ограничен уже подключённой версией **3.11.174** и останавливается с
ошибкой при другой версии. Перед обновлением PDF.js нужны повторные проверки.
Рендер идёт в отдельном документе и очереди по странице, чтобы не менять списки,
которые используются миниатюрами и другими операциями.

`pdf-editor.js`: интеграция с текущей моделью, выбором, слоями, undo, проектами и экспортом.
Не создаёт десятки тысяч SVG DOM-элементов: исходные объекты индексируются, а SVG
создаются только для выбранных/изменённых объектов. Исходные объекты не объединяются
по близости, цвету или пересечению. Автоматическое распознавание полного кабеля/розетки
как семантической группы — отдельная задача.

Проверки: `tests/plan-fakt-pdf-objects.cjs` сравнивает итоговые пиксели с независимым
PDF-эталоном, из которого соответствующая линия изначально исключена. Проверяются
одинаковый цвет, одна команда stroke, совпадающие объекты, заливки, clipping,
поворот страницы, трансформация, закрытый под-контур, кривая Безье и неизменность оригинала.

Для запуска в среде с PDF.js 3.11.174, pdf-lib и @napi-rs/canvas:

```
PDFJS_TEST_MODULE=/path/to/pdf.js node tests/plan-fakt-pdf-objects.cjs
```

PDF.js worker той же версии должен лежать рядом с тестовым pdf.js. Эти библиотеки
используются только тестовым раннером; новые зависимости приложения не добавлены.

Дополнительно проверены в браузере: выбор, удаление, пересечение на цветном фоне,
перенос, отмена, повторное открытие проекта, экспорт и независимость дубликата.
На странице 19 пользовательского PDF 2724_01_03_S19_EM01_AL обнаружены 61 612 объектов;
удалена только трасса 119240:0 слоя «ЭЛ», осталось 61 611 исходных объектов.
PDF пользователя и временные тестовые страницы в репозиторий не включены.

## Автоматическое предложение масштаба (v494)

`pdf-scale.js` извлекает подписи `1:N` (в том числе из соседних текстовых элементов)
и сопоставляет числовые размеры с прямыми линиями и двумя диагональными засечками.
Концы длинной линии могут выступать за засечки: измеряется расстояние между
пересечениями, а не полная длина штриха. Предложение по геометрии требует минимум
трёх согласованных размеров, двух различных значений и контрольных отрезков не
короче 75 единиц PDF. Согласованность — в пределах 1%; результат — медиана.
Размеры без единиц трактуются как миллиметры, что явно указано при подтверждении.

`pdf-scale-ui.js` предлагает найденный масштаб на текущем листе. В окне показан
контрольный фрагмент исходного PDF, концы и сравнение подписи с рассчитанной длиной.
Подпись масштаба без геометрического подтверждения сопровождается пояснением о
физическом размере страницы. Учтены поворот страницы и PDF UserUnit; единицы
координат переводятся в метры на пиксель текущего фона, независимо от зума.
Существующий масштаб не перезаписывается автоматически. Подтверждённое значение
хранится в прежнем `edits.cal`, сведения об основании — в `data.pages[pn].scaleCalibration`.
Смена страницы/файла закрывает окно и инвалидирует незавершённое обнаружение.

Ограничения: скан без текста, размеры со стрелками вместо диагональных засечек,
короткие или неоднозначные размеры могут требовать двух ручных точек. OCR не добавлен.
При нескольких разных масштабах требуется выбор: выбранное значение применяется
ко всему листу; отдельных масштабных областей пока нет. Экспортированный с другим
размером листа PDF надёжнее калибровать по размерным линиям, а не подписи `1:N`.

Проверка ядра: `node tests/plan-fakt-pdf-scale.cjs` (без зависимостей).
Проверено в браузере на исходном PDF: лист 19 — 12 согласованных размеров,
контроль 15200 мм → 15200 мм, масштаб около 1:100. Проверены подтверждение,
отмена, ручная замена, независимость листов, сохранение и восстановление проекта,
закрытие при смене листа, отсутствие масштаба, выбор между двумя подписями,
мобильное окно 390×844. Изменений парсера Линейки нет.

## Группы страниц (v495)

`pdf-pages.js` читает текст страниц последовательно в фоне, без полного рендера.
Планы распознаются по названию в нижней правой области штампа (включая
«Молниезащита. План кровли»). Неопознанные листы остаются доступными
в раскрываемой группе «Остальные страницы». Это эвристика: сканы, другой
штамп или ориентация могут потребовать ручного переноса.

Кнопки «В чертежи»/«В остальные» меняют только организацию списка, не PDF.
`data.pages[pn].pageGroup` хранит ручной выбор, `pageGroupAuto` — результат
распознавания. Ручной выбор имеет приоритет и сохраняется в обычном проекте.
Порядок и номера страниц, экспорт и расчёты не фильтруются.
При выборе инструмента «Линия» окно масштаба предлагает «Применить и рисовать».
Проверены реальный PDF, ручной перенос туда/обратно, сворачивание, восстановление
проекта, мобильное окно и переход от подтверждения масштаба к рисованию.

## Sharp zoom (v497)

`pdf-zoom.js` renders the visible PDF area at screen resolution after a 140 ms
zoom/pan debounce. Canvas allocation is limited to 8 MP and 4096 pixels per side,
with 32 screen pixels of overscan. Original PDF vectors/text are rendered again;
a scan cannot acquire detail absent from its source. During motion the ordinary
preview remains visible. Editing coordinates and calibration never change.

The crop sits above the background/masks and below editable SVG objects. It uses
the same filtered PDF operator list to omit promoted/deleted originals. Rendering
is serialized, pending requests coalesced, and stale results rejected after edits,
page/source changes or movement. Dimming is applied once against the canvas-area
background. Vector-only mode hides this layer.

Validation: 2400% zoom on the user's PDF at DPR=2, pan/page races, actual crop
pixels after deletion (crossing blue remains, removed line reveals background),
dimming and vector mode. Core pixel regressions additionally compare 8x crops
against independently generated expected PDFs, including rotation and clipping.

## Matching new route appearance (v499)

`pdf-line-style.js` samples long saturated cable strokes on the current PDF sheet,
excluding fills and short symbols. It selects the closest category colour and
its representative stroke weighted by length. No cable type is inferred from
colour: the user's chosen calculation category remains unchanged. Width converts
from PDF units to the existing editor coordinate system. Dash, cap, join and alpha
are stored in each new line's `pdfLineStyle`; old projects remain compatible.

New lines match automatically. Existing user lines have a `Как в PDF` action with
undo. Persistent large length labels are omitted for matched lines; selection
measurement and calculation remain available. A manually chosen drawing width is
stored per category/page, and the match action resets that override. Matched
lines use raster PDF export so curves/strokes agree with the editor. Source PDF
and editable geometry remain in the saved project.

Browser validation: actual page 19 selects #0000ff and 0.84 PDF-unit stroke
(1.69596 editor pixels at width 3400). New-line creation, restyling, undo,
project reload and export pixels were checked; exported stroke is blue (1,1,254).

## Whole device selection (v500)

`pdf-devices.js` adds an explicit rectangle-and-review tool. Only complete paths
inside the rectangle are proposed; dark paths are the default, with an all-colours
option. The user can exclude individual paths before confirming. This does not
infer semantic devices automatically and does not group PDF text labels.

Confirmed parts retain their original paths and styles and share a persistent
`_pdfDevice` group. Selection, movement, duplication and deletion act on the whole
group. The object list shows one device and the selection omits line-node and
scale controls. Existing PDF filtering removes originals without erasing crossings.

Validation: synthetic crossing wall/cable fixture, review toggles, rigid drag,
independent duplicate, delete/undo and project restore. On the user's page 19, a
22-path black symbol groups accurately even after one path was promoted earlier.

## Reference column visibility (v502)

Paired notes and legend headings in the rightmost 35 percent identify a reference column on first opening a sheet. An optional scheme heading extends it upward; a text gap after legend rows ends it before the title block. Other layouts can use manual area selection. A per-page checked flag preserves a decision to restore content. Export inclusion remains selectable. Validated on actual page 19 without preview presets, restoration after project reopen and both export pixel checks.

## Automatic device selection (v503)

Electrical device layers are partitioned into connected bounding-box components with a spatial grid and 0.25 PDF-unit tolerance. Large, tiny, elongated and stroke-only open components are excluded. Unknown layers retain manual grouping. This is conservative geometry/layer recognition, not a universal symbol classifier; adjoining socket blocks may form one device. Detection does not mutate the PDF/project. Transparent hit targets promote a complete group only on selection, allowing the first pointer gesture to move it. Source IDs prevent deleted or moved groups from reappearing. Hidden-area masks remain above targets.

Tests cover independent groups, excluded cable/wall/text layers, switch layers, size and shape rejection; actual page 19 identifies 76 groups and first-drag moves a 21-contour socket rigidly. Manual grouping, duplicate/delete/undo and project restore regressions also pass.

## Immediate manual grouping (v505)

Manual rectangle selection now commits the group on pointer release, removing the confirmation step. All colours are enabled by default since v504. Undo returns the original ungrouped objects; empty rectangles keep the tool active with guidance. Browser validation covers immediate selection, subsequent rigid drag, duplicate/delete/undo and project reopen.

## Sheet composition (v506)

`pdf-sheet-layout.js` stores normalized crop bounds, quarter-turn rotation, title,
signature rows and an optional TSV table or embedded table image in each page's
`sheetLayout`. The source PDF and editing/calibration coordinates do not change.
A CSS matrix and clipping display only the selected area on a composed sheet;
inverse mapping keeps pointer editing correct. Fit/centering use sheet bounds,
and the sharp PDF viewport now uses inverse-mapped screen corners.

History includes layout changes. Export disables the vector fast path for laid-out
projects, composes the edited source crop with matching SVG title/footer content,
and derives output page dimensions without changing source physical scale. Sheet
size follows crop/orientation rather than a fixed A-series paper preset. Composition
is bounded to 4096 pixels per side and 12 MP. Other pages keep existing export.

Browser integration test `tests/plan-fakt-sheet-layout.cjs` creates a synthetic PDF
and checks crop UI, TSV/title, all four inverse rotations, actual object drag and
undo after rotation, image table upload, exported red source/cyan image pixels and
absence of green content outside the crop, plus project restore. Visual review
also used the original page 19.

## Reference-style landscape sheet (v507)

The layout now uses a landscape aspect ratio with an engineering frame, italic
title, bottom-left quantity table and bottom-right main inscription with editable
document, project, organization, drawing, sheet and signature fields. This is a
visual template based on the user's example, not a certified standards template.
No real signature or seal is synthesized; an optional user image can be uploaded.

A separate compass has saved position and angle, independent of crop rotation.
Its screen overlay and export pass sit above the drawing. Quick actions rotate
the drawing, add/rotate the compass, or reopen the table/stamp fields at any time.
Tests cover compass insertion/rotation/drag, table and seal image uploads, stamp
fields, project restoration, existing crop/coordinate/export regressions.

## On-sheet editing and seal library (v508)

Interactive decoration rendering adds transparent hit cells for table, title,
stamp metadata, signature and revision fields. `pdf-sheet-inline.js` opens a
positioned text editor with Enter/blur commit, Escape cancellation and Tab movement.
TSV clipboard ranges (including quoted fields) populate table cells from the selected
origin, with the existing 12-row/8-column bounds. Values remain plain text.

The seal region opens a selector with upload. Images are stored in the browser's
IndexedDB `planfakt-seal-library`; the chosen image is also embedded in page layout
so projects remain portable. Library entries are not uploaded to an external service.
Asynchronous reads/uploads are guarded against page/project changes. Interactive
hit targets and hints are omitted from exported SVG decorations.

`tests/plan-fakt-sheet-inline.cjs` covers direct edit/undo, Excel range paste,
stamp/signature/revision text, Escape, two uploads, saved-seal selection/removal/undo
and project restore with library reuse. Existing layout/export tests also pass.

### v509: drawing placement
The Чертёж quick action enables a whole-crop move target and four proportional
resize handles. Done/Escape exits placement mode. Center resets the normalized
sheet offset; Size 100% resets drawingScale. Source coordinates and calibration
remain unchanged. Geometry uses a general inverse matrix; the sharp PDF layer
accounts for the effective drawing scale. Both fields persist in sheetLayout
and are consumed by export. Layout integration tests cover move/resize, fixed
paper dimensions, inverse mapping, undo, center, export and project restore.

### v510: source inscription and directories
pdf-sheet-stamp.js detects a closed lower-right rectangular inscription in the
vector scene and captures an unmodified high-resolution crop. Grid segments
define editable cells, including blank cells; PDF text populates the editor.
Untouched content stays in the original crop. Replacing a cell masks its interior
only and draws its new text/image. The final logo/company cell is split when
their positions support it. Reset restores the original cell pixels and text.
The source stamp can also be selected manually through Штамп / source controls.
Recognition is geometric and conservative, not OCR: scanned or unusual tables
may require a different extraction approach; manual capture preserves their image.

IndexedDB planfakt-stamp-directories stores person/company text and logo/signature
images. Users can add, update, delete and select entries. These are browser-local
directories, not a shared account backend. Selected content is embedded into
sheetLayout.originalStamp for portable projects and PDF export. Existing seal
library remains available above the original stamp. Source selection, async
capture and dialogs are guarded against page/project changes.

tests/plan-fakt-stamp.cjs uses the real PDF served as /real.pdf to verify table
recognition, separate company/logo regions, edit/undo, person record creation and
update, signature upload/selection, company creation/deletion, project restore,
and composition export pixels. Generic layout and inline editing regressions pass.

### v511: cable callouts
pdf-cable-labels.js adds a repeat placement tool with editable brand, section,
optional note, size and leader side. Defaults persist in project data and local
browser preferences. Clicks snap to nearby vector/source or edited line segments;
a raster-only page uses the clicked source coordinate. Callouts are independent
text objects with _cableLabel metadata and source-coordinate anchors. Dragging the
label moves its shelf while preserving the anchor; double-click or the selection
bar edits its content. Existing undo/delete/project persistence applies. Both SVG
and canvas renderers draw the shelf and leader; vector-only export falls back to
the edited PDF renderer when callouts exist. Uncalibrated pages are supported.

Tests cover repeated placement, undo, anchored dragging, editing, transformed
sheet clicks, project restore, canvas/PDF export and browser errors.

### v513: movable seal
Both original and generated stamps use the shared seal renderer. An empty slot
shows the insertion placeholder; an inserted image has no dashed placeholder.
Click selects the seal and exposes replace/remove; dragging persists normalized
sheetLayout.sealPosition with one undo step. Outside click/Escape clears the
transient selection. The seal is rendered above the plan on screen and export.
Inline browser tests cover select/drag/deselect, undo, library operations, project
restore and exported blue-pixel centroid alignment for both stamp types.

### v514: complete source-signature replacement
Source vector handwriting in the signature column is assigned to its owning row.
The base crop is rendered with those PDF objects removed; unchanged signatures
are separate vector overlays. A changed cell suppresses its entire original
signature, including strokes that cross cell borders, without whitening adjacent
cells or grid lines. Legacy originalStamp records upgrade on display and before
export, preserving existing edits and selected images. Raster-only handwriting
is outside this vector extraction path.

The real-PDF test checks all nine handwriting paths across four rows: deleting
the first leaves zero dark-blue pixels, while neighboring teal/gray pixel counts
stay unchanged; clearing all rows removes colored handwriting. Legacy upgrade,
project restore and export are also exercised.

### v515: whole-table Excel paste
The action above the left table and the toolbar Table button open a dedicated
whole-table paste dialog with dimensions and a full preview. Applying replaces
the previous matrix/image instead of inserting at a cell offset. Quoted TSV,
CRLF and an HTML-table text fallback are accepted; the limit is 100 rows by 26
columns. Large ranges fit the existing footer and may render with smaller text.
Multi-cell paste into an inline cell also replaces the complete matrix; single
cell editing remains available. Undo, project storage and export use the existing
sheetLayout.table model. Browser tests cover old-row removal, arbitrary-cell
paste, 20-row input, HTML fallback, editing, undo, restore and PDF export.
