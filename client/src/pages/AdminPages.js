import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import Admin from '../components/Admin';

function AdminPages() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className='container text-bg-dark' style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute' }}>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      
      {/* Основной контейнер с компонентными страницами */}
      <div className='container-fluid border border-3 border-black rounded-3 text-bg-light mt-4' style={{ height: '700px', marginTop: '20px', overflowY: 'auto' }}>
        <Admin setError={setError} />
      </div>
    </div>
  );
}

export default AdminPages;