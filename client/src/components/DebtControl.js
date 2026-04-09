import React, { useState, useEffect } from 'react';
import { Table, Badge, Form, Row, Col, Card, Alert, Spinner, ButtonGroup, Button } from 'react-bootstrap';

export default function DebtControl({ setError }) {
  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [summary, setSummary] = useState({
    total_creditor: 0,
    total_debtor: 0,
    creditor_count: 0,
    debtor_count: 0
  });
  const [loading, setLoading] = useState(false);
  const [debtType, setDebtType] = useState('all'); // all, creditor, debtor
  const [filters, setFilters] = useState({
    vendor: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [debts, debtType, filters]);

  const fetchDebts = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8080/api/accounting/debts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch debts');
      
      const data = await response.json();
      setDebts(data.debts || []);
      setSummary(data.summary || {
        total_creditor: 0,
        total_debtor: 0,
        creditor_count: 0,
        debtor_count: 0
      });
    } catch (err) {
      if (setError) setError('Ошибка загрузки задолженностей: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...debts];

    // Фильтр по типу задолженности
    if (debtType === 'creditor') {
      filtered = filtered.filter(d => d.debt_type === 'Кредиторская');
    } else if (debtType === 'debtor') {
      filtered = filtered.filter(d => d.debt_type === 'Дебиторская');
    }

    // Фильтр по поставщику
    if (filters.vendor) {
      filtered = filtered.filter(d => 
        d.vendor_name.toLowerCase().includes(filters.vendor.toLowerCase())
      );
    }

    // Фильтр по сумме
    if (filters.minAmount) {
      filtered = filtered.filter(d => d.debt_amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(d => d.debt_amount <= parseFloat(filters.maxAmount));
    }

    setFilteredDebts(filtered);
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

  const getDebtTypeBadge = (type) => {
    if (type === 'Кредиторская') {
      return <Badge bg="danger">Кредиторская</Badge>;
    } else if (type === 'Дебиторская') {
      return <Badge bg="info">Дебиторская</Badge>;
    }
    return <Badge bg="secondary">{type}</Badge>;
  };

  const getDeadlineStatus = (deadlineDate) => {
    if (!deadlineDate) return '-';
    
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return (
        <span className="text-danger">
          {formatDate(deadlineDate)} (просрочен на {Math.abs(daysUntilDue)} дн.)
        </span>
      );
    } else if (daysUntilDue <= 3) {
      return (
        <span className="text-warning">
          {formatDate(deadlineDate)} (осталось {daysUntilDue} дн.)
        </span>
      );
    } else {
      return formatDate(deadlineDate);
    }
  };

  const getRowClassName = (debt) => {
    if (!debt.deadline_date) return '';
    
    const deadline = new Date(debt.deadline_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'table-danger';
    if (daysUntilDue <= 3) return 'table-warning';
    return '';
  };

  // Рассчитываем итоги для отфильтрованных данных
  const filteredSummary = {
    creditor: filteredDebts
      .filter(d => d.debt_type === 'Кредиторская')
      .reduce((sum, d) => sum + d.debt_amount, 0),
    debtor: filteredDebts
      .filter(d => d.debt_type === 'Дебиторская')
      .reduce((sum, d) => sum + d.debt_amount, 0),
    creditorCount: filteredDebts.filter(d => d.debt_type === 'Кредиторская').length,
    debtorCount: filteredDebts.filter(d => d.debt_type === 'Дебиторская').length
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
      {/* Сводная информация */}
      <Row className="mb-3">
        <Col md={6}>
          <Card className="border-danger">
            <Card.Body>
              <h6 className="text-danger">Кредиторская задолженность</h6>
              <h6 className="text-muted small">Мы должны поставщикам</h6>
              <h3 className="text-danger">{formatMoney(summary.total_creditor)}</h3>
              <p className="text-muted mb-0">Договоров: {summary.creditor_count}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-info">
            <Card.Body>
              <h6 className="text-info">Дебиторская задолженность</h6>
              <h6 className="text-muted small">Поставщики должны нам (переплата)</h6>
              <h3 className="text-info">{formatMoney(summary.total_debtor)}</h3>
              <p className="text-muted mb-0">Договоров: {summary.debtor_count}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Фильтры и переключатель типа */}
      <Card className="mb-3">
        <Card.Body>
          <Row className="mb-3">
            <Col md={12}>
              <ButtonGroup className="w-100">
                <Button 
                  variant={debtType === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => setDebtType('all')}
                >
                  Все ({debts.length})
                </Button>
                <Button 
                  variant={debtType === 'creditor' ? 'danger' : 'outline-danger'}
                  onClick={() => setDebtType('creditor')}
                >
                  Кредиторская ({summary.creditor_count})
                </Button>
                <Button 
                  variant={debtType === 'debtor' ? 'info' : 'outline-info'}
                  onClick={() => setDebtType('debtor')}
                >
                  Дебиторская ({summary.debtor_count})
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Поставщик</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Поиск по названию"
                  value={filters.vendor}
                  onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Сумма от</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Сумма до</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setFilters({ vendor: '', minAmount: '', maxAmount: '' });
                  setDebtType('all');
                }}
              >
                Сбросить
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Итоги по отфильтрованным данным */}
      {(filters.vendor || filters.minAmount || filters.maxAmount || debtType !== 'all') && (
        <Alert variant="info">
          Отфильтровано: {filteredDebts.length} договоров | 
          Кредиторская: {formatMoney(filteredSummary.creditor)} ({filteredSummary.creditorCount} шт.) | 
          Дебиторская: {formatMoney(filteredSummary.debtor)} ({filteredSummary.debtorCount} шт.)
        </Alert>
      )}

      {/* Таблица задолженностей */}
      {filteredDebts.length === 0 ? (
        <Alert variant="success">
          {debtType === 'all' && 'Нет задолженностей'}
          {debtType === 'creditor' && 'Нет кредиторской задолженности'}
          {debtType === 'debtor' && 'Нет дебиторской задолженности'}
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Тип</th>
              <th>Поставщик</th>
              <th>№ договора</th>
              <th>Дата договора</th>
              <th>Общая сумма</th>
              <th>Оплачено</th>
              <th>Сумма задолженности</th>
              <th>Срок оплаты</th>
              <th>Статус договора</th>
            </tr>
          </thead>
          <tbody>
            {filteredDebts.map((debt) => (
              <tr key={debt.id} className={getRowClassName(debt)}>
                <td>{getDebtTypeBadge(debt.debt_type)}</td>
                <td>{debt.vendor_name}</td>
                <td>{debt.doc_number}</td>
                <td>{formatDate(debt.doc_date)}</td>
                <td>{formatMoney(debt.total_amount)}</td>
                <td>{formatMoney(debt.paid_amount)}</td>
                <td className="fw-bold">
                  <span className={debt.debt_type === 'Кредиторская' ? 'text-danger' : 'text-info'}>
                    {formatMoney(debt.debt_amount)}
                  </span>
                </td>
                <td>{getDeadlineStatus(debt.deadline_date)}</td>
                <td>
                  <Badge bg={debt.status === 'В работе' ? 'primary' : 'secondary'}>
                    {debt.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="table-secondary fw-bold">
              <td colSpan="6" className="text-end">ИТОГО:</td>
              <td>
                {debtType === 'creditor' && (
                  <span className="text-danger">{formatMoney(filteredSummary.creditor)}</span>
                )}
                {debtType === 'debtor' && (
                  <span className="text-info">{formatMoney(filteredSummary.debtor)}</span>
                )}
                {debtType === 'all' && (
                  <>
                    <div className="text-danger">Кредит: {formatMoney(filteredSummary.creditor)}</div>
                    <div className="text-info">Дебет: {formatMoney(filteredSummary.debtor)}</div>
                  </>
                )}
              </td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </Table>
      )}
    </div>
  );
}