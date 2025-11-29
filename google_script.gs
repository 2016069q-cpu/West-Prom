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
