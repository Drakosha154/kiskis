import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// ── Регистрация шрифта с поддержкой кириллицы ──────────────────────────────
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.ttf',
      fontWeight: 300,
    },
  ],
});

// ── Стили ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },

  // Шапка
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 8,
    color: '#6b7280',
    fontWeight: 300,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTypeBadge: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 8,
    color: '#6b7280',
  },

  // Статус-строка
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    fontSize: 9,
    fontWeight: 700,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusActive: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusOther: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },

  // Секции
  section: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#f8fafc',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  // Строки в секции
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col50: {
    width: '50%',
  },
  col33: {
    width: '33.33%',
  },
  col100: {
    width: '100%',
  },
  label: {
    fontSize: 8,
    color: '#9ca3af',
    fontWeight: 300,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 400,
  },
  valueBold: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 700,
  },
  valueAccent: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 700,
  },
  valuePrimary: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 700,
  },

  // Описание
  descriptionText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6,
  },

  // Разделитель
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 10,
    marginTop: 2,
  },

  // Подвал
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },

  // Подписи
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  signatureBlock: {
    width: '42%',
  },
  signatureTitle: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 24,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    marginBottom: 4,
  },
  signatureCaption: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

// ── Вспомогательные функции ─────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'Н/Д';
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Н/Д';
  return new Date(dateString).toLocaleString('ru-RU');
};

const formatAmount = (amount) => {
  if (amount == null) return '0,00 ₽';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'Завершён':
      return styles.statusCompleted;
    case 'Активен':
      return styles.statusActive;
    default:
      return styles.statusOther;
  }
};

// ── Основной компонент ──────────────────────────────────────────────────────
export const DocumentPDF = ({ docData }) => {
  const doc = docData; // для удобства, чтобы не менять внутренний код
  return (
  <Document
    title={`Документ ${doc.Doc_number}`}
    author="Система управления"
    subject={doc.Doc_type}
    creator="WarehouseApp"
  >
    <Page size="A4" style={styles.page}>

      {/* ── Шапка ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>Система управления складом</Text>
          <Text style={styles.companySubtitle}>
            Автоматически сформированный документ
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docTypeBadge}>{doc.Doc_type}</Text>
          <Text style={styles.docNumber}>{doc.Doc_number}</Text>
        </View>
      </View>

      {/* ── Статус ────────────────────────────────────────────────────── */}
      <View style={styles.statusBar}>
        <Text style={[styles.statusBadge, getStatusStyle(doc.Status)]}>
          {doc.Status}
        </Text>
      </View>

      {/* ── Основная информация ───────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Основная информация</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>Номер документа</Text>
              <Text style={styles.valuePrimary}>{doc.Doc_number}</Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>Тип документа</Text>
              <Text style={styles.valueBold}>{doc.Doc_type}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>Дата создания</Text>
              <Text style={styles.value}>{formatDateTime(doc.Created_at)}</Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>Дата документа</Text>
              <Text style={styles.value}>{formatDate(doc.Doc_date) || 'Н/Д'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>ID документа</Text>
              <Text style={styles.value}>#{doc.ID}</Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>Ответственный пользователь</Text>
              <Text style={styles.value}>{doc.user_name}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Поставщик ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Поставщик</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>Наименование</Text>
              <Text style={styles.valueBold}>{doc.vendor_name}</Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>ID поставщика</Text>
              <Text style={styles.value}>#{doc.Vendor_id}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Финансовая информация ─────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Финансовая информация</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>Итоговая сумма</Text>
              <Text style={styles.valueAccent}>
                {formatAmount(doc.Total_amount)}
              </Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>Валюта</Text>
              <Text style={styles.value}>{doc.Currency}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Описание ──────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Описание</Text>
        </View>
        <View style={styles.sectionBody}>
          <Text style={styles.descriptionText}>
            {doc.Description?.trim() || 'Описание отсутствует'}
          </Text>
        </View>
      </View>

      {/* ── Подписи ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Подписи</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureTitle}>Ответственный:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>
                {doc.user_name} / подпись
              </Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureTitle}>Принял:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>подпись</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Подвал страницы ───────────────────────────────────────────── */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          Сформировано: {new Date().toLocaleString('ru-RU')}
        </Text>
        <Text style={styles.footerText}>{doc.Doc_number}</Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) =>
            `Страница ${pageNumber} из ${totalPages}`
          }
        />
      </View>

    </Page>
  </Document>
);
}