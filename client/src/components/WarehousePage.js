import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  InputGroup, 
  Badge,
  Row,
  Col,
  Card,
  Spinner,
  Dropdown,
  Tabs,
  Tab,
  Alert
} from 'react-bootstrap';

function WarehousePage({ setError }) {
  // Состояния для данных
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Состояния для модальных окон
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Состояния для договоров и документов
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractProducts, setContractProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('contracts');
  
  // Состояния для приёмки
  const [receiptStep, setReceiptStep] = useState(1); // 1: выбор договора, 2: приёмка
  const [receivedItems, setReceivedItems] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptDocument, setReceiptDocument] = useState(null);
  
  // Состояния для сортировки
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  // Состояния для фильтров
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  // Состояния для формы добавления/редактирования
  const [formData, setFormData] = useState({
    article: '',
    name: '',
    description: '',
    category: '',
    unit: 'шт',
    min_stock: 10,
    current_stock: 0,
    price: 0,
    location: ''
  });

  // Состояние для формы движения товара
  const [stockMovement, setStockMovement] = useState({
    type: 'income',
    quantity: 1,
    reason: '',
    document: ''
  });

  const categories = ['Все', 'Ткани', 'Фурнитура', 'Нитки', 'Упаковка', 'Готовая продукция'];

  // Загрузка данных
  useEffect(() => {
    fetchProducts();
    fetchContracts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, stockFilter, sortConfig]);

  const fetchProducts = async () => {
  setLoading(true);
  const token = localStorage.getItem('token');
  try {
    // Загружаем товары
    const productsResponse = await fetch('http://localhost:8080/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!productsResponse.ok) throw new Error('Failed to fetch products');
    const productsData = await productsResponse.json();
    
    // Загружаем остатки со склада
    const storageResponse = await fetch('http://localhost:8080/api/storage', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!storageResponse.ok) {
      console.error('Storage response error:', await storageResponse.text());
      throw new Error('Failed to fetch storage');
    }
    const storageData = await storageResponse.json();
    
    
    // Создаем мапу для быстрого доступа к остаткам
    const storageMap = {};
    if (storageData.storage && Array.isArray(storageData.storage)) {
      storageData.storage.forEach(item => {
        // Проверяем, какое имя поля приходит от сервера
        const productId = item.product_id || item.Product_id || item.ID;
        if (productId) {
          storageMap[productId] = item.quantity || item.Quantity || 0;
        }
      });
    }
    
    
    // Объединяем данные
    const productsWithStock = (productsData.products || []).map(p => ({
      ...p,
      ID: p.ID,
      Article: p.Article,
      Name: p.Name,
      Description: p.Description,
      Category: p.Category,
      Unit: p.Unit,
      min_stock: p.Min_stock || 0,
      current_stock: storageMap[p.ID] || 0, // Берем из storage
      price: p.price || 0,
      location: p.location || 'Не указано'
    }));
    setProducts(productsWithStock);
  } catch (error) {
    console.error('Error fetching data:', error);
    setError('Ошибка загрузки данных склада: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const fetchContracts = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      
      // Фильтруем только договоры (doc_type = 'Договор')
      const contractsList = (data.documents || []).filter(doc => doc.Doc_type === 'Договор' && doc.Status !== 'Завершён');
      setContracts(contractsList);
    } catch (error) {
      console.error('Ошибка загрузки договоров:', error);
    }
  };

  const fetchDocumentProducts = async (documentId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`http://localhost:8080/api/document-products/${documentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch document products');
    const data = await response.json();
    
    // Преобразуем данные для отображения
    // Все данные о продукте (name, sku, unit) уже приходят из JOIN запроса
    const products = (data.items || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_article: item.product_article,
      vendor_price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      expected_quantity: item.quantity, // По умолчанию ожидаем столько, сколько в договоре
      received_quantity: 0
    }));
    
    return products;
  } catch (error) {
    setError('Ошибка загрузки товаров документа');
    return [];
  }
};

  const fetchContractProducts = async (vendorId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/vendor-products/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch vendor products');
      const data = await response.json();

      
      // Преобразуем данные для отображения
      const products = (data.vendorProducts || []).map(vp => ({
        id: vp.id,
        product_id: vp.product_id,
        product_name: vp.product_name,
        product_article: vp.product_article,
        vendor_price: vp.vendor_price,
        currency: vp.currency,
        delivery_days: vp.delivery_days,
        expected_quantity: 0,
        received_quantity: 0,
        unit: 'шт'
      }));

      
      setContractProducts(products);
    } catch (error) {
      setError('Ошибка загрузки товаров договора');
    }
  };

  const filterAndSortProducts = () => {
    let result = [...products];
    
    if (searchTerm) {
      result = result.filter(product => 
        product.Article?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.Category === categoryFilter);
    }
    
    if (stockFilter === 'low') {
      result = result.filter(product => product.current_stock <= product.min_stock);
    } else if (stockFilter === 'out') {
      result = result.filter(product => product.current_stock === 0);
    }
    
    result.sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredProducts(result);
  };

const handleSelectContract = async (contract) => {
  setSelectedContract(contract);
  
  // Загружаем товары из document_items
  const products = await fetchDocumentProducts(contract.ID);
  setContractProducts(products);
  
  setActiveTab('products');
};

  const handleStartReceipt = () => {
    if (!selectedContract) return;
    
    // Инициализируем список принимаемых товаров
    const initialItems = contractProducts.map(cp => ({
      ...cp,
      expected_quantity: cp.expected_quantity || 0,
      received_quantity: 0,
      status: 'pending'
    }));
    
    setReceivedItems(initialItems);
    setReceiptStep(2);
  };

  const handleQuantityChange = (index, field, value) => {
    const updated = [...receivedItems];
    updated[index][field] = parseFloat(value) || 0;
    
    // Проверяем на расхождения
    if (updated[index].expected_quantity !== updated[index].received_quantity) {
      if (!discrepancies.find(d => d.index === index)) {
        setDiscrepancies([...discrepancies, { 
          index, 
          productName: updated[index].product_name 
        }]);
      }
    } else {
      setDiscrepancies(discrepancies.filter(d => d.index !== index));
    }
    
    setReceivedItems(updated);
  };

 const handleCompleteReceipt = async () => {
  const token = localStorage.getItem('token');
  
  try {
    setLoading(true);
    
    // 1. Создаём документ прихода
    const receiptDoc = {
      doc_number: `PR-${Date.now()}`,
      doc_type: 'Приход',
      vendor_id: selectedContract.Vendor_id,
      status: discrepancies.length > 0 ? 'Расхождение' : 'Завершён',
      total_amount: calculateTotalAmount(),
      description: `Приход товаров по договору ${selectedContract.Doc_number}\n${receiptNotes}`
    };

    const docResponse = await fetch('http://localhost:8080/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(receiptDoc)
    });

    if (!docResponse.ok) {
      const errorData = await docResponse.json();
      throw new Error(errorData.error || 'Failed to create receipt document');
    }
    
    const docResult = await docResponse.json();
    setReceiptDocument(docResult);

    // 2. Подготавливаем данные для массового обновления склада
    const itemsToUpdate = receivedItems.filter(item => item.received_quantity > 0);
    
    if (itemsToUpdate.length > 0) {
      const bulkUpdateData = {
        items: itemsToUpdate.map(item => ({
          product_id: item.product_id,
          quantity: item.received_quantity,
          price: item.vendor_price || 0
        })),
        document_id: docResult.id,
        document_type: 'Приход',
        vendor_id: selectedContract.Vendor_id
      };

      // 3. Обновляем остатки на складе (mass update)
      const storageResponse = await fetch('http://localhost:8080/api/storage/bulk-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkUpdateData)
      });

      if (!storageResponse.ok) {
        const errorText = await storageResponse.text();
        console.error('Storage update error:', errorText);
        let errorMessage = 'Failed to update storage';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignore parsing error
        }
        throw new Error(errorMessage);
      }

      const storageResult = await storageResponse.json();
    }

    // 4. Если есть расхождения, обновляем статус договора
    if (discrepancies.length > 0) {
      await fetch(`http://localhost:8080/api/documents/${selectedContract.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc_number: selectedContract.Doc_number,
          doc_type: selectedContract.Doc_type,
          vendor_id: selectedContract.Vendor_id,
          status: 'Частично исполнен',
          total_amount: selectedContract.Total_amount,
          description: `${selectedContract.Description}\n\nОбнаружены расхождения при приёмке: ${discrepancies.map(d => d.productName).join(', ')}`
        })
      });
    } else {
      await fetch(`http://localhost:8080/api/documents/${selectedContract.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc_number: selectedContract.Doc_number,
          doc_type: selectedContract.Doc_type,
          vendor_id: selectedContract.Vendor_id,
          status: 'Исполнен',
          total_amount: selectedContract.Total_amount,
          description: selectedContract.Description
        })
      });
    }

    // 5. Обновляем данные на странице
    await fetchProducts();
    await fetchContracts();
    
    alert(`Приёмка завершена. Создан документ: ${receiptDoc.doc_number}`);
    handleCloseReceiveModal();
    
  } catch (error) {
    console.error('Receipt error:', error);
    setError('Ошибка при оформлении приёмки: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const handleCloseReceiveModal = () => {
    setShowReceiveModal(false);
    setReceiptStep(1);
    setSelectedContract(null);
    setContractProducts([]);
    setReceivedItems([]);
    setDiscrepancies([]);
    setReceiptNotes('');
    setReceiptDocument(null);
    setActiveTab('contracts');
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStockMovementChange = (e) => {
    const { name, value } = e.target;
    setStockMovement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      
      const productData = {
        article: formData.article,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        category: formData.category,
        min_stock: formData.min_stock
      };

      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      await fetchProducts();
      setShowAddModal(false);
      resetForm();
      
    } catch (error) {
      setError('Ошибка при добавлении товара: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      
      const productData = {
        article: formData.article,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        category: formData.category,
        min_stock: formData.min_stock
      };

      const response = await fetch(`http://localhost:8080/api/products/${selectedProduct.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      await fetchProducts();
      setShowEditModal(false);
      
    } catch (error) {
      setError('Ошибка при обновлении товара: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/products/${selectedProduct.ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete product');

      await fetchProducts();
      setShowDeleteModal(false);
    } catch (error) {
      setError('Ошибка при удалении товара');
    }
  };

