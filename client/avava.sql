--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2026-04-09 22:03:49

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 80077)
-- Name: accountings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accountings (
    id integer NOT NULL,
    operation_date date NOT NULL,
    operation_type character varying(50) NOT NULL,
    document_id integer NOT NULL,
    supplier_id integer,
    amount numeric(12,2) NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0,
    description text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounting_operation_type_check CHECK (((operation_type)::text = ANY (ARRAY[('expense'::character varying)::text, ('income'::character varying)::text])))
);


ALTER TABLE public.accountings OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 80085)
-- Name: accounting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounting_id_seq OWNER TO postgres;

--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 218
-- Name: accounting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounting_id_seq OWNED BY public.accountings.id;


--
-- TOC entry 219 (class 1259 OID 80086)
-- Name: claim_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_reports (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    marriage boolean DEFAULT false,
    deadline boolean DEFAULT false,
    quantity boolean DEFAULT false,
    created_at timestamp with time zone
);


ALTER TABLE public.claim_reports OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 80092)
-- Name: claim_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claim_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claim_reports_id_seq OWNER TO postgres;

--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 220
-- Name: claim_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claim_reports_id_seq OWNED BY public.claim_reports.id;


--
-- TOC entry 221 (class 1259 OID 80096)
-- Name: document_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_items (
    id integer NOT NULL,
    document_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    amount numeric(12,2) GENERATED ALWAYS AS ((quantity * price)) STORED,
    vat_rate numeric(5,2) DEFAULT 0,
    created_at timestamp without time zone
);


ALTER TABLE public.document_items OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 80101)
-- Name: document_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_items_id_seq OWNER TO postgres;

--
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 222
-- Name: document_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_items_id_seq OWNED BY public.document_items.id;


--
-- TOC entry 223 (class 1259 OID 80102)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    doc_number character varying(50) NOT NULL,
    doc_type character varying(50) NOT NULL,
    doc_date text NOT NULL,
    vendor_id integer,
    user_id integer,
    status character varying(50) DEFAULT 'Черновик'::character varying,
    total_amount numeric(12,2) DEFAULT 0,
    currency character varying(3) DEFAULT 'RUB'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivery_date date,
    deadline_date date,
    delivery_days integer,
    actual_delivery_date date,
    payment_terms character varying(20) DEFAULT 'postpaid'::character varying,
    paid_amount numeric(10,2) DEFAULT 0,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying,
    CONSTRAINT documents_doc_type_check CHECK (((doc_type)::text = ANY (ARRAY[('Договор'::character varying)::text, ('Приход'::character varying)::text, ('Чек'::character varying)::text]))),
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY (ARRAY[('Черновик'::character varying)::text, ('Утверждён'::character varying)::text, ('Отклонён'::character varying)::text, ('Расхождение'::character varying)::text, ('Завершён'::character varying)::text, ('Частично исполнен'::character varying)::text, ('Исполнен'::character varying)::text])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN documents.payment_terms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documents.payment_terms IS 'Условия оплаты: prepaid (100%), partial (50%), postpaid (после поставки)';


--
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN documents.paid_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documents.paid_amount IS 'Уже оплаченная сумма';


--
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN documents.payment_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documents.payment_status IS 'Статус оплаты: unpaid, partially_paid, fully_paid';


--
-- TOC entry 224 (class 1259 OID 80113)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 224
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 225 (class 1259 OID 80128)
-- Name: money; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.money (
    money real NOT NULL
);


ALTER TABLE public.money OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 80375)
-- Name: product_location_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_location_mappings (
    id integer NOT NULL,
    product_id integer NOT NULL,
    location_id integer NOT NULL,
    quantity numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity_positive CHECK ((quantity >= (0)::numeric))
);


ALTER TABLE public.product_location_mappings OWNER TO postgres;

--
-- TOC entry 4983 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE product_location_mappings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.product_location_mappings IS 'Связь многие-ко-многим между товарами и ячейками склада';


