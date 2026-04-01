import React, { useState, useEffect, useCallback } from 'react';

// ─── Вспомогательные компоненты ───────────────────────────────────────────

/** Карточка с метрикой (с возможностью клика для открытия модального окна) */
function MetricCard({ title, value, icon, colorClass, subtitle, onClick, loading }) {
  return (
    <div 
      className={`card border-0 shadow-sm h-100 ${onClick ? 'cursor-pointer hover-shadow' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer', transition: 'all 0.2s' } : {}}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="fs-5 text-muted small fw-semibold text-uppercase">{title}</span>
          <span className={`fs-4 ${colorClass}`}>{icon}</span>
        </div>
        <div className={`fs-1 fw-bold ${colorClass} mt-5`}>
          {loading ? (
            <div className="skeleton-line" style={{ width: '80px', height: '32px', background: '#e0e0e0', borderRadius: '4px' }} />
          ) : value}
        </div>
        {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

  // Форматирование даты и времени
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

/** Модальное окно для детальной информации */
function DetailModal({ isOpen, onClose, title, data, loading }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-lg modal-dialog-centered" 
        style={{ maxWidth: '800px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <span className="me-2">📊</span>
              {title}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Загрузка...</span>
                </div>
              </div>
            ) : (
              data
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Компонент для отображения деталей закупленного сырья */
function PurchasedProductsDetail({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <div className="fs-2 mb-2">📦</div>
        <p>Нет данных о закупленном сырье за выбранный период</p>
      </div>
    );
  }

  const totalQuantity = products.reduce((sum, p) => sum + p.total_quantity, 0);
  const totalAmount = products.reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div>
      <div className="alert alert-info mb-3 text-center">
        <div className="mb-2"><strong>Итого:</strong></div>
        <div className="fs-4 fw-bold">{totalQuantity.toFixed(2)} ед.</div>
        <div className="fs-3 fw-bold text-primary mt-2">
          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(totalAmount)}
        </div>
      </div>
      <h6 className="mb-3">Список закупленного сырья ({products.length})</h6>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Наименование</th>
              <th>Артикул</th>
              <th className="text-center">Количество</th>
              <th>Ед. изм.</th>
              <th className="text-center">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr key={idx}>
                <td>{product.product_name}</td>
                <td>{product.product_article || '—'}</td>
                <td className="text-center" style={{ fontSize: '1.05rem' }}>{product.total_quantity.toFixed(2)}</td>
                <td>{product.unit || 'шт'}</td>
                <td className="text-center fw-bold" style={{ fontSize: '1.05rem' }}>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(product.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Компонент для отображения деталей стоимости закупок */
function PurchaseCostDetail({ documents }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <div className="fs-2 mb-2">💰</div>
        <p>Нет документов закупок за выбранный период</p>
      </div>
    );
  }

  const total = documents.reduce((sum, d) => sum + d.total_amount, 0);

  return (
    <div>
      <div className="alert alert-success mb-3 text-center">
        <div className="mb-2"><strong>Общая стоимость закупок:</strong></div>
        <div className="fs-2 fw-bold text-success">
          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(total)}
        </div>
      </div>
      <h6 className="mb-3">Список документов закупок ({documents.length})</h6>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>№ документа</th>
              <th>Поставщик</th>
              <th>Дата</th>
              <th className="text-center">Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, idx) => (
              <tr key={idx}>
                <td>{doc.doc_number}</td>
                <td>{doc.vendor_name}</td>
                <td>{doc.doc_date}</td>
                <td className="text-center fw-bold" style={{ fontSize: '1.05rem' }}>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(doc.total_amount)}</td>
                <td><StatusBadge status={doc.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Компонент для отображения деталей претензий из claim_reports */
function ClaimsDetail({ claimsData }) {
  if (!claimsData || !claimsData.claims || claimsData.claims.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <div className="fs-2 mb-2">⚖️</div>
        <p>Нет претензий за выбранный период</p>
      </div>
    );
  }

  const { claims, summary } = claimsData;

  // Функция для получения бейджей типов претензий
  const getClaimTypeBadges = (claim) => {
    const badges = [];
    if (claim.marriage) badges.push(<span key="marriage" className="badge bg-danger me-1">Брак</span>);
    if (claim.deadline) badges.push(<span key="deadline" className="badge bg-warning text-dark me-1">Просрочка</span>);
    if (claim.quantity) badges.push(<span key="quantity" className="badge bg-info me-1">Недопоставка</span>);
    return badges;
  };

  return (
    <div>
      <div className="alert alert-danger mb-3 text-center">
        <div className="mb-2"><strong>Всего претензий:</strong></div>
        <div className="fs-2 fw-bold text-danger mb-3"  style={{marginTop: '50px'}}>{summary.total}</div>
        <div className="mt-2">
          <span className="me-3 fs-5">🔴 Брак: <strong>{summary.marriage}</strong></span>
          <span className="me-3 fs-5">⚠️ Просрочка: <strong>{summary.deadline}</strong></span>
          <span className="fs-5">ℹ️ Недопоставка: <strong>{summary.quantity}</strong></span>
        </div>
      </div>
      <h6 className="mb-3">Список претензий ({claims.length} документов)</h6>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>№ документа</th>
              <th>Поставщик</th>
              <th>Дата документа</th>
              <th className="text-center">Сумма</th>
              <th>Типы претензий</th>
              <th>Дата создания</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td>{claim.doc_number}</td>
                <td>{claim.vendor_name}</td>
                <td>{claim.doc_date}</td>
                <td className="text-center fw-bold" style={{ fontSize: '1.05rem' }}>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(claim.total_amount)}</td>
                <td>{getClaimTypeBadges(claim)}</td>
                <td>{new Date(claim.created_at).toLocaleDateString('ru-RU')}</td>
                <td><StatusBadge status={claim.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Компонент для отображения деталей задолженности */
function AccountsPayableDetail({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        <div className="fs-2 mb-2">💰</div>
        <p>Нет непогашенной задолженности</p>
      </div>
    );
  }

  const total = accounts.reduce((sum, acc) => sum + acc.total_amount, 0);

  return (
    <div>
      <div className="alert alert-warning mb-3 text-center">
        <div className="mb-2"><strong>Общая задолженность:</strong></div>
        <div className="fs-2 fw-bold text-warning">
          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(total)}
        </div>
      </div>
      <h6 className="mb-3">Список непогашенных документов ({accounts.length})</h6>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>№ документа</th>
              <th>Поставщик</th>
              <th>Дата</th>
              <th className="text-center">Сумма</th>
              <th>Срок оплаты</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, idx) => {
              const isOverdue = acc.deadline_date && new Date(acc.deadline_date) < new Date();
              return (
                <tr key={idx} className={isOverdue ? 'table-danger' : ''}>
                  <td>{acc.doc_number}</td>
                  <td>{acc.vendor_name}</td>
                  <td>{formatDateTime(acc.doc_date)}</td>
                  {console.log(acc)}
                  <td className="text-center fw-bold" style={{ fontSize: '1.05rem' }}>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(acc.total_amount-acc.paid_amount)}</td>
                  <td>{formatDateTime(acc.deadline_date) || '—'}</td>
                  <td>
                    {isOverdue ? (
                      <span className="badge bg-danger">Просрочено</span>
                    ) : acc.deadline_date ? (
                      <span className="badge bg-warning text-dark">Ожидает</span>
                    ) : (
                      <StatusBadge status={acc.status} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Бейдж статуса */
function StatusBadge({ status }) {
  const map = {
    active: { label: 'Активен', cls: 'bg-success' },
    completed: { label: 'Завершён', cls: 'bg-secondary' },
    cancelled: { label: 'Отменён', cls: 'bg-danger' },
    pending: { label: 'На рассмотрении', cls: 'bg-warning text-dark' },
    'Выполнен вовремя': { label: 'Выполнен вовремя', cls: 'bg-success' },
    'Просрочен': { label: 'Просрочен', cls: 'bg-danger' },
    'Просрочена поставка': { label: 'Просрочена поставка', cls: 'bg-danger' },
    'Оплачен': { label: 'Оплачен', cls: 'bg-info' },
    'Черновик': { label: 'Черновик', cls: 'bg-secondary' },
  };
  const s = map[status] || { label: status, cls: 'bg-secondary' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

/** Компонент календаря */
function Calendar({ events, loading, onDateSelect, selectedDate, dateRange }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();
    let startOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    return { daysInMonth, startOffset };
  };

  const getEventsForDate = (date) => {
    if (!events) return [];
    const dateStr = getLocalDateString(date);
    return events.filter(event => event.date === dateStr);
  };

  const renderCalendar = () => {
    const { daysInMonth, startOffset } = getDaysInMonth(currentDate);
    const days = [];
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    days.push(
      <div key="weekdays" className="d-flex mb-1">
        {weekdays.map(day => (
          <div key={day} className="flex-grow-1 text-center fw-semibold text-muted py-1" style={{ flexBasis: 0, fontSize: '0.875rem' }}>
            {day}
          </div>
        ))}
      </div>
    );
    
    const emptyCells = [];
    for (let i = 0; i < startOffset; i++) {
      emptyCells.push(
        <div key={`empty-${i}`} className="bg-light" style={{ flexBasis: 0, flexGrow: 1, minHeight: '70px', margin: '1px' }}>
          <div className="p-1 text-muted small"></div>
        </div>
      );
    }
    
    const monthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = getLocalDateString(date);
      const dayEvents = getEventsForDate(date);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = selectedDate === dateStr;
      
      monthDays.push(
        <div 
          key={day}
          className={`border rounded ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light'} ${isToday ? 'bg-info bg-opacity-25' : ''}`}
          style={{ flexBasis: 0, flexGrow: 1, minHeight: '70px', margin: '1px', cursor: 'pointer' }}
          onClick={() => onDateSelect(dateStr)}
        >
          <div className="p-1">
            <div className={`fw-semibold mb-1 ${isToday ? 'text-info' : ''}`} style={{ fontSize: '0.875rem' }}>
              {day}
            </div>
            {!loading && dayEvents.length > 0 && (
              <div className="small" style={{ fontSize: '0.7rem' }}>
                {dayEvents.slice(0, 2).map((event, idx) => (
                  <div key={idx} className={`text-truncate ${event.type === 'deadline' ? 'text-danger' : 'text-warning'}`}>
                    {event.type === 'deadline' ? '⚠️' : '🚚'} {event.title.length > 15 ? event.title.substring(0, 13) + '...' : event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-muted small">+{dayEvents.length - 2}</div>
                )}
              </div>
            )}
            {loading && (
              <div className="mt-1">
                <div className="skeleton-line w-75 mb-1" style={{ height: '8px', background: '#e0e0e0', borderRadius: '2px' }} />
                <div className="skeleton-line w-50" style={{ height: '8px', background: '#e0e0e0', borderRadius: '2px' }} />
              </div>
            )}
          </div>
        </div>
      );
    }
    
    const allCells = [...emptyCells, ...monthDays];
    const rows = [];
    for (let i = 0; i < allCells.length; i += 7) {
      rows.push(
        <div key={`row-${i}`} className="d-flex mb-1" style={{ minHeight: '70px' }}>
          {allCells.slice(i, i + 7)}
        </div>
      );
    }
    
    return (
      <div>
        {days}
        {rows}
      </div>
    );
  };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    onDateSelect(null);
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => changeMonth(-1)}>
          ← Предыдущий
        </button>
        <h5 className="mb-0 fw-semibold" style={{ fontSize: '1rem' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => changeMonth(1)}>
          Следующий →
        </button>
      </div>
      {renderCalendar()}
      {dateRange && (
        <div className="mt-2 small text-muted text-center">
          📅 Отображаются события за весь период: {dateRange.start} — {dateRange.end}
        </div>
      )}
    </div>
  );
}

