import React, { useState, useEffect } from 'react';
import { Button, Table, Form, Modal, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function NewContractPage({ setError }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [contractItems, setContractItems] = useState([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [contractData, setContractData] = useState({
    doc_number: 'ДОГ-' + Date.now(),
    description: '',
    delivery_date: '',
    payment_terms: 'prepaid',
    delivery_address: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchVendors();
    fetchVendorProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      console.log(data)
      setProducts(data.products || []);
    } catch (err) {
      setError('Ошибка загрузки товаров: ' + err.message);
    }
  };

  const fetchVendors = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (err) {
      setError('Ошибка загрузки поставщиков: ' + err.message);
    }
  };

  const fetchVendorProducts = async () => {
    // Здесь должен быть эндпоинт для получения товаров поставщиков
    // Пока заглушка
    setVendorProducts([
      { id: 1, vendor_id: 1, product_id: 1, price: 100, min_order: 10, available: 1000 },
      { id: 2, vendor_id: 2, product_id: 1, price: 95, min_order: 20, available: 500 },
      { id: 3, vendor_id: 3, product_id: 1, price: 110, min_order: 5, available: 200 },
      { id: 4, vendor_id: 1, product_id: 2, price: 200, min_order: 5, available: 200 },
      { id: 5, vendor_id: 2, product_id: 2, price: 190, min_order: 10, available: 300 },
      { id: 6, vendor_id: 3, product_id: 2, price: 210, min_order: 15, available: 150 },
      { id: 7, vendor_id: 1, product_id: 3, price: 500, min_order: 2, available: 50 },
      { id: 8, vendor_id: 2, product_id: 3, price: 480, min_order: 3, available: 40 },
    ]);
  };

  const addProductToContract = (productId) => {
    const product = products.find(p => p.ID === parseInt(productId));
    if (!product) return;

    // Создаем временный ID для элемента в списке
    const tempId = Date.now() + Math.random();
    
    setContractItems([
      ...contractItems,
      {
        tempId: tempId, // Используем временный ID для идентификации в списке
        product_id: product.ID,
        product_name: product.Name,
        sku: product.Article,
        unit: product.Unit,
        required_quantity: 0,
        vendors: [],
        total_allocated: 0
      }
    ]);
  };

  const updateProductQuantity = (tempId, quantity) => {
    setContractItems(contractItems.map(item => {
      if (item.tempId === tempId) {
        const newQuantity = parseInt(quantity) || 0;
        return { 
          ...item, 
          required_quantity: newQuantity,
          total_allocated: item.vendors.reduce((sum, v) => sum + v.quantity, 0)
        };
      }
      return item;
    }));
  };

  const removeProduct = (tempId) => {
    setContractItems(contractItems.filter(item => item.tempId !== tempId));
  };

  const openVendorSelection = (index) => {
    const item = contractItems[index];
    if (item.required_quantity <= 0) {
      alert('Укажите необходимое количество товара');
      return;
    }
    setCurrentItemIndex(index);
    setShowVendorModal(true);
  };

  const updateVendorsForItem = (tempId, selectedVendors) => {
    setContractItems(contractItems.map(item => {
      if (item.tempId === tempId) {
        const totalAllocated = selectedVendors.reduce((sum, v) => sum + v.quantity, 0);
        return {
          ...item,
          vendors: selectedVendors,
          total_allocated: totalAllocated
        };
      }
      return item;
    }));
    setShowVendorModal(false);
  };

  const calculateItemTotal = (item) => {
    return item.vendors.reduce((sum, v) => sum + (v.quantity * v.price), 0);
  };

  const calculateGrandTotal = () => {
    return contractItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const getAvailableVendorsForProduct = (productId) => {
    return vendorProducts
      .filter(vp => vp.product_id === productId)
      .map(vp => ({
        ...vp,
        vendor_name: vendors.find(v => v.id === vp.vendor_id)?.name || 'Неизвестный поставщик',
        vendor_rating: vendors.find(v => v.id === vp.vendor_id)?.rating || 0
      }));
  };

  const handleSubmit = async () => {
    // Проверка заполненности
    for (const item of contractItems) {
      if (item.total_allocated < item.required_quantity) {
        alert(`Товар "${item.product_name}" распределен не полностью (${item.total_allocated} из ${item.required_quantity})`);
        return;
      }
    }

    const token = localStorage.getItem('token');
    
    // Создаем документ
    const documentData = {
      doc_number: contractData.doc_number,
      doc_type: 'purchase_contract',
      supplier_id: 0, // 0 означает несколько поставщиков
      status: 'draft',
      total_amount: calculateGrandTotal(),
      description: `Доставка: ${contractData.delivery_address}\nУсловия оплаты: ${getPaymentTermsText(contractData.payment_terms)}\n${contractData.description}`,
    };

    try {
      const docResponse = await fetch('http://localhost:8080/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(documentData)
      });

      if (!docResponse.ok) throw new Error('Failed to create document');
      
      const docResult = await docResponse.json();
      
      // Здесь можно сохранить детали распределения по поставщикам
      // в отдельную таблицу или как JSON поле в документе
      
      alert('Договор успешно создан');
      navigate('/contracts');
    } catch (err) {
      setError('Ошибка создания договора: ' + err.message);
    }
  };

  const getPaymentTermsText = (term) => {
    const terms = {
      'prepaid': '100% предоплата',
      'partial': 'Частичная предоплата',
      'postpaid': 'Оплата после поставки'
    };
    return terms[term] || term;
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Оформление нового договора</h4>
        <div>
          <Button variant="secondary" onClick={() => navigate('/contracts')} className="me-2">
            Отмена
          </Button>
          <Button 
            variant="success" 
            onClick={handleSubmit}
            disabled={contractItems.length === 0}
          >
            Создать договор
          </Button>
        </div>
      </div>

      <Row>
        <Col md={8}>
          {/* Список товаров */}
          <Card className="mb-3">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>Товары в договоре</span>
                <Form.Select 
                  style={{ width: '300px' }}
                  onChange={(e) => addProductToContract(e.target.value)}
                  value=""
                >
                  <option value="">+ Добавить товар</option>
                  {products.map(product => (
                    <option key={product.ID} value={product.ID}>
                      {product.Name} ({product.Article})
                    </option>
                  ))}
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body>
              {contractItems.length === 0 ? (
                <Alert variant="info">
                  Добавьте товары в договор. Для каждого товара можно выбрать одного или нескольких поставщиков.
                </Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Артикул</th>
                      <th>Требуется</th>
                      <th>Распределено</th>
                      <th>Поставщики</th>
                      <th>Сумма</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractItems.map((item, index) => (
                      <tr key={item.tempId}>
                        <td>{item.product_name}</td>
                        <td>{item.sku}</td>
                        <td>
                          <Form.Control
                            type="number"
                            value={item.required_quantity}
                            onChange={(e) => updateProductQuantity(item.tempId, e.target.value)}
                            min="0"
                            style={{ width: '100px' }}
                          />
                        </td>
                        <td>
                          <Badge 
                            bg={item.total_allocated >= item.required_quantity ? 'success' : 'warning'}
                          >
                            {item.total_allocated} {item.unit}
                          </Badge>
                        </td>
                        <td>
                          {item.vendors.length > 0 ? (
                            <div>
                              {item.vendors.map((v, i) => (
                                <div key={i} className="mb-1">
                                  <Badge bg="info" className="me-1">
                                    {v.vendor_name}: {v.quantity} {item.unit} × {v.price}₽
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Badge bg="secondary">Не выбраны</Badge>
                          )}
                        </td>
                        <td>{calculateItemTotal(item)} ₽</td>
                        <td>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => openVendorSelection(index)}
                            className="me-2"
                          >
                            Выбрать поставщиков
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => removeProduct(item.tempId)}
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" className="text-end"><strong>ИТОГО:</strong></td>
                      <td><strong>{calculateGrandTotal()} ₽</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Детали договора */}
          <Card>
            <Card.Header>Детали договора</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Номер договора</Form.Label>
                  <Form.Control
                    type="text"
                    value={contractData.doc_number}
                    onChange={(e) => setContractData({...contractData, doc_number: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Дата поставки</Form.Label>
                  <Form.Control
                    type="date"
                    value={contractData.delivery_date}
                    onChange={(e) => setContractData({...contractData, delivery_date: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Адрес доставки</Form.Label>
                  <Form.Control
                    type="text"
                    value={contractData.delivery_address}
                    onChange={(e) => setContractData({...contractData, delivery_address: e.target.value})}
                    placeholder="Введите адрес доставки"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Условия оплаты</Form.Label>
                  <Form.Select
                    value={contractData.payment_terms}
                    onChange={(e) => setContractData({...contractData, payment_terms: e.target.value})}
                  >
                    <option value="prepaid">100% предоплата</option>
                    <option value="partial">Частичная предоплата (50%)</option>
                    <option value="postpaid">Оплата после поставки</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Примечания</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={contractData.description}
                    onChange={(e) => setContractData({...contractData, description: e.target.value})}
                    placeholder="Дополнительные условия..."
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно выбора поставщиков */}
      <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Выбор поставщиков для товара: {currentItemIndex !== null ? contractItems[currentItemIndex]?.product_name : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentItemIndex !== null && (
            <VendorSelection
              item={contractItems[currentItemIndex]}
              availableVendors={getAvailableVendorsForProduct(contractItems[currentItemIndex]?.product_id)}
              onSave={(selectedVendors) => updateVendorsForItem(contractItems[currentItemIndex].tempId, selectedVendors)}
              onCancel={() => setShowVendorModal(false)}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

// Компонент выбора поставщиков
function VendorSelection({ item, availableVendors, onSave, onCancel }) {
  const [selectedVendors, setSelectedVendors] = useState(item.vendors || []);
  const remainingQuantity = item.required_quantity - selectedVendors.reduce((sum, v) => sum + v.quantity, 0);

  const addVendor = (vendorProduct) => {
    setSelectedVendors([
      ...selectedVendors,
      {
        vendor_id: vendorProduct.vendor_id,
        vendor_name: vendorProduct.vendor_name,
        price: vendorProduct.price,
        quantity: 0,
        max_available: vendorProduct.available,
        min_order: vendorProduct.min_order
      }
    ]);
  };

  const updateVendorQuantity = (index, quantity) => {
    const newVendors = [...selectedVendors];
    newVendors[index].quantity = parseInt(quantity) || 0;
    setSelectedVendors(newVendors);
  };

  const removeVendor = (index) => {
    setSelectedVendors(selectedVendors.filter((_, i) => i !== index));
  };

  const totalSelected = selectedVendors.reduce((sum, v) => sum + v.quantity, 0);
  const isComplete = totalSelected >= item.required_quantity;

  return (
    <div>
      <Alert variant={isComplete ? 'success' : 'warning'}>
        <div className="d-flex justify-content-between">
          <span>Требуется: {item.required_quantity} {item.unit}</span>
          <span>Выбрано: {totalSelected} {item.unit}</span>
          <span>Осталось: {item.required_quantity - totalSelected} {item.unit}</span>
        </div>
      </Alert>

      {/* Доступные поставщики */}
      <Form.Select 
        className="mb-3"
        onChange={(e) => {
          const vendor = availableVendors.find(v => v.vendor_id === parseInt(e.target.value));
          if (vendor) addVendor(vendor);
        }}
        value=""
      >
        <option value="">Добавить поставщика...</option>
        
        {availableVendors.map(vendor => (
          <option key={vendor.ID} value={vendor.vendor_id}>
            {console.log(availableVendors)}
            {vendor.vendor_name} - {vendor.price}₽/ед. (в наличии: {vendor.available}, мин. заказ: {vendor.min_order})
          </option>
        ))}
      </Form.Select>

      {/* Выбранные поставщики */}
      {selectedVendors.map((vendor, index) => (
        <Card key={index} className="mb-2">
          <Card.Body>
            <Row>
              <Col md={4}>
                <strong>{vendor.vendor_name}</strong>
                <br />
                <small className="text-muted">Цена: {vendor.price}₽</small>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Количество</Form.Label>
                  <Form.Control
                    type="number"
                    value={vendor.quantity}
                    onChange={(e) => updateVendorQuantity(index, e.target.value)}
                    min={vendor.min_order}
                    max={vendor.max_available}
                  />
                  <Form.Text className="text-muted">
                    Мин: {vendor.min_order}, макс: {vendor.max_available}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <div>Сумма: {vendor.quantity * vendor.price} ₽</div>
              </Col>
              <Col md={2}>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => removeVendor(index)}
                >
                  Удалить
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}

      {selectedVendors.length === 0 && (
        <Alert variant="info">
          Выберите поставщиков из списка выше. Можно выбрать несколько поставщиков для одного товара.
        </Alert>
      )}

      <div className="d-flex justify-content-end mt-3">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          Отмена
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onSave(selectedVendors)}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}

export default NewContractPage;