--
-- TOC entry 4984 (class 0 OID 0)
-- Dependencies: 239
-- Name: COLUMN product_location_mappings.product_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.product_location_mappings.product_id IS 'ID товара';


--
-- TOC entry 4985 (class 0 OID 0)
-- Dependencies: 239
-- Name: COLUMN product_location_mappings.location_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.product_location_mappings.location_id IS 'ID ячейки склада';


--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 239
-- Name: COLUMN product_location_mappings.quantity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.product_location_mappings.quantity IS 'Количество товара в этой конкретной ячейке';


--
-- TOC entry 238 (class 1259 OID 80374)
-- Name: product_location_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_location_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_location_mappings_id_seq OWNER TO postgres;

--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 238
-- Name: product_location_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_location_mappings_id_seq OWNED BY public.product_location_mappings.id;


--
-- TOC entry 226 (class 1259 OID 80131)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    article character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    unit character varying(20) NOT NULL,
    category character varying(100),
    min_stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    max_stock integer DEFAULT 0
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 80138)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 227
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 228 (class 1259 OID 80139)
-- Name: storages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.storages (
    id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric(10,2) DEFAULT 0 NOT NULL,
    last_receipt_date timestamp without time zone,
    last_receipt_document_id integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.storages OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 80144)
-- Name: stock_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_balance_id_seq OWNER TO postgres;

--
-- TOC entry 4989 (class 0 OID 0)
-- Dependencies: 229
-- Name: stock_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_balance_id_seq OWNED BY public.storages.id;


--
-- TOC entry 230 (class 1259 OID 80145)
-- Name: vendor_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_products (
    id integer NOT NULL,
    vendor_id integer NOT NULL,
    product_id integer NOT NULL,
    vendor_price numeric(10,2),
    currency character varying(3) DEFAULT 'RUB'::character varying,
    delivery_days integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vendor_products OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 80150)
-- Name: supplier_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_products_id_seq OWNER TO postgres;

--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 231
-- Name: supplier_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_products_id_seq OWNED BY public.vendor_products.id;


--
-- TOC entry 232 (class 1259 OID 80151)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    company_name character varying(200) NOT NULL,
    contact_person character varying(100),
    phone character varying(20),
    email character varying(100),
    address text,
    inn character varying(12),
    kpp character varying(9),
    payment_account character varying(20),
    bank_name character varying(200),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 80157)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- TOC entry 4991 (class 0 OID 0)
-- Dependencies: 233
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.vendors.id;


--
-- TOC entry 234 (class 1259 OID 80158)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('менеджер'::character varying)::text, ('кладовщик'::character varying)::text, ('бухгалтер'::character varying)::text, ('директор'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 80163)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 237 (class 1259 OID 80346)
-- Name: warehouse_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_locations (
    id integer NOT NULL,
    rack character varying(10) NOT NULL,
    shelf integer NOT NULL,
    cell integer NOT NULL,
    location_code character varying(20) NOT NULL,
    capacity double precision DEFAULT 100,
    occupied double precision DEFAULT 0,
    product_id integer,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.warehouse_locations OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 80345)
-- Name: warehouse_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouse_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouse_locations_id_seq OWNER TO postgres;

--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 236
-- Name: warehouse_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouse_locations_id_seq OWNED BY public.warehouse_locations.id;


--
-- TOC entry 4695 (class 2604 OID 80164)
-- Name: accountings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings ALTER COLUMN id SET DEFAULT nextval('public.accounting_id_seq'::regclass);


--
-- TOC entry 4698 (class 2604 OID 80165)
-- Name: claim_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_reports ALTER COLUMN id SET DEFAULT nextval('public.claim_reports_id_seq'::regclass);


--
-- TOC entry 4702 (class 2604 OID 80166)
-- Name: document_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items ALTER COLUMN id SET DEFAULT nextval('public.document_items_id_seq'::regclass);


