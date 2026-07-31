from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
PUBLISHED = ROOT / "app" / "files"
OUT.mkdir(parents=True, exist_ok=True)
PUBLISHED.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_ITALIC = "/System/Library/Fonts/Supplemental/Arial Italic.ttf"
pdfmetrics.registerFont(TTFont("Arial", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("Arial-Bold", FONT_BOLD))
pdfmetrics.registerFont(TTFont("Arial-Italic", FONT_ITALIC))

NAVY = colors.HexColor("#0A1628")
NAVY_2 = colors.HexColor("#25334B")
BRONZE = colors.HexColor("#9A6A36")
BRONZE_LIGHT = colors.HexColor("#F5EEE6")
CREAM = colors.HexColor("#FBFAF7")
LINE = colors.HexColor("#E8E1D8")
TEXT = colors.HexColor("#151B26")
MUTED = colors.HexColor("#687184")
GREEN = colors.HexColor("#0F9D58")
GREEN_LIGHT = colors.HexColor("#EAF7EF")
BLUE_LIGHT = colors.HexColor("#EDF3FB")
AMBER_LIGHT = colors.HexColor("#FFF5DD")
RED_LIGHT = colors.HexColor("#FDEEEE")
WHITE = colors.white

PAGE_W, PAGE_H = A4
LEFT = 17 * mm
RIGHT = 17 * mm
TOP = 18 * mm
BOTTOM = 16 * mm


class ScriptDocTemplate(BaseDocTemplate):
    def __init__(self, filename, title, edition, **kwargs):
        self.document_title = title
        self.edition = edition
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=LEFT,
            rightMargin=RIGHT,
            topMargin=TOP,
            bottomMargin=BOTTOM,
            title=title,
            author="Pllato",
            subject="Рабочий скрипт звонка",
            **kwargs,
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="body",
            leftPadding=0,
            rightPadding=0,
            topPadding=8 * mm,
            bottomPadding=5 * mm,
        )
        self.addPageTemplates(
            PageTemplate(id="main", frames=[frame], onPage=self._page)
        )

    def _page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, PAGE_H - 11 * mm, PAGE_W, 11 * mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont("Arial-Bold", 9)
        canvas.drawString(LEFT, PAGE_H - 7 * mm, "PLLATO")
        canvas.setFont("Arial", 7.5)
        canvas.drawRightString(
            PAGE_W - RIGHT, PAGE_H - 7 * mm, self.edition.upper()
        )
        canvas.setStrokeColor(LINE)
        canvas.line(LEFT, 10 * mm, PAGE_W - RIGHT, 10 * mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("Arial", 7.5)
        canvas.drawString(LEFT, 6.5 * mm, self.document_title)
        canvas.drawRightString(
            PAGE_W - RIGHT, 6.5 * mm, f"стр. {doc.page}"
        )
        canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverKicker",
        fontName="Arial-Bold",
        fontSize=9,
        leading=12,
        textColor=BRONZE,
        spaceAfter=8,
        uppercase=True,
        tracking=1.4,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        fontName="Arial-Bold",
        fontSize=29,
        leading=32,
        textColor=NAVY,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSubtitle",
        fontName="Arial",
        fontSize=12,
        leading=18,
        textColor=MUTED,
        spaceAfter=18,
    )
)
styles.add(
    ParagraphStyle(
        name="H1Custom",
        fontName="Arial-Bold",
        fontSize=20,
        leading=24,
        textColor=NAVY,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="H2Custom",
        fontName="Arial-Bold",
        fontSize=13,
        leading=17,
        textColor=NAVY,
        spaceBefore=6,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCustom",
        fontName="Arial",
        fontSize=9.5,
        leading=14,
        textColor=TEXT,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="BodySmall",
        fontName="Arial",
        fontSize=8.3,
        leading=11.5,
        textColor=TEXT,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyMuted",
        fontName="Arial",
        fontSize=9,
        leading=13,
        textColor=MUTED,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Quote",
        fontName="Arial-Bold",
        fontSize=10.2,
        leading=15,
        textColor=NAVY,
    )
)
styles.add(
    ParagraphStyle(
        name="Label",
        fontName="Arial-Bold",
        fontSize=7.6,
        leading=10,
        textColor=BRONZE,
        uppercase=True,
        tracking=0.8,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        fontName="Arial-Bold",
        fontSize=8,
        leading=10,
        textColor=WHITE,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="TableBody",
        fontName="Arial",
        fontSize=8,
        leading=11,
        textColor=TEXT,
    )
)
styles.add(
    ParagraphStyle(
        name="Centered",
        fontName="Arial",
        fontSize=8.5,
        leading=12,
        textColor=MUTED,
        alignment=TA_CENTER,
    )
)


