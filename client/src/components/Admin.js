// Admin.js
import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Tab, Tabs, Table, Row, Col, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

// Поля, которые автогенерируются и не должны редактироваться
const AUTO_GENERATED_FIELDS = [
  'ID', 'id', 
  'CreatedAt', 'Created_at', 'created_at',
  'UpdatedAt', 'Updated_at', 'updated_at',
  'Last_receipt_date' // Это тоже автогенерируется
];

// Поля, которые вообще не показываем в формах
const HIDDEN_FIELDS = ['Password', 'password', 'password_hash'];

// Обязательные поля для каждой таблицы
const REQUIRED_FIELDS = {
  users: ['Login', 'Full_name', 'Role'],
  vendors: ['Company_name'],
  products: ['Article', 'Name', 'Unit'],
  'vendor-products': ['Vendor_id', 'Product_id'],
  documents: ['Doc_number', 'Doc_type', 'Doc_date'],
  'document-items': ['document_id', 'product_id', 'quantity', 'price'],
  accounting: ['Operation_date', 'Operation_type', 'Document_id', 'Amount'],
  storage: ['Product_id', 'Quantity']
};

// Группировка полей по категориям для каждой таблицы
const FIELD_GROUPS = {
  users: [
    { title: 'Основная информация', fields: ['Login', 'Full_name', 'Role'] }
  ],
  vendors: [
    { title: 'Основная информация', fields: ['Company_name'] },
    { title: 'Контактная информация', fields: ['Contact_person', 'Phone', 'Email', 'Address'] },
    { title: 'Реквизиты', fields: ['Inn', 'Kpp', 'Payment_account', 'Bank_name'] }
  ],
  products: [
    { title: 'Основная информация', fields: ['Article', 'Name', 'Unit'] },
    { title: 'Дополнительная информация', fields: ['Description', 'Category', 'Min_stock'] }
  ],
  'vendor-products': [
    { title: 'Связи', fields: ['Vendor_id', 'Product_id'] },
    { title: 'Условия', fields: ['Vendor_price', 'Currency', 'Delivery_days'] }
  ],
  documents: [
    { title: 'Основная информация', fields: ['Doc_number', 'Doc_type', 'Doc_date', 'Status'] },
    { title: 'Связи', fields: ['Vendor_id', 'User_id'] },
    { title: 'Финансовая информация', fields: ['Total_amount', 'Currency'] },
    { title: 'Дополнительно', fields: ['Description'] }
  ],
  'document-items': [
    { title: 'Основная информация', fields: ['document_id', 'product_id'] },
    { title: 'Количество и цены', fields: ['quantity', 'price', 'vat_rate'] }
  ],
  accounting: [
    { title: 'Основная информация', fields: ['Operation_date', 'Operation_type', 'Amount'] },
    { title: 'Связи', fields: ['Document_id', 'Supplier_id'] },
    { title: 'Дополнительно', fields: ['Vat_amount', 'Description', 'Created_by'] }
  ],
  storage: [
    { title: 'Основная информация', fields: ['Product_id', 'Quantity'] },
    { title: 'История', fields: ['Last_receipt_document_id'] }
  ]
};

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

function Admin({ setError }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('users');
  const [tableData, setTableData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [createFormData, setCreateFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
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

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (user) {
      loadTableData();
    }
  }, [activeTable, refresh, user]);

  // ============================================================================
  // ФУНКЦИИ ПРОВЕРКИ И ЗАГРУЗКИ ДАННЫХ
  // ============================================================================

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
    
    // Всегда используем предопределенную структуру таблицы
    detectTableStructureByTable(activeTable);
  } catch (err) {
    setError('Ошибка загрузки данных: ' + err.message);
    setTableData([]);
  }
};

  // ============================================================================
  // ФУНКЦИИ ОПРЕДЕЛЕНИЯ СТРУКТУРЫ ТАБЛИЦЫ
  // ============================================================================

  const detectTableStructure = (sample) => {
    const fields = {};
    Object.keys(sample).forEach(key => {
      // Исключаем автогенерируемые и скрытые поля
      if (!AUTO_GENERATED_FIELDS.includes(key) && !HIDDEN_FIELDS.includes(key)) {
        fields[key] = {
          type: typeof sample[key],
          label: getFieldLabel(key),
          required: REQUIRED_FIELDS[activeTable]?.includes(key) || false
        };
      }
    });
    setTableStructure(fields);
  };

