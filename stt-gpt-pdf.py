
from openai import OpenAI
import os
from openai import OpenAI
import os
import openai
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import pypandoc
import pdfkit
api_key = 'your api key'
client = OpenAI(api_key=api_key)
def gmat(question, max_retries=5):
    
    messages = [
        {"role": "system", "content": f"""You are the great reporter. please make report to help me"""},
        {"role": "user", "content": f"""
            i have a retail wireless cell phone business store front prepaid stores called metro by tmobile. I have employees working in there. I have a transcript for an employee and customer interaction.



            The kpi's i want you to judge on are 5 main categories, each weighing 20 points each, totaling 100 points. place this data in a PDF in table format. Make sure total adds up to 100 points



            1 - Accessories being pitched like car chargers, wwall chargers, face plate, case, cover, screen protector, bluetooths, speakers, headphones, etc.
            2 - HSI - home internet device, was it offered or pitched?
            3 - Magenta in metro for elgibility to migrate over to postpaid from metro by tmobile prepaid. Was that offered?
            4 - Did they ask customer to give them a good survey rating of a 10?
            5 - Was a tablet or add a line offered in the transaction.



            As a seperate question :



            Did the employee spend at least 3 minutes pitching everything?
        """}]  

    for attempt in range(max_retries):
        try:
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=messages
            )
            return completion.choices[0].message.content
        except openai.error.OpenAIError as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print("Retrying...")
            else:
                print("Max retries reached. Exiting.")
                raise


def main():
    try:
        # audio_file_path = input("Enter the file path of the audio file: ")
        api_key = 'your api key'
        audio_file_path = '3.mp3'#audio_file_path.strip('\"')


        response_format = 'text'#input("Enter the desired response format (text or vtt): ")

        if not api_key:
            api_key = input("Enter your OpenAI API key: ")

        client = OpenAI(api_key=api_key)

        with open(audio_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format=response_format
            )

        print("Transcription:")
        print(transcript)
        report =  gmat(transcript)
        #print(report)
        c = canvas.Canvas("report.pdf", pagesize=letter)
        width, height = letter

        # Add the report to the PDF
        textobject = c.beginText()
        textobject.setTextOrigin(10, height - 50)
        lines = report.split('\n')
        for line in lines:
            textobject.textLine(line)
        c.drawText(textobject)

        # Save the PDF
        c.save()
        html = pypandoc.convert_text(report, 'html', format='md')
        #print(html)
        # Convert HTML to PDF
        path_wkthmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'  # replace with your actual path
        config = pdfkit.configuration(wkhtmltopdf=path_wkthmltopdf)
        pdfkit.from_string(html, 'report.pdf', configuration=config)
        print('Pdf created')

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
