#!/usr/bin/env python3
"""Generate revised RL-system invoice RL-2026-006 for 1,000,000 KZT."""

from pathlib import Path
import shutil

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/Pllato_Schet_RLsystem_Fondy_1000000.pdf"
PUBLIC = ROOT / "app/schet-rl-fondy-1000000.pdf"
DOWNLOADS = Path.home() / "Downloads/Pllato_Schet_RLsystem_Fondy_1000000.pdf"

FONT_DIR = ROOT / "tools/kp/fonts"
pdfmetrics.registerFont(TTFont("Inter", str(FONT_DIR / "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Medium", str(FONT_DIR / "Inter-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Inter-SemiBold", str(FONT_DIR / "Inter-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Bold", str(FONT_DIR / "Inter-Bold.ttf")))

W, H = A4
PAPER = HexColor("#F0EAD9")
CARD = HexColor("#F6F1E2")
CARD2 = HexColor("#EFE8D3")
LINE = HexColor("#D8CFB4")
GREEN = HexColor("#33523C")
GREEN_D = HexColor("#27402E")
INK = HexColor("#20241F")
MUTED = HexColor("#6B6A58")
FAINT = HexColor("#98937C")
BLACK = HexColor("#141511")

STYLES = {
    "body": ParagraphStyle("body", fontName="Inter", fontSize=7.3, leading=10.5, textColor=INK),
    "body_muted": ParagraphStyle("body_muted", fontName="Inter", fontSize=7.1, leading=10, textColor=MUTED),
    "body_white": ParagraphStyle("body_white", fontName="Inter", fontSize=7.2, leading=10.4, textColor=white),
    "cell": ParagraphStyle("cell", fontName="Inter", fontSize=7.1, leading=9.5, textColor=INK),
    "cell_b": ParagraphStyle("cell_b", fontName="Inter-SemiBold", fontSize=7.2, leading=9.5, textColor=INK),
    "right": ParagraphStyle("right", fontName="Inter-SemiBold", fontSize=7.5, leading=9.5, textColor=INK, alignment=TA_RIGHT),
    "small": ParagraphStyle("small", fontName="Inter", fontSize=6.6, leading=9.2, textColor=MUTED),
}


def para(text, style="body"):
    return Paragraph(text, STYLES[style])


def draw_para(c, text, x, y_top, width, height, style="body"):
    p = para(text, style)
    _, h = p.wrap(width, height)
    p.drawOn(c, x, y_top - h)
    return h


def draw_party(c, x, y_top, width, title, name, lines):
    height = 40 * mm
    c.setFillColor(CARD)
    c.setStrokeColor(LINE)
    c.roundRect(x, y_top - height, width, height, 3, fill=1, stroke=1)
    c.setFillColor(GREEN)
    c.setFont("Inter-Bold", 6.2)
    c.drawString(x + 7 * mm, y_top - 8 * mm, title)
    c.setFillColor(INK)
    c.setFont("Inter-Bold", 8.2)
    c.drawString(x + 7 * mm, y_top - 15 * mm, name)
    c.setFont("Inter", 6.8)
    c.setFillColor(HexColor("#4A4A3C"))
    yy = y_top - 21 * mm
    for line in lines:
        c.drawString(x + 7 * mm, yy, line)
        yy -= 5.1 * mm


def draw_reqs(c, x, y_top, width, title, subtitle, rows):
    c.setFillColor(INK)
    c.setFont("Inter-Bold", 7.2)
    c.drawString(x, y_top, title)
    tw = c.stringWidth(title, "Inter-Bold", 7.2)
    c.setFillColor(MUTED)
    c.setFont("Inter", 7.0)
    c.drawString(x + tw + 2.2 * mm, y_top, subtitle)
    data = [[para(k, "small"), para(v, "cell_b")] for k, v in rows]
    table = Table(data, colWidths=[width * 0.35, width * 0.65], rowHeights=[5.2 * mm] * len(rows))
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD),
        ("GRID", (0, 0), (-1, -1), 0.55, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    _, th = table.wrap(width, 100 * mm)
    table.drawOn(c, x, y_top - 3 * mm - th)


def generate(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("Счёт № RL-2026-006 · Фонды проектов · частичная оплата 1 000 000 KZT · ТОО «RL-system» · Pllato")
    c.setAuthor("ИП STUDYSTORIES.APP · Pllato")
    c.setSubject("Счёт на частичную оплату по проекту по КП RL-Ф-2026-01")
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    left, right = 15 * mm, W - 15 * mm
    usable = right - left

    # Header
    c.setFillColor(INK)
    c.setFont("Inter-Bold", 18)
    c.drawString(left, H - 18 * mm, "Pllato.")
    c.setFont("Inter", 6.7)
    c.setFillColor(MUTED)
    c.drawString(left, H - 23 * mm, "Партнёр по операционной оцифровке · pllato.kz")
    c.setFillColor(GREEN)
    c.setStrokeColor(GREEN)
    badge_w = 67 * mm
    c.roundRect(right - badge_w, H - 21 * mm, badge_w, 9 * mm, 2, fill=0, stroke=1)
    c.setFont("Inter-Bold", 6.6)
    c.drawCentredString(right - badge_w / 2, H - 17.5 * mm, "ЧАСТИЧНАЯ ОПЛАТА · ФОНДЫ ПРОЕКТОВ")
    c.setFillColor(MUTED)
    c.setFont("Inter", 6.7)
    c.drawRightString(right, H - 29 * mm, "Счёт на оплату")
    c.setFillColor(GREEN_D)
    c.setFont("Inter-Bold", 15)
    c.drawRightString(right, H - 37 * mm, "№ RL-2026-006")
    c.setFillColor(MUTED)
    c.setFont("Inter", 6.8)
    c.drawRightString(right, H - 43 * mm, "от 10 августа 2026 г. · действителен 7 банковских дней")

    party_top = H - 49 * mm
    gap = 4 * mm
    pw = (usable - gap) / 2
    draw_party(c, left, party_top, pw, "ПОСТАВЩИК · ПОЛУЧАТЕЛЬ", "ИП «STUDYSTORIES.APP»", [
        "БИН: 880607300110 · Директор: Цай Платон",
        "г. Алматы, мкр. Орбита-4, д. 3, оф. 2",
        "Email: uurraa@gmail.com · +7 701 123 99 99",
    ])
    draw_party(c, left + pw + gap, party_top, pw, "ПЛАТЕЛЬЩИК · ЗАКАЗЧИК", "ТОО «RL-system»", [
        "БИН: 040340014374 · КБЕ 17 · РНН 600900533808",
        "050002, г. Алматы, Медеуский р-н,",
        "ул. Карамысова К, д. 84/2, корп. 1, кв. 55",
        "Гос. рег. №61656-1910-ТОО от 05.03.2004",
    ])

    # Basis
    y = party_top - 46 * mm
    c.setFillColor(GREEN)
    c.roundRect(left, y - 24 * mm, usable, 24 * mm, 3, fill=1, stroke=0)
    c.setFillColor(HexColor("#CFE0C8"))
    c.setFont("Inter-Bold", 6.4)
    c.drawString(left + 6 * mm, y - 7 * mm, "ОСНОВАНИЕ · ЧАСТИЧНАЯ ОПЛАТА ПО ПРОЕКТУ")
    draw_para(c,
        "Частичная оплата разработки ПО <b>«Фонды проектов»</b> по КП № RL-Ф-2026-01 от 18.07.2026. "
        "Общая стоимость проекта составляет <b>3 250 000 KZT</b>. Настоящий счёт выставлен только на <b>1 000 000 KZT</b>; "
        "остаток <b>2 250 000 KZT</b> оплачивается по отдельному последующему счёту. Оплата означает акцепт оферты "
        "pllato.kz/offer/custom-development/. Исключительные права переходят после полной оплаты проекта.",
        left + 6 * mm, y - 9 * mm, usable - 12 * mm, 14 * mm, "body_white")

    # Work item
    y -= 30 * mm
    c.setFillColor(INK)
    c.setFont("Inter-Bold", 7.2)
    c.drawString(left, y, "НАЗНАЧЕНИЕ ПЛАТЕЖА · ЧАСТИЧНАЯ ОПЛАТА")
    table_data = [
        [para("№", "cell_b"), para("Наименование работ", "cell_b"), para("Сумма", "right")],
        [para("1", "small"), para(
            "<b>Частичная оплата разработки ПО «Фонды проектов» под ключ.</b><br/>"
            "Фондирование и распределение поступлений, ДДС по статьям и проектам, остатки по фондам, "
            "учёт доходов/расходов и маржи по проектам, отчёты и дашборд, роли и доступы. "
            "Развёртывание на сервере Заказчика, передача кода и данных в собственность. По КП № RL-Ф-2026-01.", "cell"),
         para("1 000 000,00 KZT", "right")],
    ]
    table = Table(table_data, colWidths=[10 * mm, usable - 48 * mm, 38 * mm], rowHeights=[9 * mm, 38 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, 1), CARD),
        ("GRID", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    _, th = table.wrap(usable, 60 * mm)
    table.drawOn(c, left, y - 3 * mm - th)

    note_y = y - 3 * mm - th - 2 * mm
    c.setFillColor(CARD2)
    c.setStrokeColor(LINE)
    c.roundRect(left, note_y - 13 * mm, usable, 13 * mm, 2, fill=1, stroke=1)
    draw_para(c,
        "<b>Общая стоимость проекта: 3 250 000 KZT.</b> По настоящему счёту: <b>1 000 000 KZT</b>. "
        "Остаток после оплаты: <b>2 250 000 KZT</b>. НДС не облагается.",
        left + 5 * mm, note_y - 3 * mm, usable - 10 * mm, 9 * mm, "body")

    pay_y = note_y - 17 * mm
    c.setFillColor(BLACK)
    c.rect(left, pay_y - 15 * mm, usable, 15 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Inter-Bold", 7.4)
    c.drawString(left + 6 * mm, pay_y - 9.5 * mm, "ИТОГО К ОПЛАТЕ ПО НАСТОЯЩЕМУ СЧЁТУ")
    c.setFont("Inter-Bold", 16)
    c.drawRightString(right - 6 * mm, pay_y - 10.5 * mm, "1 000 000 KZT")
    c.setFillColor(HexColor("#4A4A3C"))
    c.setFont("Inter", 6.8)
    c.drawString(left, pay_y - 20 * mm, "Один миллион тенге 00 тиын. НДС не облагается.")

    purpose_y = pay_y - 22 * mm
    c.setFillColor(INK)
    c.setFont("Inter-Bold", 6.5)
    c.drawString(left, purpose_y, "НАЗНАЧЕНИЕ ПЛАТЕЖА")
    draw_para(c,
        "Частичная оплата по счёту RL-2026-006 от 10.08.2026 за разработку ПО «Фонды проектов» "
        "по КП № RL-Ф-2026-01. Акцепт оферты pllato.kz/offer/custom-development/. Без НДС.",
        left, purpose_y - 2.5 * mm, usable, 10 * mm, "small")

    req_top = purpose_y - 13 * mm
    draw_reqs(c, left, req_top, pw, "РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ", "· KASPI", [
        ("Получатель", "ИП «STUDYSTORIES.APP»"),
        ("БИН", "880607300110"),
        ("Банк", "АО «Kaspi Bank»"),
        ("IBAN (KZT)", "KZ31722S000010366450"),
        ("БИК", "CASPKZKA"),
        ("КБе · КНП", "19 · 851"),
    ])
    draw_reqs(c, left + pw + gap, req_top, pw, "ПЛАТЕЛЬЩИК", "· HALYK", [
        ("Наименование", "ТОО «RL-system»"),
        ("БИН · КБЕ", "040340014374 · 17"),
        ("РНН", "600900533808"),
        ("Банк", "АО «Народный Банк» (Halyk)"),
        ("IBAN", "KZ676018861000638261"),
        ("БИК", "HSBKKZKX"),
    ])

    # Signature and footer
    sign_y = 15 * mm
    c.setFillColor(GREEN)
    c.setFont("Inter-Bold", 6.5)
    c.drawString(left, sign_y + 9 * mm, "ПОСТАВЩИК")
    c.setFillColor(HexColor("#4A4A3C"))
    c.setFont("Inter", 7.2)
    c.drawString(left, sign_y + 2 * mm, "ИП «STUDYSTORIES.APP» · __________________ / Цай П. /")
    c.setFillColor(MUTED)
    c.setFont("Inter", 6.8)
    c.drawRightString(right, sign_y + 9 * mm, "Выставлен 10.08.2026 · оплата до 19.08.2026")
    c.setFillColor(INK)
    c.setFont("Inter-Bold", 8)
    c.drawRightString(right, sign_y + 2 * mm, "К оплате: 1 000 000 KZT · частичная оплата")

    c.setStrokeColor(LINE)
    c.line(left, 12 * mm, right, 12 * mm)
    c.setFillColor(FAINT)
    c.setFont("Inter", 6.1)
    c.drawString(left, 8 * mm, "Pllato · Счёт RL-2026-006 · ПО «Фонды проектов»")
    c.drawRightString(right, 8 * mm, "pllato.kz")
    c.save()


def main():
    generate(OUT)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUT, PUBLIC)
    shutil.copy2(OUT, DOWNLOADS)
    print(OUT)
    print(PUBLIC)
    print(DOWNLOADS)


if __name__ == "__main__":
    main()
