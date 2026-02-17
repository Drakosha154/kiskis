import React, { useState, useEffect, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Container, Alert } from 'react-bootstrap';


function MainPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    getVendors();
  }, []);

  const getVendors = async () => {
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
            setVendors(data.vendor)
            console.log(data)
        } catch (err) {
            setError('Ошибка доступа: ' + err.message);

        }
    };
  
  
  return(
  <div className='container text-bg-dark ' style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute' }}>
    <div className='container-fluid border border-3 border-black rounded-3 text-bg-light mt-4' style={{ height: '700px', marginTop: '20px', overflowY: 'auto' }}>
      <table className='table table-bordered border-primary mt-2 ' style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Id</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
            <th>Взаимодействие</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, index) => (
                <tr key={vendor.id}>
                  <td>{index + 1}</td>
                  <td>{vendor.Company_name}</td>
                  <td>{vendor.Contact_person}</td>
                  <td>{vendor.Phone}</td>
                  <td>{vendor.Email}</td>
                  <td>{vendor.Address}</td>
                  <td>{vendor.Inn}</td>
                  <td></td>
                </tr>
              ))
          } 
        </tbody>
      </table>
    </div>
    <div className='container border border-3 border-black rounded-5 text-bg-secondary' style={{ minWidth: '1200px', minHeight: '100px', position: 'relative', marginTop: '50px'}}>
      <div className="d-flex justify-content-evenly m-3 align-self-stretch ">
        <button className="btn btn-primary btn-lg" type="button" href='/' style={{width:'200px', height:'65px'}}>Поставщики</button>
        <button className="btn btn-primary btn-lg" type="button" href='/'style={{width:'200px', height:'65px'}}>Закл. договоров</button>
        <button className="btn btn-primary btn-lg" type="button" href='/'style={{width:'200px', height:'65px'}}>Кнопка3</button>
        <button className="btn btn-primary btn-lg" type="button" href='/'style={{width:'200px', height:'65px'}}>Кнопка4</button>
        <button className="btn btn-primary btn-lg" type="button" href='/'style={{width:'200px', height:'65px'}}>Кнопка5</button>
        <button className="btn btn-primary btn-lg" type="button" href='/'style={{width:'200px', height:'65px'}}>Кнопка6</button>
      </div>
    </div>
  </div>
  )
}

export default MainPage;