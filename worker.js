// логика отправки отметки (клиент)
(function(){
  const fullnameEl = document.getElementById('fullname');
  const typeEl = document.getElementById('type');
  const workersEl = document.getElementById('workers');
  const sendBtn = document.getElementById('sendBtn');
  const status = document.getElementById('status');

  // автозаполнение из localStorage
  const saved = localStorage.getItem('westprom_fullname');
  if(saved) fullnameEl.value = saved;

  sendBtn.addEventListener('click', async ()=>{
    const fullname = fullnameEl.value.trim();
    const type = typeEl.value;
    const workers = Number(workersEl.value);
    if(!fullname){ status.textContent = 'Введите имя и фамилию'; return; }

    // правила: если type === 'deal' -> days = 0
    const days = type === 'deal' ? 0 : workers;

    const payload = { fullname, type, workers, days };

    // сохранить имя локально
    localStorage.setItem('westprom_fullname', fullname);

    status.textContent = 'Отправка...';
    try{
      await fetch(SCRIPT_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      status.textContent = 'Отмечено';
      setTimeout(()=>status.textContent='');
    }catch(e){
      console.error(e);
      status.textContent = 'Ошибка отправки';
    }
  });
})();
