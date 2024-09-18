
function main() {
  try{ var api_key = 'your openai api key';; //Replace with your openai api key

  var folderPath = 'AudioTranscribeGscript'; 

  var folders = folderPath.split('/');
  var parentFolder = DriveApp.getRootFolder();
  for (var i = 0; i < folders.length; i++) {
      var folderIter = parentFolder.getFoldersByName(folders[i]);
      if (folderIter.hasNext()) {
          parentFolder = folderIter.next();
      } else {
          Logger.log('Folder not found: ' + folders[i]);
          return;
      }
  }

  var fileIter = parentFolder.getFiles();
  while (fileIter.hasNext()) {
      var file = fileIter.next();
      if (file.getName().endsWith('.mp3') || file.getName().endsWith('.mp4') || file.getName().endsWith('.ogg')) {
          var audio_file = file.getBlob();
          var file_name = file.getName();
          file_name = file_name.substring(0, file_name.lastIndexOf('.'));
          var form = {
              'file': audio_file,
              'model': 'whisper-1',
              'response_format': 'text'
            };
          
            var options = {
              method: 'post',
              headers: {
                'Authorization': 'Bearer ' + api_key,
              },
              payload: form
            };
          
            var response = UrlFetchApp.fetch('https://api.openai.com/v1/audio/transcriptions', options);
            var transcript = response.getContentText();
          
            Logger.log("Transcription:");
            Logger.log(transcript);
          
            var report = create_report(transcript, api_key, file_name);
            
    
            // Replace self-closing tags with opening and closing tags
  
            // Trim the report
            report = report.trim();
            Logger.log(report);
    
            // Parse the HTML report to plain text
            var html = XmlService.parse(HtmlService.createHtmlOutput(report).getContent());
            var rootElement = html.getRootElement();
            var bodyElement = rootElement.getChild('body');
            
            if (bodyElement === null) {
                Logger.log('No body element found in the HTML');
                return;
            }
            
            var textReport = getTextFromElement(bodyElement);
            var tableReport = getTableFromElement(bodyElement);

            writeToGoogleSheets(tableReport, file_name);
    
            // Create a new Google Doc
            var doc = DocumentApp.create(file_name);
            var body = doc.getBody();  
        
            // Append the plain text report to the Google Doc
            body.appendParagraph(textReport);
            doc.saveAndClose();
        
            // Get the document, then get the PDF Blob
            var doc = DocumentApp.openById(doc.getId());
            var pdf = doc.getAs(MimeType.PDF);
            
            // Create a new file in the root drive using the PDF Blob
            var pdfFile = DriveApp.createFile(pdf);
        
            // Replace the above code with the following:
            var blob = Utilities.newBlob(report, MimeType.HTML, `${file_name}.html`);
            var file_pdf = DriveApp.createFile(blob);
            var pdfFile = DriveApp.createFile(file_pdf.getAs(MimeType.PDF));
          
            DriveApp.createFile(pdf);
            MailApp.sendEmail({
                to: "o58475416@gmail.com",
                subject: file_name,
                body: "Here is the report.",
                attachments: [pdfFile]
              });
              var targetFolder = DriveApp.getFoldersByName('completed_audio');
              if (targetFolder.hasNext()) {
                  file.moveTo(targetFolder.next());
              } else {
                  Logger.log('Folder not found: completed_audio. Creating new folder.');
                  targetFolder = DriveApp.createFolder('completed_audio');
                  file.moveTo(targetFolder);
              }
      }
  }}
  catch (error) {
    Logger.log('An error occurred: ' + error.message);
    Logger.log('Retrying...');
    main();
  }  
}

