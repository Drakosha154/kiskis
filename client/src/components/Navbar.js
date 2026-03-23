// В файле Navbar.js добавьте прослушивание события

import React, { useState, useEffect } from 'react';
import AccountingModal from '../components/AccountingModal';
import { useNavigate } from 'react-router-dom';

export default function Navbar({setAuth}) {
  const navigate = useNavigate();
  const [money, setMoney] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMoney();
    
    // Добавляем прослушиватель события обновления баланса
    const handleBalanceUpdate = () => {
      fetchMoney();
    };
    
    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    
    // Очищаем прослушиватель при размонтировании компонента
    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
    };
  }, []);

  const fetchMoney = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/money', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch money');
      const data = await response.json();
      setMoney(data.Money);
    } catch (err) {
      console.log('Ошибка загрузки баланса: ' + err.message);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const exit = () => {
    localStorage.removeItem('token');
    setAuth(false);
    navigate('/login');
  };
  
  return (
    <>
      <nav className="navbar navbar-dark bg-black">
        <div className="container-fluid bg-black">
          <a className="navbar-brand fw-bold" href="/">Вышивальщики</a>
          <div className="d-flex">
            <button 
              className="btn btn-outline-light btn-sm me-2 position-relative d-flex align-items-center"
              onClick={() => setShowModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-cash-coin me-1"></i>
              <span className="fw-bold">{formatMoney(money)}</span>
            </button>
            <button className="btn btn-outline-light btn-sm d-flex align-items-center"
              onClick={exit}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i>
              Выход
            </button>
          </div>
        </div>
      </nav>

      <AccountingModal 
        show={showModal}
        onHide={() => setShowModal(false)}
      />
    </>
  );
}