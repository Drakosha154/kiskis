import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Tab, Tabs, Table, Row, Col, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import Moving from './Moving';
import PaymentSchedule from './PaymentSchedule';
import DebtControl from './DebtControl';

export default function AccountingPage({ setError }) {
  const [operations, setOperations] = useState([]);
  const [activeTable, setActiveTable] = useState('moving');
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
  <div className="p-4">
    <Tabs
      activeKey={activeTable}
      onSelect={(k) => setActiveTable(k)}
      className="mb-4"
    >
      <Tab key={"moving"} eventKey={"moving"} title={"Движение денежных средств"}>
        <Moving 
          balance={balance}
          formatMoney={formatMoney}
          formatDate={formatDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
          operations={operations}
          getOperationTypeLabel={getOperationTypeLabel}
        />
      </Tab>
      <Tab key={"Plati"} eventKey={"Plati"} title={"Оплата договоров"}>
        <PaymentSchedule setError={setError} />
      </Tab>
      <Tab key={"Debt"} eventKey={"Debt"} title={"Контроль задолженность"}>
        <DebtControl setError={setError} />
      </Tab>
    </Tabs>
  </div>  
  );
}