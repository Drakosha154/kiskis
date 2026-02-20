import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import SuppliersPage from '../components/VendorsPage';
import ContractsPage from '../components/ContractsPage';
import WarehousePage from '../components/WarehousePage';
import DocumentsPage from '../components/DocumentsPage';
import ReportsPage from '../components/ReportsPage';

function MainPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState('suppliers'); // Активная страница по умолчанию

  // Проверка авторизации при загрузке
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Функция для отображения активной страницы
  const renderActivePage = () => {
    switch (activePage) {
      case 'suppliers':
        return <SuppliersPage setError={setError} />;
      case 'contracts':
        return <ContractsPage setError={setError} />;
      case 'warehouse':
        return <WarehousePage setError={setError} />;
      case 'documents':
        return <DocumentsPage setError={setError} />;
      case 'reports':
        return <ReportsPage setError={setError} />;
      default:
        return <SuppliersPage setError={setError} />;
    }
  };

  return (
    <div className='container text-bg-dark' style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute' }}>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      
      {/* Основной контейнер с компонентными страницами */}
      <div className='container-fluid border border-3 border-black rounded-3 text-bg-light mt-4' style={{ height: '700px', marginTop: '20px', overflowY: 'auto' }}>
        {renderActivePage()}
      </div>

      {/* Кнопки навигации внизу по центру */}
      <div className='container border border-3 border-black rounded-5 text-bg-secondary' style={{ minWidth: '1200px', minHeight: '100px', position: 'relative', marginTop: '50px'}}>
        <div className="d-flex justify-content-evenly m-3 align-self-stretch">
          <button 
            className={`btn btn-lg border border-2 border-black btn-info ${activePage === 'suppliers' ? 'btn-success' : 'btn-primary' }`} 
            type="button" 
            style={{width:'200px', height:'65px'}}
            onClick={() => setActivePage('suppliers')}
          >
            Поставщики
          </button>
          <button 
            className={`btn btn-lg border border-2 border-black btn-info ${activePage === 'contracts' ? 'btn-success' : 'btn-primary'}`} 
            type="button" 
            style={{width:'200px', height:'65px'}}
            onClick={() => setActivePage('contracts')}
          >
            Закл. договоров
          </button>
          <button 
            className={`btn btn-lg border border-2 border-black btn-info ${activePage === 'warehouse' ? 'btn-success' : 'btn-primary'}`} 
            type="button" 
            style={{width:'200px', height:'65px'}}
            onClick={() => setActivePage('warehouse')}
          >
            Склад
          </button>
          <button 
            className={`btn btn-lg border border-2 border-black btn-info ${activePage === 'documents' ? 'btn-success' : 'btn-primary'}`} 
            type="button" 
            style={{width:'200px', height:'65px'}}
            onClick={() => setActivePage('documents')}
          >
            Документы
          </button>
          <button 
            className={`btn btn-lg border border-2 border-black btn-info ${activePage === 'reports' ? 'btn-success' : 'btn-primary'}`} 
            type="button" 
            style={{width:'200px', height:'65px'}}
            onClick={() => setActivePage('reports')}
          >
            Отчеты
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainPage;