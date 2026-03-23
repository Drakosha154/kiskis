import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer';

// Шрифт с поддержкой кириллицы (Roboto из CDN pdfmake)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const BLUE = '#003366';
const BLACK = '#000000';
const GRAY = '#808080';
const LIGHT_GRAY = '#f5f5f5';
const WHITE = '#ffffff';

const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 25,
    color: BLACK,
  },

  // ─── Шапка ───────────────────────────────────────────
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 2,
  },
  headerBanner: {
    backgroundColor: BLUE,
    padding: 14,
    marginBottom: 14,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerLeft: { fontSize: 9, color: WHITE },
  headerRight: { fontSize: 9, color: WHITE, textAlign: 'right' },

  // ─── Секция ──────────────────────────────────────────
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: WHITE,
    backgroundColor: BLUE,
    padding: '5 10',
    marginBottom: 6,
    borderRadius: 2,
  },
  sectionBody: {
    paddingHorizontal: 4,
  },

  // ─── Текст ───────────────────────────────────────────
  text: { fontSize: 10, lineHeight: 1.5, marginBottom: 3 },
  bold: { fontWeight: 'bold' },

  // ─── Таблица ─────────────────────────────────────────
  table: { marginTop: 4 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: BLUE,
  },
  tableRow: { flexDirection: 'row' },
  tableRowEven: { backgroundColor: LIGHT_GRAY },
  tableCell: {
    padding: '4 5',
    fontSize: 9,
    borderRightColor: '#cccccc',
    borderRightWidth: 0.5,
  },
  tableCellHead: {
    padding: '4 5',
    fontSize: 9,
    color: WHITE,
    fontWeight: 'bold',
    borderRightColor: '#ffffff',
    borderRightWidth: 0.5,
  },
  cellName:   { width: '38%' },
  cellQty:    { width: '12%', textAlign: 'center' },
  cellUnit:   { width: '10%', textAlign: 'center' },
  cellPrice:  { width: '20%', textAlign: 'right' },
  cellTotal:  { width: '20%', textAlign: 'right', borderRightWidth: 0 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 4,
    borderTopColor: BLUE,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 10, fontWeight: 'bold', color: BLUE, marginRight: 8 },
  totalValue: { fontSize: 11, fontWeight: 'bold', color: BLUE },

  // ─── Реквизиты ───────────────────────────────────────
  signaturesRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  signatureBlock: { flex: 1 },
  signatureTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 5,
    borderBottomColor: BLUE,
    borderBottomWidth: 1,
    paddingBottom: 3,
  },
  signatureLine: {
    marginTop: 18,
    borderTopColor: BLACK,
    borderTopWidth: 0.5,
    width: 120,
  },
  signatureHint: { fontSize: 8, color: GRAY, marginTop: 2 },

  // ─── Подвал ──────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 25,
    right: 25,
    borderTopColor: '#cccccc',
    borderTopWidth: 0.5,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: GRAY },
});

// ─── Вспомогалки ─────────────────────────────────────────────────────────────

const MONTHS = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];

