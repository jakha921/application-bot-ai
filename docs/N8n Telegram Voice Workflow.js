/**
 * n8n Code Node: Интеграция с Python скриптом для генерации Word
 * 
 * Этот код запускает Python скрипт, который генерирует Word документ
 * с правильным форматированием по образцу
 */

// ============ ВАРИАНТ 1: Использование child_process (если Python установлен локально) ============

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Получаем текст документа из предыдущего узла
const documentText = $input.item.json.response || $input.item.json.documentText;
const chatId = $input.item.json.chatId;

// Создаём временный файл с текстом
const tempTextFile = `/tmp/ariza_text_${Date.now()}.txt`;
const outputDocxFile = `/tmp/ariza_${Date.now()}.docx`;

try {
  // Сохраняем текст во временный файл
  fs.writeFileSync(tempTextFile, documentText, 'utf8');
  
  // Путь к Python скрипту (поместите скрипт в папку n8n)
  const pythonScript = path.join(__dirname, 'ariza_generator.py');
  
  // Запускаем Python скрипт
  const command = `python3 ${pythonScript} "${tempTextFile}" "${outputDocxFile}"`;
  execSync(command);
  
  // Читаем сгенерированный файл
  const docxBuffer = fs.readFileSync(outputDocxFile);
  const docxBase64 = docxBuffer.toString('base64');
  
  // Удаляем временные файлы
  fs.unlinkSync(tempTextFile);
  // fs.unlinkSync(outputDocxFile); // Оставьте если нужно для отладки
  
  return {
    chatId: chatId,
    documentData: docxBase64,
    filename: `ariza_${Date.now()}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
} catch (error) {
  console.error('Ошибка генерации документа:', error);
  throw new Error(`Не удалось создать Word документ: ${error.message}`);
}


// ============ ВАРИАНТ 2: Использование HTTP API (если Python работает как сервис) ============

/*
// Предполагается, что Python скрипт запущен как Flask API на localhost:5000

const axios = require('axios');

const documentText = $input.item.json.response || $input.item.json.documentText;
const chatId = $input.item.json.chatId;

try {
  const response = await axios.post('http://localhost:5000/generate-ariza', {
    text: documentText,
    filename: `ariza_${Date.now()}.docx`
  }, {
    responseType: 'arraybuffer'
  });
  
  const docxBase64 = Buffer.from(response.data).toString('base64');
  
  return {
    chatId: chatId,
    documentData: docxBase64,
    filename: response.headers['x-filename'] || `ariza_${Date.now()}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
} catch (error) {
  console.error('Ошибка генерации через API:', error);
  throw new Error(`API вернул ошибку: ${error.message}`);
}
*/


// ============ ВАРИАНТ 3: Чистый JavaScript (без Python) - Упрощённый ============

/*
// Используем библиотеку docx для Node.js
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

const documentText = $input.item.json.response || $input.item.json.documentText;
const chatId = $input.item.json.chatId;

// Парсим текст
const lines = documentText.split('\n').filter(l => l.trim());

// Создаём секции
let headerLines = [];
let bodyLines = [];
let appendixLines = [];
let date = '';
let signature = '';

let currentSection = 'header';

for (let line of lines) {
  const trimmed = line.trim();
  
  if (trimmed.includes('А Р И З А') || trimmed.includes('АРИЗА')) {
    currentSection = 'body';
    continue;
  }
  
  if (trimmed.startsWith('Илова:')) {
    currentSection = 'appendix';
  }
  
  if (/\d{2}\.\d{2}\.\d{4}/.test(trimmed)) {
    date = trimmed;
    currentSection = 'footer';
    continue;
  }
  
  if (currentSection === 'footer' && trimmed.includes('Адвокат')) {
    signature = trimmed;
    continue;
  }
  
  if (currentSection === 'header') {
    headerLines.push(trimmed);
  } else if (currentSection === 'body') {
    bodyLines.push(trimmed);
  } else if (currentSection === 'appendix') {
    appendixLines.push(trimmed);
  }
}

// Создаём документ
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1134,
          right: 850,
          bottom: 1134,
          left: 1700
        }
      }
    },
    children: [
      // Шапка
      ...headerLines.map(line => new Paragraph({
        text: line,
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 }
      })),
      
      // Пустая строка
      new Paragraph({ text: '' }),
      
      // Заголовок
      new Paragraph({
        text: 'А Р И З А',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        children: [new TextRun({ text: 'А Р И З А', bold: true })]
      }),
      
      // Основной текст
      ...bodyLines.map((line, i) => new Paragraph({
        text: line,
        alignment: AlignmentType.JUSTIFY,
        indent: i === 0 ? { firstLine: 720 } : undefined
      })),
      
      // Пустая строка
      new Paragraph({ text: '' }),
      
      // Приложения
      ...appendixLines.map(line => new Paragraph({
        text: line,
        alignment: AlignmentType.JUSTIFY
      })),
      
      // Пустая строка
      new Paragraph({ text: '' }),
      
      // Дата и подпись
      new Paragraph({
        children: [
          new TextRun(date),
          new TextRun('                                        '),
          new TextRun(signature)
        ]
      })
    ]
  }]
});

// Упаковываем в буфер
const buffer = await Packer.toBuffer(doc);
const docxBase64 = buffer.toString('base64');

return {
  chatId: chatId,
  documentData: docxBase64,
  filename: `ariza_${Date.now()}.docx`,
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
*/
