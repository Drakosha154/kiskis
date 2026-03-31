import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({setAuth}) {
  const navigate = useNavigate();

  const exit = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Добавить удаление роли
    setAuth(false);
    navigate('/login');
  };
  
  return (
    <nav className="navbar navbar-dark bg-black">
      <div className="container-fluid bg-black">
        <a className="navbar-brand fw-bold" href="/">Вышивальщики</a>
        <div className="d-flex">
          <button className="btn btn-outline-light btn-sm d-flex align-items-center"
            onClick={exit}
          >
            <i className="bi bi-box-arrow-in-right me-1"></i>
            Выход
          </button>
        </div>
      </div>
    </nav>
  );
}