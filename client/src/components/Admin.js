// Admin.js
import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Tab, Tabs, Table, Row, Col, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Admin({ setError }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('users');
  const [tableData, setTableData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [createFormData, setCreateFormData] = useState({});
  const [tableStructure, setTableStructure] = useState({});
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();

  // Доступные роли для пользователей
  const availableRoles = ['admin', 'менеджер', 'кладовщик', 'бухгалтер', 'директор'];

  const tables = [
    { key: 'users', name: 'Пользователи', endpoint: '/api/admin/users' },
    { key: 'vendors', name: 'Поставщики', endpoint: '/api/admin/vendors' },
    { key: 'products', name: 'Товары', endpoint: '/api/admin/products' },
    { key: 'vendor-products', name: 'Товары поставщиков', endpoint: '/api/admin/vendor-products' },
    { key: 'documents', name: 'Документы', endpoint: '/api/admin/documents' },
    { key: 'document-items', name: 'Позиции документов', endpoint: '/api/admin/document-items' },
    { key: 'accounting', name: 'Бухгалтерия', endpoint: '/api/admin/accounting' },
    { key: 'storage', name: 'Склад', endpoint: '/api/admin/storage' }
  ];

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/admin/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Admin access required');
      }

      const data = await response.json();
      
      if (data.role !== 'admin') {
        setError('Доступ запрещен. Требуются права администратора.');
        navigate('/');
        return;
      }

      setUser(data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка проверки прав доступа: ' + err.message);
      navigate('/login');
    }
  };

  useEffect(() => {
    if (user) {
      loadTableData();
    }
  }, [activeTable, refresh, user]);

  const loadTableData = async () => {
    const currentTable = tables.find(t => t.key === activeTable);
    if (!currentTable) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080${currentTable.endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Ошибка загрузки данных');

      const data = await response.json();
      setTableData(data.data || []);
      
      if (data.data && data.data.length > 0) {
        detectTableStructure(data.data[0]);
      } else {
        detectTableStructureByTable(activeTable);
      }
    } catch (err) {
      setError('Ошибка загрузки данных: ' + err.message);
      setTableData([]);
    }
  };

  const detectTableStructure = (sample) => {
    const fields = {};
    Object.keys(sample).forEach(key => {
      if (!key.includes('created_at') && !key.includes('updated_at') && key !== 'password' && key !== 'password_hash') {
        fields[key] = {
          type: typeof sample[key],
          label: getFieldLabel(key)
        };
      }
    });
    setTableStructure(fields);
  };

  const detectTableStructureByTable = (tableName) => {
    const structures = {
      users: {
        login: { type: 'string', label: 'Логин' },
        full_name: { type: 'string', label: 'ФИО' },
        role: { type: 'select', label: 'Роль', options: availableRoles }
      },
      vendors: {
        company_name: { type: 'string', label: 'Название компании' },
        contact_person: { type: 'string', label: 'Контактное лицо' },
        phone: { type: 'string', label: 'Телефон' },
        email: { type: 'string', label: 'Email' },
        address: { type: 'string', label: 'Адрес' },
        inn: { type: 'string', label: 'ИНН' },
        kpp: { type: 'string', label: 'КПП' },
        payment_account: { type: 'string', label: 'Расчетный счет' },
        bank_name: { type: 'string', label: 'Банк' }
      },
      products: {
        article: { type: 'string', label: 'Артикул' },
        name: { type: 'string', label: 'Название' },
        description: { type: 'string', label: 'Описание' },
        unit: { type: 'string', label: 'Ед. измерения' },
        category: { type: 'string', label: 'Категория' },
        min_stock: { type: 'number', label: 'Мин. остаток' }
      },
      'vendor-products': {
        vendor_id: { type: 'number', label: 'ID поставщика' },
        product_id: { type: 'number', label: 'ID товара' },
        vendor_price: { type: 'number', label: 'Цена' },
        currency: { type: 'string', label: 'Валюта' },
        delivery_days: { type: 'number', label: 'Срок доставки' }
      },
      documents: {
        doc_number: { type: 'string', label: 'Номер документа' },
        doc_type: { type: 'string', label: 'Тип' },
        doc_date: { type: 'string', label: 'Дата' },
        vendor_id: { type: 'number', label: 'ID поставщика' },
        user_id: { type: 'number', label: 'ID пользователя' },
        status: { type: 'string', label: 'Статус' },
        total_amount: { type: 'number', label: 'Сумма' },
        currency: { type: 'string', label: 'Валюта' },
        description: { type: 'string', label: 'Описание' }
      },
      'document-items': {
        document_id: { type: 'number', label: 'ID документа' },
        product_id: { type: 'number', label: 'ID товара' },
        quantity: { type: 'number', label: 'Количество' },
        price: { type: 'number', label: 'Цена' },
        vat_rate: { type: 'number', label: 'НДС' }
      },
      accounting: {
        operation_date: { type: 'string', label: 'Дата операции' },
        operation_type: { type: 'string', label: 'Тип операции' },
        document_id: { type: 'number', label: 'ID документа' },
        supplier_id: { type: 'number', label: 'ID поставщика' },
        amount: { type: 'number', label: 'Сумма' },
        vat_amount: { type: 'number', label: 'Сумма НДС' },
        description: { type: 'string', label: 'Описание' },
        created_by: { type: 'number', label: 'Создал' }
      },
      storage: {
        product_id: { type: 'number', label: 'ID товара' },
        quantity: { type: 'number', label: 'Количество' },
        last_receipt_document_id: { type: 'number', label: 'ID последнего документа' }
      }
    };

    setTableStructure(structures[tableName] || {});
  };

  const getFieldLabel = (key) => {
    const labels = {
      id: 'ID',
      login: 'Логин',
      password: 'Пароль',
      full_name: 'ФИО',
      role: 'Роль',
      created_at: 'Дата создания',
      updated_at: 'Дата обновления',
      company_name: 'Название компании',
      contact_person: 'Контактное лицо',
      phone: 'Телефон',
      email: 'Email',
      address: 'Адрес',
      inn: 'ИНН',
      kpp: 'КПП',
      payment_account: 'Расчетный счет',
      bank_name: 'Банк',
      article: 'Артикул',
      name: 'Название',
      description: 'Описание',
      unit: 'Ед. измерения',
      category: 'Категория',
      min_stock: 'Мин. остаток',
      vendor_id: 'Поставщик',
      product_id: 'Товар',
      vendor_price: 'Цена поставщика',
      currency: 'Валюта',
      delivery_days: 'Срок доставки (дни)',
      doc_number: 'Номер документа',
      doc_type: 'Тип документа',
      doc_date: 'Дата документа',
      user_id: 'Пользователь',
      status: 'Статус',
      total_amount: 'Общая сумма',
      document_id: 'Документ',
      quantity: 'Количество',
      price: 'Цена',
      vat_rate: 'НДС',
      operation_date: 'Дата операции',
      operation_type: 'Тип операции',
      supplier_id: 'Поставщик',
      amount: 'Сумма',
      vat_amount: 'Сумма НДС',
      created_by: 'Создал',
      last_receipt_date: 'Дата последнего поступления',
      last_receipt_document_id: 'Последний документ'
    };
    return labels[key] || key;
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    const emptyData = {};
    Object.keys(tableStructure).forEach(key => {
      const fieldType = tableStructure[key].type;
      if (fieldType === 'string') emptyData[key] = '';
      else if (fieldType === 'number') emptyData[key] = 0;
      else if (fieldType === 'boolean') emptyData[key] = false;
      else if (fieldType === 'select') emptyData[key] = availableRoles[0];
    });
    setCreateFormData(emptyData);
    setShowCreateModal(true);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const currentTable = tables.find(t => t.key === activeTable);
    
    try {
      const response = await fetch(`http://localhost:8080${currentTable.endpoint}/${selectedItem.id || selectedItem.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Ошибка обновления');

      setShowEditModal(false);
      setRefresh(!refresh);
      setError('');
    } catch (err) {
      setError('Ошибка обновления: ' + err.message);
    }
  };

  const handleCreateSubmit = async () => {
    const token = localStorage.getItem('token');
    const currentTable = tables.find(t => t.key === activeTable);
    
    try {
      const response = await fetch(`http://localhost:8080${currentTable.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      });

      if (!response.ok) throw new Error('Ошибка создания');

      setShowCreateModal(false);
      setRefresh(!refresh);
      setError('');
    } catch (err) {
      setError('Ошибка создания: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;

    const token = localStorage.getItem('token');
    const currentTable = tables.find(t => t.key === activeTable);
    
    try {
      const response = await fetch(`http://localhost:8080${currentTable.endpoint}/${item.id || item.ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Ошибка удаления');

      setRefresh(!refresh);
      setError('');
    } catch (err) {
      setError('Ошибка удаления: ' + err.message);
    }
  };

  // Функция для рендеринга поля ввода в зависимости от типа
  const renderFormField = (field, value, onChange, isCreate = false) => {
    const fieldConfig = tableStructure[field];
    
    if (fieldConfig.type === 'select') {
      const options = fieldConfig.options || availableRoles;
      return (
        <Form.Select
          value={value || options[0]}
          onChange={(e) => onChange({...formData, [field]: e.target.value})}
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Form.Select>
      );
    } else if (fieldConfig.type === 'number') {
      return (
        <Form.Control
          type="number"
          step="0.01"
          value={value || 0}
          onChange={(e) => onChange({...formData, [field]: parseFloat(e.target.value)})}
        />
      );
    } else {
      return (
        <Form.Control
          type={field === 'password' ? 'password' : 'text'}
          value={value || ''}
          onChange={(e) => onChange({...formData, [field]: e.target.value})}
        />
      );
    }
  };

  // Функция для рендеринга поля в форме создания
  const renderCreateFormField = (field, value, onChange) => {
    const fieldConfig = tableStructure[field];
    
    if (fieldConfig.type === 'select') {
      const options = fieldConfig.options || availableRoles;
      return (
        <Form.Select
          value={value || options[0]}
          onChange={(e) => onChange({...createFormData, [field]: e.target.value})}
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Form.Select>
      );
    } else if (fieldConfig.type === 'number') {
      return (
        <Form.Control
          type="number"
          step="0.01"
          value={value || 0}
          onChange={(e) => onChange({...createFormData, [field]: parseFloat(e.target.value)})}
        />
      );
    } else {
      return (
        <Form.Control
          type={field === 'password' ? 'password' : 'text'}
          value={value || ''}
          onChange={(e) => onChange({...createFormData, [field]: e.target.value})}
        />
      );
    }
  };

  const renderTableRow = (item, index) => {
    const fields = Object.keys(tableStructure);
    return (
      <tr key={item.id || item.ID}>
        <td>{index + 1}</td>
        {fields.map(field => (
          <td key={field}>
            {field === 'role' && item[field] === 'admin' ? 
              <Badge bg="danger">{item[field]}</Badge> :
              field === 'status' ?
                <Badge bg={item[field] === 'Черновик' ? 'secondary' : 'success'}>{item[field]}</Badge> :
                String(item[field] || '-')
            }
          </td>
        ))}
        <td>
          <div className="btn-group" role="group" size="sm">
            <Button 
              variant="warning" 
              size="sm"
              onClick={() => handleEdit(item)}
              className="me-2"
            >
              ✏️
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => handleDelete(item)}
            >
              🗑️
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const renderEditModal = () => {
    const fields = Object.keys(tableStructure);
    return (
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Редактирование записи #{selectedItem?.id || selectedItem?.ID}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              {fields.map(field => (
                <Col md={6} key={field}>
                  <Form.Group className="mb-3">
                    <Form.Label>{tableStructure[field].label}</Form.Label>
                    {tableStructure[field].type === 'select' ? (
                      <Form.Select
                        value={formData[field] || (tableStructure[field].options ? tableStructure[field].options[0] : '')}
                        onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                      >
                        {(tableStructure[field].options || availableRoles).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Form.Select>
                    ) : tableStructure[field].type === 'number' ? (
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={formData[field] || 0}
                        onChange={(e) => setFormData({...formData, [field]: parseFloat(e.target.value)})}
                      />
                    ) : (
                      <Form.Control
                        type={field === 'password' ? 'password' : 'text'}
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                      />
                    )}
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const renderCreateModal = () => {
    const fields = Object.keys(tableStructure);
    return (
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Создание новой записи</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              {fields.map(field => (
                <Col md={6} key={field}>
                  <Form.Group className="mb-3">
                    <Form.Label>{tableStructure[field].label}</Form.Label>
                    {tableStructure[field].type === 'select' ? (
                      <Form.Select
                        value={createFormData[field] || (tableStructure[field].options ? tableStructure[field].options[0] : '')}
                        onChange={(e) => setCreateFormData({...createFormData, [field]: e.target.value})}
                      >
                        {(tableStructure[field].options || availableRoles).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Form.Select>
                    ) : tableStructure[field].type === 'number' ? (
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={createFormData[field] || 0}
                        onChange={(e) => setCreateFormData({...createFormData, [field]: parseFloat(e.target.value)})}
                      />
                    ) : (
                      <Form.Control
                        type={field === 'password' ? 'password' : 'text'}
                        value={createFormData[field] || ''}
                        onChange={(e) => setCreateFormData({...createFormData, [field]: e.target.value})}
                      />
                    )}
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Отмена
          </Button>
          <Button variant="success" onClick={handleCreateSubmit}>
            Создать
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Проверка прав доступа...</span>
      </div>
    );
  }

  const currentTable = tables.find(t => t.key === activeTable);
  const tableFields = Object.keys(tableStructure);

  return (
    <div className="p-4">
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">
                👑 Админ-панель
                {user && <Badge bg="danger" className="ms-3">Администратор: {user.login}</Badge>}
              </h4>
              <p className="text-muted mb-0">Управление всеми таблицами базы данных</p>
            </div>
            <Button variant="success" onClick={handleCreate}>
              + Новая запись
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Tabs
        activeKey={activeTable}
        onSelect={(k) => setActiveTable(k)}
        className="mb-4"
      >
        {tables.map(table => (
          <Tab key={table.key} eventKey={table.key} title={table.name}>
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        {tableFields.map(field => (
                          <th key={field}>{tableStructure[field]?.label || field}</th>
                        ))}
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length > 0 ? (
                        tableData.map((item, index) => renderTableRow(item, index))
                      ) : (
                        <tr>
                          <td colSpan={tableFields.length + 2} className="text-center">
                            <Alert variant="info" className="mb-0">
                              Нет данных в таблице "{table.name}"
                            </Alert>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                {tableData.length > 0 && (
                  <div className="text-muted mt-3">
                    Всего записей: {tableData.length}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
        ))}
      </Tabs>

      {renderEditModal()}
      {renderCreateModal()}
    </div>
  );
}

export default Admin;