const handleStockMovement = async () => {
  const token = localStorage.getItem('token');
  try {
    setLoading(true);
    
    // Создаём документ движения
    const movementDoc = {
      doc_number: `MOV-${Date.now()}`,
      doc_type: stockMovement.type === 'income' ? 'Приход' : 'Расход',
      vendor_id: 0,
      status: 'Завершён',
      total_amount: stockMovement.quantity * (selectedProduct.price || 0),
      description: `${stockMovement.type === 'income' ? 'Приход' : 'Расход'}: ${stockMovement.quantity} ${selectedProduct.Unit}. ${stockMovement.reason}`
    };

    const docResponse = await fetch('http://localhost:8080/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(movementDoc)
    });

    if (!docResponse.ok) {
      const errorData = await docResponse.json();
      throw new Error(errorData.error || 'Failed to create movement document');
    }

    const docResult = await docResponse.json();

    // Обновляем остаток на складе
    const storageUpdateData = {
      product_id: selectedProduct.ID,
      quantity: stockMovement.quantity,
      operation: stockMovement.type,
      document_id: docResult.id,
      document_type: stockMovement.type === 'income' ? 'Приход' : 'Расход'
    };

    const storageResponse = await fetch('http://localhost:8080/api/storage/update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(storageUpdateData)
    });

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text();
      console.error('Storage update error:', errorText);
      let errorMessage = 'Failed to update storage';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Ignore parsing error
      }
      throw new Error(errorMessage);
    }

    await fetchProducts();
    setShowStockModal(false);
    
  } catch (error) {
    console.error('Stock movement error:', error);
    setError('Ошибка при движении товара: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      article: '',
      name: '',
      description: '',
      category: '',
      unit: 'шт',
      min_stock: 10,
      current_stock: 0,
      price: 0,
      location: ''
    });
  };

  const calculateTotalAmount = () => {
    return receivedItems.reduce((sum, item) => sum + (item.received_quantity * (item.vendor_price || 0)), 0);
  };

  const getStockStatus = (current, min) => {
    if (current === 0) return { variant: 'danger', text: 'Нет в наличии' };
    if (current <= min) return { variant: 'warning', text: 'Мало' };
    return { variant: 'success', text: 'В наличии' };
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Загрузка данных склада...</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <Row className="mb-3">
        <Col>
          <h4>Склад</h4>
        </Col>
        <Col className="text-end">
          <Button 
            variant="primary" 
            onClick={() => setShowReceiveModal(true)}
            className="me-2"
          >
            📦 Приёмка товара
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={3}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <h6>Всего товаров</h6>
              <h3>{products.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <h6>Товаров с низким запасом</h6>
              <h3 className="text-warning">
                {products.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0).length}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <h6>Нет в наличии</h6>
              <h3 className="text-danger">
                {products.filter(p => p.current_stock === 0).length}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg="light" className="text-center">
            <Card.Body>
              <h6>Общая стоимость</h6>
              <h3>
                {formatNumber(products.reduce((sum, p) => sum + (p.current_stock * p.price), 0))} ₽
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  placeholder="Поиск по артикулу, названию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Все категории</option>
                {categories.filter(c => c !== 'Все').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">Все остатки</option>
                <option value="low">Низкий запас</option>
                <option value="out">Нет в наличии</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic" className="w-100">
                  ↕️ Сортировка
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleSort('Name')}>По названию</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSort('Category')}>По категории</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSort('current_stock')}>По количеству</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSort('price')}>По цене</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Table hover responsive>
            <thead className="sticky-top bg-white">
              <tr>
                <th>Артикул</th>
                <th>Наименование</th>
                <th>Категория</th>
                <th className="text-center">Остаток</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const status = getStockStatus(product.current_stock, product.min_stock);
                return (
                  <tr key={product.ID} className={product.current_stock <= product.min_stock ? 'table-warning' : ''}>
                    <td><strong>{product.Article}</strong></td>
                    <td>{product.Name}</td>
                    <td>{product.Category}</td>
                    <td className="text-center">
                      {formatNumber(product.current_stock)} {product.Unit}
                    </td>
                    <td>
                      <Badge bg={status.variant}>
                        {status.text}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-1"
                        onClick={() => {
                          setSelectedProduct(product);
                          setFormData({
                            article: product.Article,
                            name: product.Name,
                            description: product.Description || '',
                            category: product.Category,
                            unit: product.Unit,
                            min_stock: product.min_stock,
                            current_stock: product.current_stock,
                            price: product.price,
                            location: product.location || ''
                          });
                          setShowEditModal(true);
                        }}
                      >
                        ✏️
                      </Button>
                      <Button 
                        variant="outline-warning" 
                        size="sm" 
                        className="me-1"
                        onClick={() => {
                          setSelectedProduct(product);
                          setStockMovement({
                            type: 'income',
                            quantity: 1,
                            reason: '',
                            document: ''
                          });
                          setShowStockModal(true);
                        }}
                      >
                        ↕️
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDeleteModal(true);
                        }}
                      >
                        🗑️
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="text-center p-3 text-muted">
              Товары не найдены
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Модальное окно приёмки товара */}
<Modal show={showReceiveModal} onHide={handleCloseReceiveModal} size="xl">
  <Modal.Header closeButton>
    <Modal.Title>
      {receiptStep === 1 && 'Выбор договора для приёмки'}
      {receiptStep === 2 && 'Приёмка товара по договору'}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {receiptStep === 1 && (
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => {
          setActiveTab(k);
          // Если переключились на вкладку продуктов, но договор не выбран
          if (k === 'products' && !selectedContract) {
            // Можно показать подсказку или ничего не делать
          }
        }}
        className="mb-3"
      >
        <Tab eventKey="contracts" title="Активные договоры">
          {contracts.length === 0 ? (
            <Alert variant="info">
              Нет активных договоров. Создайте договор на странице "Закл. договоров".
            </Alert>
          ) : (
            <Table striped hover>
              <thead>
                <tr>
                  <th>№ договора</th>
                  <th>Поставщик</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(contract => (
                  <tr key={contract.ID}>
                    <td><strong>{contract.Doc_number}</strong></td>
                    <td>{contract.vendor_name}</td>
                    <td>{new Date(contract.Created_at).toLocaleDateString()}</td>
                    <td>{formatNumber(contract.Total_amount)} ₽</td>
                    <td>
                      <Badge bg={contract.Status === 'Черновик' ? 'secondary' : 'success'}>
                        {contract.Status}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => {
                          handleSelectContract(contract);
                          setActiveTab('products'); // Автоматически переключаем на вкладку с товарами
                        }}
                      >
                        Выбрать
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
        
        <Tab eventKey="products" title="Товары договора" disabled={!selectedContract}>
          {selectedContract ? (
            <div>
              <Alert variant="success" className="mb-3">
                <Row>
                  <Col>
                    <strong>Договор:</strong> {selectedContract.Doc_number}
                  </Col>
                  <Col>
                    <strong>Поставщик:</strong> {selectedContract.vendor_name}
                  </Col>
                  <Col>
                    <strong>Статус:</strong>{' '}
                    <Badge bg={selectedContract.Status === 'Черновик' ? 'secondary' : 'success'}>
                      {selectedContract.Status}
                    </Badge>
                  </Col>
                </Row>
              </Alert>
              
              {contractProducts.length === 0 ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                  <span>Загрузка товаров договора...</span>
                </div>
              ) : (
                <>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Товар</th>
                        <th>Артикул</th>
                        <th className="text-center">Цена</th>
                        <th className="text-center">Дата доставки</th>
                        <th className="text-center">Валюта</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractProducts.map((product, idx) => (
                        <tr key={product.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{product.product_name}</td>
                          <td>{product.product_article}</td>
                          <td className="text-center">{formatNumber(product.vendor_price)}</td>
                          <td className="text-center">{selectedContract.Doc_date}</td>
                          <td className="text-center">{selectedContract.Currency}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Всего позиций:</strong></td>
                        <td colSpan="3"><strong>{contractProducts.length}</strong></td>
                      </tr>
                    </tfoot>
                  </Table>
                  
                  <div className="d-flex justify-content-between mt-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveTab('contracts')}
                    >
                      ← К списку договоров
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={handleStartReceipt}
                      size="lg"
                    >
                      Начать приёмку товаров →
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Alert variant="warning">
              <Alert.Heading>Договор не выбран</Alert.Heading>
              <p>
                Пожалуйста, перейдите на вкладку "Активные договоры" и выберите договор, 
                по которому будет производиться приёмка товаров.
              </p>
              <Button 
                variant="warning" 
                onClick={() => setActiveTab('contracts')}
              >
                Перейти к выбору договора
              </Button>
            </Alert>
          )}
        </Tab>
      </Tabs>
    )}
          {receiptStep === 2 && selectedContract && (
            <div>
              <Alert variant="info">
                <Row>
                  <Col>
                    <strong>Договор:</strong> {selectedContract.Doc_number}
                  </Col>
                  <Col>
                    <strong>Поставщик:</strong> {selectedContract.vendor_name}
                  </Col>
                  <Col>
                    <strong>Дата:</strong> {new Date(selectedContract.Doc_date).toLocaleDateString()}
                  </Col>
                </Row>
              </Alert>
              
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Артикул</th>
                    <th className="text-center">Ожидаемое кол-во</th>
                    <th className="text-center">Фактическое кол-во</th>
                    <th className="text-center">Ед. изм.</th>
                    <th className="text-end">Цена</th>
                    <th className="text-end">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedItems.map((item, index) => (
                    <tr key={index} className={item.expected_quantity !== item.received_quantity ? 'table-warning' : ''}>
                      <td>{item.product_name}</td>
                      <td>{item.product_article}</td>
                      <td className="text-center">
                        <Form.Control
                          type="number"
                          value={item.expected_quantity}
                          onChange={(e) => handleQuantityChange(index, 'expected_quantity', e.target.value)}
                          style={{ width: '100px', margin: '0 auto' }}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="text-center">
                        <Form.Control
                          type="number"
                          value={item.received_quantity}
                          onChange={(e) => handleQuantityChange(index, 'received_quantity', e.target.value)}
                          style={{ width: '100px', margin: '0 auto' }}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="text-center">{item.unit}</td>
                      <td className="text-end">{formatNumber(item.vendor_price)} ₽</td>
                      <td className="text-end">{formatNumber(item.received_quantity * item.vendor_price)} ₽</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="text-end"><strong>Итого:</strong></td>
                    <td className="text-end"><strong>{formatNumber(calculateTotalAmount())} ₽</strong></td>
                  </tr>
                </tfoot>
              </Table>

              <Form.Group className="mb-3">
                <Form.Label>Примечания к приёмке</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Дополнительная информация о приёмке..."
                />
              </Form.Group>

              {discrepancies.length > 0 && (
                <Alert variant="warning">
                  <strong>Обнаружены расхождения:</strong>
                  <ul className="mb-0 mt-2">
                    {discrepancies.map((d, i) => (
                      <li key={i}>{d.productName}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {receiptStep === 2 && (
            <Button variant="secondary" onClick={() => setReceiptStep(1)}>
              Назад к договорам
            </Button>
          )}
          <Button variant="secondary" onClick={handleCloseReceiveModal}>
            Закрыть
          </Button>
          {receiptStep === 1 && (
            <Button 
              variant="primary" 
              onClick={handleStartReceipt} 
              disabled={!selectedContract}
            >
              Начать приёмку
            </Button>
          )}
          {receiptStep === 2 && (
            <Button 
              variant="success" 
              onClick={handleCompleteReceipt}
              disabled={loading}
            >
              {loading ? 'Обработка...' : 'Завершить приёмку'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Модальное окно добавления товара */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Добавление товара</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Артикул</Form.Label>
                  <Form.Control
                    type="text"
                    name="article"
                    value={formData.article}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Наименование</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Категория</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.filter(c => c !== 'Все').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Единица измерения</Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    <option value="шт">шт</option>
                    <option value="м">м</option>
                    <option value="кг">кг</option>
                    <option value="уп">уп</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Цена (₽)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Текущий остаток</Form.Label>
                  <Form.Control
                    type="number"
                    name="current_stock"
                    value={formData.current_stock}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Минимальный запас</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Расположение</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="A-01-01"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleAddProduct} disabled={loading}>
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно редактирования товара */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Редактирование товара</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Артикул</Form.Label>
                  <Form.Control
                    type="text"
                    name="article"
                    value={formData.article}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Наименование</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Категория</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.filter(c => c !== 'Все').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Единица измерения</Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    <option value="шт">шт</option>
                    <option value="м">м</option>
                    <option value="кг">кг</option>
                    <option value="уп">уп</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Цена (₽)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Текущий остаток</Form.Label>
                  <Form.Control
                    type="number"
                    name="current_stock"
                    value={formData.current_stock}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Минимальный запас</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Расположение</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="A-01-01"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleEditProduct} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно движения товара */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Движение товара</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="mb-3">
              <strong>Товар:</strong> {selectedProduct.Name} ({selectedProduct.Article})
              <br />
              <strong>Текущий остаток:</strong> {selectedProduct.current_stock} {selectedProduct.Unit}
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Тип операции</Form.Label>
              <Form.Select
                name="type"
                value={stockMovement.type}
                onChange={handleStockMovementChange}
              >
                <option value="income">Приход</option>
                <option value="outcome">Расход</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Количество</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={stockMovement.quantity}
                onChange={handleStockMovementChange}
                min="0.01"
                step="0.01"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Основание</Form.Label>
              <Form.Control
                type="text"
                name="reason"
                value={stockMovement.reason}
                onChange={handleStockMovementChange}
                placeholder="Номер документа, причина..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleStockMovement} disabled={loading}>
            {loading ? 'Обработка...' : 'Провести'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно удаления */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение удаления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ⚠️ Вы действительно хотите удалить товар "{selectedProduct?.Name}"?
          <br />
          <small className="text-muted">Это действие нельзя отменить.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDeleteProduct}>
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default WarehousePage;