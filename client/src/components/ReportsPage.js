import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Утилиты ──────────────────────────────────────────────────────────────

const API = (path, token) =>
  fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

const formatMoney = (v) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatNum = (v, decimals = 2) =>
  v != null ? Number(v).toFixed(decimals) : '—';

// Получить токен из localStorage
const getToken = () => localStorage.getItem('token') || '';

// ─── Скелетон ─────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = 20, className = '' }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        width,
        height,
        background:
          'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s infinite',
      }}
    />
  );
}

// ─── Кликабельная карточка метрики ────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon,
  colorClass,
  subtitle,
  onClick,
  clickable = false,
  loading = false,
}) {
  return (
    <div
      className={`card border-0 shadow-sm h-100 ${
        clickable ? 'metric-card-clickable' : ''
      }`}
      onClick={clickable ? onClick : undefined}
      style={
        clickable
          ? { cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }
          : {}
      }
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }
      }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted small fw-semibold text-uppercase">
            {title}
          </span>
          <div className="d-flex align-items-center gap-1">
            {icon && <span className={`fs-4 ${colorClass}`}>{icon}</span>}
            {clickable && (
              <span
                className="text-muted"
                style={{ fontSize: 11 }}
                title="Нажмите для подробностей"
              >
                🔍
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <>
            <Skeleton height={36} className="mb-2" />
            <Skeleton height={14} width="60%" />
          </>
        ) : (
          <>
            <div className={`fs-2 fw-bold ${colorClass}`}>{value}</div>
            {subtitle && (
              <div className="text-muted small mt-1">{subtitle}</div>
            )}
          </>
        )}

        {clickable && !loading && (
          <div className="mt-2">
            <span
              className={`badge ${colorClass
                .replace('text-', 'bg-')
                .replace('bg-warning', 'bg-warning text-dark')} bg-opacity-10 small`}
              style={{ fontSize: 10 }}
            >
              Подробнее →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Мини-календарь ───────────────────────────────────────────────────────

function MiniCalendar({ title, colorClass, icon, eventType }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [events, setEvents] = useState([]);
  const [calLoading, setCalLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { day, x, y, event }

  // Загрузка событий при смене месяца/года
  useEffect(() => {
    let cancelled = false;
    setCalLoading(true);

    API(
      `/kpi/calendar?year=${year}&month=${month}&type=${eventType}`,
      getToken()
    )
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => {
        if (!cancelled) setEvents(d.events || []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setCalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, eventType]);

  // Построение сетки дней
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=вс
  // Смещение: неделя с понедельника
  const offset = (firstDow + 6) % 7;

  // Карта событий: день → event
  const eventMap = {};
  events.forEach((ev) => {
    const d = new Date(ev.date).getDate();
    eventMap[d] = ev;
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthNames = [
    '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  const dowLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Цвет точки события
  const dotColor = eventType === 'delivery' ? '#0d6efd' : '#198754';

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-3">
        {/* Заголовок */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted small fw-semibold text-uppercase">
            {icon} {title}
          </span>
        </div>

        {/* Навигация по месяцам */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <button
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={prevMonth}
          >
            ‹
          </button>
          <span className="fw-semibold small">
            {monthNames[month]} {year}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={nextMonth}
          >
            ›
          </button>
        </div>

        {/* Дни недели */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
          }}
        >
          {dowLabels.map((d) => (
            <div
              key={d}
              className="text-center text-muted"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {d}
            </div>
          ))}

          {/* Пустые ячейки до начала месяца */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e${i}`} />
          ))}

          {/* Дни */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const hasEvent = !!eventMap[day];
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() + 1 &&
              year === today.getFullYear();

            return (
              <div
                key={day}
                className="text-center position-relative"
                style={{
                  fontSize: 11,
                  padding: '3px 0',
                  borderRadius: 4,
                  background: isToday ? '#e8f0fe' : 'transparent',
                  fontWeight: isToday ? 700 : 400,
                  cursor: hasEvent ? 'pointer' : 'default',
                  color: isToday ? '#0d6efd' : '#333',
                }}
                onMouseEnter={(e) => {
                  if (hasEvent) {
                    setTooltip({ day, event: eventMap[day] });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {calLoading ? (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: '#eee',
                      margin: '0 auto',
                    }}
                  />
                ) : (
                  <>
                    {day}
                    {hasEvent && (
                      <span
                        style={{
                          display: 'block',
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: dotColor,
                          margin: '1px auto 0',
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Тултип события */}
        {tooltip && (
          <div
            className="card border shadow-sm position-absolute"
            style={{
              zIndex: 1000,
              bottom: 10,
              right: 10,
              minWidth: 180,
              fontSize: 12,
              pointerEvents: 'none',
            }}
          >
            <div className="card-body p-2">
              <div className="fw-semibold mb-1">
                {tooltip.event.description} — {tooltip.day}{' '}
                {monthNames[month]}
              </div>
              <div className="text-muted">
                Сумма: {formatMoney(tooltip.event.amount)}
              </div>
            </div>
          </div>
        )}

        {/* Легенда */}
        <div className="mt-2 d-flex align-items-center gap-1">
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
            }}
          />
          <span className="text-muted" style={{ fontSize: 10 }}>
            {eventType === 'delivery' ? 'Дата поставки' : 'Дата оплаты'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Модальное окно: Объём закупленного сырья ─────────────────────────────

function PurchaseVolumeModal({ show, onClose, dateFrom, dateTo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    API(
      `/kpi/purchase-volume?date_from=${dateFrom}&date_to=${dateTo}`,
      getToken()
    )
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(setData)
      .catch(() => setData({ items: [] }))
      .finally(() => setLoading(false));
  }, [show, dateFrom, dateTo]);

  if (!show) return null;

  const items = data?.items || [];

  return (
    <ModalWrapper
      title="📦 Объём закупленного сырья"
      subtitle={`Период: ${dateFrom} — ${dateTo}`}
      onClose={onClose}
      size="lg"
    >
      {/* Сводные плашки */}
      {!loading && items.length > 0 && (
        <div className="row g-2 mb-3">
          {[
            {
              label: 'Записей',
              value: items.length,
              color: 'primary',
            },
            {
              label: 'Общий объём',
              value: formatMoney(
                items.reduce((s, i) => s + i.total_purchases_amount, 0)
              ),
              color: 'success',
            },
            {
              label: 'Поставщиков (макс)',
              value: Math.max(...items.map((i) => i.supplier_count)),
              color: 'info',
            },
            {
              label: 'Дефицитов',
              value: items.reduce((s, i) => s + i.shortage_count, 0),
              color: 'danger',
            },
          ].map((s) => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className={`card border-0 bg-${s.color} bg-opacity-10`}>
                <div className="card-body p-2 text-center">
                  <div className={`fw-bold text-${s.color}`}>{s.value}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Таблица */}
      <div className="table-responsive" style={{ maxHeight: 350 }}>
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th>Период</th>
              <th>Тип</th>
              <th className="text-end">Объём закупок</th>
              <th className="text-center">Поставщики</th>
              <th className="text-center">Оборачиваемость</th>
              <th className="text-center">Дефицитов</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}>
                      <Skeleton height={14} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  Нет данных за выбранный период
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-semibold">{item.period_date}</td>
                  <td>
                    <PeriodBadge type={item.period_type} />
                  </td>
                  <td className="text-end text-primary fw-semibold">
                    {formatMoney(item.total_purchases_amount)}
                  </td>
                  <td className="text-center">{item.supplier_count}</td>
                  <td className="text-center">
                    {formatNum(item.stock_turnover)}
                  </td>
                  <td className="text-center">
                    {item.shortage_count > 0 ? (
                      <span className="badge bg-danger">
                        {item.shortage_count}
                      </span>
                    ) : (
                      <span className="badge bg-success">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ModalWrapper>
  );
}

// ─── Модальное окно: Стоимость закупленного сырья ─────────────────────────

function PurchaseCostModal({ show, onClose, dateFrom, dateTo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    API(
      `/kpi/purchase-cost?date_from=${dateFrom}&date_to=${dateTo}`,
      getToken()
    )
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then(setData)
      .catch(() => setData({ items: [] }))
      .finally(() => setLoading(false));
  }, [show, dateFrom, dateTo]);

  if (!show) return null;

  const items = data?.items || [];

  return (
    <ModalWrapper
      title="💰 Стоимость закупленного сырья"
      subtitle={`Период: ${dateFrom} — ${dateTo}`}
      onClose={onClose}
      size="lg"
    >
      {/* Сводные плашки */}
      {!loading && items.length > 0 && (
        <div className="row g-2 mb-3">
          {[
            {
              label: 'Стоимость склада',
              value: formatMoney(
                items.reduce((s, i) => s + i.stock_value, 0)
              ),
              color: 'primary',
            },
            {
              label: 'Общие расходы',
              value: formatMoney(
                items.reduce((s, i) => s + i.total_expenses, 0)
              ),
              color: 'warning',
            },
            {
              label: 'Ср. задержка оплаты',
              value:
                formatNum(
                  items.reduce((s, i) => s + i.payment_delay_avg, 0) /
                    items.length
                ) + ' дн.',
              color: items.some((i) => i.payment_delay_avg > 5)
                ? 'danger'
                : 'success',
            },
          ].map((s) => (
            <div className="col-12 col-md-4" key={s.label}>
              <div className={`card border-0 bg-${s.color} bg-opacity-10`}>
                <div className="card-body p-2 text-center">
                  <div className={`fw-bold text-${s.color}`}>{s.value}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Таблица */}
      <div className="table-responsive" style={{ maxHeight: 350 }}>
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th>Период</th>
              <th>Тип</th>
              <th className="text-end">Стоимость склада</th>
              <th className="text-end">Общие расходы</th>
              <th className="text-center">Задержка оплаты</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}>
                      <Skeleton height={14} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  Нет данных за выбранный период
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-semibold">{item.period_date}</td>
                  <td>
                    <PeriodBadge type={item.period_type} />
                  </td>
                  <td className="text-end text-primary fw-semibold">
                    {formatMoney(item.stock_value)}
                  </td>
                  <td className="text-end text-warning fw-semibold">
                    {formatMoney(item.total_expenses)}
                  </td>
                  <td className="text-center">
                    <DelayBadge days={item.payment_delay_avg} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ModalWrapper>
  );
}

// ─── Обёртка модального окна ──────────────────────────────────────────────

function ModalWrapper({ title, subtitle, onClose, children, size = 'md' }) {
  // Закрытие по Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const maxW = size === 'lg' ? 800 : size === 'xl' ? 1100 : 500;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1040,
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Диалог */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          className="card border-0 shadow-lg"
          style={{
            width: '100%',
            maxWidth: maxW,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalIn .18s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Шапка */}
          <div className="card-header bg-white border-bottom d-flex align-items-start justify-content-between">
            <div>
              <h5 className="mb-0 fw-bold">{title}</h5>
              {subtitle && (
                <span className="text-muted small">{subtitle}</span>
              )}
            </div>
            <button
              className="btn-close"
              onClick={onClose}
              aria-label="Закрыть"
            />
          </div>

          {/* Тело */}
          <div className="card-body overflow-auto">{children}</div>

          {/* Подвал */}
          <div className="card-footer bg-white border-top text-end">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Вспомогательные бейджи ───────────────────────────────────────────────

function PeriodBadge({ type }) {
  const map = {
    month:   { label: 'Месяц',   cls: 'bg-primary' },
    quarter: { label: 'Квартал', cls: 'bg-info text-dark' },
    year:    { label: 'Год',     cls: 'bg-secondary' },
  };
  const s = map[type] || { label: type, cls: 'bg-secondary' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function DelayBadge({ days }) {
  const d = Number(days);
  if (d === 0) return <span className="badge bg-success">0 дн.</span>;
  if (d <= 3)  return <span className="badge bg-warning text-dark">{d.toFixed(1)} дн.</span>;
  return <span className="badge bg-danger">{d.toFixed(1)} дн.</span>;
}

// ─── Главный компонент ────────────────────────────────────────────────────

function ReportsPage({ setError }) {
  const today    = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo,   setDateTo]   = useState(today);
  const [kpi,      setKpi]      = useState(null);
  const [loading,  setLoading]  = useState(false);

  // Состояния модальных окон
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showCostModal,   setShowCostModal]   = useState(false);

  // ── Загрузка KPI ────────────────────────────────────────────────────────
  const fetchKPI = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API(
        `/kpi/summary?date_from=${dateFrom}&date_to=${dateTo}`,
        getToken()
      );
      if (!res.ok) throw new Error('Ошибка загрузки KPI');
      const json = await res.json();
      setKpi(json);
    } catch (e) {
      setError?.(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, setError]);

  useEffect(() => {
    fetchKPI();
  }, [fetchKPI]);

  // ── Рендер ──────────────────────────────────────────────────────────────
  return (
    <div className="p-3 mt-4">
      {/* Глобальные стили */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-16px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      {/* ── Ряд 1: Объём, Стоимость, Сроки поставки ── */}
      <div className="row g-3 mb-3">

        {/* Объём закупленного сырья — кликабельный */}
        <div className="col-12 col-lg-4">
          <MetricCard
            title="Объём закупленного сырья"
            value={loading ? '' : formatMoney(kpi?.total_purchases_amount)}
            icon="📦"
            colorClass="text-primary"
            subtitle={
              kpi
                ? `Поставщиков: ${kpi.supplier_count} · Оборачиваемость: ${formatNum(kpi.stock_turnover)}`
                : 'за выбранный период'
            }
            clickable
            loading={loading}
            onClick={() => setShowVolumeModal(true)}
          />
        </div>

        {/* Стоимость закупленного сырья — кликабельный */}
        <div className="col-12 col-lg-4">
          <MetricCard
            title="Стоимость закупленного сырья"
            value={loading ? '' : formatMoney(kpi?.stock_value)}
            icon="💰"
            colorClass="text-success"
            subtitle={
              kpi
                ? `Расходы: ${formatMoney(kpi.total_expenses)}`
                : 'стоимость на складе'
            }
            clickable
            loading={loading}
            onClick={() => setShowCostModal(true)}
          />
        </div>

        {/* Сроки поставки — календарь */}
        <div className="col-12 col-lg-4" style={{ minHeight: 280 }}>
          <MiniCalendar
            title="Сроки поставки"
            icon="🚚"
            colorClass="text-warning"
            eventType="delivery"
          />
        </div>
      </div>

      {/* ── Ряд 2: Сроки оплаты, Претензии, Задолженность ── */}
      <div className="row g-3 mb-3">

        {/* Сроки оплаты — календарь */}
        <div className="col-12 col-lg-4" style={{ minHeight: 280 }}>
          <MiniCalendar
            title="Сроки оплаты"
            icon="💳"
            colorClass="text-primary"
            eventType="payment"
          />
        </div>

        {/* Количество претензий */}
        <div className="col-12 col-lg-4">
          <MetricCard
            title="Количество претензий к поставщикам"
            value={loading ? '' : (kpi?.shortage_count ?? '—')}
            icon="⚠️"
            colorClass="text-danger"
            subtitle="случаев дефицита / претензий"
            loading={loading}
          />
        </div>

        {/* Уровень кредиторской задолженности */}
        <div className="col-12 col-lg-4">
          <MetricCard
            title="Уровень кредиторской задолженности"
            value={
              loading
                ? ''
                : kpi?.payment_delay_avg != null
                ? `${formatNum(kpi.payment_delay_avg)} дн.`
                : '—'
            }
            icon="📋"
            colorClass={
              kpi?.payment_delay_avg > 5 ? 'text-danger' : 'text-warning'
            }
            subtitle="средняя задержка оплаты"
            loading={loading}
          />
        </div>
      </div>

      {/* ── Модальные окна ── */}
      <PurchaseVolumeModal
        show={showVolumeModal}
        onClose={() => setShowVolumeModal(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <PurchaseCostModal
        show={showCostModal}
        onClose={() => setShowCostModal(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}

export default ReportsPage;
