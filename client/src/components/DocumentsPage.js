import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable'
import './timesnewromanpsmt-normal.js';
import './ofont.ru_Times New Roman-bold.js';

// ═══════════════════════════════════════════════════════════════
// РЕКВИЗИТЫ КОМПАНИИ
// ═══════════════════════════════════════════════════════════════
const COMPANY_DETAILS = {
  name: 'ООО "СКЛАДСКИЕ СИСТЕМЫ"',
  shortName: 'ООО "СС"',
  inn: '7701234567',
  kpp: '770101001',
  ogrn: '1234567890123',
  address: '123456, г. Москва, ул. Складская, д. 10, офис 5',
  phone: '+7 (495) 123-45-67',
  email: 'info@warehouse-sys.ru',
  director: 'Иванов Иван Иванович',
  directorShort: 'И.И. Иванов',
  accountant: 'Петрова Мария Сергеевна',
  bank: {
    name: 'ПАО "СБЕРБАНК"',
    bik: '044525225',
    account: '40702810400000123456',
    corrAccount: '30101810400000000225'
  }
};

function DocumentsPage({ setError }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Загрузка списка документов
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8080/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки документов');
      }

      const data = await response.json();

      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Ошибка загрузки документов:', err);
      setError?.('Не удалось загрузить список документов');
    } finally {
      setLoading(false);
    }
  };

  // Функция для создания документа
  const createDocument = async (documentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      });

      if (!response.ok) {
        throw new Error('Ошибка создания документа');
      }

      const result = await response.json();
      await fetchDocuments(); // Обновляем список
      return result;
    } catch (err) {
      console.error('Ошибка создания документа:', err);
      setError?.('Не удалось создать документ');
      throw err;
    }
  };

  const fetchDocumentItems = async (documentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8080/api/document-products/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document items');
    }

    const data = await response.json();

    console.log(data)
    
    // Преобразуем данные в нужный формат
    return (data.items || []).map(item => ({
      id: item.id,
      article: item.product_article || '-',
      name: item.product_name || 'Товар',
      unit: item.unit || 'шт',
      quantity: item.quantity || 0,
      price: item.price || 0,
      amount: item.amount || 0,
      vat_rate: item.vat_rate || 0
    }));
  } catch (error) {
    console.error('Ошибка загрузки товаров документа:', error);
    return [];
  }
};

  // ═══════════════════════════════════════════════════════════════
