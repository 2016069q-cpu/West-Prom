WestProm — сайт учёта посещаемости

Файлы:
- index.html        — форма работника
- admin.html        — админ-панель (подтверждение / закрытие дня)
- reports.html      — страница отчётов и месячной таблицы человеко-дней
- styles.css        — общие стили
- config.js         — конфигурация (SCRIPT_URL, ADMIN_PASSWORD)
- worker.js         — логика отправки отметки
- admin.js          — логика админа (загрузка, подтверждение, закрытие дня)
- reports.js        — логика отчётов на клиенте
- google_script.gs  — сервер (Google Apps Script) — записывает, читает, архивирует

Шаги развёртывания:
1) Создать Google Sheet с именем "WestProm Attendance" и листами: `data` и `reports`.
   В листе `data` первая строка (заголовки):
   id | date | fullname | type | workers | days | confirmed
2) Вставить google_script.gs в Apps Script, Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
3) Скопировать полученный Web App URL (оканчивается на /exec) и убедиться, что он совпадает с config.js (файл уже содержит URL, который ты дал).
4) Залить файлы на GitHub Pages или любой статический хостинг.
