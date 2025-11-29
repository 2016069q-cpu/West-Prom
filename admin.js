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

    entries.forEach(entry => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', entry.id);

      const dateStr = entry.date ? new Date(entry.date).toLocaleString() : "—";

      tr.innerHTML = `
        <td><input type="checkbox" class="row-check"></td>
        <td>${dateStr}</td>
        <td>${entry.fullname}</td>
        <td>${entry.type}</td>
        <td>${entry.workers}</td>
        <td>${entry.days}</td>
        <td>${entry.confirmed ? '✔' : '—'}</td>
      `;

      dataTableBody.appendChild(tr);
    });
  }

  async function loadData() {
    const res = await fetch(SCRIPT_URL + '?mode=read');
    entries = await res.json();

    // сортировка по дате
    entries.sort((a,b) => new Date(b.date) - new Date(a.date));

    renderRows();
  }

  // кнопка входа
  loginBtn.addEventListener('click', () => {
    const pw = document.getElementById('adminPass').value.trim();
    if (pw === ADMIN_PASSWORD) {
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
      loadData();
    } else {
      alert('Неверный пароль');
    }
  });

  refreshBtn.addEventListener('click', loadData);

  // выбрать всё
  selectAll.addEventListener('change', (e) => {
    const checks = document.querySelectorAll('.row-check');
    checks.forEach(ch => ch.checked = e.target.checked);
  });

  // подтверждение
  confirmSelected.addEventListener('click', async () => {
    const checkedIds = [];

    document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
      const cb = tr.querySelector('.row-check');
      if (cb.checked) {
        checkedIds.push(Number(tr.getAttribute('data-id')));
      }
    });

    if (!checkedIds.length) {
      alert('Нет выделенных строк');
      return;
    }

    await fetch(SCRIPT_URL + '?mode=confirm', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: checkedIds })
    });

    alert("Подтверждено");
    loadData();
  });

  // закрыть день
  closeDayBtn.addEventListener('click', async () => {
    if (!confirm("Закрыть день?")) return;

    await fetch(SCRIPT_URL + '?mode=closeDay', { method: "POST" });

    alert("День закрыт, отчёт создан");
    loadData();
  });

})();
