// Google Apps Script — backend для WestProm

function _getSheet(){
  const ss = SpreadsheetApp.getActive();
  // Гарантируем наличие листа 'data' с правильными заголовками
  let sh = ss.getSheetByName('data');
  if(!sh){ sh = ss.insertSheet('data'); sh.appendRow(['id','date','fullname','type','workers','days','confirmed']); }
  return ss;
}

function doPost(e){
  try{
    const ss = _getSheet();
    const dataSheet = ss.getSheetByName('data');
    const mode = e.parameter && e.parameter.mode ? e.parameter.mode : null;
    
    // ================== MODE CONFIRM ==================
    if(mode === 'confirm'){
      const body = JSON.parse(e.postData.contents);
      const items = body.items || []; // items: [{date, fullname}, ...]
      
      const rows = dataSheet.getDataRange().getValues();
      
      let updatedCount = 0;
      // Начинаем с 1, чтобы пропустить заголовки
      for(let i=1;i<rows.length;i++){
        const r = rows[i];
        
        items.forEach(it=>{
          // Сравниваем строки ISO даты. Клиент отправляет ISO строку.
          // r[1] - это объект Date из таблицы, его нужно форматировать для сравнения.
          const sheetDate = Utilities.formatDate(r[1], Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
          
          // Проверяем совпадение по дате и имени
          if(sheetDate === it.date && r[2]===it.fullname){
            dataSheet.getRange(i+1, 7).setValue(true); // Столбец 7: 'confirmed'
            updatedCount++;
          }
        });
      }
      return ContentService.createTextOutput(JSON.stringify({status:'ok', confirmed: updatedCount})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ================== MODE CLOSE DAY ==================
    if(mode === 'closeDay'){
      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      let reportsSheet = ss.getSheetByName('reports');
      if(!reportsSheet) reportsSheet = ss.insertSheet('reports');
      
      const rows = dataSheet.getDataRange().getValues().slice(1);
      
      // Выбираем только подтвержденные строки
      const rowsToArchive = rows.filter(r => r[6] === true); // Столбец 7: 'confirmed'
      
      rowsToArchive.forEach(r=>{
        // Записываем в reportsSheet: dateStr, fullname, type, workers, days
        // r[2] - fullname, r[3] - type, r[4] - workers, r[5] - days
        reportsSheet.appendRow([today, r[2], r[3], r[4], r[5]]);
      });
      
      // Очищаем dataSheet (оставляем заголовки)
      dataSheet.clearContents();
      dataSheet.appendRow(['id','date','fullname','type','workers','days','confirmed']);
      
      return ContentService.createTextOutput(JSON.stringify({status:'ok', archived: rowsToArchive.length})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ================== DEFAULT: NEW ENTRY ==================
    const payload = JSON.parse(e.postData.contents);
    
    const id = payload.id || Date.now(); // Используем ID с клиента
    const date = new Date(); // GAS Date Object
    const fullname = payload.fullname || '';
    const type = payload.type || '';
    const workers = Number(payload.workers) || 0;
    const days = Number(payload.days) || 0;
    const confirmed = false;
    
    dataSheet.appendRow([id, date, fullname, type, workers, days, confirmed]);
    
    return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({status:'error',message:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e){
  const ss = _getSheet();
  const dataSheet = ss.getSheetByName('data');
  const reportsSheet = ss.getSheetByName('reports') || ss.insertSheet('reports');
  const mode = e.parameter.mode || 'read';
  
  if(mode === 'read'){
    const rows = dataSheet.getDataRange().getValues().slice(1);
    // data sheet: id | date | fullname | type | workers | days | confirmed
    const json = rows.map(r=>({
      id: r[0],
      // ИСПРАВЛЕНО: Форматируем объект Date (r[1]) в строку ISO 8601 для корректного чтения клиентом
      date: Utilities.formatDate(r[1], Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      fullname:r[2], 
      type:r[3], 
      workers:r[4], 
      days:r[5], 
      confirmed:r[6]
    }));
    return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if(mode === 'reports'){
    // reports sheet: dateStr | fullname | type | workers | days
    const vals = reportsSheet.getDataRange().getValues();
    if(vals.length<1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    const groups = {};
    for(let i=0;i<vals.length;i++){
      const row = vals[i];
      const dateStr = row[0];
      if(!groups[dateStr]) groups[dateStr] = {dateStr: dateStr, items: [], totals:{sumDays:0}};
      const item = {fullname: row[1], type: row[2], workers: row[3], days: row[4]};
      groups[dateStr].items.push(item);
      groups[dateStr].totals.sumDays += Number(row[4])||0;
    }
    const out = Object.values(groups).sort((a,b)=> b.dateStr.localeCompare(a.dateStr));
    return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({error:'unknown mode'})).setMimeType(ContentService.MimeType.JSON);
}
