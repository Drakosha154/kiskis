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

  // НОВЫЕ состояния для управления ячейками
const [warehouseLocations, setWarehouseLocations] = useState([]);
const [availableLocations, setAvailableLocations] = useState([]);
const [suggestedLocations, setSuggestedLocations] = useState({});
const [warehouseStats, setWarehouseStats] = useState(null);
const [showLocationModal, setShowLocationModal] = useState(false);
const [showWarehouseMapModal, setShowWarehouseMapModal] = useState(false);
const [maxStockWarnings, setMaxStockWarnings] = useState([]);
const [showMaxStockWarning, setShowMaxStockWarning] = useState(false);
const [pendingReceiptData, setPendingReceiptData] = useState(null);

// ДОБАВИТЬ ЭТИ СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ЯЧЕЙКАМИ:
const [showAddLocationModal, setShowAddLocationModal] = useState(false);
const [editingLocation, setEditingLocation] = useState(null);
const [newLocationData, setNewLocationData] = useState({
  rack: 'A',
  shelf: 1,
  cell: 1,
  capacity: 100
});
const [showLocationManagementModal, setShowLocationManagementModal] = useState(false); // Для исправления ошибки


  // Состояния для претензий
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({
  claim_type: 'shortage',
  amount: 0,
  items: [],
  marriage: false,    // Добавить
  deadline: false,    // Добавить
  quantity: false     // Добавить
});
  const [receiptDocumentId, setReceiptDocumentId] = useState(null);
  
  // Состояния для приёмки
  const [receiptStep, setReceiptStep] = useState(1);
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
    min_stock: 0,
    max_stock: 1,
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
    fetchWarehouseLocations();
    fetchWarehouseStats();
    fetchAvailableLocations();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, stockFilter, sortConfig]);

   const fetchWarehouseLocations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/warehouse-locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setWarehouseLocations(data.locations || []);
    } catch (error) {
      console.error('Ошибка загрузки ячеек склада:', error);
    }
  };

  const fetchAvailableLocations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/warehouse-locations/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch available locations');
      const data = await response.json();
      setAvailableLocations(data.locations || []);
    } catch (error) {
      console.error('Ошибка загрузки доступных ячеек:', error);
    }
  };

  const fetchSuggestedLocations = async (productId, quantity) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:8080/api/warehouse-locations/suggest/${productId}?quantity=${quantity}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      return data.suggested_locations || [];
    } catch (error) {
      console.error('Ошибка получения предложений размещения:', error);
      return [];
    }
  };

  const fetchWarehouseStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/warehouse-locations/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      console.log(data)
      setWarehouseStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики склада:', error);
    }
  };

  const fetchProducts = async () => {
  setLoading(true);
  try {
    const [productsRes, storageRes] = await Promise.all([
      fetch('http://localhost:8080/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }),
      fetch('http://localhost:8080/api/storage', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
    ]);

    const productsData = await productsRes.json();
    const storageData = await storageRes.json();

    // Создать карту: product_id -> storage info
    const storageMap = {};
    storageData.storage.forEach(s => {
      storageMap[s.product_id] = {
        quantity: s.quantity,
        last_receipt_date: s.last_receipt_date,
        updated_at: s.updated_at
      };
    });

    // Для каждого товара получить его локации
    const enrichedProducts = await Promise.all(
      productsData.products.map(async (p) => {
        // Получить локации товара
        let locations = [];
        try {
          const locRes = await fetch(`http://localhost:8080/api/products/${p.ID}/locations`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const locData = await locRes.json();
          locations = locData.locations || [];
        } catch (error) {
          console.error(`Ошибка загрузки локаций для товара ${p.ID}:`, error);
        }

        return {
          ...p,
          quantity: storageMap[p.ID]?.quantity || 0,
          last_receipt_date: storageMap[p.ID]?.last_receipt_date || '',
          updated_at: storageMap[p.ID]?.updated_at || '',
          locations: locations,
          location: locations.length > 0
            ? locations.map(l => `${l.location_code} (${l.quantity})`).join(', ')
            : 'Не размещено'
        };
      })
    );

    setProducts(enrichedProducts);
    setFilteredProducts(enrichedProducts);
  } catch (error) {

  }
  setLoading(false);
};

  const fetchContracts = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost:8080/api/documents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch documents');
    const data = await response.json();
    
    // Фильтруем договоры по статусу и условиям оплаты
    const contractsList = (data.documents || [])
      .filter(doc => doc.Doc_type === 'Договор' && doc.Status !== 'Завершён')
      .filter(doc => {
        // Проверяем, можно ли принимать товар по этому договору
        const paymentTerms = doc.PaymentTerms || doc.payment_terms;
        const paymentStatus = doc.PaymentStatus || doc.payment_status;
        const paidAmount = doc.PaidAmount || doc.paid_amount || 0;
        const totalAmount = doc.Total_amount || 0;
        
        switch(paymentTerms) {
          case 'prepaid':
            // Для 100% предоплаты требуется полная оплата
            return paymentStatus === 'fully_paid';
          case 'partial':
            // Для 50/50 требуется оплата минимум 50%
            return paidAmount >= totalAmount * 0.5;
          case 'postpaid':
            // Для постоплаты приёмка доступна всегда
            return true;
          default:
            // Если условия оплаты не указаны, разрешаем приёмку
            return true;
        }
      });
    
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
      
      const products = (data.items || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_article: item.product_article,
        vendor_price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        expected_quantity: item.quantity,
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

  const handleReceiptSubmit = async () => {
    if (receivedItems.length === 0) {
      setError('Добавьте товары для приёмки');
      return;
    }

    const token = localStorage.getItem('token');
    const items = receivedItems.map(item => ({
      product_id: item.product_id,
      quantity: parseFloat(item.received_quantity),
      price: parseFloat(item.vendor_price),
      location_id: item.selected_location_id || null
    }));

    try {
      setLoading(true);
      
      // Первый запрос - проверка max_stock
      const checkResponse = await fetch('http://localhost:8080/api/storage/bulk-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items,
          document_id: receiptDocument?.ID || 0,
          document_type: 'Приход товара',
          vendor_id: receiptDocument?.Vendor_id || 0,
          selected_contract_id: selectedContract?.ID || 0
        })
      });

      const checkData = await checkResponse.json();

      // Если есть предупреждения о превышении max_stock
      if (checkData.requires_confirm && checkData.warnings) {
        setMaxStockWarnings(checkData.warnings);
        setShowMaxStockWarning(true);
        setPendingReceiptData({ items, checkResponse });
        setLoading(false);
        return;
      }

      // Если предупреждений нет, завершаем приемку
      await completeReceipt(checkData);
      
    } catch (error) {
      console.error('Ошибка при приёмке:', error);
      setError('Ошибка при приёмке товаров: ' + error.message);
    } finally {
      setLoading(false);
    }
  };



  const completeReceipt = async (responseData) => {
    if (!responseData || responseData.error) {
      setError(responseData?.error || 'Ошибка при приёмке товаров');
      return;
    }

    // Обновляем данные
    await fetchProducts();
    await fetchWarehouseStats();
    
    // Сбрасываем состояния
    setShowReceiveModal(false);
    setReceivedItems([]);
    setReceiptStep(1);
    setSelectedContract(null);
    setContractProducts([]);
    setPendingReceiptData(null);
    setMaxStockWarnings([]);
    
    setError(''); // Очищаем ошибки
    alert('Товары успешно приняты на склад!');
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
      result = result.filter(product => product.Current_stock <= product.Min_stock);
    } else if (stockFilter === 'out') {
      result = result.filter(product => product.Current_stock === 0);
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
    const products = await fetchDocumentProducts(contract.ID);
    setContractProducts(products);
    setActiveTab('products');
  };

  const handleStartReceipt = () => {
    if (!selectedContract) return;
    
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

  const calculateTotalAmount = () => {
    return receivedItems.reduce((sum, item) => sum + (item.received_quantity * (item.vendor_price || 0)), 0);
  };

  const calculateShortageAmount = () => {
    return receivedItems.reduce((sum, item) => {
      if (item.received_quantity < item.expected_quantity) {
        const shortage = item.expected_quantity - item.received_quantity;
        return sum + (shortage * (item.vendor_price || 0));
      }
      return sum;
    }, 0);
  };

  const handleCreateClaim = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      
      const shortageItems = receivedItems.filter(item => item.received_quantity < item.expected_quantity);
      
      const response = await fetch('http://localhost:8080/api/claims', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_id: receiptDocumentId,
          claim_type: claimData.claim_type,
          description: claimData.description,
          amount: claimData.amount,
          items: shortageItems.map(item => ({
            product_id: item.product_id,
            quantity: item.expected_quantity - item.received_quantity,
            price: item.vendor_price || 0,
            issue_type: claimData.claim_type === 'shortage' ? 'shortage' : 'defect',
            description: `Недопоставка: ожидалось ${item.expected_quantity}, получено ${item.received_quantity}`
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create claim');
      }
      
      const result = await response.json();
      alert(`Претензия ${result.claim_number} создана успешно!`);
      setShowClaimModal(false);
      
      // Обновляем данные
      await fetchProducts();
      await fetchContracts();
      
    } catch (error) {
      setError('Ошибка при создании претензии: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClaimReport = async () => {
  const token = localStorage.getItem('token');
  
  try {
    setLoading(true);
    
    // Проверяем, что выбран хотя бы один тип претензии
    if (!claimData.marriage && !claimData.deadline && !claimData.quantity) {
      alert('Пожалуйста, выберите хотя бы один тип претензии');
      return;
    }
    
    const response = await fetch('http://localhost:8080/api/claim-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_id: receiptDocumentId,
        marriage: claimData.marriage || false,
        deadline: claimData.deadline || false,
        quantity: claimData.quantity || false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create claim report');
    }
    
    const result = await response.json();
    alert(`Претензия создана успешно!`);
    setShowClaimModal(false);
    
    // Обновляем статус договора
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
        status: 'Принят с претензиями',
        total_amount: selectedContract.Total_amount,
        description: `${selectedContract.Description || ''}\n\nСоздана претензия: ${claimData.description || 'Претензия по качеству/количеству'}`
      })
    });
    
    // Обновляем данные
    await fetchProducts();
    await fetchContracts();
    window.dispatchEvent(new CustomEvent('balanceUpdate'));
    
    handleCloseReceiveModal();
    
  } catch (error) {
    console.error('Claim report error:', error);
    setError('Ошибка при создании претензии: ' + error.message);
  } finally {
    setLoading(false);
  }
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
      selected_contract_id: selectedContract.ID,
      status: (discrepancies.length > 0 || claimData.marriage || claimData.deadline || claimData.quantity) ? 'Расхождение' : 'Завершён',
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
    setReceiptDocumentId(docResult.id);

    // ═══════════════════════════════════════════════════════════════
    // 2. СОЗДАЁМ ТОВАРЫ ДОКУМЕНТА (document_items)
    // ═══════════════════════════════════════════════════════════════
    const itemsToCreate = receivedItems.filter(item => item.received_quantity > 0);
    
    if (itemsToCreate.length > 0) {
      const documentItemsData = {
        document_id: docResult.id,
        items: itemsToCreate.map(item => ({
          document_id: docResult.id,
          product_id: item.product_id,
          quantity: item.received_quantity,
          price: item.vendor_price || 0,
          selected_location_id: item.selected_location_id,
          vat_rate: 0
        }))
      };

      const itemsResponse = await fetch('http://localhost:8080/api/document-products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentItemsData)
      });

      if (!itemsResponse.ok) {
        const errorText = await itemsResponse.text();
        console.error('Document items creation error:', errorText);
        throw new Error('Failed to create document items');
      }
      
    }

    // 2. Подготавливаем данные для массового обновления склада
    const itemsToUpdate = receivedItems.filter(item => item.received_quantity > 0);

    console.log(itemsToUpdate)
    
    if (itemsToUpdate.length > 0) {
      const bulkUpdateData = {
        items: itemsToUpdate.map(item => ({
          product_id: item.product_id,
          quantity: item.received_quantity,
          price: item.vendor_price || 0,
          location_id: item.selected_location_id
        })),
        document_id: docResult.id,
        document_type: 'Приход',
        vendor_id: selectedContract.Vendor_id,
        selected_contract_id: selectedContract.ID,
      };

      const storageResponse = await fetch('http://localhost:8080/api/storage/bulk-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkUpdateData)
      });

      if (!storageResponse.ok) {
        const errorData = await storageResponse.json();
        // НОВОЕ: Обработка ошибки недостатка средств
        if (errorData.error && errorData.error.includes('Недостаточно средств')) {
          alert(
            `❌ Недостаточно средств для оплаты остатка по договору!\n\n` +
            `Доступно в бюджете: ${errorData.available?.toFixed(2) || 0}₽\n` +
            `Требуется к оплате: ${errorData.required?.toFixed(2) || 0}₽\n` +
            `Нехватка: ${errorData.shortage?.toFixed(2) || 0}₽\n\n` +
            `Уже оплачено: ${errorData.already_paid?.toFixed(2) || 0}₽\n` +
            `Общая сумма: ${errorData.total_amount?.toFixed(2) || 0}₽\n` +
            `Условия оплаты: ${errorData.payment_terms || 'не указаны'}\n\n` +
            `Пополните бюджет и попробуйте снова.`
          );
        } else {
          alert(`Ошибка обновления склада: ${errorData.error || 'Неизвестная ошибка'}`);
        }
        throw new Error(errorData.error || 'Failed to update storage');
      }
      
      // НОВОЕ: Показываем информацию об успешной оплате
      const storageResult = await storageResponse.json();

      if (storageResult.amount_paid > 0) {
        alert(
          `✅ Товар успешно принят!\n\n` +
          `Оплачено при приёмке: ${storageResult.amount_paid?.toFixed(2) || 0}₽\n` +
          `Было оплачено ранее: ${storageResult.already_paid?.toFixed(2) || 0}₽\n` +
          `Общая сумма: ${storageResult.total_amount?.toFixed(2) || 0}₽\n` +
          `Остаток в бюджете: ${storageResult.money_left?.toFixed(2) || 0}₽\n` +
          `Статус оплаты: ${storageResult.payment_status === 'fully_paid' ? 'Полностью оплачен' : 'Частично оплачен'}`
        );
      }
    }

    // 3. СОЗДАЁМ ПРЕТЕНЗИЮ, если выбран хотя бы один чекбокс
    const hasClaim = claimData.marriage || claimData.deadline || claimData.quantity;
    if (hasClaim) {
      const claimResponse = await fetch('http://localhost:8080/api/claim-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_id: docResult.id,
          marriage: claimData.marriage || false,
          deadline: claimData.deadline || false,
          quantity: claimData.quantity || false,
          description: claimData.description || ''
        })
      });
      console.log('123213123')
      if (!claimResponse.ok) {
        console.warn('Claim creation failed but receipt completed');
      } else {
        console.log('Claim created successfully');
      }
    }

    // 4. Обновляем статус договора
    const contractStatus = (discrepancies.length > 0 || hasClaim) ? 'Частично исполнен' : 'Исполнен';
    
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
        status: contractStatus,
        total_amount: selectedContract.Total_amount,
        description: `${selectedContract.Description || ''}\n\nПриёмка завершена. Создан документ: ${receiptDoc.doc_number}${hasClaim ? '\nСоздана претензия.' : ''}`
      })
    });
    
    await fetchProducts();
    await fetchContracts();
    window.dispatchEvent(new CustomEvent('balanceUpdate'));
    
    const message = hasClaim ? 'Приёмка завершена. Претензия создана!' : 'Приёмка завершена успешно!';
    alert(message);
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
  setReceiptDocumentId(null);
  setActiveTab('contracts');
  // Сбрасываем данные претензии
  setClaimData({
    claim_type: 'shortage',
    description: '',
    amount: 0,
    items: [],
    marriage: false,
    deadline: false,
    quantity: false
  });
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

  const handleAddToReceipt = async (product) => {
    // Проверяем, не добавлен ли уже товар
    const existingItem = receivedItems.find(item => item.product_id === product.product_id);
    if (existingItem) {
      setError('Этот товар уже добавлен в список приёмки');
      return;
    }

    // Получаем предложения по размещению
    const suggestions = await fetchSuggestedLocations(product.product_id, product.expected_quantity || 1);
    
    const newItem = {
      ...product,
      received_quantity: product.expected_quantity || 0,
      suggested_locations: suggestions,
      selected_location_id: suggestions.length > 0 ? suggestions[0].id : null,
      selected_location_code: suggestions.length > 0 ? suggestions[0].location_code : ''
    };

    setReceivedItems([...receivedItems, newItem]);
  };

  const handleLocationChange = (productId, locationId) => {
    setReceivedItems(prevItems => 
      prevItems.map(item => {
        if (item.product_id === productId) {
          const location = item.suggested_locations?.find(loc => loc.id === parseInt(locationId)) ||
                          availableLocations.find(loc => loc.id === parseInt(locationId));
          return {
            ...item,
            selected_location_id: locationId ? parseInt(locationId) : null,
            selected_location_code: location ? location.location_code : ''
          };
        }
        return item;
      })
    );
  };

    // Карточка статистики склада
  const renderWarehouseStats = () => {
    if (!warehouseStats) return null;

    const getOccupancyColor = (percent) => {
      if (percent < 50) return 'success';
      if (percent < 80) return 'warning';
      return 'danger';
    };

    return (
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📊 Статистика склада</h5>
          <Button variant="outline-primary" size="sm" onClick={() => setShowWarehouseMapModal(true)}>
            🗺️ Карта склада
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="text-center">
                <h6>Всего ячеек</h6>
                <h3>{warehouseStats.total_locations}</h3>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <h6>Занято ячеек</h6>
                <h3 className="text-warning">{warehouseStats.occupied_locations}</h3>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <h6>Свободно ячеек</h6>
                <h3 className="text-success">{warehouseStats.available_locations}</h3>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <h6>Заполненность</h6>
                {console.log(warehouseStats)}
                <h3>
                  <Badge bg={getOccupancyColor(warehouseStats.occupancy_percent)}>
                    {warehouseStats.occupancy_percent.toFixed(1)}%
                  </Badge>
                </h3>
              </div>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <div className="progress" style={{ height: '30px' }}>
                <div 
                  className={`progress-bar bg-${getOccupancyColor(warehouseStats.occupancy_percent)}`}
                  style={{ width: `${warehouseStats.occupancy_percent}%` }}
                >
                  {warehouseStats.total_occupied.toFixed(0)} / {warehouseStats.total_capacity.toFixed(0)}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };



  const handleConfirmMaxStockWarning = async () => {
  if (!pendingReceiptData) return;

  const token = localStorage.getItem('token');
  try {
    setLoading(true);
    
    // Повторный запрос с force_confirm=true
    const response = await fetch('http://localhost:8080/api/storage/bulk-update?force_confirm=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: pendingReceiptData.items,
        document_id: receiptDocument?.ID || 0,
        document_type: 'Приход товара',
        vendor_id: receiptDocument?.Vendor_id || 0,
        selected_contract_id: selectedContract?.ID || 0
      })
    });

    if (!response.ok) {
      throw new Error('Failed to complete receipt');
    }

    const data = await response.json();
    await completeReceipt(data);
    
    // Закрываем модальное окно предупреждения
    setShowMaxStockWarning(false);
    setMaxStockWarnings([]);
    setPendingReceiptData(null);
    
  } catch (error) {
    console.error('Ошибка при подтверждении приемки:', error);
    setError('Ошибка при подтверждении приемки: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const renderMaxStockWarningModal = () => (
    <Modal show={showMaxStockWarning} onHide={() => setShowMaxStockWarning(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>⚠️ Предупреждение о превышении лимита</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          <strong>Внимание!</strong> Следующие товары превысят максимальный лимит на складе:
        </Alert>
        
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Текущий остаток</th>
              <th>Принимается</th>
              <th>Будет на складе</th>
              <th>Максимум</th>
              <th>Превышение</th>
              <th>Заполненность</th>
            </tr>
          </thead>
          <tbody>
            {maxStockWarnings.map((warning, idx) => (
              <tr key={idx}>
                {console.log(warning)}
                <td>{warning.product_name}</td>
                <td>{warning.current_stock}</td>
                <td className="text-primary"><strong>+{warning.receiving}</strong></td>
                <td><strong>{warning.new_stock}</strong></td>
                <td>{warning.max_stock}</td>
                {console.log(warning)}
                <td className="text-danger"><strong>+{warning.excess.toFixed(2)}</strong></td>
                <td>
                  <Badge bg={warning.occupancy_percent > 120 ? 'danger' : 'warning'}>
                    {warning.occupancy_percent.toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Alert variant="info">
          <strong>Что делать?</strong>
          <ul className="mb-0 mt-2">
            <li>Вы можете продолжить приемку с превышением лимита</li>
            <li>Или отменить и скорректировать количество принимаемых товаров</li>
            <li>Рекомендуется проверить наличие свободного места на складе</li>
          </ul>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => {
          setShowMaxStockWarning(false);
          setPendingReceiptData(null);
          setMaxStockWarnings([]);
        }}>
          Отменить приемку
        </Button>
        <Button variant="warning" onClick={handleConfirmMaxStockWarning}>
          Подтвердить приемку с превышением
        </Button>
      </Modal.Footer>
    </Modal>
  );

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
        min_stock: formData.min_stock,
        max_stock: formData.max_stock
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
        min_stock: formData.min_stock,
        max_stock: formData.max_stock
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
        throw new Error('Failed to update storage');
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
      m_stock: 10,
      current_stock: 0,
      price: 0,
      location: ''
    });
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
  
// Компонент управления ячейками склада
const renderWarehouseLocationsManager = () => {

  const handleCreateLocation = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/warehouse-locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLocationData)
      });

      if (response.ok) {
        await fetchWarehouseLocations();
        setShowAddLocationModal(false);
        setNewLocationData({ rack: 'A', shelf: 1, cell: 1, capacity: 100 });
        alert('Ячейка создана успешно!');
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка создания ячейки');
      }
    } catch (error) {
      console.error('Ошибка создания ячейки:', error);
      setError('Ошибка создания ячейки');
    }
  };

  const handleUpdateLocation = async (locationId, updates) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/warehouse-locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchWarehouseLocations();
        setEditingLocation(null);
        alert('Ячейка обновлена!');
      }
    } catch (error) {
      console.error('Ошибка обновления ячейки:', error);
      setError('Ошибка обновления ячейки');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту ячейку?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/warehouse-locations/${locationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchWarehouseLocations();
        alert('Ячейка удалена!');
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка удаления ячейки');
      }
    } catch (error) {
      console.error('Ошибка удаления ячейки:', error);
      setError('Ошибка удаления ячейки');
    }
  };

  const handleToggleAvailability = async (locationId, currentStatus) => {
    await handleUpdateLocation(locationId, { is_available: !currentStatus });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Управление ячейками склада</h4>
        <Button variant="primary" onClick={() => setShowAddLocationModal(true)}>
          + Добавить ячейку
        </Button>
      </div>

      {/* Фильтры */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Select onChange={(e) => {
                // Фильтр по стеллажу
              }}>
                <option value="">Все стеллажи</option>
                {[...new Set(warehouseLocations.map(l => l.rack))].sort().map(rack => (
                  <option key={rack} value={rack}>Стеллаж {rack}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select>
                <option value="all">Все ячейки</option>
                <option value="available">Доступные</option>
                <option value="occupied">Занятые</option>
                <option value="disabled">Отключенные</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Таблица ячеек */}
      <Card>
        <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Table striped bordered hover responsive size="sm">
            <thead className="sticky-top bg-white">
              <tr>
                <th>Код</th>
                <th>Стеллаж</th>
                <th>Полка</th>
                <th>Ячейка</th>
                <th>Вместимость</th>
                <th>Занято</th>
                <th>Заполненность</th>
                <th>Товар</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {warehouseLocations.map(loc => {
                const occupancyPercent = (loc.occupied / loc.capacity) * 100;
                const isEditing = editingLocation?.id === loc.id;

                return (
                  <tr key={loc.id}>
                    <td><strong>{loc.location_code}</strong></td>
                    <td>{loc.rack}</td>
                    <td>{loc.shelf}</td>
                    <td>{loc.cell}</td>
                    <td>
                      {isEditing ? (
                        <Form.Control
                          type="number"
                          size="sm"
                          value={editingLocation.capacity}
                          onChange={(e) => setEditingLocation({
                            ...editingLocation,
                            capacity: parseFloat(e.target.value)
                          })}
                          style={{ width: '80px' }}
                        />
                      ) : (
                        loc.capacity
                      )}
                    </td>
                    <td>{loc.occupied.toFixed(2)}</td>
                    <td>
                      <div className="progress" style={{ height: '20px', minWidth: '80px' }}>
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
                      {loc.product_id ? (
                        <Badge bg="info">ID: {loc.product_id}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={loc.is_available ? 'success' : 'secondary'}>
                        {loc.is_available ? 'Доступна' : 'Недоступна'}
                      </Badge>
                    </td>
                    <td>
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            className="me-1"
                            onClick={() => handleUpdateLocation(loc.id, {
                              capacity: editingLocation.capacity
                            })}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingLocation(null)}
                          >
                            ✕
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-1"
                            onClick={() => setEditingLocation(loc)}
                            title="Редактировать"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant={loc.is_available ? 'outline-warning' : 'outline-success'}
                            className="me-1"
                            onClick={() => handleToggleAvailability(loc.id, loc.is_available)}
                            title={loc.is_available ? 'Отключить' : 'Включить'}
                          >
                            {loc.is_available ? '🔒' : '🔓'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteLocation(loc.id)}
                            disabled={loc.occupied > 0}
                            title={loc.occupied > 0 ? 'Нельзя удалить занятую ячейку' : 'Удалить'}
                          >
                            🗑️
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Модальное окно добавления ячейки */}
      <Modal show={showAddLocationModal} onHide={() => setShowAddLocationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить ячейку склада</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Стеллаж</Form.Label>
                  <Form.Control
                    type="text"
                    value={newLocationData.rack}
                    onChange={(e) => setNewLocationData({...newLocationData, rack: e.target.value.toUpperCase()})}
                    placeholder="A, B, C..."
                    maxLength={10}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Полка</Form.Label>
                  <Form.Control
                    type="number"
                    value={newLocationData.shelf}
                    onChange={(e) => setNewLocationData({...newLocationData, shelf: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ячейка</Form.Label>
                  <Form.Control
                    type="number"
                    value={newLocationData.cell}
                    onChange={(e) => setNewLocationData({...newLocationData, cell: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Вместимость</Form.Label>
              <Form.Control
                type="number"
                value={newLocationData.capacity}
                onChange={(e) => setNewLocationData({...newLocationData, capacity: parseFloat(e.target.value) || 100})}
                min="1"
              />
              <Form.Text className="text-muted">
                Максимальное количество единиц товара, которое может вместить ячейка
              </Form.Text>
            </Form.Group>
            <Alert variant="info">
              <strong>Код ячейки:</strong> {newLocationData.rack}-{newLocationData.shelf}-{newLocationData.cell}
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddLocationModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCreateLocation}>
            Создать ячейку
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Модальное окно с картой склада
const renderWarehouseMapModal = () => {
  // Группируем ячейки по стеллажам
  const groupedLocations = warehouseLocations.reduce((acc, loc) => {
    if (!acc[loc.rack]) acc[loc.rack] = {};
    if (!acc[loc.rack][loc.shelf]) acc[loc.rack][loc.shelf] = [];
    acc[loc.rack][loc.shelf].push(loc);
    return acc;
  }, {});

  const getCellColor = (location) => {
    const occupancyPercent = (location.occupied / location.capacity) * 100;
    if (!location.is_available) return '#6c757d';
    if (occupancyPercent === 0) return '#28a745';
    if (occupancyPercent < 50) return '#ffc107';
    if (occupancyPercent < 100) return '#fd7e14';
    return '#dc3545';
  };

  return (
    <Modal show={showWarehouseMapModal} onHide={() => setShowWarehouseMapModal(false)} size="xl" fullscreen>
      <Modal.Header closeButton>
        <Modal.Title>🗺️ Карта склада</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Row className="mb-3">
          <Col>
            <Alert variant="info">
              <strong>Легенда:</strong>{' '}
              <Badge bg="success">Свободно</Badge>{' '}
              <Badge bg="warning">Заполнено &lt;50%</Badge>{' '}
              <Badge bg="warning" style={{ backgroundColor: '#fd7e14' }}>Заполнено 50-100%</Badge>{' '}
              <Badge bg="danger">Переполнено</Badge>{' '}
              <Badge bg="secondary">Недоступно</Badge>
            </Alert>
          </Col>
        </Row>

        {Object.keys(groupedLocations).sort().map(rack => (
          <Card key={rack} className="mb-4">
            <Card.Header>
              <h5>Стеллаж {rack}</h5>
            </Card.Header>
            <Card.Body>
              {Object.keys(groupedLocations[rack]).sort((a, b) => parseInt(b) - parseInt(a)).map(shelf => (
                <div key={shelf} className="mb-3">
                  <h6>Полка {shelf}</h6>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {groupedLocations[rack][shelf].sort((a, b) => a.cell - b.cell).map(location => (
                      <div
                        key={location.id}
                        style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: getCellColor(location),
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        title={`${location.location_code}\nЗанято: ${location.occupied}/${location.capacity}\n${location.product_name ? 'Товар: ' + location.product_name : 'Пусто'}`}
                      >
                        <div>{location.cell}</div>
{location.product_name ? (
  <small style={{ fontSize: '8px', textAlign: 'center', lineHeight: '1.1' }}>
    {location.product_name.substring(0, 10)}
  </small>
) : (
  <small style={{ fontSize: '9px' }}>—</small>
)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowWarehouseMapModal(false)}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};


  return (
    <div className="p-3">
    {renderWarehouseStats()}
    <Tabs defaultActiveKey="products" className="mb-3">
      <Tab eventKey="products" title="📦 Товары на складе">
      <Row className="mb-3">
          <Col className="text-end">
            <Button 
              variant="primary" 
              onClick={() => setShowReceiveModal(true)}
            >
              📦 Приёмка товара
            </Button>
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
    <th>Мин. запас</th>
    <th>Макс. запас</th>
    <th>Заполненность</th>
    <th>Размещение</th>
    <th>Статус</th>
    <th>Действия</th>
  </tr>
</thead>
            <tbody>
              {filteredProducts.map(product => {
    const totalFromLocations = product.locations.reduce((sum, loc) => sum + loc.quantity, 0);
    const status = getStockStatus(totalFromLocations, product.Min_stock);  
    const stockPercent = product.Max_stock > 0 ? (totalFromLocations / product.Max_stock) * 100 : 0;
    console.log(totalFromLocations)
    
    return (
      <tr key={product.ID} className={totalFromLocations <= product.Min_stock ? 'table-warning' : ''}>
        <td><strong>{product.Article}</strong></td>
        <td>{product.Name}</td>
        <td>{product.Category}</td>
        <td className="text-center">
          {formatNumber(totalFromLocations)} {product.Unit}
        </td>
        <td className="text-center">{product.Min_stock}</td>
        <td className="text-center">{product.Max_stock || '—'}</td>
        <td>
          {product.Max_stock > 0 ? (
            <div>
              <div className="progress" style={{ height: '20px' }}>
                <div 
                  className={`progress-bar ${
                    stockPercent > 100 ? 'bg-danger' : 
                    stockPercent > 90 ? 'bg-warning' : 
                    'bg-success'
                  }`}
                  style={{ width: `${Math.min(stockPercent, 100)}%` }}
                >
                  {stockPercent.toFixed(0)}%
                </div>
              </div>
            </div>
          ) : '—'}
        </td>
        <td>
          <small className="text-muted">
            {product.locations && product.locations.length > 0 ? (
    <div>
      {product.locations.map((loc, idx) => (
        <Badge 
          key={idx} 
          bg="info" 
          className="me-1 mb-1"
          style={{ cursor: 'pointer' }}
          title={`Ячейка: ${loc.location_code}\nКоличество: ${loc.quantity} ${product.unit}\nЗанято: ${loc.occupied}/${loc.capacity}`}
        >
          {loc.location_code}: {loc.quantity} {product.unit}
        </Badge>
      ))}
    </div>
  ) : (
    <span className="text-muted">Не размещено</span>
  )}
          </small>
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
                min_stock: product.Min_stock,
                max_stock: product.Max_stock,
                current_stock: totalFromLocations,
                price: product.Price,
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

      {/* Модальное окно приёмки товара - остаётся без изменений */}
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
    <th className="text-center">Сумма</th>
    <th>Условия оплаты</th>
    <th>Статус</th>
    <th>Действия</th>
  </tr>
</thead>
              <tbody>
  {contracts.map(contract => {
    const paymentTerms = contract.PaymentTerms || contract.payment_terms;
    const paymentStatus = contract.PaymentStatus || contract.payment_status;
    
    const getPaymentTermsLabel = (terms) => {
      switch(terms) {
        case 'prepaid': return '100% предоплата';
        case 'partial': return '50/50';
        case 'postpaid': return 'Постоплата';
        default: return terms || '-';
      }
    };
    
    const getPaymentStatusBadge = (status) => {
      switch(status) {
        case 'fully_paid': return <Badge bg="success">Оплачен</Badge>;
        case 'partially_paid': return <Badge bg="warning">Частично</Badge>;
        case 'unpaid': return <Badge bg="danger">Не оплачен</Badge>;
        default: return <Badge bg="secondary">{status}</Badge>;
      }
    };
    
    return (
      <tr key={contract.ID}>
        <td><strong>{contract.Doc_number}</strong></td>
        <td>{contract.vendor_name}</td>
        <td>{new Date(contract.Created_at).toLocaleDateString()}</td>
        <td className="text-center fw-bold" style={{ fontSize: '1.05rem' }}>{formatNumber(contract.Total_amount)} ₽</td>
        <td>
          <div>{getPaymentTermsLabel(paymentTerms)}</div>
          <small>{getPaymentStatusBadge(paymentStatus)}</small>
        </td>
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
              setActiveTab('products');
            }}
          >
            Выбрать
          </Button>
        </td>
      </tr>
    );
  })}
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
                     <td className="text-center fw-bold" style={{ fontSize: '1.05rem' }}>{formatNumber(product.vendor_price)}</td>
                     <td className="text-center">{selectedContract.Doc_date}</td>
                     <td className="text-center">{selectedContract.Currency}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Всего позиций:</strong></td>
                        <td colSpan="3"><strong style={{ fontSize: '1.1rem' }}>{contractProducts.length}</strong></td>
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
          <th>Размещение</th> {/* НОВАЯ КОЛОНКА */}
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
            <td className="text-end" style={{ fontSize: '1.05rem' }}>{formatNumber(item.vendor_price)} ₽</td>
            <td>
  <Form.Select
    value={item.selected_location_id || ''}
    onChange={async (e) => {
      const locationId = parseInt(e.target.value);
      const location = availableLocations.find(l => l.id === locationId);
      
      // Проверка capacity
      if (location) {
        const availableSpace = location.capacity - location.occupied;
        if (item.received_quantity > availableSpace) {
          alert(
            `Недостаточно места в ячейке ${location.location_code}.\n` +
            `Доступно: ${availableSpace.toFixed(2)} ${item.unit}\n` +
            `Требуется: ${item.received_quantity} ${item.unit}\n\n` +
            `Пожалуйста, выберите другую ячейку или уменьшите количество.`
          );
          return;
        }
        
        // Проверка: занята ли ячейка другим товаром
        if (location.product_id !== null && location.product_id !== item.product_id) {
          alert(
            `Ячейка ${location.location_code} уже занята другим товаром.\n` +
            `Выберите пустую ячейку или ячейку с этим же товаром.`
          );
          return;
        }
      }
      
      const updated = [...receivedItems];
      updated[index].selected_location_id = locationId;
      updated[index].selected_location_code = location?.location_code || '';
      setReceivedItems(updated);
    }}
    className={!item.selected_location_id ? 'border-warning' : ''}
  >
    <option value="">Выберите ячейку</option>
    
    {/* Группа: Ячейки с этим товаром */}
    {availableLocations.filter(loc => loc.product_id === item.product_id).length > 0 && (
      <optgroup label="✓ Ячейки с этим товаром">
        {availableLocations
          .filter(loc => loc.product_id === item.product_id)
          .map(loc => {
            const availableSpace = loc.capacity - loc.occupied;
            const isEnoughSpace = item.received_quantity <= availableSpace;
            return (
              <option 
                key={loc.id} 
                value={loc.id}
                disabled={!isEnoughSpace}
              >
                {loc.location_code} 
                (своб: {availableSpace.toFixed(0)}/{loc.capacity})
                {!isEnoughSpace ? ' ⚠️ Мало места' : ''}
              </option>
            );
          })}
      </optgroup>
    )}
    
    {/* Группа: Пустые ячейки */}
    {availableLocations.filter(loc => loc.product_id === null).length > 0 && (
      <optgroup label="Пустые ячейки">
        {availableLocations
          .filter(loc => loc.product_id === null)
          .map(loc => {
            const availableSpace = loc.capacity - loc.occupied;
            const isEnoughSpace = item.received_quantity <= availableSpace;
            return (
              <option 
                key={loc.id} 
                value={loc.id}
                disabled={!isEnoughSpace}
              >
                {loc.location_code} 
                (своб: {availableSpace.toFixed(0)}/{loc.capacity})
                {!isEnoughSpace ? ' ⚠️ Мало места' : ''}
              </option>
            );
          })}
      </optgroup>
    )}
  </Form.Select>
              {item.selected_location_code && (
    <small className="text-success d-block mt-1">
      ✓ Выбрано: {item.selected_location_code}
    </small>
  )}
  
  {!item.selected_location_id && (
    <small className="text-warning d-block mt-1">
      ⚠️ Выберите ячейку
    </small>
  )}
</td>
            <td className="text-end fw-bold" style={{ fontSize: '1.05rem' }}>{formatNumber(item.received_quantity * item.vendor_price)} ₽</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan="7" className="text-end"><strong>Итого:</strong></td>
          <td className="text-end"><strong style={{ fontSize: '1.2rem' }}>{formatNumber(calculateTotalAmount())} ₽</strong></td>
        </tr>
      </tfoot>
    </Table>

    {/* БЛОК С ЧЕКБОКСАМИ ДЛЯ ПРЕТЕНЗИЙ */}
    <Card className="mb-3 border-warning">
      <Card.Header className="bg-warning text-dark">
        <strong>⚠️ Претензия поставщику</strong>
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label><strong>Типы претензий (можно выбрать несколько):</strong></Form.Label>
          <div className="mt-2">
            <Form.Check
              type="checkbox"
              id="marriage-checkbox"
              label="🚫 Брак товара"
              checked={claimData.marriage || false}
              onChange={(e) => setClaimData({...claimData, marriage: e.target.checked})}
              className="mb-2"
            />
            <Form.Check
              type="checkbox"
              id="deadline-checkbox"
              label="⏰ Опоздание по срокам доставки"
              checked={claimData.deadline || false}
              onChange={(e) => setClaimData({...claimData, deadline: e.target.checked})}
              className="mb-2"
            />
            <Form.Check
              type="checkbox"
              id="quantity-checkbox"
              label="📦 Несоответствие количества товара"
              checked={claimData.quantity || false}
              onChange={(e) => setClaimData({...claimData, quantity: e.target.checked})}
            />
          </div>
        </Form.Group>

        {discrepancies.length > 0 && (
          <Alert variant="warning">
            <strong>Обнаружены расхождения в количестве:</strong>
            <ul className="mb-0 mt-2">
              {discrepancies.map((d, i) => (
                <li key={i}>{d.productName}</li>
              ))}
            </ul>
            <small className="text-muted mt-2 d-block">
              Сумма недопоставки: <strong style={{ fontSize: '1.1rem' }}>{formatNumber(calculateShortageAmount())} ₽</strong>
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>

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
            <Form.Label>Минимальный запас</Form.Label>
            {console.log(formData)}
            <Form.Control
              type="number"
              value={formData.min_stock}
              onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
              min="0"
              placeholder="Минимальное количество на складе"
            />
            <Form.Text className="text-muted">
              При достижении этого уровня товар будет помечен как "Низкий запас"
            </Form.Text>
          </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
            <Form.Label>Максимальный запас</Form.Label>
            <Form.Control
              type="number"
              value={formData.max_stock || ''}
              onChange={(e) => setFormData({...formData, max_stock: parseInt(e.target.value) || 0})}
              min="0"
              placeholder="Максимальное количество на складе"
            />
            <Form.Text className="text-muted">
              При превышении этого уровня будет предупреждение при приемке
            </Form.Text>
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

            {/* Визуализация текущего состояния */}
      {formData.max_stock > 0 && (
        <Alert variant="info">
          <strong>Текущее состояние:</strong>
          <div className="mt-2">
            <div className="d-flex justify-content-between mb-1">
              <span>Текущий остаток: {formData.current_stock}</span>
              <span>Мин: {formData.min_stock} | Макс: {formData.max_stock}</span>
            </div>
            <div className="progress" style={{ height: '25px' }}>
              <div 
                className="progress-bar bg-secondary" 
                style={{ width: `${(formData.min_stock / formData.max_stock) * 100}%` }}
                title={`Минимум: ${formData.min_stock}`}
              >
                Min
              </div>
              <div 
                className={`progress-bar ${
                  formData.current_stock > formData.max_stock ? 'bg-danger' :
                  formData.current_stock > formData.max_stock * 0.9 ? 'bg-warning' :
                  'bg-success'
                }`}
                style={{ 
                  width: `${Math.min((formData.current_stock / formData.max_stock) * 100, 100) - (formData.min_stock / formData.max_stock) * 100}%` 
                }}
              >
                {formData.current_stock}
              </div>
            </div>
          </div>
        </Alert>
      )}
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
      </Tab>
      <Tab eventKey="locations" title="🗺️ Управление ячейками">
        {renderWarehouseLocationsManager()}
      </Tab>
    </Tabs>
      {renderMaxStockWarningModal()}
      {renderWarehouseMapModal()}
    </div>
  );
}

export default WarehousePage;