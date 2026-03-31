import React, { useState, useEffect } from 'react';
import { Table, Badge, Spinner, Form } from 'react-bootstrap';

export default function AccountingPage({ setError }) {
  const [operations, setOperations] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchOperations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    let url = 'http://localhost:8080/api/accounting/operations';
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('start_date', dateRange.startDate);
    if (dateRange.endDate) params.append('end_date', dateRange.endDate);
    if (params.toString()) url += '?' + params.toString();

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch operations');
      
      const data = await response.json();
      console.log(data);
      setOperations(data.operations || []);
      setBalance(data.balance || 0);
    } catch (err) {
      if (setError) setError('Ошибка загрузки операций: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [dateRange]);

  const getOperationTypeLabel = (type) => {
    switch(type) {
      case 'income': return { text: 'Приход', variant: 'success' };
      case 'expense': return { text: 'Расход', variant: 'danger' };
      case 'writeoff': return { text: 'Списание', variant: 'warning' };
      default: return { text: type, variant: 'secondary' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex align-items-center mb-4">
        <i className="bi bi-cash-stack me-2" style={{ fontSize: '2rem', color: '#198754' }}></i>
        <h2 className="fw-bold mb-0">Движение денежных средств</h2>
      </div>

      {/* Баланс */}
      <div className="bg-white p-4 rounded-3 mb-4 shadow-sm border">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fs-4 text-secondary">Текущий баланс:</span>
          <span className={`fs-2 fw-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatMoney(balance)}
          </span>
        </div>
      </div>

      {/* Фильтры по датам */}
      <div className="mb-4">
        <Form className="d-flex gap-3">
          <Form.Group style={{ minWidth: '200px' }}>
            <Form.Label className="text-secondary small fw-semibold">С</Form.Label>
            <Form.Control
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="border rounded-3 shadow-sm"
            />
          </Form.Group>
          <Form.Group style={{ minWidth: '200px' }}>
            <Form.Label className="text-secondary small fw-semibold">По</Form.Label>
            <Form.Control
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="border rounded-3 shadow-sm"
            />
          </Form.Group>
        </Form>
      </div>

      {/* Таблица операций */}
      {loading ? (
        <div className="text-center p-5 bg-white rounded-3 shadow-sm">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <div className="bg-white rounded-3 shadow-sm overflow-hidden">
          <Table hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="text-secondary fw-semibold py-3">Дата</th>
                <th className="text-secondary fw-semibold py-3">Тип</th>
                <th className="text-secondary fw-semibold py-3">Документ</th>
                <th className="text-secondary fw-semibold py-3">Поставщик</th>
                <th className="text-secondary fw-semibold py-3">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {operations.length > 0 ? (
                operations.map((op, index) => {
                  const typeInfo = getOperationTypeLabel(op.Operation_type);
                  return (
                    <tr key={op.ID || index} className="border-bottom">
                      <td className="py-3">{formatDate(op.Operation_date)}</td>
                      <td className="py-3">
                        <Badge 
                          bg={typeInfo.variant}
                          className="px-3 py-2 rounded-pill"
                        >
                          {typeInfo.text}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {op.document_number ? (
                          <span className="text-primary" title={`Тип: ${op.document_number}`}>
                            <i className="bi bi-file-text me-1"></i>
                            {op.document_number}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3">
                        {op.vendor_name || op.Product_name || '—'}
                      </td>
                      <td className={`py-3 fw-bold ${op.Operation_type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {op.Operation_type === 'income' ? '+' : '-'}{formatMoney(op.Amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-secondary">
                    <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                    Нет операций за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}