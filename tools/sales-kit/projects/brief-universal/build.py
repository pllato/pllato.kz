# -*- coding: utf-8 -*-
# Сборка универсальной анкеты в один файл app/brief.html (оболочка — из daru-kunduzay/brief/shell.html + свои стили)
import os
D=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(os.path.join(D,'..','daru-kunduzay','brief','shell.html'),encoding='utf-8').read()
s=s.replace('<title>Опросник для ТЗ · клиника · Pllato</title>','<title>Анкета для ТЗ · Pllato</title>')
s=s.replace('</style>',open(os.path.join(D,'extra.css'),encoding='utf-8').read()+'\n</style>',1)
s=s.replace('/*QUESTIONS*/',open(os.path.join(D,'questions.js'),encoding='utf-8').read()).replace('/*ENGINE*/',open(os.path.join(D,'engine.js'),encoding='utf-8').read())
open(os.path.join(ROOT,'app','brief.html'),'w',encoding='utf-8').write(s);print('ok',len(s))
