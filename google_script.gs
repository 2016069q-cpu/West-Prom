// Google Apps Script — backend для WestProm
function _getSheet(){
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('data');
  if(!sh){ sh = ss.insertSheet('data'); sh.appendRow(['date','fullname','type','workers','days','confirmed']); }
  return ss;
}

function doPost(e){
  try{
    const ss = _getSheet();
    const dataSheet = ss.getSheetByName('data');
    const payload = JSON.parse(e.postData.contents);
    const date = new Date();
    const fullname = payload.fullname || '';
    const type = payload.type || '';
    const workers = Number(payload.workers) || 0;
    const days = Number(payload.days) || 0;
    const confirmed = false;
    dataSheet.appendRow([date, fullname, type, workers, days, confirmed]);
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
    const json = rows.map(r=>({date: r[0], fullname:r[1], type:r[2], workers:r[3], days:r[4], confirmed:r[5]}));
    return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
  }
  if(mode === 'reports'){
    // reports sheet: each day block stored as rows: dateStr | fullname | type | workers | days
    const vals = reportsSheet.getDataRange().getValues();
    if(vals.length<1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    // group by dateStr
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

function doPostConfirm(items){
  // helper not used directly
}

function doPost(e){
  // if mode=confirm or mode=closeDay sent as query param, handle special
  try{
    const ss = _getSheet();
    const dataSheet = ss.getSheetByName('data');
    const mode = e.parameter && e.parameter.mode ? e.parameter.mode : null;
    if(mode === 'confirm'){
      const body = JSON.parse(e.postData.contents);
      const items = body.items || [];
      // For each item, find matching row and set confirmed = true
      const rows = dataSheet.getDataRange().getValues();
      for(let i=1;i<rows.length;i++){
        const r = rows[i];
        items.forEach(it=>{
          if(new Date(r[0]).toString() === new Date(it.date).toString() && r[1]===it.fullname){
            dataSheet.getRange(i+1,6).setValue(true);
          }
        });
      }
      return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
    }
    if(mode === 'closeDay'){
      // take all unarchived rows from dataSheet, create a report entry by today's dateStr
      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      let reportsSheet = ss.getSheetByName('reports');
      if(!reportsSheet) reportsSheet = ss.insertSheet('reports');
      const rows = dataSheet.getDataRange().getValues().slice(1);
      rows.forEach(r=>{
        // only include rows that are not already archived (we do simple approach: copy all rows and then clear dataSheet)
        reportsSheet.appendRow([today, r[1], r[2], r[3], r[4]]);
      });
      // очищаем dataSheet (оставляем заголовки)
      dataSheet.clearContents();
      dataSheet.appendRow(['date','fullname','type','workers','days','confirmed']);
      return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
    }
    // default: regular new entry
    const payload = JSON.parse(e.postData.contents);
    const date = new Date();
    const fullname = payload.fullname || '';
    const type = payload.type || '';
    const workers = Number(payload.workers) || 0;
    const days = Number(payload.days) || 0;
    const confirmed = false;
    ss.getSheetByName('data').appendRow([date, fullname, type, workers, days, confirmed]);
    return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({status:'error',message:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