def p(text, style="BodyCustom"):
    return Paragraph(text, styles[style])


def callout(label, text, fill=BRONZE_LIGHT, border=LINE, quote=False):
    content = [
        p(label.upper(), "Label"),
        Spacer(1, 2 * mm),
        p(text, "Quote" if quote else "BodyCustom"),
    ]
    table = Table([[content]], colWidths=[PAGE_W - LEFT - RIGHT])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.8, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    return table


def step_block(number, title, goal, phrase, note=None):
    badge = Table(
        [[p(number, "TableHead")]],
        colWidths=[11 * mm],
        rowHeights=[11 * mm],
    )
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BOX", (0, 0), (-1, -1), 0, NAVY),
            ]
        )
    )
    body = [
        p(title, "H2Custom"),
        p(f"<b>Цель:</b> {goal}", "BodyMuted"),
        callout("Говорим", phrase, fill=CREAM, border=LINE, quote=True),
    ]
    if note:
        body.extend([Spacer(1, 2 * mm), p(f"<b>Важно:</b> {note}", "BodySmall")])
    table = Table(
        [[badge, body]],
        colWidths=[14 * mm, PAGE_W - LEFT - RIGHT - 14 * mm],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 3 * mm),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return KeepTogether([table, Spacer(1, 5 * mm)])


def branch_table(rows, widths=None):
    if widths is None:
        widths = [55 * mm, 118 * mm]
    data = [
        [p("СИТУАЦИЯ", "TableHead"), p("ОТВЕТ / ДЕЙСТВИЕ", "TableHead")]
    ]
    data.extend([[p(a, "TableBody"), p(b, "TableBody")] for a, b in rows])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.7 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.7 * mm),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [WHITE, CREAM],
                ),
            ]
        )
    )
    return table


