import React, { useState, useEffect } from 'react';
import { Button, Table } from 'react-bootstrap';

function ContractsPage({ setError }) {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    getContracts();
  }, []);

  const getContracts = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch contracts');
      
      const data = await response.json();
      setContracts(data.documents || []);
    } catch (err) {
      setError('Ошибка загрузки договоров: ' + err.message);
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Заключение договоров</h4>
        <Button variant="success">
          <span className="me-2">+</span> Новый договор
        </Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>№</th>
            <th>Номер документа</th>
            <th>Тип</th>
            <th>Дата</th>
            <th>Поставщик</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract, index) => (
            <tr key={contract.ID}>
              <td>{index + 1}</td>
              <td>{contract.Doc_number}</td>
              <td>{contract.Doc_type}</td>
              <td>{new Date(contract.Doc_date).toLocaleDateString()}</td>
              <td>{contract.Supplier_id}</td>
              <td>{contract.Status}</td>
              <td>{contract.Total_amount}</td>
              <td>
                <Button variant="warning" size="sm" className="me-2">
                  Редактировать
                </Button>
                <Button variant="danger" size="sm">
                  Удалить
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ContractsPage;