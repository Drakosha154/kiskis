import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';

function WarehouseLocationsManager() {
  const [locations, setLocations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    rack: 'A',
    shelf: 1,
    cell: 1,
    capacity: 100
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/warehouse-locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Ошибка загрузки ячеек:', error);
    }
  };

  const handleCreateLocation = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/warehouse-locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchLocations();
        setShowAddModal(false);
        setFormData({ rack: 'A', shelf: 1, cell: 1, capacity: 100 });
        alert('Ячейка создана успешно!');
      }
    } catch (error) {
      console.error('Ошибка создания ячейки:', error);
    }
  };

  const handleToggleAvailability = async (locationId, currentStatus) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:8080/api/warehouse-locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_available: !currentStatus })
      });
      await fetchLocations();
    } catch (error) {
      console.error('Ошибка обновления ячейки:', error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Управление ячейками склада</h4>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Добавить ячейку
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Код</th>
            <th>Стеллаж</th>
            <th>Полка</th>
            <th>Ячейка</th>
            <th>Вместимость</th>
            <th>Занято</th>
            <th>Заполненность</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {locations.map(loc => {
            const occupancyPercent = (loc.occupied / loc.capacity) * 100;
            return (
              <tr key={loc.id}>
                <td><strong>{loc.location_code}</strong></td>
                <td>{loc.rack}</td>
                <td>{loc.shelf}</td>
                <td>{loc.cell}</td>
                <td>{loc.capacity}</td>
                <td>{loc.occupied.toFixed(2)}</td>
                <td>
                  <div className="progress" style={{ height: '20px' }}>
                    <div 
                      className={`progress-bar ${
                        occupancyPercent > 100 ? 'bg-danger' : 
                        occupancyPercent > 80 ? 'bg-warning' : 
                        'bg-success'
                      }`}
                      style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                    >
                      {occupancyPercent.toFixed(0)}%
                    </div>
                  </div>
                </td>
                <td>
                  <Badge bg={loc.is_available ? 'success' : 'secondary'}>
                    {loc.is_available ? 'Доступна' : 'Недоступна'}
                  </Badge>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant={loc.is_available ? 'warning' : 'success'}
                    onClick={() => handleToggleAvailability(loc.id, loc.is_available)}
                  >
                    {loc.is_available ? 'Отключить' : 'Включить'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Модальное окно добавления ячейки */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить ячейку</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Стеллаж</Form.Label>
              <Form.Control
                type="text"
                value={formData.rack}
                onChange={(e) => setFormData({...formData, rack: e.target.value})}
                placeholder="A, B, C..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Полка</Form.Label>
              <Form.Control
                type="number"
                value={formData.shelf}
                onChange={(e) => setFormData({...formData, shelf: parseInt(e.target.value)})}
                min="1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ячейка</Form.Label>
              <Form.Control
                type="number"
                value={formData.cell}
                onChange={(e) => setFormData({...formData, cell: parseInt(e.target.value)})}
                min="1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Вместимость</Form.Label>
              <Form.Control
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseFloat(e.target.value)})}
                min="1"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCreateLocation}>
            Создать
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default WarehouseLocationsManager;