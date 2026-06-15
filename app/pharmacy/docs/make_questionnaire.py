# -*- coding: utf-8 -*-
"""Генерация PDF-опросника для встречи с аптекой (вопросы по логике перед запуском)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, KeepTogether)

# --- шрифты с кириллицей ---
pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold')

# --- палитра ---
GREEN   = colors.HexColor('#047857')
RED     = colors.HexColor('#dc2626')
AMBER   = colors.HexColor('#d97706')
GREEN2  = colors.HexColor('#059669')
INK     = colors.HexColor('#1f2937')
MUTED   = colors.HexColor('#6b7280')
LINE    = colors.HexColor('#c7cdd4')

# --- стили ---
def S(name, **kw):
    base = dict(fontName='Arial', textColor=INK, fontSize=10.5, leading=14)
    base.update(kw)
    return ParagraphStyle(name, **base)

st_title   = S('title',  fontName='Arial-Bold', fontSize=18, leading=22, textColor=GREEN)
st_sub     = S('sub',    fontSize=10, leading=14, textColor=MUTED)
st_meta     = S('meta',   fontSize=10, leading=18, textColor=INK)
st_sec     = S('sec',    fontName='Arial-Bold', fontSize=11.5, leading=14, textColor=colors.white)
st_q       = S('q',      fontName='Arial-Bold', fontSize=11, leading=15, textColor=INK)
st_qbody   = S('qbody',  fontSize=10, leading=14, textColor=INK)
st_note    = S('note',   fontSize=9, leading=12.5, textColor=MUTED)
st_foot    = S('foot',   fontSize=8, leading=10, textColor=MUTED)

def section_band(title, color):
    """Цветная полоса-заголовок раздела."""
    t = Table([[Paragraph(title, st_sec)]], colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROUNDEDCORNERS', [3,3,3,3]),
    ]))
    return t

def answer_lines(n=2):
    """Пустые линии для ответа от руки."""
    out = []
    for _ in range(n):
        out.append(Spacer(1, 11))
        out.append(HRFlowable(width='100%', thickness=0.5, color=LINE, lineCap='round'))
    out.append(Spacer(1, 4))
    return out

def question(num, title, body=None, note=None, lines=2):
    blk = [Paragraph(f'{num}.&nbsp;&nbsp;{title}', st_q)]
    if body:
        blk.append(Spacer(1, 3))
        blk.append(Paragraph(body, st_qbody))
    if note:
        blk.append(Spacer(1, 2))
        blk.append(Paragraph(note, st_note))
    blk += answer_lines(lines)
    blk.append(Spacer(1, 7))
    return KeepTogether(blk)

# --- контент ---
story = []
story.append(Paragraph('Pllato CRM — вопросы по логике перед запуском', st_title))
story.append(Spacer(1, 3))
story.append(Paragraph('Опросник для встречи с аптекой. Цель — закрыть открытые места в логике: '
                       'распределение заявок, обмен с 1С, справочник продавцов.', st_sub))
story.append(Spacer(1, 10))

meta = Table([[Paragraph('Аптека: __________________________', st_meta),
               Paragraph('Дата: ____________', st_meta),
               Paragraph('Отвечал(а): ______________', st_meta)]],
             colWidths=[78*mm, 38*mm, 54*mm])
meta.setStyle(TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),
                          ('BOTTOMPADDING',(0,0),(-1,-1),0)]))
story.append(meta)
story.append(Spacer(1, 14))

# Раздел 1
story.append(section_band('КРИТИЧНО — сквозная логика (заметят первым)', RED))
story.append(Spacer(1, 8))
story.append(question(1, 'Распределение новых заявок',
    'Когда новый клиент пишет в WhatsApp или звонит — кому уходит лид?',
    '• один ответственный на всех &nbsp;•&nbsp; по очереди (round-robin) &nbsp;•&nbsp; по точке/номеру, на который написали &nbsp;•&nbsp; свободный — кто первый взял.<br/>'
    'Сейчас: заявка создаёт клиента и сделку в воронке с меткой точки, но ответственного не назначает.'))
story.append(Spacer(1, 2))
story.append(Paragraph('Решено внутри CRM, спрашивать не нужно: <b>статус заказа</b> (Новый → Готово) '
    'менеджер переключает вручную прямо в списке заказов — обратный поток из 1С не требуется.', st_note))

story.append(Spacer(1, 6))
# Раздел 2
story.append(section_band('ЧИСТКА СПРАВОЧНИКА ПРОДАВЦОВ В 1С (на стороне аптеки)', AMBER))
story.append(Spacer(1, 8))
story.append(question(2, 'Дубли и неоднозначные имена продавцов',
    '«Валерия» числится на 6 точках, «Алёна» — на 3. Это разные люди под одним именем или один сотрудник?',
    '• развести по ФИО (Фамилия + Имя); «Екатерина» и «Екатерина Пугачёва», «Валерия» и «Чикунова Валерия» — объединять или это разные люди?'))
story.append(question(3, 'Служебные учётки',
    '«Администратор», «Касса Ала-Арча», «Касса Ош» — это не люди. Исключить их из KPI продавцов?', lines=1))
story.append(question(4, 'Нужна ли привязка «продавец → точка»?',
    'В 1С такого поля нет (связь только в продажах). Нужна оргструктура «кто за какой аптекой закреплён» (вести вручную в CRM) или достаточно факта из продаж?'))
story.append(question(5, 'Будут ли кассиры заходить в CRM?',
    'Если да — привяжем их логины к продавцам 1С (увидят «мои продажи»). Если CRM только для управляющих/владельца — привязка не нужна.', lines=1))

story.append(Spacer(1, 6))
# Раздел 3
story.append(section_band('НА БУДУЩЕЕ / ОПЦИОНАЛЬНО', GREEN2))
story.append(Spacer(1, 8))
story.append(question(6, 'Выплаты блогерам и кэшбэк врачам — проводить ли в 1С?',
    'Начисление и отметка «выплачено» уже работают в CRM. Открыт только вопрос бухгалтерии:',
    'нужно ли дополнительно проводить эти выплаты в 1С как документ (расходный ордер / ведомость), '
    'или учёта в CRM достаточно? Если нужно — каким документом вы их обычно оформляете?'))
story.append(Spacer(1, 4))
story.append(Paragraph('Уже двусторонне, обсуждать не нужно: <b>промокоды</b> — создание в CRM заводит '
    'дисконтную карту в 1С, статистика использований возвращается обратно.', st_note))

# --- футер с номером страницы ---
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Arial', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 12*mm, 'Pllato CRM · опросник для встречи')
    canvas.drawRightString(190*mm, 12*mm, f'стр. {doc.page}')
    canvas.setStrokeColor(LINE)
    canvas.line(20*mm, 15*mm, 190*mm, 15*mm)
    canvas.restoreState()

out = '/Users/yernaryedil/pllato-chat-v1.5/pharmacy-crm/docs/Вопросы-к-аптеке.pdf'
doc = SimpleDocTemplate(out, pagesize=A4,
                        leftMargin=20*mm, rightMargin=20*mm,
                        topMargin=18*mm, bottomMargin=20*mm,
                        title='Pllato CRM — вопросы по логике', author='Pllato CRM')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('OK ->', out)
