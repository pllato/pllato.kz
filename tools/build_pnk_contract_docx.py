from pathlib import Path
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "docx"
APP = ROOT / "app"
OUT.mkdir(parents=True, exist_ok=True)
APP.mkdir(parents=True, exist_ok=True)
OUTPUT = OUT / "Pllato_Dogovor_PNK_Portal.docx"
PUBLIC = APP / "dogovor-pnk.docx"

NAVY = "16233A"
PALE = "F3F6FA"
PALE_BLUE = "E9EFF7"
GRAY = "667085"
LINE = "D9D9D9"
WHITE = "FFFFFF"
BLACK = RGBColor(0, 0, 0)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=110, start=120, bottom=110, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for tag, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{tag}"))
        if node is None:
            node = OxmlElement(f"w:{tag}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_border(cell, color=LINE, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    node = OxmlElement("w:cantSplit")
    tr_pr.append(node)


def set_run_font(run, name="Arial", size=10.5, bold=None, color=BLACK):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    run.font.color.rgb = color


def set_paragraph_format(paragraph, before=0, after=5, line=1.15, keep_next=False):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line
    fmt.keep_with_next = keep_next


def add_page_field(paragraph):
    run = paragraph.add_run()
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char1, instr, fld_char2])
    set_run_font(run, size=8, color=RGBColor(102, 112, 133))


doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = Cm(1.7)
section.bottom_margin = Cm(1.6)
section.left_margin = Cm(2.0)
section.right_margin = Cm(2.0)
section.header_distance = Cm(0.8)
section.footer_distance = Cm(0.8)

styles = doc.styles
styles["Normal"].font.name = "Arial"
styles["Normal"]._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
styles["Normal"]._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
styles["Normal"].font.size = Pt(10.5)
styles["Normal"].font.color.rgb = BLACK
styles["Normal"].paragraph_format.space_after = Pt(5)
styles["Normal"].paragraph_format.line_spacing = 1.15

title_style = styles["Title"]
title_style.font.name = "Arial"
title_style._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
title_style._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
title_style.font.size = Pt(20)
title_style.font.bold = True
title_style.font.color.rgb = BLACK
title_style.paragraph_format.space_after = Pt(6)
title_ppr = title_style.element.get_or_add_pPr()
title_border = title_ppr.find(qn("w:pBdr"))
if title_border is not None:
    title_ppr.remove(title_border)

for name, size, before, after in (("Heading 1", 13.5, 12, 6), ("Heading 2", 11.5, 9, 4)):
    st = styles[name]
    st.font.name = "Arial"
    st._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = BLACK
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

# Header and footer
header = section.header
hp = header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
r = hp.add_run("ELC ALMATY   Договор на разработку портала ПНК")
set_run_font(r, size=8, bold=True, color=RGBColor(102, 112, 133))

footer = section.footer
ft = footer.add_table(rows=1, cols=2, width=Inches(6.7))
ft.alignment = WD_TABLE_ALIGNMENT.CENTER
ft.columns[0].width = Inches(5.9)
ft.columns[1].width = Inches(0.8)
p = ft.cell(0, 0).paragraphs[0]
r = p.add_run("Договор № PNK-2026-01 от 5 октября 2026 года")
set_run_font(r, size=8, color=RGBColor(102, 112, 133))
p = ft.cell(0, 1).paragraphs[0]
p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
add_page_field(p)


def add_heading(text, level=1):
    p = doc.add_paragraph(text, style=f"Heading {level}")
    return p


def add_clause(number, text, bold_lead=None):
    p = doc.add_paragraph()
    set_paragraph_format(p, after=5, line=1.15)
    r = p.add_run(f"{number} ")
    set_run_font(r, bold=True)
    if bold_lead and text.startswith(bold_lead):
        r = p.add_run(bold_lead)
        set_run_font(r, bold=True)
        r = p.add_run(text[len(bold_lead):])
        set_run_font(r)
    else:
        r = p.add_run(text)
        set_run_font(r)
    return p


