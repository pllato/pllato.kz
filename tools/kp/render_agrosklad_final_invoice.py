from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "Pllato_Schet_AgroSklad_Final_AS-C-2026-03.pdf"

FONT_DIR = Path(
    "/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/"
    "libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype"
)
FONT = str(FONT_DIR / "DejaVuSans.ttf")
FONT_BOLD = str(FONT_DIR / "DejaVuSans-Bold.ttf")
pdfmetrics.registerFont(TTFont("ArialRU", FONT))
pdfmetrics.registerFont(TTFont("ArialRUBold", FONT_BOLD))

NAVY = colors.HexColor("#132139")
TEXT = colors.HexColor("#2d405f")
MUTED = colors.HexColor("#7184a3")
GREEN = colors.HexColor("#2f7d32")
GREEN_LIGHT = colors.HexColor("#e4f1e4")
YELLOW = colors.HexColor("#efa900")
LINE = colors.HexColor("#d5e0eb")
SOFT = colors.HexColor("#eef4f8")
WHITE = colors.white


def pstyle(name, size=8.3, leading=None, color=TEXT, bold=False, align=TA_LEFT):
    return ParagraphStyle(
        name,
        fontName="ArialRUBold" if bold else "ArialRU",
        fontSize=size,
        leading=leading or size * 1.34,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        spaceBefore=0,
    )


def draw_paragraph(c, text, x, top, width, style, height_limit=500):
    para = Paragraph(text, style)
    _, height = para.wrap(width, height_limit)
    para.drawOn(c, x, top - height)
    return height


def draw_logo(c, x, top):
    size = 34
    y = top - size
    c.setFillColor(GREEN)
    c.roundRect(x, y, size, size, 8, stroke=0, fill=1)
    c.setStrokeColor(WHITE)
    c.setLineWidth(2.6)
    c.line(x + 8, y + 10, x + 8, y + 26)
    c.line(x + 8, y + 10, x + 27, y + 10)
    c.line(x + 13, y + 17, x + 27, y + 17)
    c.setStrokeColor(YELLOW)
    c.setLineWidth(2.2)
    c.line(x + 17, y + 25, x + 17, y + 31)
    c.line(x + 17, y + 31, x + 14, y + 28)
    c.line(x + 17, y + 31, x + 20, y + 28)


