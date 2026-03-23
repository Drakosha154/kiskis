import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { DocumentPDF } from './DocumentPDF';

function DocumentsPage({ setError }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

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
  
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

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
        <button 
          className="btn btn-primary"
          onClick={fetchDocuments}
          disabled={loading}
        >
          <i className="bi bi-arrow-repeat me-2"></i>
          Обновить
        </button>
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
                    <span className={`badge ${doc.Status === 'Активен' ? 'bg-success' : 'bg-secondary'}`}>
                      {doc.Status}
                    </span>
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
                      Детали
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно остается без изменений */}
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
              <div className="modal-body">
                <div className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Основная информация</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Номер договора:</strong></p>
                        <p className="text-primary h5">{selectedDocument.Doc_number}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Тип документа:</strong></p>
                        <p>{selectedDocument.Doc_type}</p>
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <p><strong>Дата создания:</strong></p>
                        <p>{formatDateTime(selectedDocument.Created_at)}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Статус:</strong></p>
                        <p><span className={`badge ${selectedDocument.Status === 'Активен' ? 'bg-success' : 'bg-secondary'}`}>{selectedDocument.Status}</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Информация о поставщике</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Поставщик:</strong></p>
                        <p><i className="bi bi-building me-2 text-muted"></i>{selectedDocument.vendor_name}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Пользователь:</strong></p>
                        <p><i className="bi bi-person me-2 text-muted"></i>{selectedDocument.user_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Финансовая информация</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Сумма договора:</strong></p>
                        <p className="text-success h4">{formatAmount(selectedDocument.Total_amount)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="border-bottom pb-2 mb-3">Описание</h5>
                    <p className="mb-0">{selectedDocument.Description || 'Нет описания'}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Закрыть
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