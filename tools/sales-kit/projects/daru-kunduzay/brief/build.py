# -*- coding: utf-8 -*-
# Сборка опросника в один файл: app/brief-daru.html
import os
D=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.abspath(os.path.join(D,'..','..','..','..','..'))
s=open(os.path.join(D,'shell.html'),encoding='utf-8').read()
s=s.replace('/*QUESTIONS*/',open(os.path.join(D,'questions.js'),encoding='utf-8').read()).replace('/*ENGINE*/',open(os.path.join(D,'engine.js'),encoding='utf-8').read())
open(os.path.join(ROOT,'app','brief-daru.html'),'w',encoding='utf-8').write(s);print('ok',len(s))