def build_pdf(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("Счёт на оплату № AS-С-2026-03 · АгроСклад × Pllato · Итоговый этап")
    width, height = A4
    left, right = 17 * mm, width - 17 * mm
    usable = right - left
    top = height - 17 * mm

    # Header
    draw_logo(c, left, top)
    c.setFillColor(NAVY)
    c.setFont("ArialRUBold", 18)
    c.drawString(left + 44, top - 16, "АгроСклад")
    c.setFillColor(MUTED)
    c.setFont("ArialRU", 7)
    c.drawString(left + 44, top - 33, "портал ответственного хранения СЗР · Pllato")
    draw_paragraph(
        c,
        "СЧЁТ НА ОПЛАТУ № AS-С-2026-03",
        right - 230,
        top - 2,
        230,
        pstyle("head-right", 11.8, 14, NAVY, True, TA_RIGHT),
    )
    draw_paragraph(
        c,
        "от 24 августа 2026 г.<br/><font color='#8ba0bf'>Итоговый этап · 45%</font>",
        right - 190,
        top - 24,
        190,
        pstyle("head-date", 8.7, 11, MUTED, False, TA_RIGHT),
    )
    rule_y = top - 55
    c.setStrokeColor(GREEN)
    c.setLineWidth(3.2)
    c.line(left, rule_y, left + usable * 0.55, rule_y)
    c.setStrokeColor(YELLOW)
    c.line(left + usable * 0.55, rule_y, right, rule_y)

    y = rule_y - 14
    subtitle = (
        "Счёт за итоговый этап разработки складского портала «АгроСклад» для ответственного хранения СЗР. "
        "Основание - Коммерческое предложение № AS-2026-01 от 13.07.2026. Этап выставляется после завершения "
        "полировок и полной передачи портала на сервер Заказчика."
    )
    h = draw_paragraph(c, subtitle, left, y, usable, pstyle("subtitle", 8.5, 12, TEXT))
    y -= h + 14

    # Parties
    col_gap = 34
    col_w = (usable - col_gap) / 2
    c.setFont("ArialRUBold", 7.2)
    c.setFillColor(MUTED)
    c.drawString(left, y, "ИСПОЛНИТЕЛЬ (ПОСТАВЩИК)")
    c.drawString(left + col_w + col_gap, y, "ЗАКАЗЧИК (ПЛАТЕЛЬЩИК)")
    y -= 12
    supplier = (
        "<font name='ArialRUBold' size='10'>ИП «STUDYSTORIES.APP»</font><br/>"
        "БИН 880607300110<br/>Директор: Цай Платон<br/>Тел: +7 701 123 99 99<br/>"
        "uurraa@gmail.com · pllato.kz"
    )
    customer = (
        "<font name='ArialRUBold' size='10'>ИП «Агро Бирлик 2025»</font><br/>"
        "ИИН 901210350960 · Талон № KZ66TWQ05018123<br/>"
        "Юр. адрес: 020000, РК, Акмолинская обл., г. Кокшетау,<br/>Северный проезд 2, зд. 18<br/>"
        "Св-во по НДС: серия 03001 № 2007419 от 20.08.2025 г.<br/>"
        "ИИК KZ878562204148052094 · АО «Банк ЦентрКредит»<br/>"
        "БИК KCJBKZKX · Кбе 19<br/>Руководитель: Сагитов Рашит Ришатович<br/>"
        "Тел.: +7 702 726 48 37 · Бухгалтер: +7 775 957 82 69<br/>"
        "ipagrobirlik2025@mail.ru"
    )
    party_style = pstyle("party", 7.7, 10.2, TEXT)
    hs = draw_paragraph(c, supplier, left, y, col_w, party_style)
    hc = draw_paragraph(c, customer, left + col_w + col_gap, y, col_w, party_style)
    y -= max(hs, hc) + 16

    # Work table
    desc = (
        "<b>Разработка портала «АгроСклад» - Итоговый этап: полировки и передача.</b><br/>"
        "Финальная доработка интерфейсов и бизнес-логики, устранение согласованных замечаний, "
        "полная проверка ключевых сценариев, настройка на сервере Заказчика, передача рабочей версии "
        "и ввод портала в эксплуатацию."
    )
    table_data = [
        ["№", "Наименование работ / услуг", "Кол-\nво", "Цена, ₸", "Сумма, ₸"],
        ["1", Paragraph(desc, pstyle("desc", 7.7, 10.4, NAVY)), "1", "675 000", "675 000"],
    ]
    work_table = Table(table_data, colWidths=[26, usable - 26 - 42 - 70 - 74, 42, 70, 74], rowHeights=[31, 74])
    work_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "ArialRUBold"),
                ("FONTSIZE", (0, 0), (-1, 0), 6.8),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 1), (-1, -1), "ArialRU"),
                ("FONTSIZE", (0, 1), (-1, -1), 8.2),
                ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
                ("TOPPADDING", (0, 1), (-1, -1), 7),
                ("LINEBELOW", (0, 1), (-1, 1), 0.5, LINE),
            ]
        )
    )
    work_table.wrapOn(c, usable, 200)
    work_table.drawOn(c, left, y - 105)
    y -= 105

    c.setFillColor(SOFT)
    c.rect(left, y - 38, usable, 38, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("ArialRUBold", 9)
    c.drawString(left + 10, y - 24, "Сумма к оплате - Итоговый этап (45%)")
    c.setFillColor(GREEN)
    c.setFont("ArialRUBold", 10.5)
    c.drawRightString(right - 10, y - 24, "675 000 ₸")
    y -= 52

    total = (
        "Всего к оплате по данному счёту: <b>675 000 (шестьсот семьдесят пять тысяч) тенге 00 тиын.</b> "
        "НДС не облагается (Исполнитель не является плательщиком НДС РК)."
    )
    h = draw_paragraph(c, total, left, y, usable, pstyle("total", 8.4, 11.8, TEXT))
    y -= h + 15

    # Payment schedule
    c.setFont("ArialRUBold", 10.5)
    c.setFillColor(NAVY)
    c.drawString(left, y, "Порядок расчётов по проекту")
    y -= 13
    terms = (
        "Общая стоимость - <b>1 500 000 ₸</b>. Клиентская часть стоимостью 500 000 ₸ включена бонусом. "
        "Оплата: 10% при старте, 45% после сдачи Ядра, 45% после полной передачи с полировками на сервер Заказчика."
    )
    h = draw_paragraph(c, terms, left, y, usable, pstyle("terms", 7.9, 10.8, MUTED))
    y -= h + 8
    schedule = [
        ["Предоплата 10% - старт работ", "150 000 ₸"],
        ["Этап 1 · Ядро - каркас портала", "675 000 ₸"],
        [Paragraph("<b>Итоговый этап - полировки и передача на сервер</b>  <font color='#2f7d32'>← ТЕКУЩИЙ СЧЁТ</font>", pstyle("current", 8.2, 10.5, NAVY)), "675 000 ₸"],
    ]
    schedule_table = Table(schedule, colWidths=[usable - 100, 100], rowHeights=[26, 26, 28])
    schedule_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "ArialRU"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.2),
                ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
                ("BACKGROUND", (0, 2), (-1, 2), GREEN_LIGHT),
                ("FONTNAME", (1, 2), (1, 2), "ArialRUBold"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (0, -1), 12),
                ("RIGHTPADDING", (1, 0), (1, -1), 12),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
            ]
        )
    )
    schedule_table.wrapOn(c, usable, 100)
    schedule_table.drawOn(c, left, y - 80)
    y -= 96

    # Payment details
    c.setFont("ArialRUBold", 10.5)
    c.setFillColor(NAVY)
    c.drawString(left, y, "Реквизиты для оплаты")
    y -= 11
    req = [
        ["Получатель", "ИП «STUDYSTORIES.APP», БИН 880607300110"],
        ["ИИК / Банк", "KZ31722S000010366450 · АО «Kaspi Bank» · БИК CASPKZKA · Кбе 19"],
        ["Назначение", "Оплата итогового этапа (45%) по КП № AS-2026-01 за разработку ПО «АгроСклад», счёт № AS-С-2026-03. Без НДС"],
    ]
    req_rows = [[Paragraph(a, pstyle("rk", 8, 10.2, MUTED)), Paragraph(b, pstyle("rv", 8, 10.2, NAVY))] for a, b in req]
    req_table = Table(req_rows, colWidths=[140, usable - 140], rowHeights=[25, 27, 39])
    req_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 1), (-1, 1), SOFT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
            ]
        )
    )
    req_table.wrapOn(c, usable, 120)
    req_table.drawOn(c, left, y - 91)
    y -= 106

    # Signatures
    sign_gap = 40
    sign_w = (usable - sign_gap) / 2
    c.setFillColor(MUTED)
    c.setFont("ArialRUBold", 7.3)
    c.drawString(left, y, "ИСПОЛНИТЕЛЬ")
    c.drawString(left + sign_w + sign_gap, y, "ЗАКАЗЧИК")
    y -= 14
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.5)
    c.line(left, y, left + sign_w, y)
    c.line(left + sign_w + sign_gap, y, right, y)
    y -= 13
    c.setFillColor(TEXT)
    c.setFont("ArialRU", 8.2)
    c.drawString(left, y, "ИП «STUDYSTORIES.APP»  / Цай П. /  М.П.")
    c.drawString(left + sign_w + sign_gap, y, "ИП «Агро Бирлик 2025»  / Сагитов Р.Р. /  М.П.")

    # Footer
    footer_y = 17 * mm
    c.setStrokeColor(LINE)
    c.line(left, footer_y + 12, right, footer_y + 12)
    c.setFillColor(MUTED)
    c.setFont("ArialRU", 6.7)
    c.drawString(left, footer_y, "Pllato · Счёт AS-С-2026-03 · ИП «STUDYSTORIES.APP» · БИН 880607300110")
    c.drawRightString(right, footer_y, "pllato.kz")
    c.showPage()
    c.save()


if __name__ == "__main__":
    build_pdf(OUT)
    print(OUT)