--
-- TOC entry 4705 (class 2604 OID 80167)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4733 (class 2604 OID 80378)
-- Name: product_location_mappings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_location_mappings ALTER COLUMN id SET DEFAULT nextval('public.product_location_mappings_id_seq'::regclass);


--
-- TOC entry 4713 (class 2604 OID 80169)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4717 (class 2604 OID 80170)
-- Name: storages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages ALTER COLUMN id SET DEFAULT nextval('public.stock_balance_id_seq'::regclass);


--
-- TOC entry 4725 (class 2604 OID 80171)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4720 (class 2604 OID 80172)
-- Name: vendor_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products ALTER COLUMN id SET DEFAULT nextval('public.supplier_products_id_seq'::regclass);


--
-- TOC entry 4723 (class 2604 OID 80173)
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 4727 (class 2604 OID 80349)
-- Name: warehouse_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_locations ALTER COLUMN id SET DEFAULT nextval('public.warehouse_locations_id_seq'::regclass);


--
-- TOC entry 4948 (class 0 OID 80077)
-- Dependencies: 217
-- Data for Name: accountings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accountings (id, operation_date, operation_type, document_id, supplier_id, amount, vat_amount, description, created_by, created_at) FROM stdin;
90	2026-04-07	expense	169	8	1476.00	0.00	Предоплата 100% по договору ДОГ-1775581057242-8	7	2026-04-07 19:57:53.50729
91	2026-04-09	expense	172	8	1476.00	0.00	Оплата по договору ДОГ-1775738417266-8	7	2026-04-09 15:43:02.614127
92	2026-04-09	expense	174	8	1599.00	0.00	Оплата по договору ДОГ-1775739965232-8	7	2026-04-09 16:06:38.450654
93	2026-04-09	expense	176	8	861.00	0.00	Оплата по договору ДОГ-1775740014440-8	7	2026-04-09 16:09:44.297396
94	2026-04-09	expense	176	8	861.00	0.00	Оплата по договору ДОГ-1775740014440-8	7	2026-04-09 16:11:28.165374
95	2026-04-09	expense	178	8	738.00	0.00	Оплата по договору ДОГ-1775761024526-8	7	2026-04-09 21:58:01.559703
96	2026-04-09	expense	178	8	738.00	0.00	Оплата по договору ДОГ-1775761024526-8	7	2026-04-09 21:59:28.939709
\.


--
-- TOC entry 4950 (class 0 OID 80086)
-- Dependencies: 219
-- Data for Name: claim_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claim_reports (id, document_id, marriage, deadline, quantity, created_at) FROM stdin;
\.


--
-- TOC entry 4952 (class 0 OID 80096)
-- Dependencies: 221
-- Data for Name: document_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_items (id, document_id, product_id, quantity, price, vat_rate, created_at) FROM stdin;
121	169	21	12.00	123.00	0.00	2026-04-07 19:57:53.525587
122	170	21	12.00	123.00	0.00	2026-04-07 19:58:39.131145
123	171	21	12.00	123.00	0.00	2026-04-07 20:00:15.799312
124	172	21	12.00	123.00	0.00	2026-04-09 15:40:32.006353
125	173	21	12.00	123.00	0.00	2026-04-09 15:43:29.74132
126	174	21	13.00	123.00	0.00	2026-04-09 16:06:19.94738
127	175	21	13.00	123.00	0.00	2026-04-09 16:06:52.316303
128	176	21	14.00	123.00	0.00	2026-04-09 16:07:35.556788
129	177	21	14.00	123.00	0.00	2026-04-09 16:11:10.589811
130	178	21	12.00	123.00	0.00	2026-04-09 21:57:22.567723
131	179	21	12.00	123.00	0.00	2026-04-09 21:59:20.236067
\.