// ГЕНЕРАЦИЯ ДОГОВОРА ПОСТАВКИ (строгий официальный документ)
// ═══════════════════════════════════════════════════════════════
const generateContractPDF = async (document) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFont('timesnewromanpsmt', 'normal');

    // ═══════════════════════════════════════════════════════════
    // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Проверка переполнения страницы
    // ═══════════════════════════════════════════════════════════
    const checkPageOverflow = (currentY, requiredSpace = 30) => {
      const pageHeight = doc.internal.pageSize.height; // 297mm для A4
      const bottomMargin = 20; // Нижний отступ
      const maxY = pageHeight - bottomMargin; // 277mm
      
      if (currentY + requiredSpace > maxY) {
        doc.addPage();
        return 20; // Начальная позиция новой страницы
      }
      return currentY; // Текущая позиция без изменений
    };
    
    let yPos = 20;

    // ═══════════════════════════════════════════════════════════
    // ЗАГРУЗКА ТОВАРОВ ДОКУМЕНТА
    // ═══════════════════════════════════════════════════════════
    const items = await fetchDocumentItems(document.ID);
    document.items = items; // Добавляем товары в объект документа
    
    // ═══════════════════════════════════════════════════════════
    // ЗАГОЛОВОК ДОКУМЕНТА
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('ДОГОВОР ПОСТАВКИ', 105, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(12);
    doc.text(`№ ${document.Doc_number} от ${new Date(document.Created_at).toLocaleDateString('ru-RU')}`, 105, yPos, { align: 'center' });
    
    // Линия под заголовком
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    // ═══════════════════════════════════════════════════════════
    // ПРЕАМБУЛА
    // ═══════════════════════════════════════════════════════════
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`г. Москва`, 20, yPos);
    doc.text(new Date(document.Created_at).toLocaleDateString('ru-RU'), 170, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    
    const preamble = `${COMPANY_DETAILS.name}, ИНН ${COMPANY_DETAILS.inn}, КПП ${COMPANY_DETAILS.kpp}, именуемое в дальнейшем "Покупатель", в лице ${COMPANY_DETAILS.director}, действующего на основании Устава, с одной стороны, и ${document.vendor_name || 'Поставщик'}, именуемое в дальнейшем "Поставщик", в лице представителя, действующего на основании доверенности, с другой стороны, вместе именуемые "Стороны", заключили настоящий Договор о нижеследующем:`;
    
    const splitPreamble = doc.splitTextToSize(preamble, 170);
    doc.text(splitPreamble, 20, yPos);
    yPos += splitPreamble.length * 5 + 5;
    
    // ═══════════════════════════════════════════════════════════
    // 1. ПРЕДМЕТ ДОГОВОРА
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('1. ПРЕДМЕТ ДОГОВОРА', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text('1.1. Поставщик обязуется поставить, а Покупатель принять и оплатить товар', 20, yPos);
    yPos += 5;
    doc.text('     в соответствии с условиями настоящего Договора.', 20, yPos);
    
    //yPos += 7;
    //doc.text('1.2. ' + (document.Description || 'Поставка товаров в соответствии с условиями договора.'), 20, yPos);
    
    yPos = checkPageOverflow(yPos, 40);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 2. НАИМЕНОВАНИЕ И КОЛИЧЕСТВО ТОВАРА
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('2. НАИМЕНОВАНИЕ И КОЛИЧЕСТВО ТОВАРА', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    
    if (document.items && document.items.length > 0) {
      // Таблица товаров
      const tableData = document.items.map((item, index) => [
        (index + 1).toString(),
        item.article || '-',
        item.name || 'Товар',
        item.unit || 'шт',
        item.quantity?.toString() || '0',
        `${(item.price || 0).toLocaleString('ru-RU')} ₽`,
        `${((item.quantity || 0) * (item.price || 0)).toLocaleString('ru-RU')} ₽`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['№', 'Артикул', 'Наименование', 'Ед.', 'Кол-во', 'Цена', 'Сумма']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 2,
          font: 'timesnewromanpsmt',
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'normal',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 60 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 28, halign: 'right' },
          6: { cellWidth: 28, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });
      
      yPos = doc.lastAutoTable.finalY + 5;
    }
    
    // Итоговая сумма
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text(`Итого: ${formatAmount(document.Total_amount)}`, 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos = checkPageOverflow(yPos, 40);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 3. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЕТОВ
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('3. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЕТОВ', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text(`3.1. Общая стоимость товара по настоящему Договору составляет:`, 20, yPos);
    yPos += 5;
    doc.text(`     ${formatAmount(document.Total_amount)}.`, 20, yPos);
    
    yPos += 7;
    doc.text('3.2. Цены на товар являются твердыми и не подлежат изменению в течение', 20, yPos);
    yPos += 5;
    doc.text('     срока действия Договора.', 20, yPos);
    
    yPos += 7;
    doc.text('3.3. Оплата производится в течение 10 (десяти) рабочих дней с момента', 20, yPos);
    yPos += 5;
    doc.text('     подписания настоящего Договора путем безналичного перечисления', 20, yPos);
    yPos += 5;
    doc.text('     денежных средств на расчетный счет Поставщика.', 20, yPos);
    
    yPos = checkPageOverflow(yPos, 35);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 4. СРОКИ И ПОРЯДОК ПОСТАВКИ
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('4. СРОКИ И ПОРЯДОК ПОСТАВКИ', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text('4.1. Поставка товара осуществляется в течение 14 (четырнадцати) рабочих дней', 20, yPos);
    yPos += 5;
    doc.text('     с момента поступления оплаты на расчетный счет Поставщика.', 20, yPos);
    
    yPos += 7;
    doc.text(`4.2. Поставка товара осуществляется по адресу: ${COMPANY_DETAILS.address}.`, 20, yPos);
    
    yPos += 7;
    doc.text('4.3. Приемка товара оформляется актом приёмки-передачи.', 20, yPos);
    
    yPos = checkPageOverflow(yPos, 45);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 5. ПРАВА И ОБЯЗАННОСТИ СТОРОН
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('5. ПРАВА И ОБЯЗАННОСТИ СТОРОН', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text('5.1. Поставщик обязуется:', 20, yPos);
    yPos += 5;
    doc.text('     - поставить товар надлежащего качества;', 20, yPos);
    yPos += 5;
    doc.text('     - передать товар в установленные сроки;', 20, yPos);
    yPos += 5;
    doc.text('     - предоставить все необходимые документы на товар.', 20, yPos);
    
    yPos += 7;
    doc.text('5.2. Покупатель обязуется:', 20, yPos);
    yPos += 5;
    doc.text('     - принять и оплатить товар в установленные сроки;', 20, yPos);
    yPos += 5;
    doc.text('     - обеспечить условия для разгрузки товара.', 20, yPos);
    
    yPos = checkPageOverflow(yPos, 30);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 6. ОТВЕТСТВЕННОСТЬ СТОРОН
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('6. ОТВЕТСТВЕННОСТЬ СТОРОН', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text('6.1. За нарушение сроков поставки Поставщик уплачивает пеню в размере 0,1%', 20, yPos);
    yPos += 5;
    doc.text('     от стоимости товара за каждый день просрочки.', 20, yPos);
    
    yPos += 7;
    doc.text('6.2. За нарушение сроков оплаты Покупатель уплачивает пеню в размере 0,1%', 20, yPos);
    yPos += 5;
    doc.text('     от суммы задолженности за каждый день просрочки.', 20, yPos);
    
    yPos = checkPageOverflow(yPos, 30);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 7. ФОРС-МАЖОР
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('7. ФОРС-МАЖОР', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text('7.1. Стороны освобождаются от ответственности за частичное или полное', 20, yPos);
    yPos += 5;
    doc.text('     неисполнение обязательств по настоящему Договору, если это явилось', 20, yPos);
    yPos += 5;
    doc.text('     следствием обстоятельств непреодолимой силы.', 20, yPos);
    
    yPos = checkPageOverflow(yPos, 25);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 8. СРОК ДЕЙСТВИЯ ДОГОВОРА
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('8. СРОК ДЕЙСТВИЯ ДОГОВОРА', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 7;
    doc.setFontSize(10);
    
    doc.text('8.1. Настоящий Договор вступает в силу с момента его подписания и действует', 20, yPos);
    yPos += 5;
    doc.text('     до полного исполнения Сторонами своих обязательств.', 20, yPos);
    
    yPos = checkPageOverflow(yPos, 100);
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // 9. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('9. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН', 20, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 10;
    
    // Рамка для реквизитов
    doc.setLineWidth(0.3);
    doc.rect(20, yPos, 170, 80);
    
    // Вертикальная линия разделения
    doc.line(105, yPos, 105, yPos + 80);
    
    // ПОСТАВЩИК (левая колонка)
    let leftY = yPos + 5;
    doc.setFontSize(10);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('ПОСТАВЩИК:', 25, leftY);
    
    leftY += 7;
    doc.setFont('timesnewromanpsmt', 'normal');
    doc.setFontSize(9);
    doc.text(document.vendor_name || 'Наименование поставщика', 25, leftY);
    
    leftY += 30;
    doc.text('_______________________', 25, leftY);
    leftY += 4;
    doc.setFontSize(8);
    doc.text('(подпись)', 45, leftY);
    
    leftY += 8;
    doc.setFontSize(9);
    doc.text('М.П.', 25, leftY);
    
    // ПОКУПАТЕЛЬ (правая колонка)
    let rightY = yPos + 5;
    doc.setFontSize(10);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('ПОКУПАТЕЛЬ:', 110, rightY);
    
    rightY += 7;
    doc.setFont('timesnewromanpsmt', 'normal');
    doc.setFontSize(8);
    doc.text(COMPANY_DETAILS.name, 110, rightY);
    rightY += 4;
    doc.text(`ИНН: ${COMPANY_DETAILS.inn}`, 110, rightY);
    rightY += 4;
    doc.text(`КПП: ${COMPANY_DETAILS.kpp}`, 110, rightY);
    rightY += 4;
    doc.text(`ОГРН: ${COMPANY_DETAILS.ogrn}`, 110, rightY);
    rightY += 4;
    const addressLines = doc.splitTextToSize(`Адрес: ${COMPANY_DETAILS.address}`, 75);
    doc.text(addressLines, 110, rightY);
    rightY += addressLines.length * 4;
    doc.text(`Тел: ${COMPANY_DETAILS.phone}`, 110, rightY);
    rightY += 4;
    doc.text(`Email: ${COMPANY_DETAILS.email}`, 110, rightY);
    rightY += 6;
    doc.text(`Банк: ${COMPANY_DETAILS.bank.name}`, 110, rightY);
    rightY += 4;
    doc.text(`БИК: ${COMPANY_DETAILS.bank.bik}`, 110, rightY);
    rightY += 4;
    doc.text(`Р/с: ${COMPANY_DETAILS.bank.account}`, 110, rightY);
    rightY += 4;
    doc.text(`К/с: ${COMPANY_DETAILS.bank.corrAccount}`, 110, rightY);
    
    rightY = yPos + 65;
    doc.setFontSize(9);
    doc.text('_______________________', 110, rightY);
    rightY += 4;
    doc.setFontSize(8);
    doc.text(`${COMPANY_DETAILS.directorShort}`, 125, rightY);
    
    rightY += 8;
    doc.setFontSize(9);
    doc.text('М.П.', 110, rightY);
    
    // Футер
    const footerY = doc.internal.pageSize.height - 10;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Сформировано: ${new Date().toLocaleString('ru-RU')}`, 20, footerY);
    
    // Сохранение
    doc.save(`Договор_${document.Doc_number}.pdf`);
    
  } catch (error) {
    console.error('Ошибка при создании PDF договора:', error);
    setError?.('Не удалось создать PDF договора');
  }
};

// ═══════════════════════════════════════════════════════════════
// ГЕНЕРАЦИЯ АКТА ПРИЁМКИ ТОВАРА (упрощенный документ)
// ═══════════════════════════════════════════════════════════════
const generateReceiptPDF = async (document) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFont('timesnewromanpsmt', 'normal');
    
    // Цветовая схема
    const colors = {
      primary: [37, 99, 235],
      success: [5, 150, 105],
      text: [31, 41, 55],
      secondary: [107, 114, 128],
      light: [248, 250, 252],
      border: [229, 231, 235],
      white: [255, 255, 255]
    };

    // ═══════════════════════════════════════════════════════════
    // ЗАГРУЗКА ТОВАРОВ ДОКУМЕНТА
    // ═══════════════════════════════════════════════════════════
    const items = await fetchDocumentItems(document.ID);
    console.log(items)
    document.items = items; // Добавляем товары в объект документа
    console.log(document)
    let yPos = 15;
    
    // ═══════════════════════════════════════════════════════════
    // ЦВЕТНАЯ ПОЛОСА СВЕРХУ
    // ═══════════════════════════════════════════════════════════
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, 210, 8, 'F');
    
    yPos = 20;
    
    // ═══════════════════════════════════════════════════════════
    // ЗАГОЛОВОК
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(18);
    doc.setTextColor(...colors.primary);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('АКТ ПРИЁМКИ ТОВАРА', 105, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.setFont('timesnewromanpsmt', 'normal');
    doc.text(`№ ${document.Doc_number} от ${new Date(document.Created_at).toLocaleDateString('ru-RU')}`, 105, yPos, { align: 'center' });
    
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // ИНФОРМАЦИОННЫЙ БЛОК
    // ═══════════════════════════════════════════════════════════
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.rect(15, yPos, 180, 30, 'FD');
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(...colors.secondary);
    doc.text('Поставщик:', 20, yPos);
    doc.setTextColor(...colors.text);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text(document.vendor_name || 'Не указан', 50, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 6;
    doc.setTextColor(...colors.secondary);
    doc.text('Получатель:', 20, yPos);
    doc.setTextColor(...colors.text);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text(COMPANY_DETAILS.name, 50, yPos);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 6;
    doc.setTextColor(...colors.secondary);
    doc.text('Основание:', 20, yPos);
    doc.setTextColor(...colors.text);
    doc.text(`Договор поставки`, 50, yPos);
    
    yPos += 6;
    doc.setTextColor(...colors.secondary);
    doc.text('Ответственный:', 20, yPos);
    doc.setTextColor(...colors.text);
    doc.text(document.user_name || 'Не указан', 50, yPos);
    
    yPos += 12;
    
    // ═══════════════════════════════════════════════════════════
    // ЗАГОЛОВОК ТАБЛИЦЫ
    // ═══════════════════════════════════════════════════════════
    doc.setFillColor(...colors.light);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setDrawColor(...colors.border);
    doc.rect(15, yPos, 180, 8);
    
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('ПЕРЕЧЕНЬ ПРИНЯТОГО ТОВАРА', 20, yPos + 5.5);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 10;
    
    // ═══════════════════════════════════════════════════════════
    // ТАБЛИЦА ТОВАРОВ
    // ═══════════════════════════════════════════════════════════
    if (document.items && document.items.length > 0) {
      const tableData = document.items.map((item, index) => [
        (index + 1).toString(),
        item.article || '-',
        item.name || 'Товар',
        item.unit || 'шт',
        item.quantity?.toString() || '0',
        `${(item.price || 0).toLocaleString('ru-RU')}`,
        `${((item.quantity || 0) * (item.price || 0)).toLocaleString('ru-RU')}`
      ]);
      
      autoTable(doc,{
        startY: yPos,
        head: [['№', 'Артикул', 'Наименование', 'Ед.изм', 'Кол-во', 'Цена, ₽', 'Сумма, ₽']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          font: 'timesnewromanpsmt',
          textColor: colors.text,
          lineColor: colors.border,
          lineWidth: 0.2
        },
        headStyles: { 
          fillColor: colors.primary,
          textColor: colors.white,
          fontStyle: 'normal',
          halign: 'center',
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 60 },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 26, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: colors.light
        },
        margin: { left: 15, right: 15 }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      doc.text('Товары не указаны', 105, yPos + 10, { align: 'center' });
      yPos += 20;
    }
    
    // ═══════════════════════════════════════════════════════════
    // ИТОГОВАЯ ИНФОРМАЦИЯ
    // ═══════════════════════════════════════════════════════════
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.rect(15, yPos, 180, 35, 'FD');
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    
    const itemCount = document.items?.length || 0;
    const totalQuantity = document.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    doc.text(`Всего наименований: ${itemCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Общее количество единиц: ${totalQuantity}`, 20, yPos);
    
    yPos += 8;
    doc.text(`Сумма без НДС:`, 20, yPos);
    doc.text(`${formatAmount(document.Total_amount)}`, 185, yPos, { align: 'right' });
    
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(...colors.border);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 6;
    doc.setFontSize(12);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.setTextColor(...colors.success);
    doc.text(`ИТОГО к оплате:`, 20, yPos);
    doc.text(formatAmount(document.Total_amount), 185, yPos, { align: 'right' });
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 12;
    
    // ═══════════════════════════════════════════════════════════
    // ПРИМЕЧАНИЯ
    // ═══════════════════════════════════════════════════════════
    if (document.Description) {
      doc.setFillColor(...colors.light);
      doc.setDrawColor(...colors.border);
      doc.rect(15, yPos, 180, 20, 'FD');
      
      yPos += 7;
      doc.setFontSize(10);
      doc.setTextColor(...colors.secondary);
      doc.text('ПРИМЕЧАНИЯ:', 20, yPos);
      
      yPos += 5;
      doc.setTextColor(...colors.text);
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(document.Description, 170);
      doc.text(descLines, 20, yPos);
      
      yPos += descLines.length * 4 + 8;
    } else {
      yPos += 5;
    }
    
    // ═══════════════════════════════════════════════════════════
    // БЛОК ПОДПИСЕЙ
    // ═══════════════════════════════════════════════════════════
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.rect(15, yPos, 180, 8, 'FD');
    
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text('ПОДПИСИ', 20, yPos + 5.5);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    yPos += 8;
    
    // Рамка для подписей
    doc.setDrawColor(...colors.border);
    doc.rect(15, yPos, 180, 35);
    
    // Вертикальная линия разделения
    doc.line(105, yPos, 105, yPos + 35);
    
    // Левая сторона - Товар отпустил
    let leftY = yPos + 7;
    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    doc.text('Товар отпустил:', 20, leftY);
    
    leftY += 6;
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text(document.vendor_name || 'Поставщик', 20, leftY);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    leftY += 10;
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.3);
    doc.line(20, leftY, 90, leftY);
    
    leftY += 4;
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.text('(подпись)', 55, leftY, { align: 'center' });
    
    leftY += 6;
    doc.setFontSize(9);
    doc.text(`Дата: ${new Date(document.Created_at).toLocaleDateString('ru-RU')}`, 20, leftY);
    
    // Правая сторона - Товар принял
    let rightY = yPos + 7;
    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    doc.text('Товар принял:', 110, rightY);
    
    rightY += 6;
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.setFont('ofont.ru_Times New Roman', 'bold');
    doc.text(document.user_name || 'Получатель', 110, rightY);
    doc.setFont('timesnewromanpsmt', 'normal');
    
    rightY += 10;
    doc.setDrawColor(...colors.secondary);
    doc.line(110, rightY, 180, rightY);
    
    rightY += 4;
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.text('(подпись)', 145, rightY, { align: 'center' });
    
    rightY += 6;
    doc.setFontSize(9);
    doc.text(`Дата: ${new Date(document.Created_at).toLocaleDateString('ru-RU')}`, 110, rightY);
    
    // ═══════════════════════════════════════════════════════════
    // ФУТЕР
    // ═══════════════════════════════════════════════════════════
    const footerY = doc.internal.pageSize.height - 12;
    
    // Цветная полоса снизу
    doc.setFillColor(...colors.primary);
    doc.rect(0, doc.internal.pageSize.height - 8, 210, 8, 'F');
    
    // Информация о генерации
    doc.setFontSize(7);
    doc.setTextColor(...colors.white);
    doc.text(`Сформировано автоматически: ${new Date().toLocaleString('ru-RU')}`, 20, footerY);
    doc.text(`Документ: ${document.Doc_number}`, 105, footerY, { align: 'center' });
    doc.text(COMPANY_DETAILS.shortName, 190, footerY, { align: 'right' });
    
    // Сохранение
    doc.save(`Акт_приёмки_${document.Doc_number}.pdf`);
    
  } catch (error) {
    console.error('Ошибка при создании PDF акта приёмки:', error);
    setError?.('Не удалось создать PDF акта приёмки');
  }
};

  // Обновленная функция генерации PDF с поддержкой русского языка
  // Улучшенная функция генерации PDF с современным дизайном
const generatePDF = async (document) => {
  try {
    // Определяем тип документа и вызываем соответствующую функцию
    if (document.Doc_type === 'Договор') {
      await generateContractPDF(document);
    } else if (document.Doc_type === 'Приход') {
      await generateReceiptPDF(document);
    } else {
      // Если тип неизвестен, показываем ошибку
      console.error('Неизвестный тип документа:', document.Doc_type);
      setError?.(`Неизвестный тип документа: ${document.Doc_type}`);
    }
  } catch (error) {
    console.error('Ошибка при генерации PDF:', error);
    setError?.('Не удалось создать PDF файл');
  }
};
  
  // Функция для печати через окно браузера
  const printDocument = () => {
    const printContent = document.getElementById('document-details').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        ${printContent}
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
            .card { border: 1px solid #ddd; margin-bottom: 20px; }
            .modal { position: relative; display: block; background: white; }
            .modal-dialog { max-width: 100%; margin: 0; }
          }
        </style>
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Перезагружаем для восстановления React состояния
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Форматирование даты и времени
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  // Форматирование суммы
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-3">Загрузка документов...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="d-flex align-items-center">
          <i className="bi bi-file-text me-2"></i>
          Договоры и документы
        </h2>
      </div>

      {documents.length === 0 ? (
        <div className="alert alert-info">
          Нет доступных документов. Создайте новый договор.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered table-hover shadow-sm">
            <thead className="bg-light">
              <tr>
                <th>№ договора</th>
                <th>Тип</th>
                <th>Поставщик</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.ID}>
                  <td>
                    <strong>{doc.Doc_number}</strong>
                  </td>
                  <td>{doc.Doc_type}</td>
                  <td>
                    {doc.vendor_name}
                  </td>
                  <td>
                    {formatDate(doc.Created_at)}
                  </td>
                  <td>
                    {doc.Status}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => handleViewDocument(doc)}
                      title="Просмотреть детали"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Просмотреть
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => generatePDF(doc)}
                      title="Скачать PDF"
                    >
                      <i className="bi bi-file-pdf me-1"></i>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно с детальной информацией */}
      {showModal && selectedDocument && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title">
                  <i className="bi bi-file-text me-2"></i>
                  Детальная информация о договоре
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body" id="document-details">
                {/* Основная информация */}
                <div className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Основная информация</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Номер договора:</strong>
                        </p>
                        <p className="text-primary h5">{selectedDocument.Doc_number}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Тип документа:</strong>
                        </p>
                        <p>{selectedDocument.Doc_type}</p>
                      </div>
                    </div>
                    
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Дата создания:</strong>
                        </p>
                        <p>
                          {formatDateTime(selectedDocument.Created_at)}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Дата документа:</strong>
                        </p>
                        <p>
                          <i className="bi bi-clock me-2 text-muted"></i>
                          {formatDate(selectedDocument.Created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Информация о поставщике */}
                <div className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Информация о поставщике</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Поставщик:</strong>
                        </p>
                        <p>
                          <i className="bi bi-building me-2 text-muted"></i>
                          {selectedDocument.vendor_name}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Пользователь:</strong>
                        </p>
                        <p>
                          <i className="bi bi-person me-2 text-muted"></i>
                          {selectedDocument.user_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Финансовая информация */}
                <div className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Финансовая информация</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Сумма договора:</strong>
                        </p>
                        <p className="text-success h4">
                          {formatAmount(selectedDocument.Total_amount)}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Статус:</strong>
                        </p>
                        <p>
                          {selectedDocument.Status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Описание */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Описание</h5>
                    <p className="mb-0">
                      {selectedDocument.Description || 'Нет описания'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Закрыть
                </button>
                <button type="button" className="btn btn-primary ms-2" onClick={() => generatePDF(selectedDocument)}>
                  <i className="bi bi-file-pdf me-2"></i>
                  Скачать PDF
                </button>
                <button type="button" className="btn btn-success ms-2" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>
                  Печать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;