const detectTableStructureByTable = (tableName) => {
  const structures = {
    users: {
      Login: { type: 'string', label: 'Логин', required: true },
      Full_name: { type: 'string', label: 'ФИО', required: true },
      Role: { type: 'select', label: 'Роль', options: availableRoles, required: true }
    },
    vendors: {
      Company_name: { type: 'string', label: 'Название компании', required: true },
      Contact_person: { type: 'string', label: 'Контактное лицо', required: false },
      Phone: { type: 'string', label: 'Телефон', required: false },
      Email: { type: 'string', label: 'Email', required: false },
      Address: { type: 'string', label: 'Адрес', required: false },
      Inn: { type: 'string', label: 'ИНН', required: false },
      Kpp: { type: 'string', label: 'КПП', required: false },
      Payment_account: { type: 'string', label: 'Расчетный счет', required: false },
      Bank_name: { type: 'string', label: 'Банк', required: false }
    },
    products: {
      Article: { type: 'string', label: 'Артикул', required: true },
      Name: { type: 'string', label: 'Название', required: true },
      Description: { type: 'string', label: 'Описание', required: false },
      Unit: { type: 'string', label: 'Ед. измерения', required: true },
      Category: { type: 'string', label: 'Категория', required: false },
      Min_stock: { type: 'number', label: 'Мин. остаток', required: false }
    },
    'vendor-products': {
      Vendor_id: { type: 'number', label: 'ID поставщика', required: true },
      Product_id: { type: 'number', label: 'ID товара', required: true },
      Vendor_price: { type: 'number', label: 'Цена', required: false },
      Currency: { type: 'string', label: 'Валюта', required: false },
      Delivery_days: { type: 'number', label: 'Срок доставки', required: false }
    },
    documents: {
      Doc_number: { type: 'string', label: 'Номер документа', required: true },
      Doc_type: { type: 'string', label: 'Тип', required: true },
      Doc_date: { type: 'string', label: 'Дата', required: true },
      Vendor_id: { type: 'number', label: 'ID поставщика', required: false },
      User_id: { type: 'number', label: 'ID пользователя', required: false },
      Status: { type: 'string', label: 'Статус', required: false },
      Total_amount: { type: 'number', label: 'Сумма', required: false },
      Currency: { type: 'string', label: 'Валюта', required: false },
      Description: { type: 'string', label: 'Описание', required: false }
    },
    'document-items': {
      document_id: { type: 'number', label: 'ID документа', required: true },
      product_id: { type: 'number', label: 'ID товара', required: true },
      quantity: { type: 'number', label: 'Количество', required: true },
      price: { type: 'number', label: 'Цена', required: true },
      vat_rate: { type: 'number', label: 'НДС', required: false }
    },
    accounting: {
      Operation_date: { type: 'string', label: 'Дата операции', required: true },
      Operation_type: { type: 'string', label: 'Тип операции', required: true },
      Document_id: { type: 'number', label: 'ID документа', required: true },
      Supplier_id: { type: 'number', label: 'ID поставщика', required: false },
      Amount: { type: 'number', label: 'Сумма', required: true },
      Vat_amount: { type: 'number', label: 'Сумма НДС', required: false },
      Description: { type: 'string', label: 'Описание', required: false },
      Created_by: { type: 'number', label: 'Создал', required: false }
    },
    storage: {
      Product_id: { type: 'number', label: 'ID товара', required: true },
      Quantity: { type: 'number', label: 'Количество', required: true },
      Last_receipt_document_id: { type: 'number', label: 'ID последнего документа', required: false }
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

  // ============================================================================
  // ОБРАБОТЧИКИ ДЕЙСТВИЙ
  // ============================================================================

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
    // Валидация пароля для пользователей
    if (activeTable === 'users') {
      if (!createFormData.password || createFormData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        return;
      }
      if (createFormData.password !== createFormData.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
      // Удаляем confirmPassword перед отправкой
      const dataToSend = { ...createFormData };
      delete dataToSend.confirmPassword;
      
      const token = localStorage.getItem('token');
      const currentTable = tables.find(t => t.key === activeTable);
      
      try {
        const response = await fetch(`http://localhost:8080${currentTable.endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });

        if (!response.ok) throw new Error('Ошибка создания');

        setShowCreateModal(false);
        setRefresh(!refresh);
        setError('');
      } catch (err) {
        setError('Ошибка создания: ' + err.message);
      }
      return;
    }

    // Для остальных таблиц
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${selectedItem.id || selectedItem.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      if (!response.ok) throw new Error('Ошибка изменения пароля');

      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setError('');
      alert('Пароль успешно изменен');
    } catch (err) {
      setError('Ошибка изменения пароля: ' + err.message);
    }
  };

  // ============================================================================
  // РЕНДЕРИНГ КОМПОНЕНТОВ
  // ============================================================================

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
    const groups = FIELD_GROUPS[activeTable] || [{ title: 'Информация', fields: Object.keys(tableStructure) }];
    
    return (
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Редактирование записи #{selectedItem?.id || selectedItem?.ID}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {groups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {groups.length > 1 && (
                  <h6 className="text-primary mb-3 mt-3 border-bottom pb-2">
                    {group.title}
                  </h6>
                )}
                <Row>
                  {group.fields.map(field => {
                    const fieldConfig = tableStructure[field];
                    if (!fieldConfig) return null;
                    
                    return (
                      <Col md={6} key={field}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-danger"> *</span>}
                          </Form.Label>
                          {fieldConfig.type === 'select' ? (
                            <Form.Select
                              value={formData[field] || (fieldConfig.options ? fieldConfig.options[0] : '')}
                              onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                              required={fieldConfig.required}
                            >
                              {(fieldConfig.options || availableRoles).map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </Form.Select>
                          ) : fieldConfig.type === 'number' ? (
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={formData[field] || 0}
                              onChange={(e) => setFormData({...formData, [field]: parseFloat(e.target.value)})}
                              required={fieldConfig.required}
                            />
                          ) : (
                            <Form.Control
                              type="text"
                              value={formData[field] || ''}
                              onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                              required={fieldConfig.required}
                            />
                          )}
                        </Form.Group>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ))}
            
            {/* Кнопка для смены пароля (только для пользователей) */}
            {activeTable === 'users' && (
              <div className="mt-3">
                <Button 
                  variant="outline-warning" 
                  onClick={() => {
                    setShowPasswordModal(true);
                  }}
                >
                  🔒 Изменить пароль
                </Button>
              </div>
            )}
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
    const groups = FIELD_GROUPS[activeTable] || [{ title: 'Информация', fields: Object.keys(tableStructure) }];
    
    return (
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Создание новой записи</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {groups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {groups.length > 1 && (
                  <h6 className="text-primary mb-3 mt-3 border-bottom pb-2">
                    {group.title}
                  </h6>
                )}
                <Row>
                  {group.fields.map(field => {
                    const fieldConfig = tableStructure[field];
                    if (!fieldConfig) return null;
                    
                    return (
                      <Col md={6} key={field}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            {fieldConfig.label}
                            {fieldConfig.required && <span className="text-danger"> *</span>}
                          </Form.Label>
                          {fieldConfig.type === 'select' ? (
                            <Form.Select
                              value={createFormData[field] || (fieldConfig.options ? fieldConfig.options[0] : '')}
                              onChange={(e) => setCreateFormData({...createFormData, [field]: e.target.value})}
                              required={fieldConfig.required}
                            >
                              {(fieldConfig.options || availableRoles).map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </Form.Select>
                          ) : fieldConfig.type === 'number' ? (
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={createFormData[field] || 0}
                              onChange={(e) => setCreateFormData({...createFormData, [field]: parseFloat(e.target.value)})}
                              required={fieldConfig.required}
                            />
                          ) : (
                            <Form.Control
                              type="text"
                              value={createFormData[field] || ''}
                              onChange={(e) => setCreateFormData({...createFormData, [field]: e.target.value})}
                              required={fieldConfig.required}
                            />
                          )}
                        </Form.Group>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ))}
            
            {/* Специальная обработка для пользователей - добавляем поле пароля */}
            {activeTable === 'users' && (
              <div>
                <h6 className="text-primary mb-3 mt-3 border-bottom pb-2">
                  Безопасность
                </h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Пароль <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="password"
                        value={createFormData.password || ''}
                        onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                        placeholder="Минимум 6 символов"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Подтверждение пароля <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="password"
                        value={createFormData.confirmPassword || ''}
                        onChange={(e) => setCreateFormData({...createFormData, confirmPassword: e.target.value})}
                        placeholder="Повторите пароль"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}
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

  const renderPasswordModal = () => {
    return (
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Изменить пароль пользователя</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Новый пароль <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="Минимум 6 символов"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Подтвердите пароль <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Повторите пароль"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handlePasswordChange}>
            Изменить пароль
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // ============================================================================
  // ОСНОВНОЙ РЕНДЕР
  // ============================================================================

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
      {renderPasswordModal()}
    </div>
  );
}

export default Admin;