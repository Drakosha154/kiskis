import React, { useState, useEffect, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Container, Alert } from 'react-bootstrap';


function MainPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/vendors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Admin access denied');
            
            const data = await response.json();
            console.log('data: ', data)

        } catch (err) {
            setError('Ошибка доступа: ' + err.message);

        }
    };
  
  
  return(
  <div className='container mt-4' style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute' }}>
    <div className='container border border-3 border-black rounded-3' style={{ width: '1400px', height: '700px', marginTop: '20px', overflowY: 'auto' }}>
      <table className='table table-bordered border-primary mt-2 ' style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
          <tr>
            <th>zboba1</th>
            <th>zboba2</th>
            <th>zboba3</th>
            <th>zboba4</th>
          </tr>
        </tbody>
      </table>
    </div>
    <div className='container border border-3 border-dark rounded-5 ' style={{ minWidth: '1200px', minHeight: '100px', position: 'relative', marginTop: '50px'}}>
      <div className="d-flex justify-content-evenly m-3 align-self-stretch ">
        <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка1</button>
        <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка2</button>
        <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка3</button>
        <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка4</button>
        <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка5</button>
        <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка6</button>
      </div>
    </div>
  </div>
  )
}

export default MainPage;