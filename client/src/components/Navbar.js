import Roflik from '../pages/Roflik';
import { Routes, Route } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-dark bg-black">
      <div className="container-fluid bg-black">
        <a className="navbar-brand fw-bold" href="/">Вышивальщики</a>

        {/* Ссылка на админ-панель справа в виде кнопки */}
        <div className="d-flex">
          <a className="btn btn-outline-light btn-sm" href="/roflik">
            <i className="bi bi-gear-fill me-1">
              <Routes>
                <Route path="/roflik" element={<Roflik />} />
              </Routes>
            </i>
            Нажми
          </a>
        </div>
      </div>
    </nav>
  );
}