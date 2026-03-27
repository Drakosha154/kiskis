import React, { useState, useEffect, useCallback } from 'react';

// ─── Вспомогательные компоненты ───────────────────────────────────────────

/** Карточка с метрикой */
function MetricCard({ title, value, icon, colorClass, subtitle }) {
  return (
    <div className={`card border-0 shadow-sm h-100`}>
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted small fw-semibold text-uppercase">{title}</span>
          <span className={`fs-4 ${colorClass}`}>{icon}</span>
        </div>
        <div className={`fs-2 fw-bold ${colorClass}`}>{value}</div>
        {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

/** Бейдж статуса договора */
function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Активен',    cls: 'bg-success' },
    completed: { label: 'Завершён',   cls: 'bg-secondary' },
    cancelled: { label: 'Отменён',    cls: 'bg-danger' },
    pending:   { label: 'На рассмотрении', cls: 'bg-warning text-dark' },
  };
  const s = map[status] || { label: status, cls: 'bg-secondary' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

/** Скелетон-загрузчик */
function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div
            className="rounded"
            style={{
              height: 16,
              background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.2s infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

/** Строка «нет данных» */
function EmptyRow({ cols, text }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center text-muted py-4">
        {text}
      </td>
    </tr>
  );
}

/** Компонент календаря */
function Calendar({ events, loading, onDateSelect, selectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = воскресенье
    
    // Преобразуем для начала с понедельника
    let startOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    return { daysInMonth, startOffset };
  };

  const getEventsForDate = (date) => {
    if (!events) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const renderCalendar = () => {
    const { daysInMonth, startOffset } = getDaysInMonth(currentDate);
    const days = [];
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    // Заголовок с днями недели
    days.push(
      <div key="weekdays" className="d-flex mb-1">
        {weekdays.map(day => (
          <div key={day} className="flex-grow-1 text-center fw-semibold text-muted py-1" style={{ flexBasis: 0, fontSize: '0.875rem' }}>
            {day}
          </div>
        ))}
      </div>
    );
    
    // Пустые ячейки для начала месяца
    const emptyCells = [];
    for (let i = 0; i < startOffset; i++) {
      emptyCells.push(
        <div key={`empty-${i}`} className="bg-light" style={{ flexBasis: 0, flexGrow: 1, minHeight: '70px', margin: '1px' }}>
          <div className="p-1 text-muted small"></div>
        </div>
      );
    }
    
    // Ячейки с днями месяца
    const monthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
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
                {dayEvents.slice(0, 1).map((event, idx) => (
                  <div key={idx} className={`text-truncate ${event.type === 'deadline' ? 'text-danger' : 'text-warning'}`}>
                    • {event.title.length > 20 ? event.title.substring(0, 18) + '...' : event.title}
                  </div>
                ))}
                {dayEvents.length > 1 && (
                  <div className="text-muted">+{dayEvents.length - 1}</div>
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
    
    // Объединяем все ячейки в строки
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
              <div className="d-flex gap-2 mt-1">
                <span className={`badge ${event.type === 'deadline' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                  {event.type === 'deadline' ? 'Дедлайн' : 'Поставка'}
                </span>
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
  // Получаем даты: сегодня и месяц назад
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo,   setDateTo]   = useState(today);
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' или 'details'
  const [selectedDate, setSelectedDate] = useState(null);

  // Пример данных для календаря (в реальном приложении будут приходить с API)
  const calendarEvents = [
    { date: '2026-12-15', title: 'Срок оплаты №123', description: 'Оплатить счет 150 000 ₽', type: 'deadline' },
    { date: '2024-12-20', title: 'Поставка сырья', description: '500 кг от ООО "Поставщик"', type: 'delivery' },
    { date: '2024-12-25', title: 'Срок подачи претензии', description: 'По договору №456', type: 'deadline' },
    { date: '2025-01-10', title: 'Плановая проверка', description: 'Проверка качества сырья', type: 'deadline' },
    { date: '2024-12-05', title: 'Согласование договора', description: 'Новый договор с поставщиком', type: 'deadline' },
    { date: '2024-12-18', title: 'Отгрузка готовой продукции', description: 'Заказ №789', type: 'delivery' },
  ];

  // ── Загрузка данных ──────────────────────────────────────────────────────
  // const fetchReports = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  //     const res = await fetch(`/api/reports?${params}`);

  //     if (!res.ok) {
  //       const err = await res.json();
  //       throw new Error(err.error || 'Ошибка загрузки отчёта');
  //     }

  //     const json = await res.json();
  //     setData(json);
  //   } catch (e) {
  //     setError?.(e.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [dateFrom, dateTo, setError]);

  // useEffect(() => {
  //   fetchReports();
  // }, [fetchReports]);

  // ── Форматирование ───────────────────────────────────────────────────────
  const formatMoney = (v) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v);

  const summary = data?.summary;

  // ── Рендер ───────────────────────────────────────────────────────────────
  return (
    <div className="p-3" style={{ height: '100%', overflow: 'auto' }}>
      {/* Анимация shimmer */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
  
      {/* ── Заголовок ── */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold">📊 Отчёты</h4>
          <span className="text-muted small">Сводная аналитика по закупкам</span>
        </div>

        {/* ── Кнопки переключения вкладок ── */}
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
            📅 Сроки
          </button>
        </div>

        {/* ── Фильтр дат ── */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 'auto' }}>
            <span className="input-group-text bg-white">С</span>
            <input
              type="date"
              className="form-control"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="input-group input-group-sm" style={{ width: 'auto' }}>
            <span className="input-group-text bg-white">По</span>
            <input
              type="date"
              className="form-control"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            //onClick={fetchReports}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-1" />
            ) : '🔄'} Обновить
          </button>
        </div>
      </div>


      <div className="container-fluid rounded-3 text-bg-light mt-3 p-0 overflow-hidden">
        {/* Содержимое вкладок */}
        <div className="p-3">
          {/* Вкладка 1: Сводная аналитика */}
          {activeTab === 'summary' && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-6 col-lg-4">
                  <MetricCard
                    title="Объем закупленного сырья"
                    value={loading ? '...' : (summary?.contracts_count ?? '—')}
                    icon="📄"
                    colorClass="text-primary"
                    subtitle="за выбранный период"
                  />
                </div>
                <div className="col-6 col-lg-4">
                  <MetricCard
                    title="Стоимость закупленного сырья"
                    value={loading ? '...' : (summary?.arrivals_count ?? '—')}
                    icon="📦"
                    colorClass="text-success"
                    subtitle="поставок получено"
                  />
                </div>
              </div>
              <div className="row g-3">
                <div className="col-6 col-lg-4">
                  <MetricCard
                    title="Количество претензий к поставщикам"
                    value={loading ? '...' : (summary?.arrivals_count ?? '—')}
                    icon="📦"
                    colorClass="text-success"
                    subtitle="поставок получено"
                  />
                </div>
                <div className="col-6 col-lg-4">
                  <MetricCard
                    title="Уровень кредиторской задолженности"
                    value={loading ? '...' : (summary ? formatMoney(summary.total_spent) : '—')}
                    icon="💰"
                    colorClass="text-warning"
                    subtitle="общая сумма закупок"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Вкладка 2: Календарь сроков с левой панелью событий */}
          {activeTab === 'details' && (
            <div className="row g-3">
              {/* Левая колонка - детали событий */}
              <div className="col-md-5 col-lg-4">
                <EventDetails 
                  selectedDate={selectedDate} 
                  events={calendarEvents} 
                  loading={loading}
                />
              </div>
              
              {/* Правая колонка - календарь */}
              <div className="col-md-7 col-lg-8 border border-1 border-dark p-1 rounded-1">
                <Calendar 
                  events={calendarEvents} 
                  loading={loading}
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;