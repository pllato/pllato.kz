# -*- coding: utf-8 -*-
# Опросник «Склад готовой продукции · птицефабрика» → app/brief-ptica.html. Оболочка и движок — от универсальной анкеты.
import os
D=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.abspath(os.path.join(D,'..','..','..','..','..'))
P=os.path.join(ROOT,'tools','sales-kit','projects')
s=open(os.path.join(P,'daru-kunduzay','brief','shell.html'),encoding='utf-8').read()
s=s.replace('<title>Опросник для ТЗ · клиника · Pllato</title>','<title>Склад готовой продукции · опросник · Pllato</title>')
s=s.replace('</style>',open(os.path.join(P,'brief-universal','extra.css'),encoding='utf-8').read()+'\n</style>',1)
eng=open(os.path.join(P,'brief-universal','engine.js'),encoding='utf-8').read()
s=s.replace('/*QUESTIONS*/',open(os.path.join(D,'questions.js'),encoding='utf-8').read()).replace('/*ENGINE*/',eng)
open(os.path.join(ROOT,'app','brief-ptica.html'),'w',encoding='utf-8').write(s);print('ok',len(s))
