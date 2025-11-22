// Code.gs - Deploy as Web App
function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Invalid request parameters'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = e.parameter.action;

  if (action === 'getTodayData') {
    return getTodayData();
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'savePreference') {
    return savePreference(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function getTodayData() {
  try {
    const sheet = SpreadsheetApp.openById('155F8ualWYxnc_dGP_kNXLdz24gRR8Fe5WI7XCLIC0H0').getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const today = new Date().toDateString();
    
    const headers = data[0];
    const todayData = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        const rowDate = new Date(row[0]).toDateString();
        
        if (rowDate === today) {
          const person = {
            timestamp: row[0],
            name: row[1],
            mealId: row[2],
            breakfast: row[3] ? row[3].toString() : '0',
            nightMeal: row[4] ? row[4].toString() : '0',
            date: row[5]
          };
          todayData.push(person);
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: todayData
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function savePreference(data) {
  try {
    const sheet = SpreadsheetApp.openById('155F8ualWYxnc_dGP_kNXLdz24gRR8Fe5WI7XCLIC0H0').getActiveSheet();
    const allData = sheet.getDataRange().getValues();
    const today = new Date().toDateString();
    
    // Check if meal ID already exists today
    let existingRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const rowDate = new Date(allData[i][0]).toDateString();
      if (rowDate === today && allData[i][2] === data.mealId) {
        existingRow = i + 1;
        break;
      }
    }
    
    const timestamp = new Date();
    const rowData = [
      timestamp,
      data.name,
      data.mealId,
      data.breakfast,
      data.nightMeal,
      today
    ];
    
    if (existingRow !== -1) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Preferences saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Auto reset function
function resetDailyPreferences() {
  Logger.log("Daily reset completed at: " + new Date());
}

// Set up daily trigger
function createDailyTrigger() {
  ScriptApp.newTrigger('resetDailyPreferences')
    .timeBased()
    .atHour(23)
    .nearMinute(59)
    .everyDays(1)
    .create();
}