function create_report(transcript, api_key, filename) {
  
  var messages = [
    {role: "system", content: `You are the great reporter. please make report to help me. please make report in HTML format.You should output only the correct HTML. you print just HTML without any others. All element must be terminated by the matching end-tag. The title must be 'Employee Performance Report (${filename})'
                              And then the table must include  <th>KPI</th>  <th>Score (out of 20)</th>  <th>Comments</th>
                              And then you must answer about this question in the bottom: 'Did the employee spend at least 3 minutes pitching everything?'.
                              `},//please change your prompt in here.
    {role: "user", content: `
      I have a retail wireless cell phone business store front prepaid stores called metro by tmobile.  I have employees working in there.  I have a transcript for an employee and customer interaction.

      The kpi's i want you to judge on are 5 main categories, each weighing 20 points each, totaling 100 points.  place this data in a table that looks very presentable.

      1 - Accessories being pitched like car chargers, wwall chargers, face plate, case, cover, screen protector, bluetooths, speakers, headphones, etc.
      2 - HSI - home internet device, was it offered or pitched?
      3 - Magenta in metro for elgibility to migrate over to postpaid from metro by tmobile prepaid. Was that offered?
      4 - Did they ask customer to give them a good survey rating of a 10?
      5 - Was a tablet or add a line offered in the transaction. 

      As a seperate question : 

      Did the employee spend at least 3 minutes pitching everything?

      here is content: ${transcript}     

      `}
  ];

  var data = {
    'model': 'gpt-4o',
    'messages': messages
  };

  var options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + api_key,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  var completion = JSON.parse(response.getContentText());

  var report = completion.choices[0].message.content;
  report = report.replace(/<meta[^>]*>/g, function(match) {
      if (match.endsWith('/>')) {
          return match;
      } else {
          return match + '</meta>';
      }
  });

  report = report.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
  return report;
}

function getTextFromElement(element) {
  var text = '';
  var children = element.getChildren();
  children.forEach(function(child) {
      switch (child.getName()) {
          case 'p':
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
              text += child.getText() + '\n';
              break;
          case 'table':
              var rows = child.getChild('tbody').getChildren('tr');
              rows.forEach(function(row) {
                  var cells = row.getChildren('td');
                  cells.forEach(function(cell) {
                      text += cell.getText() + ' ';
                  });
                  text += '\n';
              });
              break;
          default:
              text += getTextFromElement(child);
      }
  });
  return text;
}

function createTimeDrivenTriggers() {
  main()
  ScriptApp.newTrigger('main')
      .timeBased()
      .everyMinutes(5)
      .create();
}

function writeToGoogleSheets(data, filename) {
  // Create a new spreadsheet with a specific name if it doesn't exist
  var spreadsheetName = "KPIs";
  var spreadsheet;
  var files = DriveApp.getFilesByName(spreadsheetName);
  
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(spreadsheetName);
  }
  
  // Get or create a sheet with the filename as the sheet name
  var sheet = spreadsheet.getSheetByName(filename);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(filename);
  }
  
  // Append new data to the sheet with the current date as the first field
  var lastRow = sheet.getLastRow();
  var currentDate = new Date();
  console.log(`Data length: ${data.length}`)
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    sheet.getRange(lastRow + i + 1, 1).setValue(currentDate); // Set the current date in the first column
    for (var j = 0; j < row.length; j++) {
      sheet.getRange(lastRow + i + 1, j + 2).setValue(row[j]); // Shift other data to the right
    }
  }
}

function getTableFromElement(element) {
  var data = [];
  var children = element.getChildren();
  children.forEach(function(child) {
      switch (child.getName()) {
          case 'table':
              var rows = child.getChild('tbody').getChildren('tr');
              rows.forEach(function(row) {
                  var rowData = [];
                  var cells = row.getChildren('td');
                  cells.forEach(function(cell) {
                      rowData.push(cell.getText());
                  });
                  data.push(rowData);
              });
              break;
          default:
              //data = data.concat(getTextFromElement(child));
              break;
      }
  });
  return data;
}

function getDataFromSheet(startDate, endDate) {
  var sheet = SpreadsheetApp.openById('15zyvPCZ41jY6KRG_rpdnjpAd7JRiwd87xUjf1REH5NY').getSheetByName('Sheet1');
  var data = sheet.getDataRange().getValues();
  
  // Filter data based on date range
  var filteredData = data.filter(row => {
    var date = new Date(row[0]);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });
  
  // Group data by date
  var groupedData = {};
  filteredData.forEach(row => {
    var date = row[0];
    if (!groupedData[date]) {
      groupedData[date] = [];
    }
    groupedData[date].push(row);
  });
  
  return groupedData;
}

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('dashboard');
  var startDate = e.parameter.startDate || '2024-09-18';
  var endDate = e.parameter.endDate || '2024-09-20';
  var data = getDataFromSheet(startDate, endDate);
  template.data = data;
  template.startDate = startDate;
  template.endDate = endDate;
  return template.evaluate();
}