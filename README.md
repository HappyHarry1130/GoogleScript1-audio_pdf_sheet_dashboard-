# Audio Transcription and Reporting Script

This Google Apps Script project automates the process of transcribing audio files, generating performance reports, and storing the results in Google Sheets and Google Drive. It also sends the generated reports via email.

## Features

- Transcribes audio files (`.mp3`, `.mp4`, `.ogg`) using OpenAI's Whisper model.
- Generates HTML performance reports based on the transcription.
- Parses the HTML report to extract plain text and table data.
- Writes the table data to a Google Sheets spreadsheet.
- Creates a Google Doc with the plain text report and converts it to a PDF.
- Sends the PDF report via email.
- Moves processed audio files to a "completed_audio" folder.
- Sets up a time-driven trigger to run the script every 5 minutes.

## Setup

1. **Clone the repository** or create a new Google Apps Script project and copy the code from `google_app.js` into your script editor.

2. **Replace the OpenAI API key**:
   ```javascript
   var api_key = 'your_openai_api_key_here';
   ```

3. **Set up the folder structure**:
   - Create a folder named `AudioTranscribeGscript` in your Google Drive.
   - Place your audio files (`.mp3`, `.mp4`, `.ogg`) in this folder.

4. **Authorize the script**:
   - Run the script for the first time to authorize the necessary permissions.

5. **Deploy the script**:
   - Set up a time-driven trigger to run the `main` function every 5 minutes:
     ```javascript
     function createTimeDrivenTriggers() {
       main();
       ScriptApp.newTrigger('main')
           .timeBased()
           .everyMinutes(5)
           .create();
     }
     ```

## Functions

### `main()`
- The main function that orchestrates the entire process.
- Transcribes audio files, generates reports, writes data to Google Sheets, creates Google Docs, and sends emails.

### `create_report(transcript, api_key, filename)`
- Generates an HTML performance report based on the provided transcript.
- Uses OpenAI's GPT-4 model to create the report.

### `getTextFromElement(element)`
- Extracts plain text from an HTML element.

### `writeToGoogleSheets(data, filename)`
- Writes the extracted table data to a Google Sheets spreadsheet.

### `getTableFromElement(element)`
- Extracts table data from an HTML element.

### `getDataFromSheet()`
- Retrieves data from a specific Google Sheets spreadsheet.

### `doGet()`
- Serves an HTML dashboard with data from the Google Sheets spreadsheet.

## Usage

1. **Upload audio files** to the `AudioTranscribeGscript` folder in your Google Drive.
2. The script will automatically process the files, generate reports, and send emails.
3. Check the `KPIs` spreadsheet in your Google Drive for the performance data.
4. Processed audio files will be moved to the `completed_audio` folder.

## Notes

- Ensure that the OpenAI API key is valid and has sufficient quota.
- Customize the email recipient and other parameters as needed.