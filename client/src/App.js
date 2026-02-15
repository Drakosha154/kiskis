import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

function App() { 
  const [isAuth, setAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuth(true);
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login setAuth={setAuth} />} />
      </Routes>
      
    </div>
  );
}

export default App;
