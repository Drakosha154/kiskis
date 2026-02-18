import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Container, Alert, Modal } from 'react-bootstrap'; // Добавлен Modal

function MainPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false); // Состояние для модального окна
  const [selectedVendor, setSelectedVendor] = useState(null); // Выбранный поставщик
  

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

   const saveVendor = async (e) => {
    e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            Company_name: formData.get('Company_name'),
            Contact_person: formData.get('Contact_person'),
            Phone: formData.get('Phone'),
            Email: formData.get('Email'),
            Address: formData.get('Address'),
            Inn: formData.get('Inn'),
            Kpp: formData.get('Kpp'),
            Payment_account: formData.get('Payment_account'),
            Bank_name: formData.get('Bank_name'),
        };
        
    const token = localStorage.getItem('token');
      
    try {
      
      const response = await fetch(`http://localhost:8080/api/vendors/${selectedVendor.ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Admin access denied');

      setShowModal(false);
      setSelectedVendor(null);
      getVendors();
    } catch (err) {
      setError('Ошибка доступа: ' + err.message);
    }
  };

  const handleShowModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVendor(null);
  };

  const handleDelete = (vendorId) => {
    // Логика удаления
    console.log('Удалить поставщика с ID:', vendorId);
  };

  return (
    <div className='container text-bg-dark' style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', position: 'absolute' }}>
      <div className='container-fluid border border-3 border-black rounded-3 text-bg-light mt-4' style={{ height: '700px', marginTop: '20px', overflowY: 'auto' }}>
        <table className='table table-bordered border-primary mt-2' style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Название компании</th>
              <th>Контакты</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Адрес</th>
              <th>ИНН</th>
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
                <td>
                  <div className="btn-group" role="group">
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={() => handleDelete(vendor.id)}
                    >
                      Удалить
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-warning"
                      onClick={() => handleShowModal(vendor)}
                    >
                      Редактировать
                    </button>
                    <button type="button" className="btn btn-danger">
                      Не придумал
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно React Bootstrap */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size='xl'>
        <Modal.Header closeButton>
          <Modal.Title>Редактирование данных поставщика</Modal.Title>
        </Modal.Header>
        <Form onSubmit={saveVendor}>
          <div className='container'>
          <Modal.Body >
          {selectedVendor && (
            <>
              {console.log(selectedVendor)}
              <div className='row'>
                <div className='col'>
              <Form.Group className="mb-3">
                  <Form.Label>Название компании</Form.Label>
                  <Form.Control
                      name="Company_name"
                      defaultValue={selectedVendor.Company_name}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Контакт</Form.Label>
                  <Form.Control
                      name="Contact_person"
                      defaultValue={selectedVendor.Contact_person}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Телефон</Form.Label>
                  <Form.Control
                      name="Phone"
                      defaultValue={selectedVendor.Phone}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                      name="Email"
                      defaultValue={selectedVendor.Email}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Адрес</Form.Label>
                  <Form.Control
                      name="Address"
                      defaultValue={selectedVendor.Address}
                  />
              </Form.Group>
              </div>
              <div className='col'>
              <Form.Group className="mb-3">
                  <Form.Label>ИНН</Form.Label>
                  <Form.Control
                      name="Inn"
                      defaultValue={selectedVendor.Inn}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>КПП</Form.Label>
                  <Form.Control
                      name="Inn"
                      defaultValue={selectedVendor.Kpp}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Номер счета</Form.Label>
                  <Form.Control
                      name="Payment_account"
                      defaultValue={selectedVendor.Payment_account}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Название банка</Form.Label>
                  <Form.Control
                      name="Bank_name"
                      defaultValue={selectedVendor.Bank_name}
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>dsdsd</Form.Label>
                  <Form.Control
                      name="Bank_name"
                      defaultValue={selectedVendor.Bank_name}
                  />
              </Form.Group>
            </div>
          </div>
            </>
          )}
          </Modal.Body>
          </div>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => handleCloseModal(false)}>
                Отмена
            </Button>
            <Button variant="primary" type="submit">
                Сохранить
            </Button>
        </Modal.Footer>
      </Form>
    </Modal>

      <div className='container border border-3 border-black rounded-5 text-bg-secondary' style={{ minWidth: '1200px', minHeight: '100px', position: 'relative', marginTop: '50px'}}>
        <div className="d-flex justify-content-evenly m-3 align-self-stretch">
          <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Поставщики</button>
          <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Закл. договоров</button>
          <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка3</button>
          <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка4</button>
          <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка5</button>
          <button className="btn btn-primary btn-lg" type="button" style={{width:'200px', height:'65px'}}>Кнопка6</button>
        </div>
      </div>
    </div>
  );
}

export default MainPage;