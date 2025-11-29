// admin.js (Исправленная версия)
(function() {

  const loginBtn = document.getElementById('loginBtn');
  const loginSection = document.getElementById('loginSection');
  const adminSection = document.getElementById('adminSection');
  const dataTableBody = document.querySelector('#dataTable tbody');
  const refreshBtn = document.getElementById('refreshBtn');
  const selectAll = document.getElementById('selectAll');
  const confirmSelected = document.getElementById('confirmSelected');
  const closeDayBtn = document.getElementById('closeDay');

  let entries = []; // храним все записи из Google Script

  function renderRows() {
    dataTableBody.innerHTML = '';

    // Добавляем уникальный data-row-id для привязки к элементу entries
    entries.forEach((entry, index) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-row-id', index); // Используем индекс массива как ID строки для DOM

      const dateStr = entry.date ? new Date(entry.date).toLocaleString() : "—";
      const statusBadge = entry.confirmed ? 
        '<span class="badge badge-confirm">Да</span>' : 
        '<span class="badge badge-pending">Нет</span>';

      tr.innerHTML = `
        <td><input type="checkbox" class="row-check" ${entry.confirmed ? 'disabled' : ''}></td>
        <td>${dateStr}</td>
        <td>${entry.fullname}</td>
        <td>${entry.type}</td>
        <td>${entry.workers}</td>
        <td>${entry.days}</td>
        <td>${statusBadge}</td>
      `;

      dataTableBody.appendChild(tr);
    });
  }

  async function loadData() {
    const res = await fetch(SCRIPT_URL + '?mode=read');
    const rawEntries = await res.json();
    
    // Сортировка по дате
    rawEntries.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    // Добавляем ID (timestamp) к каждой записи, если его нет (хотя он должен быть)
    entries = rawEntries.map((e, idx) => ({ 
        ...e, 
        id: e.id || idx + 1 
    })); 

    renderRows();
  }

  // кнопка входа
  loginBtn.addEventListener('click', () => {
    const pw = document.getElementById('adminPass').value.trim();
    const loginStatus = document.getElementById('loginStatus');
    if (pw === ADMIN_PASSWORD) {
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
      loadData();
    } else {
      loginStatus.textContent = 'Неверный пароль';
      setTimeout(() => loginStatus.textContent = '', 3000);
    }
  });

  refreshBtn.addEventListener('click', loadData);

  // выбрать всё
  selectAll.addEventListener('change', (e) => {
    // Выбирать только те, что не подтверждены
    const checks = document.querySelectorAll('.row-check:not(:disabled)');
    checks.forEach(ch => ch.checked = e.target.checked);
  });

  // подтверждение
  confirmSelected.addEventListener('click', async () => {
    const itemsToConfirm = [];

    document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
      const cb = tr.querySelector('.row-check');
      if (cb.checked) {
        // Получаем индекс записи из entries
        const rowId = tr.getAttribute('data-row-id');
        const entry = entries[rowId];
        // Отправляем date и fullname для поиска на сервере
        itemsToConfirm.push({ date: new Date(entry.date).toISOString(), fullname: entry.fullname });
      }
    });

    if (!itemsToConfirm.length) {
      alert('Нет выделенных строк');
      return;
    }
    
    confirmSelected.disabled = true;

    const res = await fetch(SCRIPT_URL + '?mode=confirm', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsToConfirm }) // ИСПРАВЛЕНО: отправляем items {date, fullname}
    });
    
    const json = await res.json();
    confirmSelected.disabled = false;

    if(json.status === 'ok'){
      alert(`Подтверждено ${json.confirmed} записей.`);
      loadData();
    } else {
      alert("Ошибка подтверждения: " + json.message);
    }
  });

  // закрыть день
  closeDayBtn.addEventListener('click', async () => {
    if (!confirm("Вы уверены? Закрыть день (создать отчёт) и очистить черновики?")) return;

    closeDayBtn.disabled = true;
    const res = await fetch(SCRIPT_URL + '?mode=closeDay', { method: "POST" });
    const json = await res.json();
    closeDayBtn.disabled = false;

    if(json.status === 'ok'){
        alert(`День закрыт, ${json.archived} записей архивировано.`);
        loadData();
    } else {
        alert("Ошибка закрытия дня: " + json.message);
    }
  });
  
})();