/** Компонент для отображения деталей выбранной даты */
function EventDetails({ selectedDate, events, loading }) {
  const getEventsForDate = (dateStr) => {
    if (!events || !dateStr) return [];
    return events.filter(event => event.date === dateStr);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const dayEvents = getEventsForDate(selectedDate);

  if (!selectedDate) {
    return (
      <div className="bg-light rounded p-3 h-100 d-flex align-items-center justify-content-center">
        <div className="text-center text-muted">
          <div className="fs-2 mb-2">📅</div>
          <h6 className="mb-1">Выберите дату в календаре</h6>
          <p className="mb-0 small">Нажмите на любой день, чтобы увидеть события</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-light rounded p-3 h-100">
        <div className="skeleton-line w-75 mb-2" style={{ height: '20px', background: '#e0e0e0', borderRadius: '4px' }} />
        <div className="skeleton-line w-100 mb-2" style={{ height: '50px', background: '#e0e0e0', borderRadius: '4px' }} />
        <div className="skeleton-line w-100 mb-2" style={{ height: '50px', background: '#e0e0e0', borderRadius: '4px' }} />
        <div className="skeleton-line w-100" style={{ height: '50px', background: '#e0e0e0', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div className="bg-light rounded p-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
      <div className="mb-3">
        <h6 className="mb-1 fw-bold">📅 {formatDate(selectedDate)}</h6>
        <div className="small text-muted">События на этот день</div>
      </div>
      
      {dayEvents.length > 0 ? (
        <div>
          {dayEvents.map((event, idx) => (
            <div key={idx} className="mb-2 p-2 bg-white rounded border shadow-sm">
              <div className={`fw-semibold mb-1 small ${event.type === 'deadline' ? 'text-danger' : 'text-warning'}`}>
                {event.type === 'deadline' ? '⚠️ ' : '🚚 '}{event.title}
              </div>
              <div className="small text-muted mb-1">{event.description}</div>
              {event.document_id && (
                <div className="small text-muted">Документ №: {event.document_id}</div>
              )}
              <div className="d-flex gap-2 mt-1">
                <span className={`badge ${event.type === 'deadline' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                  {event.type === 'deadline' ? 'Дедлайн' : 'Поставка'}
                </span>
                {event.status && <StatusBadge status={event.status} />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted py-3">
          <div className="fs-2 mb-2">✨</div>
          <p className="mb-0 small">Нет событий на этот день</p>
        </div>
      )}
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────

function ReportsPage({ setError }) {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [selectedMonth, setSelectedMonth] = useState(new Date()); // текущий месяц
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Состояния для модальных окон
  const [modalOpen, setModalOpen] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const getToken = () => localStorage.getItem('token');

  // Вспомогательные функции для работы с месяцами
const getMonthStart = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

const getMonthEnd = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
};

const formatMonthYear = (date) => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const changeMonth = (increment) => {
  setSelectedMonth(prevMonth => {
    const newDate = new Date(prevMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    return newDate;
  });
};

  const fetchReports = useCallback(async () => {
  setLoading(true);
  try {
    const token = getToken();
    const dateFrom = getMonthStart(selectedMonth);
    const dateTo = getMonthEnd(selectedMonth);
    
    const summaryRes = await fetch(
      `http://localhost:8080/api/reports/summary?date_from=${dateFrom}&date_to=${dateTo}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!summaryRes.ok) throw new Error('Failed to fetch summary');
    const summaryData = await summaryRes.json();

    console.log(summary)
    setSummary(summaryData.summary);
    
  } catch (err) {
    console.error('Error fetching reports:', err);
    if (setError) setError('Ошибка загрузки данных отчётов');
  } finally {
    setLoading(false);
  }
}, [selectedMonth, setError]);

  // Получение событий календаря за весь период
  const fetchCalendarEvents = useCallback(async () => {
    try {
      const token = getToken();
      const eventsRes = await fetch(
        `http://localhost:8080/api/reports/calendar-events?date_from=${yearAgo}&date_to=${nextYear}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (!eventsRes.ok) throw new Error('Failed to fetch calendar events');
      const eventsData = await eventsRes.json();
      setCalendarEvents(eventsData.events || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }
  }, [yearAgo, nextYear]);

  // Получение детальных данных для модального окна
  const fetchModalDetails = async (type) => {
  setModalLoading(true);
  try {
    const token = getToken();
    const dateFrom = getMonthStart(selectedMonth);
    const dateTo = getMonthEnd(selectedMonth);
    let response;
    
    switch (type) {
      case 'purchased':
        response = await fetch(
          `http://localhost:8080/api/reports/purchased-products?date_from=${dateFrom}&date_to=${dateTo}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        break;
      case 'cost':
        response = await fetch(
          `http://localhost:8080/api/reports/purchase-cost?date_from=${dateFrom}&date_to=${dateTo}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        break;
      case 'claims':
        response = await fetch(
          `http://localhost:8080/api/reports/claims-detail?date_from=${dateFrom}&date_to=${dateTo}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        break;
      case 'accounts':
        response = await fetch(
          `http://localhost:8080/api/reports/accounts-payable-detail`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        break;
      default:
        return;
    }
    
    if (!response.ok) throw new Error('Failed to fetch details');
    const data = await response.json();
    setModalData(data);
  } catch (err) {
    console.error('Error fetching modal details:', err);
    setModalData({ error: true, message: 'Ошибка загрузки данных' });
  } finally {
    setModalLoading(false);
  }
};

  const openModal = (type, title) => {
    setModalTitle(title);
    setModalOpen(type);
    fetchModalDetails(type);
  };

  const closeModal = () => {
    setModalOpen(null);
    setModalData(null);
  };

  useEffect(() => {
    fetchReports();
    fetchCalendarEvents();
  }, [fetchReports, fetchCalendarEvents]);

  const formatMoney = (v) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v);

  // Рендер содержимого модального окна
  const renderModalContent = () => {
    if (modalData?.error) {
      return <div className="alert alert-danger">{modalData.message}</div>;
    }
    
    switch (modalOpen) {
      case 'purchased':
        return <PurchasedProductsDetail products={modalData?.products || []} />;
      case 'cost':
        return <PurchaseCostDetail documents={modalData?.documents || []} />;
      case 'claims':
        return <ClaimsDetail claimsData={modalData} />;
      case 'accounts':
        return <AccountsPayableDetail accounts={modalData?.accounts || []} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-3" style={{ height: '100%', overflow: 'auto' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-shadow {
          transition: all 0.2s ease;
        }
        .hover-shadow:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
  
      {/* ── Заголовок ── */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold">📊 Отчёты</h4>
          <span className="text-muted small">Сводная аналитика по закупкам</span>
        </div>

        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('summary')}
          >
            📈 Сводная аналитика
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'details' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('details')}
          >
            📅 Сроки и календарь
          </button>
        </div>

        {activeTab === 'summary' && (
  <div className="d-flex align-items-center gap-2 flex-wrap">
    <button
      className="btn btn-outline-secondary btn-sm"
      onClick={() => changeMonth(-1)}
      disabled={loading}
      title="Предыдущий месяц"
    >
      ← Предыдущий
    </button>
    
    <div className="px-3 py-1 bg-light rounded border" style={{ minWidth: '150px', textAlign: 'center' }}>
      <strong>{formatMonthYear(selectedMonth)}</strong>
    </div>
    
    <button
      className="btn btn-outline-secondary btn-sm"
      onClick={() => changeMonth(1)}
      disabled={loading}
      title="Следующий месяц"
    >
      Следующий →
    </button>
  </div>
)}
      </div>

      <div className="container-fluid rounded-3 text-bg-light mt-3 p-0 overflow-hidden">
        <div className="p-3">
          {/* Вкладка 1: Сводная аналитика - 4 основные метрики */}
          {activeTab === 'summary' && (
            <div className="row g-4">
              <div className="col-md-6">
                <MetricCard
                  title="Объём закупленного сырья"
                  value={loading ? '...' : (summary?.purchased_quantity !== undefined ? `${summary.purchased_quantity.toFixed(2)} ед.` : '—')}
                  icon="📦"
                  colorClass="text-primary"
                  onClick={() => openModal('purchased', 'Детали закупленного сырья')}
                  loading={loading}
                />
              </div>
              <div className="col-md-6" style={{height: '250px'}}>
                <MetricCard
                  title="Стоимость закупленного сырья"
                  value={loading ? '...' : (summary?.total_spent !== undefined ? formatMoney(summary.total_spent) : '—')}
                  icon="💰"
                  colorClass="text-success"
                  onClick={() => openModal('cost', 'Детали стоимости закупок')}
                  loading={loading}
                />
              </div>
              <div className="col-md-6">
                <MetricCard
                  title="Количество претензий"
                  value={loading ? '...' : (summary?.claims_count ?? '—')}
                  icon="⚠️"
                  colorClass="text-danger"
                  onClick={() => openModal('claims', 'Детали претензий')}
                  loading={loading}
                />
              </div>
              <div className="col-md-6" style={{height: '250px'}}>
                <MetricCard
                  title="Уровень задолженности"
                  value={loading ? '...' : (summary?.accounts_payable !== undefined ? formatMoney(summary.accounts_payable) : '—')}
                  icon="🏦"
                  colorClass="text-warning"  
                  onClick={() => openModal('accounts', 'Кредиторская задолженность')}
                  loading={loading}
                />
              </div>
            </div>
          )}
          
          {/* Вкладка 2: Календарь сроков */}
          {activeTab === 'details' && (
            <div className="row g-3">
              <div className="col-md-5 col-lg-4">
                <EventDetails 
                  selectedDate={selectedDate} 
                  events={calendarEvents} 
                  loading={loading}
                />
              </div>
              <div className="col-md-7 col-lg-8 border border-1 border-dark p-1 rounded-1">
                <Calendar 
                  events={calendarEvents} 
                  loading={loading}
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                  dateRange={{ start: yearAgo, end: nextYear }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      <DetailModal
        isOpen={modalOpen !== null}
        onClose={closeModal}
        title={modalTitle}
        data={renderModalContent()}
        loading={modalLoading}
      />
    </div>
  );
}

export default ReportsPage;