def bullets(items, fill=WHITE):
    rows = []
    for item in items:
        rows.append([p("•", "H2Custom"), p(item, "BodyCustom")])
    table = Table(rows, colWidths=[6 * mm, PAGE_W - LEFT - RIGHT - 6 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return table


def cover(story, kicker, title, subtitle, audience, outcome, source):
    story.extend(
        [
            Spacer(1, 14 * mm),
            p(kicker, "CoverKicker"),
            p(title, "CoverTitle"),
            p(subtitle, "CoverSubtitle"),
            callout(
                "Цель звонка",
                outcome,
                fill=GREEN_LIGHT,
                border=colors.HexColor("#B8E0C6"),
                quote=True,
            ),
            Spacer(1, 7 * mm),
            branch_table(
                [
                    ("Кто использует", audience),
                    ("Источник контакта", source),
                    (
                        "Правило",
                        "Говорим правду об источнике контакта, задаём вопросы по одному и фиксируем следующий шаг только с конкретной датой.",
                    ),
                ],
                widths=[44 * mm, 129 * mm],
            ),
            Spacer(1, 14 * mm),
            p(
                "Рабочая версия Pllato. Реплики можно адаптировать под естественную речь, но нельзя менять смысл квалификации, обещать невозможное или скрывать источник контакта.",
                "Centered",
            ),
            PageBreak(),
        ]
    )


def build_landpr(path):
    title = "Скрипт звонка по базе LANDPR"
    doc = ScriptDocTemplate(str(path), title, "рабочая версия · 31.07.2026")
    story = []
    cover(
        story,
        "СКРИПТ ПАРТНЁРСКОГО ОБЗВОНА",
        "Скрипт звонка<br/>по базе LANDPR",
        "Тёплый вход по заявкам на лидогенерацию: понять бизнес, выявить задачу и назначить предметный разбор с Pllato.",
        "Менеджер Pllato или согласованный представитель партнёрской команды.",
        "Клиент подтвердил потребность и согласовал встречу-разбор на конкретную дату и время. Если потребности нет - контакт корректно закрыт или поставлен на согласованный возврат.",
        "Заявка, переданная LANDPR. Перед звонком менеджер проверяет имя, компанию, телефон и доступные данные заявки.",
    )

    story.extend(
        [
            p("Карта разговора", "H1Custom"),
            p(
                "Разговор занимает 5-10 минут. Главная задача - не презентовать все возможности Pllato, а понять, есть ли у клиента проблема, которую стоит разбирать на встрече.",
                "BodyMuted",
            ),
            branch_table(
                [
                    ("1. Тёплый вход", "Напомнить заявку LANDPR и получить согласие на короткий разговор."),
                    ("2. Позиционирование", "Одним предложением объяснить связку LANDPR + Pllato."),
                    ("3. Контекст и боль", "Узнать бизнес, команду, текущий учёт и конкретные потери."),
                    ("4. Мостик", "Связать услышанную боль с подходом Pllato."),
                    ("5. Приглашение", "Предложить бесплатный разбор на 30 минут."),
                    ("6. Фиксация", "Подтвердить слот, отправить WhatsApp и заполнить CRM."),
                ],
                widths=[48 * mm, 125 * mm],
            ),
            Spacer(1, 6 * mm),
            callout(
                "Тон",
                "Спокойный, деловой, без давления. Менеджер говорит простыми словами, слушает больше, чем говорит, и использует формулировки самого клиента.",
                fill=BLUE_LIGHT,
                border=colors.HexColor("#C9D9EE"),
            ),
            Spacer(1, 6 * mm),
            p("Перед звонком", "H2Custom"),
            bullets(
                [
                    "Открыть карточку: имя, компания, телефон, источник LANDPR, дата заявки.",
                    "Проверить сайт или Instagram компании, если ссылка есть.",
                    "Подготовить два свободных слота для встречи и WhatsApp-шаблон.",
                    "Не звонить без понимания, кому и по какой заявке вы звоните.",
                ]
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Начало разговора", "H1Custom"),
            step_block(
                "01",
                "Тёплый вход",
                "Напомнить источник и получить разрешение на минутный разговор.",
                "«Здравствуйте, [имя]! Меня зовут [имя менеджера], команда Pllato. LANDPR передали нам ваш контакт: вы оставляли заявку по лидогенерации. Удобно сейчас минуту поговорить?»",
                "Если клиент не помнит заявку, спокойно назвать дату и доступный контекст. Не спорить.",
            ),
            step_block(
                "02",
                "Позиционирование",
                "Коротко объяснить роль Pllato и сразу перейти к бизнесу клиента.",
                "«LANDPR помогает с привлечением заявок, а мы в Pllato помогаем выстроить их обработку: разрабатываем CRM и рабочие порталы под процессы компании. Чтобы понять, актуально ли это для вас, расскажите, пожалуйста, какой у вас бизнес?»",
                "После одного предложения о Pllato задайте вопрос. Не начинайте длинную презентацию.",
            ),
            p("Если начало пошло иначе", "H2Custom"),
            branch_table(
                [
                    (
                        "«Откуда у вас мой номер?»",
                        "«Из заявки LANDPR по лидогенерации. Если вам неудобно, я могу назвать данные заявки или закрыть контакт».",
                    ),
                    (
                        "«Что вы продаёте?»",
                        "«Сначала проверяю, есть ли задача, которую мы можем решить. Pllato разрабатывает CRM и рабочие порталы под процессы компании. Какой у вас бизнес?»",
                    ),
                    (
                        "«Сейчас неудобно»",
                        "«Понимаю. Когда лучше вернуться: сегодня после 17:00 или завтра до обеда?» Зафиксировать точное время.",
                    ),
                    (
                        "«Не оставлял заявку»",
                        "Извиниться, уточнить, можно ли удалить контакт, и не продолжать продажу без согласия.",
                    ),
                ]
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Диагностика бизнеса", "H1Custom"),
            step_block(
                "03",
                "Контекст и боль",
                "Услышать масштаб, текущий способ работы и реальный ущерб от проблемы.",
                "«А давно занимаетесь? Сколько сейчас человек в команде? Как ведёте клиентов и заказы - Excel, Bitrix, WhatsApp, блокнот? Что в работе отнимает больше всего времени или приводит к потерям?»",
                "Не задавайте все вопросы одним списком. Реагируйте на ответы и углубляйте 2-3 раза.",
            ),
            p("Вопросы, которые раскрывают задачу", "H2Custom"),
            bullets(
                [
                    "«Как сейчас выглядит путь от новой заявки до оплаты и исполнения?»",
                    "«Где данные приходится вводить повторно или переносить вручную?»",
                    "«Что произошло в последний раз из-за этой проблемы?»",
                    "«Сколько времени, денег или клиентов это стоило?»",
                    "«Кто ещё участвует в процессе и кто принимает решение?»",
                    "«Что должно измениться, чтобы вы сказали: система действительно помогла?»",
                ],
                fill=CREAM,
            ),
            Spacer(1, 4 * mm),
            callout(
                "Фиксируем дословно",
                "Не записывайте «нужна CRM» как боль. Записывайте событие и последствия: «две заявки потерялись в WhatsApp, клиентам не ответили, недополучили оплату».",
                fill=AMBER_LIGHT,
                border=colors.HexColor("#EFD79B"),
            ),
            Spacer(1, 6 * mm),
            p("Быстрая квалификация", "H2Custom"),
            branch_table(
                [
                    ("Есть команда и повторяемый процесс", "Продолжаем диагностику."),
                    ("Есть конкретная боль и последствия", "Переходим к мостику."),
                    ("Нет задачи / всё устраивает", "Уточняем один контрольный вопрос и корректно завершаем."),
                    ("Очень малый объём, нет бюджета", "Не назначаем встречу ради статистики; согласуем материал или возврат позже."),
                ]
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Переход к предложению", "H1Custom"),
            step_block(
                "04",
                "Мостик",
                "Связать конкретную боль клиента с подходом Pllato.",
                "«Слушайте, то, что вы описали - [повторить конкретную боль клиента] - мы как раз с этим работаем. Pllato делает не коробку, а систему под ваш процесс. Что вы используете сейчас: Bitrix, amoCRM, 1С, Excel или ничего?»",
                "Обязательно повторите формулировку клиента. Общая фраза «мы автоматизируем бизнес» слабее.",
            ),
            step_block(
                "05",
                "Приглашение на разбор",
                "Получить конкретную дату и время встречи.",
                "«Предлагаю разбор с Платоном, партнёром по технической части. За 30 минут пройдёмся по вашему процессу и честно скажем, есть ли смысл в системе. Удобнее на этой неделе или на следующей?»",
                "После выбора недели предложите два конкретных слота.",
            ),
            p("Развилки", "H2Custom"),
            branch_table(
                [
                    (
                        "Уже есть Bitrix / amoCRM",
                        "«Это нормально. Мы подключаемся, когда коробка не садится на процесс или требует слишком много ручной работы. На разборе проверим, есть ли смысл что-то менять».",
                    ),
                    (
                        "«Сколько стоит?»",
                        "«Зависит от объёма. В текущем скрипте ориентир ядра - от 890 тыс. тенге, дальше модулями. Точнее можно сказать после короткого разбора процесса».",
                    ),
                    (
                        "«Пришлите кейсы»",
                        "«Пришлю 2-3 подходящих примера. Чтобы не отправлять случайное, уточню ещё два вопроса о процессе, а затем предложу короткий слот».",
                    ),
                    (
                        "«Подумаю»",
                        "Уточнить, что именно нужно обдумать. Согласовать дату возврата или отправку короткого материала.",
                    ),
                    (
                        "Категоричное «нет»",
                        "Поблагодарить, закрыть контакт без давления и корректно отметить результат в CRM.",
                    ),
                ]
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Фиксация результата", "H1Custom"),
            step_block(
                "06",
                "Подтверждение встречи",
                "Закрепить договорённость и не потерять контакт после звонка.",
                "«Отлично. Фиксирую [дата] в [время]. Сейчас отправлю в WhatsApp подтверждение и короткий бриф, чтобы встреча была предметной. До связи!»",
                "WhatsApp отправить в течение 5 минут. Встречу сразу внести в общий календарь.",
            ),
            p("Шаблон WhatsApp", "H2Custom"),
            callout(
                "Сообщение",
                "«Здравствуйте, [имя]! Это [имя менеджера], команда Pllato. Подтверждаю встречу-разбор с Платоном [дата] в [время]. Перед встречей, пожалуйста, подумайте: 1) какие 2-3 процесса самые проблемные; 2) что используете сейчас; 3) сколько человек в команде. Ссылку на встречу отправим заранее. До связи!»",
                fill=GREEN_LIGHT,
                border=colors.HexColor("#B8E0C6"),
                quote=True,
            ),
            Spacer(1, 7 * mm),
            p("Что сохранить в CRM", "H2Custom"),
            bullets(
                [
                    "Источник: LANDPR; дата и контекст заявки.",
                    "Бизнес, команда, текущие инструменты и география.",
                    "Главная боль дословно, последний реальный случай и последствия.",
                    "Кто принимает решение и кто будет на встрече.",
                    "Дата и время встречи, следующий ответственный, отправленные материалы.",
                    "Если встречи нет: точная причина, согласованный перезвон или отказ.",
                ]
            ),
            Spacer(1, 6 * mm),
            callout(
                "Контроль качества",
                "Звонок считается выполненным качественно, если понятны источник, задача, конкретная боль, ЛПР и следующий шаг. Сам факт разговора или отправки презентации результатом не является.",
                fill=BLUE_LIGHT,
                border=colors.HexColor("#C9D9EE"),
            ),
        ]
    )
    doc.build(story)


def build_lead_manager(path):
    title = "Скрипт лид-менеджера: квалификация и первая встреча"
    doc = ScriptDocTemplate(str(path), title, "рабочая версия · 31.07.2026")
    story = []
    cover(
        story,
        "СКРИПТ КВАЛИФИКАЦИИ SDR",
        "Лид-менеджер:<br/>квалификация и первая встреча",
        "Рабочая последовательность первого контакта: понять задачу, проверить квалификацию и назначить КЭП.",
        "Лид-менеджер / SDR Pllato, который принимает новые обращения и назначает первые встречи.",
        "Квалифицированный клиент посетил первую встречу. Квалификация включает чистый доход от $5 000, понятную потребность в ПО для бизнеса и заполненный бриф.",
        "Новая заявка Pllato из CRM, формы, рекомендации, партнёрского канала или входящего сообщения.",
    )

    story.extend(
        [
            p("Роль и результат поста", "H1Custom"),
            branch_table(
                [
                    (
                        "Продукт поста",
                        "Квалифицированный клиент по требованиям Pllato, который посетил первую встречу.",
                    ),
                    (
                        "Статистика поста",
                        "Количество состоявшихся первых встреч с квалифицированными клиентами.",
                    ),
                    (
                        "Непосредственный руководитель",
                        "РОП - руководитель отдела продаж.",
                    ),
                    (
                        "Линия коммуникации",
                        "Лид-менеджер -> РОП -> Директор -> Владелец бизнеса.",
                    ),
                    (
                        "КЭП",
                        "Ключевой этап продаж: выявить главную боль, показать возможный подход и продать следующий шаг - подготовку и просмотр Демо.",
                    ),
                ],
                widths=[50 * mm, 123 * mm],
            ),
            Spacer(1, 7 * mm),
            p("Три обязательных критерия квалификации", "H2Custom"),
            branch_table(
                [
                    ("1. Доход", "Минимальный чистый доход бизнеса - $5 000."),
                    ("2. Потребность", "Есть понятная потребность в разработке ПО для бизнеса."),
                    ("3. Бриф", "Заполнен бриф о бизнесе и текущем процессе."),
                ]
            ),
            Spacer(1, 7 * mm),
            callout(
                "Правило статистики",
                "Не назначайте КЭП ради количества. Если клиент не проходит критерии, зафиксируйте причину и согласуйте подходящий дальнейший контакт.",
                fill=RED_LIGHT,
                border=colors.HexColor("#E8B9B9"),
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Структура первого звонка", "H1Custom"),
            step_block(
                "01",
                "Рамка",
                "Представиться, напомнить источник и согласовать 7-10 минут.",
                "«Здравствуйте, [имя]. Меня зовут [имя], Pllato. Вы оставляли обращение [источник]. Правильно понимаю, сейчас удобно 7 минут, чтобы понять задачу и решить, есть ли смысл во встрече?»",
            ),
            step_block(
                "02",
                "Контекст",
                "Понять продукт, географию, срок работы, команду и текущий способ учёта.",
                "«Расскажите коротко о бизнесе. Как сейчас выглядит путь от обращения клиента до оплаты и исполнения?»",
            ),
            step_block(
                "03",
                "Боль",
                "Найти конкретную проблему, ручную работу и последствия.",
                "«Что сейчас раздражает сильнее всего? Что произошло в последний раз из-за этой ситуации? Во что это обошлось?»",
                "Уточните 2-3 раза. Название решения вроде «нужна CRM» не является болью.",
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("От задачи к встрече", "H1Custom"),
            step_block(
                "04",
                "Желаемый результат",
                "Понять, что клиент хочет контролировать и что должно измениться.",
                "«Если система заработает идеально, что вы сможете видеть или контролировать, чего не видите сейчас?»",
            ),
            step_block(
                "05",
                "Квалификация",
                "Проверить ЛПР, доход от $5 000, срочность и готовность обсуждать решение.",
                "«Кто кроме вас участвует в решении и согласовании бюджета? Когда хотите получить результат? Какой чистый доход бизнеса за обычный месяц?»",
                "Не маскируйте проверку дохода. Объясните, что критерий нужен, чтобы не тратить время клиента на неподходящий формат.",
            ),
            step_block(
                "06",
                "Продажа КЭП",
                "Связать боль с ценностью встречи и предложить два слота.",
                "«На встрече покажем, как можно собрать единый процесс под вашу ситуацию и проверим, имеет ли смысл готовить Демо. Удобнее во вторник в 15:00 или в среду в 11:00?»",
            ),
            step_block(
                "07",
                "Фиксация",
                "Повторить договорённость, запросить материалы и заполнить CRM.",
                "«Фиксирую среду 11:00, отправлю ссылку. Пришлите сайт и логотип - подготовим встречу предметно».",
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Вопросы для сильной квалификации", "H1Custom"),
            p("Контекст процесса", "H2Custom"),
            bullets(
                [
                    "«Как приходит новое обращение и кто первым его обрабатывает?»",
                    "«Где хранятся данные о клиенте, заказе, оплате и исполнении?»",
                    "«Какие программы уже используются: CRM, 1С, Excel, мессенджеры?»",
                    "«Сколько человек участвует в процессе и где передаётся ответственность?»",
                ]
            ),
            p("Боль и последствия", "H2Custom"),
            bullets(
                [
                    "«Что приходится делать вручную по нескольку раз?»",
                    "«Что произошло в последний раз, когда процесс дал сбой?»",
                    "«Как часто это происходит и сколько стоит компании?»",
                    "«Почему текущая система или готовый сервис не решают задачу?»",
                ]
            ),
            p("Решение и срочность", "H2Custom"),
            bullets(
                [
                    "«Что должно работать по-другому после внедрения?»",
                    "«Какие три показателя руководитель хочет видеть каждый день?»",
                    "«Когда хотите начать и что произойдёт, если отложить на полгода?»",
                    "«Кто утверждает бюджет и кого важно пригласить на КЭП?»",
                ]
            ),
            Spacer(1, 5 * mm),
            callout(
                "Слушаем 80%, говорим 20%",
                "Скрипт задаёт направление, но не заменяет диалог. Следующий вопрос должен опираться на предыдущий ответ клиента.",
                fill=BLUE_LIGHT,
                border=colors.HexColor("#C9D9EE"),
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Ответы на типовые ситуации", "H1Custom"),
            branch_table(
                [
                    (
                        "«Сколько стоит?»",
                        "«Зависит от задачи. Обычно ориентир около $3 000, точнее после разбора. Чтобы не назвать случайную цену, уточню ещё два вопроса о процессе».",
                    ),
                    (
                        "«Просто пришлите презентацию»",
                        "«Пришлю. Чтобы выбрать подходящий кейс, уточню 2-3 вопроса и предложу короткий слот, если будет совпадение».",
                    ),
                    (
                        "Доход $3 000, потребность есть",
                        "Зафиксировать как пока неквалифицированного. Согласовать материал или дату возврата. Не назначать КЭП ради статистики.",
                    ),
                    (
                        "«Нужна CRM»",
                        "«Что сейчас происходит без неё? Почему это проблема? Расскажите последний реальный случай».",
                    ),
                    (
                        "Собеседник не ЛПР",
                        "Уточнить путь согласования и пригласить ЛПР на КЭП. Не скрывать это в брифе.",
                    ),
                    (
                        "«Перезвоните на следующей неделе»",
                        "Предложить два конкретных слота и согласовать один. Следующий шаг без даты не считается.",
                    ),
                    (
                        "Уже есть Bitrix / amoCRM",
                        "Уточнить, что именно не закрывает текущая система: процессы вне продаж, ограничения, ручной ввод, стоимость, отчётность.",
                    ),
                    (
                        "Сопротивление команды",
                        "Уточнить, кто будет пользоваться системой, чего сотрудники опасаются и кто участвует в описании процесса.",
                    ),
                ],
                widths=[53 * mm, 120 * mm],
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("Передача в КЭП и CRM", "H1Custom"),
            p("После согласования встречи", "H2Custom"),
            bullets(
                [
                    "Повторить дату, время, состав участников и цель встречи.",
                    "Запросить сайт, логотип и доступные материалы для предметной подготовки.",
                    "Внести КЭП в общий календарь и назначить клоузера.",
                    "Дозаполнить обязательные поля брифа до встречи.",
                    "Отправить подтверждение и ссылку клиенту.",
                ]
            ),
            p("Минимум в брифе", "H2Custom"),
            branch_table(
                [
                    ("Компания", "Название, ниша, география, срок работы."),
                    ("Команда", "Размер, роли, участники процесса."),
                    ("Текущий путь", "От обращения до оплаты и исполнения."),
                    ("Инструменты", "CRM, 1С, Excel, WhatsApp, другие системы."),
                    ("Главная боль", "Дословно, с последним случаем и последствиями."),
                    ("Желаемый результат", "Что должно измениться и какие показатели нужны."),
                    ("Квалификация", "Доход, ЛПР, срочность, готовность обсуждать решение."),
                    ("Следующий шаг", "Дата и время КЭП, участники, ответственный."),
                ],
                widths=[45 * mm, 128 * mm],
            ),
            Spacer(1, 6 * mm),
            callout(
                "Контроль результата",
                "Продукт лид-менеджера - не звонок, не назначение и не заполненная карточка. Продукт - квалифицированный клиент, который фактически посетил первую встречу.",
                fill=GREEN_LIGHT,
                border=colors.HexColor("#B8E0C6"),
                quote=True,
            ),
        ]
    )
    doc.build(story)


def publish_copy(source):
    target = PUBLISHED / source.name
    target.write_bytes(source.read_bytes())
    return target


def main():
    landpr = OUT / "Pllato_Script_LANDPR.pdf"
    lead = OUT / "Pllato_Script_Lead_Manager.pdf"
    build_landpr(landpr)
    build_lead_manager(lead)
    publish_copy(landpr)
    publish_copy(lead)
    print(landpr)
    print(lead)


if __name__ == "__main__":
    main()
