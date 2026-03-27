import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import Register from './pages/Register';
import MainPages from './pages/MainPages';
import Navbar from './components/Navbar';
import AdminPages from './pages/AdminPages';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PDFViewer } from "@react-pdf/renderer";

function App() { 
  const [isAuth, setAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuth(true);
  }, []);

  return (
    <div className="App" style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute', overflow: 'hidden' }}>
      {isAuth && <Navbar setAuth={setAuth} />}
      <Routes>
        <Route path="/" element={<MainPages setAuth={setAuth} />} />
        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminPages />} />
      </Routes>
      
    </div>
  );
}

export default App;
