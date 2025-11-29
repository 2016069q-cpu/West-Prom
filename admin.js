// Админ-панель: логин, загрузка данных, подтверждение и закрытие дня
(function(){

  const loginBtn = document.getElementById('loginBtn');
  const loginStatus = document.getElementById('loginStatus');
  const adminSection = document.getElementById('adminSection');
  const loginSection = document.getElementById('loginSection');

  const dataTableBody = document.querySelector('#dataTable tbody');
  const refreshBtn = document.getElementById('refreshBtn');
  const selectAll = document.getElementById('selectAll');
  const confirmSelected = document.getElementById('confirmSelected');
  const closeDayBtn = document.getElementById('closeDay');

  function renderRows(rows){
    dataTableBody.innerHTML = '';
    rows.forEach((r, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" data-idx="${idx}"></td>
        <td>${new Date(r.date).toLocaleString()}</td>
        <td>${r.fullname}</td>
        <td>${r.type}</td>
        <td>${r.workers}</td>
        <td>${r.days}</td>
        <td>${r.confirmed ? '✔' : '—'}</td>
      `;
      dataTableBody.appendChild(tr);
    });
  }

  async function loadData(){
    const res = await fetch(SCRIPT_URL + '?mode=read');
    const json = await res.json();
    json.sort((a,b)=> new Date(b.date) - new Date(a.date));
    renderRows(json);
  }

  // Вход админа
  loginBtn.addEventListener('click', ()=>{
    const pw = document.getElementById('adminPass').value.trim();
    if(pw === ADMIN_PASSWORD){
      loginStatus.textContent = 'Вход выполнен';
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
      loadData();
    } else {
      loginStatus.textContent = 'Неверный пароль';
    }
  });

  refreshBtn.addEventListener('click', loadData);

  selectAll.addEventListener('change', (e)=>{
    document.querySelectorAll('#dataTable tbody input[type=checkbox]')
      .forEach(cb => cb.checked = e.target.checked);
  });

  confirmSelected.addEventListener('click', async ()=>{
    const checkedIdx = [...document.querySelectorAll('#dataTable tbody input[type=checkbox]')]
      .map((cb,i)=> cb.checked ? i : -1)
      .filter(i => i >= 0);

    if(!checkedIdx.length){
      alert('Выберите строки');
      return;
    }

    const res = await fetch(SCRIPT_URL + '?mode=read');
    const json = await res.json();
    const toConfirm = checkedIdx.map(i => json[i]);

    await fetch(SCRIPT_URL + '?mode=confirm', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({items: toConfirm})
    });

    alert('Подтверждено');
    loadData();
  });

  closeDayBtn.addEventListener('click', async ()=>{
    if(!confirm('Закрыть день и создать отчёт?')) return;

    await fetch(SCRIPT_URL + '?mode=closeDay', { method:'POST' });

    alert('День закрыт, отчёт создан');
    loadData();
  });

})();
