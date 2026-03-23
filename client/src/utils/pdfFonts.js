// src/utils/pdfFonts.js

// Важно: Это base64 представление шрифта
// Вы можете сконвертировать ваш .ttf файл в base64 через онлайн-сервис
// или использовать этот код для загрузки

export const loadRussianFont = async (doc) => {
  // Способ 1: Загрузка шрифта из public папки
  try {
    const fontUrl = '/fonts/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = btoa(
      new Uint8Array(fontBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    // Добавляем шрифт в jsPDF
    doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    
    return true;
  } catch (error) {
    console.error('Ошибка загрузки шрифта:', error);
    
    // Способ 2: Использование стандартного шрифта с поддержкой кириллицы
    // В jsPDF есть встроенная поддержка кириллицы через пакет jspdf-unicode
    doc.setFont('helvetica');
    return false;
  }
};

// Альтернативный способ: загрузка шрифта через CDN
export const loadFontFromCDN = async () => {
  // Этот подход требует установки jspdf-unicode
  try {
    const { jsPDF } = await import('jspdf');
    const { loadFont } = await import('jspdf-unicode');
    
    // Загружаем шрифт с CDN
    const font = await loadFont('https://fonts.cdnfonts.com/css/roboto');
    return font;
  } catch (error) {
    console.error('Ошибка загрузки шрифта с CDN:', error);
    return null;
  }
};