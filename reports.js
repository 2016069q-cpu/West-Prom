// Загружает лист reports и показывает блоки по дням и суммирует человека-дни по месяцу
(async function(){
  async function loadReports(){
    const res = await fetch(SCRIPT_URL + '?mode=reports');
    const arr = await res.json();
    // arr: [{dateStr: '2025-11-29', items: [{fullname,type,workers,days,confirmed}], totals: {sumDays}}]
    const container = document.getElementById('reportsContainer');
    container.innerHTML = '';
    arr.forEach(day=>{
      const div = document.createElement('div');
      div.className = 'report-day';
      div.innerHTML = `<h4>Отчёт за ${day.dateStr} — человеко-дней: ${day.totals.sumDays}</h4>`;
      const table = document.createElement('table'); table.className='table';
      table.innerHTML = `<thead><tr><th>Имя</th><th>Тип</th><th>Людей</th><th>Дн.</th></tr></thead>`;
      const tbody = document.createElement('tbody');
      day.items.forEach(it=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${it.fullname}</td><td>${it.type}</td><td>${it.workers}</td><td>${it.days}</td>`;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      div.appendChild(table);
      container.appendChild(div);
    });

    // build monthly summary by fullname
    const monthlyDiv = document.getElementById('monthly');
    monthlyDiv.innerHTML = '';
    const map = new Map();
    arr.forEach(day=> day.items.forEach(it=>{
      if(it.days && it.days>0){
        map.set(it.fullname, (map.get(it.fullname)||0) + it.days);
      }
    }));
    const tbl = document.createElement('table'); tbl.className='table';
    let rows = `<thead><tr><th>Имя</th><th>Человеко-дней за период</th></tr></thead><tbody>`;
    for(const [name,sum] of map.entries()) rows += `<tr><td>${name}</td><td>${sum}</td></tr>`;
    rows += '</tbody>';
    tbl.innerHTML = rows;
    monthlyDiv.appendChild(tbl);
  }
  loadReports();
})();
