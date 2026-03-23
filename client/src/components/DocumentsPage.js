import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './timesnewromanpsmt-normal.js';

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

  // Обновленная функция генерации PDF с поддержкой русского языка
  const generatePDF = (document) => {
    try {
      // Создаем PDF с поддержкой юникода
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      doc.setFont('timesnewromanpsmt', 'normal');
      
      // Заголовок
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      
      // Для текста используем обычные строки (jsPDF сам обработает Unicode)
      doc.text('ДОГОВОР', 105, 20, { align: 'center' });
      
      // Линия
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Номер и дата
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`№ ${document.Doc_number}`, 20, 35);
      doc.text(`от ${new Date(document.Created_at).toLocaleDateString('ru-RU')}`, 150, 35);
      
      // Информация о сторонах
      doc.setFontSize(12);
      doc.text('Поставщик:', 20, 50);
      doc.setFont('timesnewromanpsmt', 'normal');
      doc.text(document.vendor_name, 20, 57);
      doc.setFont('timesnewromanpsmt', 'normal');
      
      doc.text('Заказчик:', 20, 70);
      doc.setFont('timesnewromanpsmt', 'normal');
      doc.text(document.user_name || 'Пользователь', 20, 77);
      doc.setFont('timesnewromanpsmt', 'normal');
      
      // Предмет договора
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('1. ПРЕДМЕТ ДОГОВОРА', 20, 95);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Обработка описания с русским текстом
      const description = document.Description || 'Поставка товаров в соответствии с условиями договора';
      const splitDescription = doc.splitTextToSize(description, 170);
      doc.text(splitDescription, 20, 105);
      
      // Таблица с товарами (если есть)
      if (document.items && document.items.length > 0) {
        doc.text('2. ПЕРЕЧЕНЬ ТОВАРОВ', 20, 125);
        
        const tableData = document.items.map(item => [
          item.name,
          item.quantity,
          item.unit || 'шт',
          `${item.price.toLocaleString('ru-RU')} ₽`,
          `${(item.quantity * item.price).toLocaleString('ru-RU')} ₽`
        ]);
        
        doc.autoTable({
          startY: 135,
          head: [['Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма']],
          body: tableData,
          theme: 'grid',
          styles: { 
            fontSize: 9, 
            cellPadding: 3,
            font: fontLoaded ? 'Roboto' : 'helvetica'
          },
          headStyles: { 
            fillColor: [66, 139, 202], 
            textColor: 255, 
            fontStyle: 'bold',
            font: fontLoaded ? 'Roboto' : 'helvetica'
          },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
          }
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        
        // Сумма
        doc.setFontSize(12);
        doc.text(`Общая сумма: ${formatAmount(document.Total_amount)}`, 140, finalY);
      } else {
        doc.text('2. СТОИМОСТЬ ДОГОВОРА', 20, 125);
        doc.setFontSize(12);
        doc.text(`Общая сумма договора составляет: ${formatAmount(document.Total_amount)}`, 20, 140);
        doc.text('НДС не облагается', 20, 150);
      }
      
      // Условия
      let yPosition = document.items && document.items.length > 0 ? 210 : 165;
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('3. УСЛОВИЯ ОПЛАТЫ', 20, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const paymentText = 'Оплата производится в течение 10 рабочих дней с момента подписания договора.';
      const paymentText2 = 'Форма оплаты: безналичный расчет.';
      doc.text(doc.splitTextToSize(paymentText, 170), 20, yPosition + 10);
      doc.text(doc.splitTextToSize(paymentText2, 170), 20, yPosition + 17);
      
      // Сроки
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('4. СРОКИ ПОСТАВКИ', 20, yPosition + 35);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const deliveryText = 'Поставка товаров осуществляется в течение 14 рабочих дней с момента оплаты.';
      doc.text(doc.splitTextToSize(deliveryText, 170), 20, yPosition + 45);
      
      // Ответственность
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('5. ОТВЕТСТВЕННОСТЬ СТОРОН', 20, yPosition + 65);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const penaltyText = 'За нарушение сроков поставки поставщик уплачивает пеню в размере 0,1% от суммы договора за каждый день просрочки.';
      doc.text(doc.splitTextToSize(penaltyText, 170), 20, yPosition + 75);
      
      // Подписи
      const signaturesY = doc.internal.pageSize.height - 40;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('ПОДПИСИ СТОРОН:', 20, signaturesY - 20);
      
      doc.text('Поставщик:', 20, signaturesY - 5);
      doc.setFont('timesnewromanpsmt', 'normal');
      doc.text(document.vendor_name, 20, signaturesY);
      doc.setFont('timesnewromanpsmt', 'normal');
      
      doc.text('Заказчик:', 120, signaturesY - 5);
      doc.setFont('timesnewromanpsmt', 'normal');
      doc.text(document.user_name || 'Пользователь', 120, signaturesY);
      doc.setFont('timesnewromanpsmt', 'normal');
      
      // Дата
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Сформировано в системе: ${new Date().toLocaleString('ru-RU')}`, 20, doc.internal.pageSize.height - 10);
      
      // Сохраняем PDF
      doc.save(`Договор_${document.Doc_number}.pdf`);
      
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
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
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={fetchDocuments}
            disabled={loading}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Обновить
          </button>
          <button 
            className="btn btn-success"
            onClick={async () => {
              // Пример создания нового документа
              const newDocument = {
                Doc_number: `DOC-${Date.now()}`,
                Doc_type: 'Договор поставки',
                vendor_name: 'ООО "Поставщик"',
                Total_amount: 150000,
                Description: 'Поставка оборудования',
                Status: 'Черновик',
                items: [
                  { name: 'Ноутбук', quantity: 5, unit: 'шт', price: 30000 },
                  { name: 'Монитор', quantity: 5, unit: 'шт', price: 15000 }
                ]
              };
              await createDocument(newDocument);
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Создать документ
          </button>
        </div>
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
                <th>Сумма</th>
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
                    <strong>{formatAmount(doc.Total_amount)}</strong>
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