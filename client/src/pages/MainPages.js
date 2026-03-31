import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import SuppliersPage from '../components/VendorsPage';
import ContractsPage from '../components/ContractsPage';
import WarehousePage from '../components/WarehousePage';
import DocumentsPage from '../components/DocumentsPage';
import ReportsPage from '../components/ReportsPage';
import AccountingPage from '../components/AccountingPage';
import { hasAccessToTab, getAccessibleTabs } from '../utils/roleUtils';

function MainPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // Получаем список доступных вкладок и устанавливаем первую как активную
  const accessibleTabs = getAccessibleTabs();
  const [activePage, setActivePage] = useState(accessibleTabs[0] || 'suppliers');
  
  // Функция для обновления баланса (будет передана в Navbar)
  const refreshBalance = () => {
    // Эта функция будет вызывать fetchMoney в Navbar
    window.dispatchEvent(new CustomEvent('balanceUpdate'));
  };

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const renderActivePage = () => {
    switch (activePage) {
      case 'suppliers':
        return <SuppliersPage setError={setError} />;
      case 'contracts':
        return <ContractsPage setError={setError} />;
      case 'warehouse':
        return <WarehousePage setError={setError} onBalanceUpdate={refreshBalance} />;
      case 'documents':
        return <DocumentsPage setError={setError} />;
      case 'accounting':
        return <AccountingPage setError={setError} />;
      case 'reports':
        return <ReportsPage setError={setError} />;
      default:
        return <SuppliersPage setError={setError} />;
    }
  };

  // Конфигурация кнопок навигации
  const navigationButtons = [
    { id: 'suppliers', label: 'Поставщики' },
    { id: 'contracts', label: 'Закл. договоров' },
    { id: 'warehouse', label: 'Склад' },
    { id: 'documents', label: 'Документы' },
    { id: 'accounting', label: 'Бухгалтерия' },
    { id: 'reports', label: 'Отчеты' }
  ];

  return (
    <div className='container text-bg-dark' style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute' }}>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      
      {/* Основной контейнер с компонентными страницами */}
      <div className='container-fluid border border-3 border-black rounded-3 text-bg-light mt-4' style={{ height: '700px', marginTop: '20px', overflowY: 'auto' }}>
        {renderActivePage()}
      </div>

      {/* Кнопки навигации */}
      <div className='container border border-3 border-black rounded-5 text-bg-secondary' style={{ minWidth: '1200px', minHeight: '100px', position: 'relative', marginTop: '50px'}}>
        <div className="d-flex justify-content-evenly m-3 align-self-stretch">
          {navigationButtons.map(button => {
            const hasAccess = hasAccessToTab(button.id);
            const isActive = activePage === button.id;
            
            return (
              <button 
                key={button.id}
                className={`btn btn-lg border border-2 border-black ${
                  !hasAccess 
                    ? 'btn-secondary' 
                    : isActive 
                      ? 'btn-success' 
                      : 'btn-primary'
                }`}
                type="button" 
                style={{width:'200px', height:'65px'}}
                onClick={() => hasAccess && setActivePage(button.id)}
                disabled={!hasAccess}
              >
                {button.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MainPage;