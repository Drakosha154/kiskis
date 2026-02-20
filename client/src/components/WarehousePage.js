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
  Dropdown
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        setTimeout(() => {
          const mockProducts = [
            {
              id: 1,
              article: 'FAB-001',
              name: 'Хлопковая ткань',
              description: '100% хлопок, ширина 150см',
              category: 'Ткани',
              unit: 'м',
              min_stock: 50,
              current_stock: 125.5,
              price: 450.00,
              location: 'A-01-02',
              last_updated: '2024-01-15'
            },
            {
              id: 2,
              article: 'FAB-002',
              name: 'Льняная ткань',
              description: 'Натуральный лен, ширина 140см',
              category: 'Ткани',
              unit: 'м',
              min_stock: 40,
              current_stock: 32.0,
              price: 680.00,
              location: 'A-01-03',
              last_updated: '2024-01-14'
            },
            {
              id: 3,
              article: 'ACC-001',
              name: 'Пуговицы пластиковые',
              description: 'Черные, диаметр 15мм',
              category: 'Фурнитура',
              unit: 'шт',
              min_stock: 500,
              current_stock: 1250,
              price: 2.50,
              location: 'B-02-01',
              last_updated: '2024-01-13'
            },
            {
              id: 4,
              article: 'ACC-002',
              name: 'Молния тракторная',
              description: 'Длина 60см, черная',
              category: 'Фурнитура',
              unit: 'шт',
              min_stock: 200,
              current_stock: 85,
              price: 45.00,
              location: 'B-02-04',
              last_updated: '2024-01-12'
            },
            {
              id: 5,
              article: 'THR-001',
              name: 'Нитки полиэстер',
              description: 'Катушка 1000м, белые',
              category: 'Нитки',
              unit: 'шт',
              min_stock: 100,
              current_stock: 230,
              price: 35.00,
              location: 'C-01-01',
              last_updated: '2024-01-15'
            }
          ];
          setProducts(mockProducts);
          setFilteredProducts(mockProducts);
          setLoading(false);
        }, 500);
      } catch (error) {
        setError('Ошибка загрузки данных склада');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [setError]);

  useEffect(() => {
    let result = [...products];
    
    if (searchTerm) {
      result = result.filter(product => 
        product.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    if (stockFilter === 'low') {
      result = result.filter(product => product.current_stock <= product.min_stock);
    } else if (stockFilter === 'out') {
      result = result.filter(product => product.current_stock === 0);
    }
    
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter, stockFilter, sortConfig]);

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
    try {
      console.log('Adding product:', formData);
      setShowAddModal(false);
    } catch (error) {
      setError('Ошибка при добавлении товара');
    }
  };

  const handleEditProduct = async () => {
    try {
      console.log('Editing product:', selectedProduct.id, formData);
      setShowEditModal(false);
    } catch (error) {
      setError('Ошибка при обновлении товара');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      console.log('Deleting product:', selectedProduct.id);
      setShowDeleteModal(false);
    } catch (error) {
      setError('Ошибка при удалении товара');
    }
  };

  const handleStockMovement = async () => {
    try {
      console.log('Stock movement:', {
        productId: selectedProduct.id,
        ...stockMovement
      });
      setShowStockModal(false);
    } catch (error) {
      setError('Ошибка при движении товара');
    }
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
            variant="success" 
            onClick={() => setShowAddModal(true)}
            className="me-2"
          >
            + Добавить товар
          </Button>
          <Button variant="secondary">
            Отчет
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
                <InputGroup.Text>
                  🔍
                </InputGroup.Text>
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
                  <Dropdown.Item onClick={() => handleSort('name')}>По названию</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSort('category')}>По категории</Dropdown.Item>
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
                <th className="text-center">Мин. запас</th>
                <th className="text-end">Цена</th>
                <th className="text-end">Сумма</th>
                <th>Расположение</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const status = getStockStatus(product.current_stock, product.min_stock);
                return (
                  <tr key={product.id} className={product.current_stock <= product.min_stock ? 'table-warning' : ''}>
                    <td><strong>{product.article}</strong></td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td className="text-center">
                      {formatNumber(product.current_stock)} {product.unit}
                    </td>
                    <td className="text-center">
                      {product.min_stock} {product.unit}
                    </td>
                    <td className="text-end">{formatNumber(product.price)} ₽</td>
                    <td className="text-end">
                      {formatNumber(product.current_stock * product.price)} ₽
                    </td>
                    <td>{product.location}</td>
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
                          setFormData(product);
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
          <Button variant="primary" onClick={handleAddProduct}>
            Добавить
          </Button>
        </Modal.Footer>
      </Modal>

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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleEditProduct}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Движение товара</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <div className="mb-3">
              <strong>Товар:</strong> {selectedProduct.name} ({selectedProduct.article})
              <br />
              <strong>Текущий остаток:</strong> {selectedProduct.current_stock} {selectedProduct.unit}
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
                <option value="write-off">Списание</option>
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
              <Form.Label>Причина/Основание</Form.Label>
              <Form.Control
                type="text"
                name="reason"
                value={stockMovement.reason}
                onChange={handleStockMovementChange}
                placeholder="Номер документа, причина..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Документ</Form.Label>
              <Form.Control
                type="text"
                name="document"
                value={stockMovement.document}
                onChange={handleStockMovementChange}
                placeholder="Номер накладной/акта"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleStockMovement}>
            Провести
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение удаления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ⚠️ Вы действительно хотите удалить товар "{selectedProduct?.name}"?
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