--
-- TOC entry 4954 (class 0 OID 80102)
-- Dependencies: 223
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, doc_number, doc_type, doc_date, vendor_id, user_id, status, total_amount, currency, description, created_at, delivery_date, deadline_date, delivery_days, actual_delivery_date, payment_terms, paid_amount, payment_status) FROM stdin;
170	PR-1775581119121	Приход	2026-04-07	8	7	Завершён	1476.00	RUB	Приход товаров по договору ДОГ-1775581057242-8\n	2026-04-07 19:58:39.12235	\N	2026-05-07	7	\N	postpaid	0.00	unpaid
171	PR-1775581215653	Приход	2026-04-07	8	7	Завершён	1476.00	RUB	Приход товаров по договору ДОГ-1775581057242-8\n	2026-04-07 20:00:15.65348	\N	2026-05-07	7	\N	postpaid	0.00	unpaid
169	ДОГ-1775581057242-8	Договор	2026-04-16	8	7	Исполнен	1476.00	RUB	Поставщик: ООО ТехноПром\n\nСостав поставки:\n- ффф: 12 шт × 123₽ = 1476₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-16\n\n\nПриёмка завершена. Создан документ: PR-1775581215653	2026-04-07 19:57:53.495474	2026-04-16	2026-05-16	0	\N	prepaid	0.00	fully_paid
173	PR-1775738609734	Приход	2026-04-09	8	7	Завершён	1476.00	RUB	Приход товаров по договору ДОГ-1775738417266-8\n	2026-04-09 15:43:29.735396	\N	2026-05-09	7	\N	postpaid	0.00	unpaid
172	ДОГ-1775738417266-8	Договор	2026-04-17	8	7	Исполнен	1476.00	RUB	Поставщик: ООО ТехноПром\n\nСостав поставки:\n- ффф: 12 шт × 123₽ = 1476₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-17\n\n\nПриёмка завершена. Создан документ: PR-1775738609734	2026-04-09 15:40:31.989275	2026-04-17	2026-05-17	0	\N	prepaid	1476.00	fully_paid
175	PR-1775740012311	Приход	2026-04-09	8	7	Завершён	1599.00	RUB	Приход товаров по договору ДОГ-1775739965232-8\n	2026-04-09 16:06:52.312476	\N	2026-05-09	7	\N	postpaid	0.00	unpaid
174	ДОГ-1775739965232-8	Договор	2026-04-11	8	7	Исполнен	1599.00	RUB	Поставщик: ООО ТехноПром\n\nСостав поставки:\n- ффф: 13 шт × 123₽ = 1599₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-11\n\n\nПриёмка завершена. Создан документ: PR-1775740012311	2026-04-09 16:06:19.938533	2026-04-11	2026-05-11	0	\N	prepaid	1599.00	fully_paid
177	PR-1775740270584	Приход	2026-04-09	8	7	Завершён	1722.00	RUB	Приход товаров по договору ДОГ-1775740014440-8\n	2026-04-09 16:11:10.585958	\N	2026-05-09	7	\N	postpaid	0.00	unpaid
179	PR-1775761160224	Приход	2026-04-09	8	7	Завершён	1476.00	RUB	Приход товаров по договору ДОГ-1775761024526-8\n	2026-04-09 21:59:20.225812	\N	2026-05-09	7	\N	postpaid	0.00	unpaid
176	ДОГ-1775740014440-8	Договор	2026-04-11	8	7	Исполнен	1722.00	RUB	Поставщик: ООО ТехноПром\n\nСостав поставки:\n- ффф: 14 шт × 123₽ = 1722₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: Частичная предоплата\nДата доставки: 2026-04-11\n\n\nПриёмка завершена. Создан документ: PR-1775740270584	2026-04-09 16:07:35.548307	2026-04-11	2026-05-11	0	\N	partial	1722.00	fully_paid
178	ДОГ-1775761024526-8	Договор	2026-04-11	8	7	Исполнен	1476.00	RUB	Поставщик: ООО ТехноПром\n\nСостав поставки:\n- ффф: 12 шт × 123₽ = 1476₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: Частичная предоплата\nДата доставки: 2026-04-11\n\n\nПриёмка завершена. Создан документ: PR-1775761160224	2026-04-09 21:57:22.545838	2026-04-11	2026-05-11	0	\N	partial	1476.00	fully_paid
\.