function formatRu(amount) {
  if (amount == null) return '0,00 ₽';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateFull(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} г.`;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export function DocumentPDF({ doc }) {
  console.log('document')
  console.log(doc)
  //const hasItems = doc.items && doc.items.length > 0;
  const createdDate = doc.Created_at;

  return (
    <Document title={`Договор ${doc.Doc_number}`} author="Система управления">
      <Page size="A4" style={s.page}>

        {/* ── Шапка ── */}
        <View style={s.headerBanner}>
          <Text style={s.headerTitle}>ДОГОВОР ПОСТАВКИ</Text>
          <Text style={s.headerSubtitle}>№ {doc.Doc_number}</Text>
          <View style={s.headerRow}>
            <Text style={s.headerLeft}>г. Москва</Text>
            <Text style={s.headerRight}>
              от {createdDate.getDate()} {MONTHS[createdDate.getMonth()]} {createdDate.getFullYear()} г.
            </Text>
          </View>
        </View>

        {/* ── 1. Стороны ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>1. СТОРОНЫ ДОГОВОРА</Text>
          <View style={s.sectionBody}>
            <Text style={s.text}>
              <Text style={s.bold}>Поставщик: </Text>
              {doc.vendor_name}, в лице Генерального директора, действующего на основании
              Устава, именуемый в дальнейшем «Поставщик».
            </Text>
            <Text style={s.text}>
              <Text style={s.bold}>Покупатель: </Text>
              {doc.user_name || 'Покупатель'}, именуемый в дальнейшем «Покупатель».
            </Text>
          </View>
        </View>

        {/* ── 2. Предмет ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>2. ПРЕДМЕТ ДОГОВОРА</Text>
          <View style={s.sectionBody}>
            <Text style={s.text}>
              {doc.Description ||
                'Поставщик обязуется передать в собственность Покупателю товары, а Покупатель ' +
                'обязуется принять и оплатить эти товары на условиях настоящего договора.'}
            </Text>
          </View>
        </View>

        {/* ── 3. Товары / Цена ── */}
        {/* {hasItems ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>3. ПЕРЕЧЕНЬ ТОВАРОВ</Text>
            <View style={[s.sectionBody, s.table]}>

              <View style={s.tableHead}>
                <Text style={[s.tableCellHead, s.cellName]}>Наименование</Text>
                <Text style={[s.tableCellHead, s.cellQty]}>Кол-во</Text>
                <Text style={[s.tableCellHead, s.cellUnit]}>Ед.</Text>
                <Text style={[s.tableCellHead, s.cellPrice]}>Цена</Text>
                <Text style={[s.tableCellHead, s.cellTotal]}>Сумма</Text>
              </View>

              {doc.items.map((item, i) => (
                <View
                  key={i}
                  style={[s.tableRow, i % 2 === 1 ? s.tableRowEven : {}]}
                >
                  <Text style={[s.tableCell, s.cellName]}>{item.name || 'Товар'}</Text>
                  <Text style={[s.tableCell, s.cellQty]}>{item.quantity || 1}</Text>
                  <Text style={[s.tableCell, s.cellUnit]}>{item.unit || 'шт'}</Text>
                  <Text style={[s.tableCell, s.cellPrice]}>{formatRu(item.price)}</Text>
                  <Text style={[s.tableCell, s.cellTotal]}>
                    {formatRu((item.quantity || 1) * (item.price || 0))}
                  </Text>
                </View>
              ))}

              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Итого:</Text>
                <Text style={s.totalValue}>{formatRu(doc.Total_amount)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={s.section}>
            <Text style={s.sectionTitle}>3. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЁТОВ</Text>
            <View style={s.sectionBody}>
              <Text style={s.text}>
                3.1. Общая стоимость настоящего договора составляет{' '}
                <Text style={s.bold}>{formatRu(doc.Total_amount)}</Text>.
              </Text>
              <Text style={s.text}>3.2. НДС не облагается (УСН).</Text>
              <Text style={s.text}>
                3.3. Оплата производится в течение 10 (десяти) рабочих дней с момента
                подписания договора.
              </Text>
            </View>
          </View>
        )} */}

        {/* ── 4. Условия поставки ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>4. УСЛОВИЯ ПОСТАВКИ</Text>
          <View style={s.sectionBody}>
            <Text style={s.text}>
              4.1. Поставка осуществляется в течение 14 (четырнадцати) рабочих дней с
              момента получения предоплаты.
            </Text>
            <Text style={s.text}>
              4.2. Доставка товаров осуществляется силами Поставщика за его счёт.
            </Text>
            <Text style={s.text}>
              4.3. Право собственности переходит к Покупателю с момента подписания
              товарной накладной.
            </Text>
          </View>
        </View>

        {/* ── 5. Ответственность ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>5. ОТВЕТСТВЕННОСТЬ СТОРОН</Text>
          <View style={s.sectionBody}>
            <Text style={s.text}>
              5.1. За нарушение сроков поставки Поставщик уплачивает пеню в размере 0,1%
              от стоимости непоставленного товара за каждый день просрочки.
            </Text>
            <Text style={s.text}>
              5.2. За нарушение сроков оплаты Покупатель уплачивает пеню в размере 0,1%
              от суммы просроченного платежа за каждый день просрочки.
            </Text>
            <Text style={s.text}>
              5.3. Уплата неустойки не освобождает стороны от исполнения обязательств.
            </Text>
          </View>
        </View>

        {/* ── 6. Реквизиты ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>6. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</Text>
          <View style={[s.sectionBody, s.signaturesRow]}>
            {/* Поставщик */}
            <View style={s.signatureBlock}>
              <Text style={s.signatureTitle}>ПОСТАВЩИК</Text>
              <Text style={s.text}>Наименование: {doc.vendor_name}</Text>
              <Text style={s.text}>ИНН: 7701234567</Text>
              <Text style={s.text}>КПП: 770101001</Text>
              <Text style={s.text}>ОГРН: 1234567890123</Text>
              <Text style={s.text}>Адрес: 127000, г. Москва, ул. Тверская, д. 1</Text>
              <Text style={s.text}>р/с 40702810123456789012</Text>
              <Text style={s.text}>ПАО Сбербанк, БИК 044525225</Text>
              <Text style={s.text}>к/с 30101810400000000225</Text>
              <View style={s.signatureLine} />
              <Text style={s.signatureHint}>подпись / расшифровка</Text>
            </View>

            {/* Покупатель */}
            <View style={s.signatureBlock}>
              <Text style={s.signatureTitle}>ПОКУПАТЕЛЬ</Text>
              <Text style={s.text}>Наименование: {doc.user_name || 'Покупатель'}</Text>
              <Text style={s.text}>ИНН: 7709876543</Text>
              <Text style={s.text}>КПП: 770901002</Text>
              <Text style={s.text}>ОГРН: 9876543210987</Text>
              <Text style={s.text}>Адрес: 127000, г. Москва, ул. Арбат, д. 10</Text>
              <View style={s.signatureLine} />
              <Text style={s.signatureHint}>подпись / расшифровка</Text>
            </View>
          </View>
        </View>

        {/* ── Подвал ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Договор № {doc.Doc_number} от {formatDateFull(doc.Created_at)}
          </Text>
          <Text style={s.footerText}>
            Сформирован: {new Date().toLocaleString('ru-RU')}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
