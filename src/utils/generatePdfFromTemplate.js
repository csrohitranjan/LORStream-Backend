import puppeteer from 'puppeteer';
import fs from "fs";



// Function to generate PDF from HTML template
export async function generatePdfFromTemplate(templatePath, templateData, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Read HTML template file
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Inject data into HTML template
    const filledTemplate = fillTemplateWithData(htmlTemplate, templateData);

    // Set HTML content
    await page.setContent(filledTemplate);

    // Generate PDF
    const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
            // top: '5mm',
            right: '5mm',
            // bottom: '5mm',
            left: '5mm'
        }
    });

    await browser.close();

    // Save PDF to outputPath folder
    fs.writeFileSync(outputPath, pdfBuffer);
}



// Function to fill HTML template with data
function fillTemplateWithData(template, templateData) {
    // Replace placeholders with data
    for (const key in templateData) {
        if (Object.hasOwnProperty.call(templateData, key)) {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), templateData[key]);
        }
    }
    return template;
}