--
-- TOC entry 4956 (class 0 OID 80128)
-- Dependencies: 225
-- Data for Name: money; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.money (money) FROM stdin;
1865
\.


--
-- TOC entry 4970 (class 0 OID 80375)
-- Dependencies: 239
-- Data for Name: product_location_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_location_mappings (id, product_id, location_id, quantity, created_at, updated_at) FROM stdin;
3	21	7	12.00	2026-04-09 15:43:29.749105	2026-04-09 15:43:29.749105
2	21	6	51.00	2026-04-07 20:00:15.815514	2026-04-09 21:59:20.253948
\.


--
-- TOC entry 4957 (class 0 OID 80131)
-- Dependencies: 226
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, article, name, description, unit, category, min_stock, created_at, max_stock) FROM stdin;
21	ффф	ффф		шт	Ткани	1	2026-04-07 19:57:35.070246	100
22	fff	fff		шт		10	2026-04-09 21:56:30.333423	0
\.


--
-- TOC entry 4959 (class 0 OID 80139)
-- Dependencies: 228
-- Data for Name: storages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.storages (id, product_id, quantity, last_receipt_date, last_receipt_document_id, updated_at) FROM stdin;
14	21	63.00	2026-04-09 21:59:20.25195	179	2026-04-09 21:59:20.25195
\.


--
-- TOC entry 4965 (class 0 OID 80158)
-- Dependencies: 234
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, login, password, full_name, role, created_at) FROM stdin;
8	artem	$2a$10$dKUvl9vtF5vk8JQ5RCpB.O0Qc6duxxnnSzdJLvdmNZQytWiP0axWS	artem	admin	2026-04-01 21:03:32.864524
5	user1	$2a$10$mPIdVel1AVVR0AoBSjBple0Uwir3MxIe10FmWLAi20P.Wx7zbxNEG	Зубенко Михаил Петрович	менеджер	2026-03-31 12:41:08.755263
4	user2	$2a$10$ksAcpWlBT0EMQAELPoBVLefqMgIMnP9KoeDpXQwZ3dRoN3EtI5RFO	Косолапов Иван Владимирович	кладовщик	2026-03-27 23:21:48.98639
6	user3	$2a$10$KjWyUozoWsbi1OH7Y/hE3OvQMeQW.mHoCW9u.edY0eLUInYg1Gkpi	Хохлов Николай Владимирович	бухгалтер	2026-03-31 12:41:20.748485
7	user4	$2a$10$a7.gruiT5JCL7jpEbs3XcOvqtVL0Yo7FDtCZJwWg6JtX4X3Fre01y	Канев Максим Анатольевич	директор	2026-03-31 12:41:35.978616
2	admin	$2a$10$DpWvjAGqEWerVgbsdl5LruTzpQLmy9wiJWLiC3sK8eyCANHvdYTo.	admin	admin	2026-02-15 16:07:05.594232
\.


--
-- TOC entry 4961 (class 0 OID 80145)
-- Dependencies: 230
-- Data for Name: vendor_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_products (id, vendor_id, product_id, vendor_price, currency, delivery_days, updated_at) FROM stdin;
34	8	21	123.00	RUB	0	0001-01-01 00:00:00
35	8	22	123.00	RUB	0	0001-01-01 00:00:00
\.


