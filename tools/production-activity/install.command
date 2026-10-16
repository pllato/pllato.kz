#!/bin/bash
set -eu
cd "$(dirname "$0")"
PYTHON=$(command -v python3 || true)
if [ -z "$PYTHON" ]; then
  echo 'Нужен Python 3 с https://www.python.org/downloads/macos/'
  read -r -p 'Нажмите Enter для закрытия'; exit 1
fi
if ! "$PYTHON" install.py; then
  echo 'Установка не завершена. Проверьте интернет и повторите запуск — дублей не будет.'
  read -r -p 'Нажмите Enter для закрытия'; exit 1
fi
read -r -p 'Нажмите Enter для закрытия'
