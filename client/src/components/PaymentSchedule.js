import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Form, Row, Col, Card, Modal, Alert, Spinner } from 'react-bootstrap';

export default function PaymentSchedule({ setError }) {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('full'); // 'full' или 'partial'
  const [processing, setProcessing] = useState(false);

  // Фильтры
  const [filters, setFilters] = useState({
    paymentStatus: 'all', // all, unpaid, partially_paid
    paymentTerms: 'all',  // all, prepaid, partial, postpaid
    overdueOnly: false
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contracts, filters]);

  const fetchContracts = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8080/api/accounting/contracts-to-pay', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch contracts');
      
      const data = await response.json();
      setContracts(data.contracts || []);
      setCurrentBalance(data.current_balance || 0);
    } catch (err) {
      if (setError) setError('Ошибка загрузки договоров: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...contracts];

    // Фильтр по статусу оплаты
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(c => c.payment_status === filters.paymentStatus);
    }

    // Фильтр по условиям оплаты
    if (filters.paymentTerms !== 'all') {
      filtered = filtered.filter(c => c.payment_terms === filters.paymentTerms);
    }

    // Фильтр по просрочке
    if (filters.overdueOnly) {
      filtered = filtered.filter(c => c.is_overdue);
    }

    setFilteredContracts(filtered);
  };

  const handlePaymentClick = (contract) => {
    setSelectedContract(contract);
    setPaymentAmount(contract.remaining_amount.toFixed(2));
    setPaymentType('full');
    setShowPaymentModal(true);
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'full') {
      setPaymentAmount(selectedContract.remaining_amount.toFixed(2));
    } else if (type === 'min') {
      const minAmount = selectedContract.min_payment - selectedContract.paid_amount;
      setPaymentAmount(Math.max(0, minAmount).toFixed(2));
    } else {
      setPaymentAmount('');
    }
  };

  const handlePayment = async () => {
    if (!selectedContract || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      if (setError) setError('Введите корректную сумму оплаты');
      return;
    }

    const amount = parseFloat(paymentAmount);

    if (amount > selectedContract.remaining_amount) {
      if (setError) setError('Сумма оплаты превышает остаток по договору');
      return;
    }

    if (amount > currentBalance) {
      if (setError) setError('Недостаточно средств в бюджете');
      return;
    }

    setProcessing(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:8080/api/accounting/pay-contract/${selectedContract.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      const data = await response.json();
      
      // Закрываем модальное окно
      setShowPaymentModal(false);
      setSelectedContract(null);
      setPaymentAmount('');
      
      // Обновляем список договоров
      await fetchContracts();
      
      if (setError) setError(''); // Очищаем ошибки
      alert(`Оплата успешно проведена!\nДоговор: ${data.doc_number}\nОплачено: ${formatMoney(data.amount_paid)}\nОстаток: ${formatMoney(data.remaining)}`);
    } catch (err) {
      if (setError) setError('Ошибка проведения оплаты: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
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

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'unpaid':
        return <Badge bg="danger">Не оплачен</Badge>;
      case 'partially_paid':
        return <Badge bg="warning">Частично оплачен</Badge>;
      case 'fully_paid':
        return <Badge bg="success">Полностью оплачен</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPaymentTermsLabel = (terms) => {
    switch(terms) {
      case 'prepaid':
        return '100% предоплата';
      case 'partial':
        return '50/50';
      case 'postpaid':
        return 'Постоплата';
      default:
        return terms;
    }
  };

  const getRowClassName = (contract) => {
    if (contract.is_overdue) return 'table-danger';
    if (contract.days_until_due <= 3 && contract.days_until_due >= 0) return 'table-warning';
    return '';
  };

  const getDeadlineStatus = (contract) => {
    if (!contract.deadline_date) return '-';
    
    if (contract.is_overdue) {
      return (
        <span className="text-danger">
          {formatDate(contract.deadline_date)} (просрочен на {Math.abs(contract.days_until_due)} дн.)
        </span>
      );
    } else if (contract.days_until_due <= 3) {
      return (
        <span className="text-warning">
          {formatDate(contract.deadline_date)} (осталось {contract.days_until_due} дн.)
        </span>
      );
    } else {
      return formatDate(contract.deadline_date);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      {/* Информационная панель */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={4}>
              <h6>Текущий баланс</h6>
              <h4 className={currentBalance < 0 ? 'text-danger' : 'text-success'}>
                {formatMoney(currentBalance)}
              </h4>
            </Col>
            <Col md={4}>
              <h6>Договоров к оплате</h6>
              <h4>{filteredContracts.length}</h4>
            </Col>
            <Col md={4}>
              <h6>Общая сумма к оплате</h6>
              <h4 className="text-danger">
                {formatMoney(filteredContracts.reduce((sum, c) => sum + c.remaining_amount, 0))}
              </h4>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Фильтры */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Статус оплаты</Form.Label>
                <Form.Select 
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
                >
                  <option value="all">Все</option>
                  <option value="unpaid">Не оплачен</option>
                  <option value="partially_paid">Частично оплачен</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Условия оплаты</Form.Label>
                <Form.Select 
                  value={filters.paymentTerms}
                  onChange={(e) => setFilters({...filters, paymentTerms: e.target.value})}
                >
                  <option value="all">Все</option>
                  <option value="prepaid">100% предоплата</option>
                  <option value="partial">50/50</option>
                  <option value="postpaid">Постоплата</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <Form.Check 
                  type="checkbox"
                  label="Только просроченные"
                  checked={filters.overdueOnly}
                  onChange={(e) => setFilters({...filters, overdueOnly: e.target.checked})}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={fetchContracts}>
                Обновить
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Таблица договоров */}
      {filteredContracts.length === 0 ? (
        <Alert variant="info">Нет договоров, требующих оплаты</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>№ договора</th>
              <th>Дата</th>
              <th>Поставщик</th>
              <th>Условия оплаты</th>
              <th>Общая сумма</th>
              <th>Оплачено</th>
              <th>Осталось</th>
              <th>Срок оплаты</th>
              <th>Статус</th>
              <th>Приёмка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => (
              <tr key={contract.id} className={getRowClassName(contract)}>
                <td>{contract.doc_number}</td>
                <td>{formatDate(contract.doc_date)}</td>
                <td>{contract.vendor_name}</td>
                <td>{getPaymentTermsLabel(contract.payment_terms)}</td>
                <td>{formatMoney(contract.total_amount)}</td>
                <td>{formatMoney(contract.paid_amount)}</td>
                <td className="fw-bold">{formatMoney(contract.remaining_amount)}</td>
                <td>{getDeadlineStatus(contract)}</td>
                <td>{getPaymentStatusBadge(contract.payment_status)}</td>
                <td>
                  {contract.can_receive_goods ? (
                    <Badge bg="success">Доступна</Badge>
                  ) : (
                    <Badge bg="secondary">Недоступна</Badge>
                  )}
                </td>
                <td>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => handlePaymentClick(contract)}
                    disabled={contract.remaining_amount <= 0}
                  >
                    Оплатить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Модальное окно оплаты */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Оплата договора</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContract && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Договор:</strong> {selectedContract.doc_number}
                </Col>
                <Col md={6}>
                  <strong>Поставщик:</strong> {selectedContract.vendor_name}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Общая сумма:</strong> {formatMoney(selectedContract.total_amount)}
                </Col>
                <Col md={6}>
                  <strong>Уже оплачено:</strong> {formatMoney(selectedContract.paid_amount)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Осталось оплатить:</strong> <span className="text-danger fw-bold">{formatMoney(selectedContract.remaining_amount)}</span>
                </Col>
                <Col md={6}>
                  <strong>Текущий баланс:</strong> <span className={currentBalance >= selectedContract.remaining_amount ? 'text-success' : 'text-danger'}>{formatMoney(currentBalance)}</span>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Условия оплаты:</strong> {getPaymentTermsLabel(selectedContract.payment_terms)}
                  {selectedContract.min_payment > 0 && (
                    <span className="text-muted"> (минимум: {formatMoney(selectedContract.min_payment)})</span>
                  )}
                </Col>
              </Row>

              <hr />

              <Form.Group className="mb-3">
                <Form.Label>Тип оплаты</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label="Оплатить полностью"
                    name="paymentType"
                    checked={paymentType === 'full'}
                    onChange={() => handlePaymentTypeChange('full')}
                  />
                  {selectedContract.min_payment > 0 && selectedContract.min_payment < selectedContract.total_amount && (
                    <Form.Check
                      inline
                      type="radio"
                      label={`Минимальная оплата (${formatMoney(Math.max(0, selectedContract.min_payment - selectedContract.paid_amount))})`}
                      name="paymentType"
                      checked={paymentType === 'min'}
                      onChange={() => handlePaymentTypeChange('min')}
                    />
                  )}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Сумма оплаты</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedContract.remaining_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={paymentType !== 'partial'}
                />
                <Form.Text className="text-muted">
                  Максимум: {formatMoney(Math.min(selectedContract.remaining_amount, currentBalance))}
                </Form.Text>
              </Form.Group>

              {parseFloat(paymentAmount) > currentBalance && (
                <Alert variant="danger">
                  Недостаточно средств в бюджете! Не хватает: {formatMoney(parseFloat(paymentAmount) - currentBalance)}
                </Alert>
              )}

              {parseFloat(paymentAmount) > selectedContract.remaining_amount && (
                <Alert variant="warning">
                  Сумма оплаты превышает остаток по договору!
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)} disabled={processing}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePayment}
            disabled={processing || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > currentBalance}
          >
            {processing ? 'Обработка...' : 'Оплатить'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}