--
-- TOC entry 4963 (class 0 OID 80151)
-- Dependencies: 232
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, company_name, contact_person, phone, email, address, inn, kpp, payment_account, bank_name, created_at) FROM stdin;
8	ООО ТехноПром	Иванов Петр Сергеевич	+7 (495) 123-45-67	info@tehnoprom.ru	г. Москва, ул. Промышленная, д. 10, офис 5	7701234567	770101001	40702810123450000001	ПАО Сбербанк г. Москва	2026-02-17 23:04:10.147301
6	ООО ЛогистикГрупп	Смирнова Ольга Викторовна	+7 (831) 456-78-90	info@logisticgroup.ru	г. Нижний Новгород, ул. Транспортная, д. 8	5263123456	526301001	40702810678900000005	ПАО Банк ФК Открытие	0001-01-01 00:00:00
\.


--
-- TOC entry 4968 (class 0 OID 80346)
-- Dependencies: 237
-- Data for Name: warehouse_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_locations (id, rack, shelf, cell, location_code, capacity, occupied, product_id, is_available, created_at, updated_at) FROM stdin;
7	A	1	2	A-1-2	100	12	21	t	2026-04-07 19:58:10.672774	2026-04-09 15:43:29.747102
6	A	1	1	A-1-1	100	51	21	t	2026-04-07 19:58:07.507317	2026-04-09 21:59:20.252949
\.


--
-- TOC entry 4994 (class 0 OID 0)
-- Dependencies: 218
-- Name: accounting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounting_id_seq', 96, true);


--
-- TOC entry 4995 (class 0 OID 0)
-- Dependencies: 220
-- Name: claim_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.claim_reports_id_seq', 7, true);


--
-- TOC entry 4996 (class 0 OID 0)
-- Dependencies: 222
-- Name: document_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_items_id_seq', 131, true);


--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 224
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 179, true);


--
-- TOC entry 4998 (class 0 OID 0)
-- Dependencies: 238
-- Name: product_location_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_location_mappings_id_seq', 3, true);


--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 227
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 22, true);


--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 229
-- Name: stock_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_balance_id_seq', 14, true);


--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 231
-- Name: supplier_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_products_id_seq', 35, true);


--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 233
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 11, true);


--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 236
-- Name: warehouse_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warehouse_locations_id_seq', 7, true);


--
-- TOC entry 4743 (class 2606 OID 80175)
-- Name: accountings accounting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_pkey PRIMARY KEY (id);


--
-- TOC entry 4747 (class 2606 OID 80179)
-- Name: claim_reports claim_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_reports
    ADD CONSTRAINT claim_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4749 (class 2606 OID 80181)
-- Name: document_items document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4752 (class 2606 OID 80183)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4789 (class 2606 OID 80384)
-- Name: product_location_mappings product_location_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_location_mappings
    ADD CONSTRAINT product_location_mappings_pkey PRIMARY KEY (id);


--
-- TOC entry 4758 (class 2606 OID 80189)
-- Name: products products_article_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_article_key UNIQUE (article);


--
-- TOC entry 4760 (class 2606 OID 80191)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4762 (class 2606 OID 80193)
-- Name: storages stock_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_pkey PRIMARY KEY (id);


--
-- TOC entry 4764 (class 2606 OID 80195)
-- Name: storages stock_balance_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_product_id_key UNIQUE (product_id);


--
-- TOC entry 4768 (class 2606 OID 80197)
-- Name: vendor_products supplier_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4770 (class 2606 OID 80199)
-- Name: vendor_products supplier_products_supplier_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_supplier_id_product_id_key UNIQUE (vendor_id, product_id);


--
-- TOC entry 4772 (class 2606 OID 80201)
-- Name: vendors suppliers_inn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT suppliers_inn_key UNIQUE (inn);


--
-- TOC entry 4774 (class 2606 OID 80203)
-- Name: vendors suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 4791 (class 2606 OID 80386)
-- Name: product_location_mappings unique_product_location; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_location_mappings
    ADD CONSTRAINT unique_product_location UNIQUE (product_id, location_id);