def add_bullet(text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    set_paragraph_format(p, after=3, line=1.12)
    if not p.runs:
        p.add_run(text)
    else:
        p.runs[0].text = text
    for r in p.runs:
        set_run_font(r)
    p.paragraph_format.left_indent = Cm(0.7 + 0.5 * level)
    p.paragraph_format.first_line_indent = Cm(-0.35)
    return p


def make_table(headers, rows, widths, font_size=9.2, header_fill=NAVY, repeat=True):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for i, width in enumerate(widths):
        table.columns[i].width = Cm(width)
    header = table.rows[0]
    if repeat:
        set_repeat_table_header(header)
    for i, text in enumerate(headers):
        cell = header.cells[i]
        cell.width = Cm(widths[i])
        set_cell_shading(cell, header_fill)
        set_cell_border(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_paragraph_format(p, after=0, line=1.05)
        r = p.add_run(text)
        set_run_font(r, size=font_size, bold=True, color=RGBColor(255, 255, 255))
    for row_idx, values in enumerate(rows):
        row = table.add_row()
        set_cant_split(row)
        for i, value in enumerate(values):
            cell = row.cells[i]
            cell.width = Cm(widths[i])
            set_cell_border(cell)
            set_cell_margins(cell)
            if row_idx % 2 == 1:
                set_cell_shading(cell, PALE)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if i == 0 or len(str(value)) > 18 else WD_ALIGN_PARAGRAPH.CENTER
            set_paragraph_format(p, after=0, line=1.08)
            r = p.add_run(str(value))
            set_run_font(r, size=font_size)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


# Cover and parties
p = doc.add_paragraph("Договор на разработку программного обеспечения", style="Title")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p = doc.add_paragraph("№ PNK-2026-01")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_format(p, after=8)
for r in p.runs:
    set_run_font(r, size=12, bold=True)

meta = make_table(
    ["Место заключения", "Дата заключения", "Предмет"],
    [["город Алматы", "5 октября 2026 года", "Портал управления консалтингом и реестром членов Палаты"]],
    [4.0, 4.2, 8.8], font_size=9.4, header_fill=NAVY, repeat=False,
)

p = doc.add_paragraph()
set_paragraph_format(p, after=7, line=1.18)
text = (
    "Товарищество с ограниченной ответственностью «ELC ALMATY», БИН 151040007861, "
    "в лице директора Цая Платона Львовича, действующего на основании Устава, именуемое далее «Исполнитель», "
    "с одной стороны, и Общественное объединение «Палата Налоговых Консультантов» (республиканский статус), "
    "БИН 020740002798, в лице руководителя Шакеевой Хорунжей Меруерт Турсуновны, действующей на основании Устава, "
    "именуемое далее «Заказчик», с другой стороны, совместно именуемые «Стороны», заключили настоящий Договор."
)
r = p.add_run(text)
set_run_font(r)

add_heading("1 Предмет договора")
add_clause("1.1", "Исполнитель обязуется разработать, развернуть и передать Заказчику веб-приложение с мобильной адаптацией для управления консалтинговыми проектами и реестром членов Палаты, а Заказчик обязуется принять результат и оплатить работы на условиях настоящего Договора.")
add_clause("1.2", "Состав результата определяется Техническим заданием № TZ-PNK-2026-01 от 18 сентября 2026 года и Приложением 1 к настоящему Договору. Указанные документы являются его неотъемлемой частью. При расхождении приоритет имеют настоящий Договор, затем Приложение 1, затем Техническое задание.")
add_clause("1.3", "Система размещается на сервере Заказчика. Исполнитель передаёт исходный код, административные доступы и инструкции после полной оплаты и подписания акта полной сдачи.")
add_clause("1.4", "В первый релиз входят разделы 1–15 Технического задания. Интеграция с 1С, новый сайт pnk.kz, отдельный сервис массовых рассылок, подборка тендеров и мобильные приложения не входят в стоимость и выполняются только по отдельному соглашению.")

add_heading("2 Стоимость и порядок оплаты")
add_clause("2.1", "Стоимость работ составляет 2 500 000 два миллиона пятьсот тысяч тенге. НДС не начисляется, поскольку Исполнитель не является плательщиком НДС.")
make_table(
    ["Платёж", "Основание", "Доля", "Сумма", "Срок"],
    [
        ["1", "Начало работ", "10%", "250 000 ₸", "5 рабочих дней после подписания"],
        ["2", "Приёмка Ядра", "45%", "1 125 000 ₸", "5 рабочих дней после акта Ядра"],
        ["3", "Полная приёмка", "45%", "1 125 000 ₸", "5 рабочих дней после акта полной сдачи"],
    ],
    [1.1, 5.5, 1.4, 3.0, 5.0], font_size=8.8,
)
add_clause("2.2", "Датой оплаты считается день зачисления средств на расчётный счёт Исполнителя. До поступления первого платежа сроки выполнения работ не исчисляются.")
add_clause("2.3", "Абонентская плата за право использования Системы не предусмотрена. Сервер, домены, провайдер WhatsApp, IP-телефония, онлайн-платежи и иные услуги третьих лиц оплачиваются Заказчиком напрямую.")

add_heading("3 Сроки и этапы работ")
add_clause("3.1", "Плановый срок разработки составляет 6 недель с даты начала работ. Срок может быть увеличен до 8 недель при задержке материалов, доступов или согласований со стороны Заказчика, а также из-за сроков подключения сторонних сервисов.")
make_table(
    ["Этап", "Срок", "Результат"],
    [
        ["Запуск", "1 неделя", "Рабочая группа, доступы, сервер, данные, справочники и карта интеграций"],
        ["Ядро", "2–3 недели", "Роли, клиенты, проекты, таймшиты, согласование, отчёты, счета, себестоимость, задачи, реестр, кабинет члена, взносы и первый перенос данных"],
        ["Выпуски", "2–3 недели", "Не менее одного выпуска в неделю, правки в пределах Технического задания, документооборот, KPI, интеграции и публичный реестр"],
        ["Полная сдача", "до 6 недель", "Развёртывание, обучение, передача кода и доступов, переключение со старой системы"],
    ],
    [3.0, 3.0, 11.0], font_size=9.0,
)
add_clause("3.2", "Заказчик рассматривает каждый выпуск в течение 2 рабочих дней и направляет единый перечень замечаний. Срок продлевается на время просрочки ответа, непредоставления данных или доступа.")
add_clause("3.3", "Новые требования, которые отсутствуют в разделах 1–15 Технического задания, оформляются дополнительным соглашением с отдельной стоимостью и сроком.")

add_heading("4 Порядок сдачи и приёмки")
add_clause("4.1", "Исполнитель уведомляет Заказчика о готовности Ядра или полной версии, предоставляет доступ для проверки и направляет акт выполненных работ.")
add_clause("4.2", "Заказчик в течение 5 рабочих дней подписывает акт либо направляет мотивированный отказ с перечнем несоответствий Техническому заданию. Если Заказчик не направил подписанный акт или мотивированный отказ в установленный срок, соответствующий этап считается принятым.")
add_clause("4.3", "Исполнитель устраняет подтверждённые несоответствия без дополнительной оплаты. Пожелания, расширяющие согласованный объём, оцениваются отдельно.")
add_clause("4.4", "Ядро принимается по сквозному сценарию: сотрудник вносит время, руководитель согласует таймшит, система формирует отчёт и счёт, а проект показывает себестоимость и маржу.")
add_clause("4.5", "Полная версия принимается также по сценарию Палаты: кандидат регистрируется, загружает документы, принимается в члены, получает начисление взноса и уведомление, а оплата отражается в его кабинете.")
add_clause("4.6", "Отсутствие API, изменение правил или ограничение доступа со стороны внешнего сервиса не является недостатком Системы, если Исполнитель реализовал доступный и согласованный способ обмена.")

add_heading("5 Обязанности Исполнителя")
for num, text in [
    ("5.1", "Разработать Систему в согласованном объёме и обеспечить её работоспособность в современных версиях Chrome, Edge и Safari."),
    ("5.2", "Настроить роли, права, двухфакторную проверку для сотрудников, журнал действий и ежедневное резервное копирование на инфраструктуре Заказчика."),
    ("5.3", "Перенести доступные данные из Excel-выгрузок либо согласованным парсером без вмешательства в исходный код старой системы."),
    ("5.4", "Провести два обучающих занятия продолжительностью до 1,5 часа каждое: для сотрудников и для администратора Системы."),
    ("5.5", "Передать Заказчику исходный код, административные доступы и инструкции после полной оплаты."),
]: add_clause(num, text)

add_heading("6 Обязанности Заказчика")
for num, text in [
    ("6.1", "Назначить уполномоченного представителя, который собирает и передаёт Исполнителю единый перечень решений и замечаний."),
    ("6.2", "Своевременно предоставить реквизиты юридических лиц, справочники, шаблоны бланков, ставки, формулы, категории членов, правила взносов, тестовые данные и доступы."),
    ("6.3", "Обеспечить доступ к серверу, домену pnk.kz, корпоративной почте и кабинетам сторонних сервисов, а также получить необходимые согласия и лицензии."),
    ("6.4", "Проверять выпуски и подписывать акты в сроки разделов 3 и 4."),
    ("6.5", "Назначить сотрудников для обучения и не передавать доступы к Системе третьим лицам без необходимости."),
]: add_clause(num, text)

add_heading("7 Интеграции и инфраструктура")
add_clause("7.1", "В первый релиз входят подключение WhatsApp, IP-телефонии, корпоративной электронной почты, Kaspi для оплаты членских взносов, формы входа и регистрации с текущего сайта pnk.kz, а также публикация реестра из Системы.")
add_clause("7.2", "Интеграция выполняется при наличии документированного API, технического доступа и необходимых договоров Заказчика с провайдерами. Если прямой API недоступен, Стороны согласуют ссылку, файловый обмен или ручную отметку операции.")
add_clause("7.3", "Ориентировочные расходы, не входящие в цену Договора: сервер около 15 000 тенге в месяц, WhatsApp около 5 000 тенге за номер в месяц, IP-телефония около 30 000 тенге в месяц. Фактические тарифы определяют поставщики услуг.")

add_heading("8 Данные и конфиденциальность")
add_clause("8.1", "Заказчик определяет цели и состав обработки персональных данных и обеспечивает законные основания для их обработки. Исполнитель обрабатывает данные только для выполнения настоящего Договора и по указаниям Заказчика.")
add_clause("8.2", "Система размещается на сервере Заказчика. Исполнитель не вправе использовать данные членов Палаты, кандидатов, клиентов или сотрудников в собственных целях и не передаёт их третьим лицам, кроме привлечённых технических поставщиков, согласованных Заказчиком.")
add_clause("8.3", "Обязательство о конфиденциальности действует во время Договора и 5 лет после его прекращения. Коммерческие условия, исходные данные, персональные данные, доступы и внутренние документы считаются конфиденциальными.")
add_clause("8.4", "Заказчик отвечает за содержание загруженных материалов, уровни доступа своих пользователей и сохранность переданных ему ключей после завершения работ.")

add_heading("9 Права на результат работ")
add_clause("9.1", "Исключительные имущественные права на созданный для Заказчика исходный код, структуру базы данных, интерфейсы и документацию переходят к Заказчику после полной оплаты и подписания акта полной сдачи.")
add_clause("9.2", "Исполнитель сохраняет права на общие технические библиотеки, универсальные компоненты, методы и наработки, которые существовали до Договора или не содержат конфиденциальных данных Заказчика. Их использование не ограничивает право Заказчика эксплуатировать и изменять переданную Систему.")
add_clause("9.3", "Права на программные продукты и сервисы третьих лиц регулируются условиями их правообладателей.")

add_heading("10 Гарантия и сопровождение")
add_clause("10.1", "Гарантийный срок составляет 6 месяцев с даты подписания акта полной сдачи. Исполнитель бесплатно исправляет воспроизводимые ошибки, из-за которых согласованная функция не соответствует Техническому заданию.")
add_clause("10.2", "Гарантия не распространяется на новые функции, изменение бизнес-процессов, ошибки внешних сервисов, сбои инфраструктуры Заказчика, действия пользователей с повышенными правами и изменение кода третьими лицами.")
add_clause("10.3", "Доработки после приёмки выполняются по отдельному согласованию по часовой ставке или в рамках договора сопровождения.")

add_heading("11 Ответственность Сторон")
add_clause("11.1", "Стороны отвечают за нарушение обязательств в соответствии с настоящим Договором и законодательством Республики Казахстан.")
add_clause("11.2", "За просрочку оплаты Заказчик уплачивает пеню 0,1% от просроченной суммы за каждый календарный день, но не более 10% этой суммы.")
add_clause("11.3", "За просрочку полной сдачи по вине Исполнителя он уплачивает пеню 0,1% от стоимости просроченного этапа за каждый календарный день, но не более 10% стоимости этапа.")
add_clause("11.4", "Исполнитель не отвечает за упущенную выгоду, решения пользователей, качество исходных данных и перерывы в работе сторонних сервисов. Совокупная ответственность Исполнителя ограничена суммой, фактически оплаченной по Договору, кроме случаев умысла и нарушений, для которых закон устанавливает иной предел.")

add_heading("12 Обстоятельства непреодолимой силы")
add_clause("12.1", "Сторона освобождается от ответственности за неисполнение, вызванное чрезвычайными и непредотвратимыми обстоятельствами, возникшими после заключения Договора. Такая Сторона уведомляет другую Сторону в течение 5 рабочих дней.")
add_clause("12.2", "Срок исполнения продлевается на период действия обстоятельств и устранения их последствий. Если они продолжаются более 30 календарных дней, каждая Сторона вправе предложить прекращение Договора с оплатой фактически выполненных работ.")

add_heading("13 Срок действия и прекращение")
add_clause("13.1", "Договор действует с даты подписания до полного исполнения обязательств, а условия о конфиденциальности, правах и гарантии действуют в пределах установленных сроков.")
add_clause("13.2", "Каждая Сторона вправе отказаться от Договора при существенном нарушении другой Стороной, если нарушение не устранено в течение 10 рабочих дней после письменного уведомления.")
add_clause("13.3", "При досрочном прекращении Заказчик оплачивает фактически выполненные и переданные работы. Исполнитель передаёт оплаченный результат в текущем состоянии.")

add_heading("14 Разрешение споров")
add_clause("14.1", "Стороны стремятся урегулировать спор переговорами и обязательной письменной претензией. Срок ответа на претензию составляет 10 рабочих дней.")
add_clause("14.2", "Неурегулированный спор рассматривается судом по месту нахождения ответчика в соответствии с законодательством Республики Казахстан.")

add_heading("15 Заключительные положения")
add_clause("15.1", "Изменения действительны, если оформлены письменно и подписаны обеими Сторонами, в том числе электронной цифровой подписью НУЦ РК.")
add_clause("15.2", "Стороны признают юридическую силу уведомлений, актов, счетов, файлов и согласований, направленных с корпоративных адресов и номеров уполномоченных представителей. Изменение контакта сообщается письменно.")
add_clause("15.3", "Договор составлен на русском языке в двух экземплярах равной юридической силы либо подписывается в электронном виде.")
add_clause("15.4", "Приложения к Договору: Приложение 1 Состав и критерии приёмки; Приложение 2 График платежей и форма акта; Техническое задание № TZ-PNK-2026-01 от 18 сентября 2026 года.")

add_heading("16 Реквизиты и подписи")
parties = make_table(
    ["Исполнитель", "Заказчик"],
    [[
        "ТОО «ELC ALMATY»\nБИН 151040007861\nИИК KZ82722S000033379752\nАО «Kaspi Bank»\nБИК CASPKZKA\nКБе 17\nг. Алматы, ул. Желтоксан, 118, офис 407\nДиректор Цай Платон Львович\n\n___________________ Цай П. Л.",
        "Общественное объединение «Палата Налоговых Консультантов» (республиканский статус)\nБИН 020740002798\nИИК KZ956017131000052400\nАО «Народный Банк Казахстана»\nБИК HSBKKZKX\nКБе 18\n050006, г. Алматы, мкр. Калкаман 2, ул. Байкена Ашимова, 297, офис 21А\nРуководитель Шакеева-Хорунжая Меруерт Турсуновна\n\n___________________ Шакеева-Хорунжая М. Т.",
    ]],
    [8.5, 8.5], font_size=9.2,
)

p = doc.add_paragraph("Приложение 1", style="Title")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.page_break_before = True
p = doc.add_paragraph("Состав работ и критерии приёмки")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in p.runs:
    set_run_font(r, size=13, bold=True)
set_paragraph_format(p, after=10)

scope_rows = [
    ["1", "Роли и доступы", "Шесть внутренних и две внешние роли, права по подразделениям и юрлицам, 2FA, блокировка уволенного пользователя"],
    ["2", "Клиенты и проекты", "Карточка клиента, договоры и ставки, проекты от разовой консультации до сопровождения, воронки по направлениям"],
    ["3", "Учёт времени", "Ручной ввод и таймер, billable и non billable, согласование, закрытие периода и контроль заполнения"],
    ["4", "Отчёты и счета", "Отчёт на бланке в Word и PDF, согласование, отправка по e mail, счёт из отчёта и дебиторская задолженность"],
    ["5", "Себестоимость и KPI", "Себестоимость часа и проекта, маржа, управленческая зарплата и настраиваемые KPI"],
    ["6", "Табель и отпуска", "Табель по юрлицам, календарь отсутствий, заявки и остаток отпуска, личный кабинет сотрудника"],
    ["7", "Задачи и календари", "Поручения, сроки, контроль просрочки, личные и общие календари, напоминания"],
    ["8", "Документооборот", "Журналы входящих и исходящих с автонумерацией, приказы и блокирующее ознакомление"],
    ["9", "Палата", "Кандидаты, документы, решение о приёме, реестры, публикация, членские взносы и кабинет члена"],
    ["10", "Уведомления", "Событийные письма и уведомления, библиотека разъяснений, история доставки"],
    ["11", "Интеграции", "WhatsApp, IP телефония, электронная почта, Kaspi, действующий сайт pnk.kz при наличии технического доступа"],
    ["12", "Безопасность", "Сервер Заказчика, 2FA, журнал действий и просмотра данных, резервное копирование"],
    ["13", "Перенос", "Excel выгрузки или согласованный парсер, тестовый и финальный перенос без доступа к исходному коду старой CRM"],
    ["14", "Запуск", "Развёртывание, обучение, инструкции, передача кода и доступов"],
]
make_table(["№", "Блок", "Результат"], scope_rows, [1.0, 4.0, 12.0], font_size=8.7)

add_heading("Критерии приёмки", 1)
for item in [
    "Сквозной сценарий консалтинга проходит от записи времени до отправленного счёта и расчёта маржи на данных Заказчика.",
    "Сквозной сценарий Палаты проходит от регистрации кандидата до начисленного взноса и отражённой оплаты в кабинете.",
    "Каждая роль видит только согласованные разделы и данные, а действия записываются в журнал.",
    "Печатные формы, нумерация документов и основные справочники соответствуют утверждённым образцам Заказчика.",
    "Перенесённые контрольные выборки совпадают с исходными выгрузками по количеству и ключевым полям.",
]: add_bullet(item)

add_heading("Не входит в стоимость", 1)
make_table(
    ["Опция", "Ориентировочная стоимость", "Условие"],
    [
        ["Интеграция с 1С 8.x", "800 000 ₸", "После обследования конфигурации"],
        ["Новый сайт pnk.kz", "1 000 000 ₸", "Отдельный проект вместо WordPress"],
        ["Сервис массовых рассылок", "350 000 ₸", "Конструктор, сегменты и статистика"],
        ["Подборка тендеров", "от 300 000 ₸", "При наличии API площадок"],
        ["Мобильные приложения", "отдельная оценка", "После стабилизации веб версии"],
    ],
    [6.0, 4.0, 7.0], font_size=8.8,
)

p = doc.add_paragraph("Приложение 2", style="Title")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.page_break_before = True
p = doc.add_paragraph("График платежей и форма акта")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in p.runs:
    set_run_font(r, size=13, bold=True)
set_paragraph_format(p, after=10)

add_heading("График платежей", 1)
make_table(
    ["№", "Основание", "Доля", "Сумма", "Срок оплаты"],
    [
        ["1", "Подписание Договора и начало работ", "10%", "250 000 ₸", "5 рабочих дней"],
        ["2", "Подписание акта приёмки Ядра", "45%", "1 125 000 ₸", "5 рабочих дней"],
        ["3", "Подписание акта полной сдачи", "45%", "1 125 000 ₸", "5 рабочих дней"],
        ["", "Итого", "100%", "2 500 000 ₸", ""],
    ],
    [1.0, 6.4, 1.5, 3.2, 4.9], font_size=8.9,
)

add_heading("Форма акта выполненных работ", 1)
spacer = doc.add_paragraph()
set_paragraph_format(spacer, after=2)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("АКТ ВЫПОЛНЕННЫХ РАБОТ № ______")
set_run_font(r, size=12, bold=True)
set_paragraph_format(p, after=9)

p = doc.add_paragraph("к Договору № PNK-2026-01 от 5 октября 2026 года")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in p.runs: set_run_font(r, size=9.5)

for text in [
    "ТОО «ELC ALMATY» в лице директора Цая Платона Львовича и Общественное объединение «Палата Налоговых Консультантов» (республиканский статус) в лице руководителя Шакеевой-Хорунжей Меруерт Турсуновны составили настоящий Акт.",
    "Исполнитель передал, а Заказчик принял следующий результат работ:",
]:
    p = doc.add_paragraph(text)
    set_paragraph_format(p, after=7, line=1.18)
    for r in p.runs: set_run_font(r)

make_table(
    ["Этап", "Описание принятого результата", "Сумма"],
    [["________________", "____________________________________________________________\n____________________________________________________________", "____________ ₸"]],
    [3.5, 10.0, 3.5], font_size=9.2,
)

p = doc.add_paragraph("Работы выполнены в согласованном объёме. Заказчик претензий по объёму, качеству и срокам не имеет, кроме замечаний, прямо указанных ниже.")
for r in p.runs: set_run_font(r)
p = doc.add_paragraph("Замечания при наличии: ______________________________________________________________________________________")
for r in p.runs: set_run_font(r)

sig = make_table(
    ["Исполнитель", "Заказчик"],
    [["ТОО «ELC ALMATY»\n\n________________ Цай П. Л.\nМ П", "ОО «Палата Налоговых Консультантов»\n\n________________ Шакеева-Хорунжая М. Т.\nМ П"]],
    [8.5, 8.5], font_size=9.4,
)

# Preserve semantic metadata and save.
doc.core_properties.title = "Договор на разработку портала ПНК"
doc.core_properties.subject = "Разработка системы управления консалтингом и реестром членов Палаты налоговых консультантов"
doc.core_properties.author = "ТОО ELC ALMATY"
doc.core_properties.keywords = "ПНК, договор, разработка программного обеспечения, ELC ALMATY"

doc.save(OUTPUT)
PUBLIC.write_bytes(OUTPUT.read_bytes())
print(OUTPUT)
print(PUBLIC)
