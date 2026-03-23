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
  const [activeTab, setActiveTab] = useState('contracts');

  // ── Загрузка данных ──────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`/api/reports?${params}`);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка загрузки отчёта');
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      setError?.(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, setError]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Форматирование ───────────────────────────────────────────────────────
  const formatMoney = (v) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v);

  const summary = data?.summary;

  // ── Рендер ───────────────────────────────────────────────────────────────
  return (
    <div className="p-3">
      {/* Анимация shimmer */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Заголовок ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold">📊 Отчёты</h4>
          <span className="text-muted small">Сводная аналитика по закупкам</span>
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
            onClick={fetchReports}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-1" />
            ) : '🔄'} Обновить
          </button>
        </div>
      </div>

      {/* ── Карточки метрик ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <MetricCard
            title="Договоров заключено"
            value={loading ? '...' : (summary?.contracts_count ?? '—')}
            icon="📄"
            colorClass="text-primary"
            subtitle="за выбранный период"
          />
        </div>
        <div className="col-6 col-lg-3">
          <MetricCard
            title="Приходов оформлено"
            value={loading ? '...' : (summary?.arrivals_count ?? '—')}
            icon="📦"
            colorClass="text-success"
            subtitle="поставок получено"
          />
        </div>
        <div className="col-6 col-lg-3">
          <MetricCard
            title="Затрачено средств"
            value={loading ? '...' : (summary ? formatMoney(summary.total_spent) : '—')}
            icon="💰"
            colorClass="text-warning"
            subtitle="общая сумма закупок"
          />
        </div>
        <div className="col-6 col-lg-3">
          <MetricCard
            title="Поставок с браком"
            value={loading ? '...' : (summary?.defective_deliveries ?? '—')}
            icon="⚠️"
            colorClass="text-danger"
            subtitle="неудовлетворительных"
          />
        </div>
      </div>
    </div>
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

export default ReportsPage;