--
-- TOC entry 4776 (class 2606 OID 80205)
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- TOC entry 4778 (class 2606 OID 80207)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4783 (class 2606 OID 80358)
-- Name: warehouse_locations warehouse_locations_location_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_locations
    ADD CONSTRAINT warehouse_locations_location_code_key UNIQUE (location_code);


--
-- TOC entry 4785 (class 2606 OID 80356)
-- Name: warehouse_locations warehouse_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_locations
    ADD CONSTRAINT warehouse_locations_pkey PRIMARY KEY (id);


--
-- TOC entry 4744 (class 1259 OID 80208)
-- Name: idx_accounting_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_document ON public.accountings USING btree (document_id);


--
-- TOC entry 4745 (class 1259 OID 80209)
-- Name: idx_accounting_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_supplier ON public.accountings USING btree (supplier_id, operation_date);


--
-- TOC entry 4750 (class 1259 OID 80210)
-- Name: idx_document_items_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_items_document ON public.document_items USING btree (document_id);


--
-- TOC entry 4753 (class 1259 OID 80341)
-- Name: idx_documents_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_payment_status ON public.documents USING btree (payment_status);


--
-- TOC entry 4754 (class 1259 OID 80342)
-- Name: idx_documents_payment_terms; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_payment_terms ON public.documents USING btree (payment_terms);


--
-- TOC entry 4755 (class 1259 OID 80211)
-- Name: idx_documents_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_supplier ON public.documents USING btree (vendor_id, doc_date);


--
-- TOC entry 4756 (class 1259 OID 80212)
-- Name: idx_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_type ON public.documents USING btree (doc_type, doc_date);


--
-- TOC entry 4786 (class 1259 OID 80398)
-- Name: idx_plm_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plm_location_id ON public.product_location_mappings USING btree (location_id);


--
-- TOC entry 4787 (class 1259 OID 80397)
-- Name: idx_plm_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plm_product_id ON public.product_location_mappings USING btree (product_id);


--
-- TOC entry 4765 (class 1259 OID 80213)
-- Name: idx_supplier_products_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_products_product ON public.vendor_products USING btree (product_id);


--
-- TOC entry 4766 (class 1259 OID 80214)
-- Name: idx_supplier_products_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_products_supplier ON public.vendor_products USING btree (vendor_id);


--
-- TOC entry 4779 (class 1259 OID 80371)
-- Name: idx_warehouse_locations_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warehouse_locations_available ON public.warehouse_locations USING btree (is_available);


--
-- TOC entry 4780 (class 1259 OID 80369)
-- Name: idx_warehouse_locations_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warehouse_locations_code ON public.warehouse_locations USING btree (location_code);


--
-- TOC entry 4781 (class 1259 OID 80370)
-- Name: idx_warehouse_locations_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warehouse_locations_product ON public.warehouse_locations USING btree (product_id);


--
-- TOC entry 4792 (class 2606 OID 80215)
-- Name: accountings accounting_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4793 (class 2606 OID 80220)
-- Name: accountings accounting_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.vendors(id);


--
-- TOC entry 4794 (class 2606 OID 80225)
-- Name: document_items document_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4795 (class 2606 OID 80230)
-- Name: documents documents_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_supplier_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- TOC entry 4796 (class 2606 OID 80235)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4801 (class 2606 OID 80392)
-- Name: product_location_mappings fk_location; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_location_mappings
    ADD CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES public.warehouse_locations(id) ON DELETE CASCADE;


--
-- TOC entry 4800 (class 2606 OID 80359)
-- Name: warehouse_locations fk_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_locations
    ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- TOC entry 4802 (class 2606 OID 80387)
-- Name: product_location_mappings fk_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_location_mappings
    ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4797 (class 2606 OID 80240)
-- Name: storages stock_balance_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4798 (class 2606 OID 80245)
-- Name: vendor_products supplier_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4799 (class 2606 OID 80250)
-- Name: vendor_products supplier_products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_supplier_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


-- Completed on 2026-04-09 22:03:49

--
-- PostgreSQL database dump complete
--

