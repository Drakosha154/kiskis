import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Tab, Tabs, Table, Row, Col } from 'react-bootstrap';

function VendorsPage({ setError }) {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [productAddMode, setProductAddMode] = useState('existing');
  
  const [newVendor, setNewVendor] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    inn: '',
    kpp: '',
    payment_account: '',
    bank_name: ''
  });
  
  const [newVendorProduct, setNewVendorProduct] = useState({
    product_id: '',
    vendor_price: '',
    currency: 'RUB',
    delivery_days: ''
  });

  const [newProduct, setNewProduct] = useState({
    article: '',
    name: '',
    description: '',
    unit: 'шт',
    category: '',
    min_stock: 0
  });

  const [newProductVendorPrice, setNewProductVendorPrice] = useState({
    vendor_price: '',
    currency: 'RUB',
    delivery_days: ''
  });

  useEffect(() => {
    getVendors();
    getProducts();
  }, []);

  const getVendors = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Admin access denied');
      
      const data = await response.json();
      setVendors(data.vendor);
    } catch (err) {
      setError('Ошибка доступа: ' + err.message);
    }
  };

  const getProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError('Ошибка загрузки товаров: ' + err.message);
    }
  };

  const getVendorProducts = async (vendorId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/vendor-products/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch vendor products');
      
      const data = await response.json();
      
      if (data.vendorProducts && Array.isArray(data.vendorProducts)) {
        setVendorProducts(data.vendorProducts);
      } else if (Array.isArray(data)) {
        setVendorProducts(data);
      } else {
        setVendorProducts([]);
      }
    } catch (err) {
      setError('Ошибка загрузки товаров поставщика: ' + err.message);
      setVendorProducts([]);
    }
  };

  const createVendor = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8080/api/vendors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newVendor),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create vendor');
      }

      setNewVendor({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        inn: '',
        kpp: '',
        payment_account: '',
        bank_name: ''
      });
      
      setShowCreateModal(false);
      getVendors();
      
    } catch (err) {
      setError('Ошибка создания поставщика: ' + err.message);
    }
  };

  const createNewProduct = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const data = await response.json();
      
      if (data.product && data.product.ID) {
        return data.product.ID;
      } else if (data.id) {
        return data.id;
      } else {
        await getProducts();
        const createdProduct = products.find(p => p.Article === newProduct.article) || 
                              products.find(p => p.Name === newProduct.name);
        
        if (createdProduct) {
          return createdProduct.ID;
        }
      }
      
      throw new Error('Не удалось получить ID созданного товара');
    } catch (err) {
      throw new Error('Ошибка создания товара: ' + err.message);
    }
  };

  const addExistingVendorProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const requestData = {
      vendor_id: selectedVendor.ID,
      products: [{
        product_id: parseInt(newVendorProduct.product_id),
        vendor_price: parseFloat(newVendorProduct.vendor_price),
        currency: newVendorProduct.currency,
        delivery_days: parseInt(newVendorProduct.delivery_days) || 0
      }]
    };

    try {
      const response = await fetch('http://localhost:8080/api/vendor-products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      setNewVendorProduct({
        product_id: '',
        vendor_price: '',
        currency: 'RUB',
        delivery_days: ''
      });
      
      getVendorProducts(selectedVendor.ID);
    } catch (err) {
      setError('Ошибка добавления товара: ' + err.message);
    }
  };

  const addNewProduct = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      const newProductId = await createNewProduct();
      
      if (!newProductId) {
        throw new Error('Не удалось получить ID созданного товара');
      }

      const token = localStorage.getItem('token');
      
      const requestData = {
        vendor_id: selectedVendor.ID,
        products: [{
          product_id: newProductId,
          vendor_price: parseFloat(newProductVendorPrice.vendor_price),
          currency: newProductVendorPrice.currency,
          delivery_days: parseInt(newProductVendorPrice.delivery_days) || 0
        }]
      };

      const response = await fetch('http://localhost:8080/api/vendor-products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product to vendor');
      }

      setNewProduct({
        article: '',
        name: '',
        description: '',
        unit: 'шт',
        category: '',
        min_stock: 0
      });
      
      setNewProductVendorPrice({
        vendor_price: '',
        currency: 'RUB',
        delivery_days: ''
      });
      
      setProductAddMode('existing');
      
      await Promise.all([
        getVendorProducts(selectedVendor.ID),
        getProducts()
      ]);
      
    } catch (err) {
      setError('Ошибка: ' + err.message);
    }
  };

  const deleteVendorProduct = async (vendorProductId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар у поставщика?')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/vendor-products/${vendorProductId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete vendor product');
      
      getVendorProducts(selectedVendor.ID);
    } catch (err) {
      setError('Ошибка удаления товара: ' + err.message);
    }
  };

  const saveVendor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
      company_name: formData.get('Company_name'),
      contact_person: formData.get('Contact_person'),
      phone: formData.get('Phone'),
      email: formData.get('Email'),
      address: formData.get('Address'),
      inn: formData.get('Inn'),
      kpp: formData.get('Kpp'),
      payment_account: formData.get('Payment_account'),
      bank_name: formData.get('Bank_name'),
    };
    
    const token = localStorage.getItem('token');
      
    try {
      const response = await fetch(`http://localhost:8080/api/vendors/${selectedVendor.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Admin access denied');

      setShowEditModal(false);
      setSelectedVendor(null);
      getVendors();
    } catch (err) {
      setError('Ошибка доступа: ' + err.message);
    }
  };

  const handleShowEditModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowEditModal(true);
    setActiveTab('info');
    setProductAddMode('existing');
    getVendorProducts(vendor.ID);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedVendor(null);
    setVendorProducts([]);
    setActiveTab('info');
    resetForms();
  };

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewVendor({
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      inn: '',
      kpp: '',
      payment_account: '',
      bank_name: ''
    });
  };

  const resetForms = () => {
    setNewVendorProduct({
      product_id: '',
      vendor_price: '',
      currency: 'RUB',
      delivery_days: ''
    });
    setNewProduct({
      article: '',
      name: '',
      description: '',
      unit: 'шт',
      category: '',
      min_stock: 0
    });
    setNewProductVendorPrice({
      vendor_price: '',
      currency: 'RUB',
      delivery_days: ''
    });
  };

  const handleDelete = async (vendorId) => {
    if (window.confirm('Вы уверены, что хотите удалить поставщика?')) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:8080/api/vendors/${vendorId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete vendor');
        
        getVendors();
      } catch (err) {
        setError('Ошибка удаления: ' + err.message);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Список поставщиков</h4>
        <Button variant="success" onClick={handleShowCreateModal}>
          <span className="me-2">+</span> Новый поставщик
        </Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Название компании</th>
            <th>Контакты</th>
            <th>Телефон</th>
            <th>Email</th>
            <th>Адрес</th>
            <th>ИНН</th>
            <th>Взаимодействие</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, index) => (
            <tr key={vendor.ID}>
              <td>{index + 1}</td>
              <td>{vendor.Company_name}</td>
              <td>{vendor.Contact_person}</td>
              <td>{vendor.Phone}</td>
              <td>{vendor.Email}</td>
              <td>{vendor.Address}</td>
              <td>{vendor.Inn}</td>
              <td>
                <div className="btn-group" role="group">
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDelete(vendor.ID)}
                  >
                    Удалить
                  </Button>
                  <Button 
                    variant="warning" 
                    size="sm"
                    onClick={() => handleShowEditModal(vendor)}
                  >
                    Редактировать
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {vendors.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center">
                Нет поставщиков. Нажмите "Новый поставщик" для добавления.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Модальное окно создания поставщика */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} backdrop="static" size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>Создание нового поставщика</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={createVendor}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Название компании <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.company_name}
                    onChange={(e) => setNewVendor({...newVendor, company_name: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Контактное лицо <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.contact_person}
                    onChange={(e) => setNewVendor({...newVendor, contact_person: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Телефон <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Адрес <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.address}
                    onChange={(e) => setNewVendor({...newVendor, address: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ИНН <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.inn}
                    onChange={(e) => setNewVendor({...newVendor, inn: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>КПП</Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.kpp}
                    onChange={(e) => setNewVendor({...newVendor, kpp: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Расчетный счет <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.payment_account}
                    onChange={(e) => setNewVendor({...newVendor, payment_account: e.target.value})}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Название банка <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newVendor.bank_name}
                    onChange={(e) => setNewVendor({...newVendor, bank_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end mt-3">
              <Button variant="secondary" onClick={handleCloseCreateModal} className="me-2">
                Отмена
              </Button>
              <Button variant="success" type="submit">
                Создать поставщика
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Модальное окно редактирования поставщика */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} backdrop="static" size='xl'>
        <Modal.Header closeButton>
          <Modal.Title>Редактирование данных поставщика: {selectedVendor?.Company_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="info" title="Информация">
              <Form onSubmit={saveVendor}>
                {selectedVendor && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Название компании</Form.Label>
                        <Form.Control
                          name="Company_name"
                          defaultValue={selectedVendor.Company_name}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Контактное лицо</Form.Label>
                        <Form.Control
                          name="Contact_person"
                          defaultValue={selectedVendor.Contact_person}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Телефон</Form.Label>
                        <Form.Control
                          name="Phone"
                          defaultValue={selectedVendor.Phone}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          name="Email"
                          type="email"
                          defaultValue={selectedVendor.Email}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Адрес</Form.Label>
                        <Form.Control
                          name="Address"
                          defaultValue={selectedVendor.Address}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>ИНН</Form.Label>
                        <Form.Control
                          name="Inn"
                          defaultValue={selectedVendor.Inn}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>КПП</Form.Label>
                        <Form.Control
                          name="Kpp"
                          defaultValue={selectedVendor.Kpp}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Расчетный счет</Form.Label>
                        <Form.Control
                          name="Payment_account"
                          defaultValue={selectedVendor.Payment_account}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Название банка</Form.Label>
                        <Form.Control
                          name="Bank_name"
                          defaultValue={selectedVendor.Bank_name}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                <div className="text-end mt-3">
                  <Button variant="secondary" onClick={handleCloseEditModal} className="me-2">
                    Отмена
                  </Button>
                  <Button variant="primary" type="submit">
                    Сохранить изменения
                  </Button>
                </div>
              </Form>
            </Tab>

            <Tab eventKey="products" title="Товары поставщика">
              <Row>
                <Col md={5}>
                  <div className="mb-3">
                    <Button 
                      variant={productAddMode === 'existing' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => setProductAddMode('existing')}
                      className="me-2"
                    >
                      Существующий товар
                    </Button>
                    <Button 
                      variant={productAddMode === 'new' ? 'success' : 'outline-success'} 
                      size="sm"
                      onClick={() => setProductAddMode('new')}
                    >
                      Новый товар
                    </Button>
                  </div>

                  {productAddMode === 'existing' ? (
                    <Form onSubmit={addExistingVendorProduct}>
                      <h5>Добавить существующий товар</h5>
                      <Form.Group className="mb-3">
                        <Form.Label>Товар</Form.Label>
                        <Form.Select
                          value={newVendorProduct.product_id}
                          onChange={(e) => setNewVendorProduct({...newVendorProduct, product_id: e.target.value})}
                          required
                        >
                          <option value="">Выберите товар</option>
                          {products.map(product => (
                            <option key={product.ID} value={product.ID}>
                              {product.Name} ({product.Article})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Цена поставщика</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          value={newVendorProduct.vendor_price}
                          onChange={(e) => setNewVendorProduct({...newVendorProduct, vendor_price: e.target.value})}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Валюта</Form.Label>
                        <Form.Select
                          value={newVendorProduct.currency}
                          onChange={(e) => setNewVendorProduct({...newVendorProduct, currency: e.target.value})}
                        >
                          <option value="RUB">RUB</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Срок доставки (дней)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={newVendorProduct.delivery_days}
                          onChange={(e) => setNewVendorProduct({...newVendorProduct, delivery_days: e.target.value})}
                        />
                      </Form.Group>

                      <Button variant="primary" type="submit">
                        Добавить товар
                      </Button>
                    </Form>
                  ) : (
                    <Form onSubmit={addNewProduct}>
                      <h5>Создать новый товар</h5>
                      <Form.Group className="mb-3">
                        <Form.Label>Артикул</Form.Label>
                        <Form.Control
                          type="text"
                          value={newProduct.article}
                          onChange={(e) => setNewProduct({...newProduct, article: e.target.value})}
                          required
                          placeholder="Например: ACC-001"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Наименование товара</Form.Label>
                        <Form.Control
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Описание</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </Form.Group>

                      <Row>
                        <Col>
                          <Form.Group className="mb-3">
                            <Form.Label>Единица измерения</Form.Label>
                            <Form.Select
                              value={newProduct.unit}
                              onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                              required
                            >
                              <option value="шт">Штука (шт)</option>
                              <option value="кг">Килограмм (кг)</option>
                              <option value="м">Метр (м)</option>
                              <option value="уп">Упаковка (уп)</option>
                              <option value="компл">Комплект (компл)</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group className="mb-3">
                            <Form.Label>Категория</Form.Label>
                            <Form.Control
                              type="text"
                              value={newProduct.category}
                              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                              placeholder="Например: Фурнитура"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Минимальный остаток</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={newProduct.min_stock}
                          onChange={(e) => setNewProduct({...newProduct, min_stock: parseInt(e.target.value) || 0})}
                        />
                      </Form.Group>

                      <hr />
                      <h6>Цена для поставщика {selectedVendor?.Company_name}</h6>

                      <Form.Group className="mb-3">
                        <Form.Label>Цена поставщика</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProductVendorPrice.vendor_price}
                          onChange={(e) => setNewProductVendorPrice({...newProductVendorPrice, vendor_price: e.target.value})}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Валюта</Form.Label>
                        <Form.Select
                          value={newProductVendorPrice.currency}
                          onChange={(e) => setNewProductVendorPrice({...newProductVendorPrice, currency: e.target.value})}
                        >
                          <option value="RUB">RUB</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Срок доставки (дней)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={newProductVendorPrice.delivery_days}
                          onChange={(e) => setNewProductVendorPrice({...newProductVendorPrice, delivery_days: e.target.value})}
                        />
                      </Form.Group>

                      <Button variant="success" type="submit">
                        Создать товар и добавить поставщику
                      </Button>
                    </Form>
                  )}
                </Col>

                <Col md={7}>
                  <h5>Товары поставщика</h5>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Артикул</th>
                        <th>Товар</th>
                        <th>Цена</th>
                        <th>Валюта</th>
                        <th>Срок доставки</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorProducts.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.product_article}</td>
                          <td>{item.product_name}</td>
                          <td>{formatPrice(item.vendor_price)}</td>
                          <td>{item.currency}</td>
                          <td>{item.delivery_days} дн.</td>
                          <td>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => deleteVendorProduct(item.id)}
                            >
                              Удалить
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {vendorProducts.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center">
                            Нет добавленных товаров
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default VendorsPage;