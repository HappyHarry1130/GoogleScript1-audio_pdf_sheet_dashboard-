const openai = require('openai');
const fs = require('fs');
const pdfkit = require('pdfkit');
const wkhtmltopdf = require('wkhtmltopdf');
const { exec } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

const api_key = 'your key';
const client = new openai.OpenAI({ apiKey: api_key });

function convertWithPandoc(input, fromFormat, toFormat) {
    return new Promise((resolve, reject) => {
        exec(`echo "${input}" | pandoc -f ${fromFormat} -t ${toFormat}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else if (stderr) {
                reject(new Error(stderr));
            } else {
                resolve(stdout);
            }
        });
    });
}

async function gmat(question, max_retries=5) {
    const messages = [
        {role: "system", content: "You are the great reporter. please make report to help me"},
        {role: "user", content: `i have a retail wireless cell phone business store front prepaid stores called metro by tmobile. I have employees working in there. I have a transcript for an employee and customer interaction.



            The kpi's i want you to judge on are 5 main categories, each weighing 20 points each, totaling 100 points. place this data in a PDF in table format. Make sure total adds up to 100 points



            1 - Accessories being pitched like car chargers, wwall chargers, face plate, case, cover, screen protector, bluetooths, speakers, headphones, etc.
            2 - HSI - home internet device, was it offered or pitched?
            3 - Magenta in metro for elgibility to migrate over to postpaid from metro by tmobile prepaid. Was that offered?
            4 - Did they ask customer to give them a good survey rating of a 10?
            5 - Was a tablet or add a line offered in the transaction.



            As a seperate question :



            Did the employee spend at least 3 minutes pitching everything?`}
    ];

    for (let attempt = 0; attempt < max_retries; attempt++) {
        try {
            const completion = await client.chat.completions.create({
                model: "gpt-4o",
                messages: messages
            });
            return completion.choices[0].message.content;
        } catch (e) {
            console.log(`Attempt ${attempt + 1} failed: ${e}`);
            if (attempt < max_retries - 1) {
                console.log("Retrying...");
            } else {
                console.log("Max retries reached. Exiting.");
                throw e;
            }
        }
    }
}

async function main() {
    try {
        const audio_file_path = '3.mp3';
        const response_format = 'text';

        const form = new FormData();
        form.append('file', fs.createReadStream(audio_file_path));
        form.append('model', 'whisper-1');
        form.append('response_format', response_format);

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
            headers: {
                'Authorization': `Bearer ${api_key}`,
                ...form.getHeaders()
            }
        });

        console.log("Transcription:");
        console.log(response.data);
        const report = await gmat(response.data);
        console.log(report)

        // const doc = new pdfkit();
        // doc.pipe(fs.createWriteStream('report.pdf'));
        // doc.text(report);
        // doc.end();

        // const html = await convertWithPandoc(report, 'markdown', 'html');
        // wkhtmltopdf(html, { output: 'report.pdf' });

        // console.log('Pdf created');
    } catch (e) {
        console.log("Error:", e);
    }
}

main();