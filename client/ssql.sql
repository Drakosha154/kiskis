--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2026-03-29 00:00:58

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
-- TOC entry 230 (class 1259 OID 79648)
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
    CONSTRAINT accounting_operation_type_check CHECK (((operation_type)::text = ANY ((ARRAY['expense'::character varying, 'income'::character varying])::text[])))
);


ALTER TABLE public.accountings OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 79647)
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
-- TOC entry 4972 (class 0 OID 0)
-- Dependencies: 229
-- Name: accounting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounting_id_seq OWNED BY public.accountings.id;


--
-- TOC entry 239 (class 1259 OID 79900)
-- Name: claim_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_items (
    id integer NOT NULL,
    claim_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric(15,2) NOT NULL,
    price numeric(15,2) DEFAULT 0,
    amount numeric(15,2) DEFAULT 0,
    issue_type character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.claim_items OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 79899)
-- Name: claim_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claim_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claim_items_id_seq OWNER TO postgres;

--
-- TOC entry 4973 (class 0 OID 0)
-- Dependencies: 238
-- Name: claim_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claim_items_id_seq OWNED BY public.claim_items.id;


--
-- TOC entry 237 (class 1259 OID 79870)
-- Name: claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claims (
    id integer NOT NULL,
    claim_number character varying(50) NOT NULL,
    document_id integer NOT NULL,
    vendor_id integer NOT NULL,
    claim_date timestamp without time zone NOT NULL,
    claim_type character varying(50) NOT NULL,
    description text,
    amount numeric(15,2) DEFAULT 0,
    status character varying(50) DEFAULT 'Новая'::character varying,
    resolved_at timestamp without time zone,
    resolution text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.claims OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 79869)
-- Name: claims_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claims_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claims_id_seq OWNER TO postgres;

--
-- TOC entry 4974 (class 0 OID 0)
-- Dependencies: 236
-- Name: claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claims_id_seq OWNED BY public.claims.id;


--
-- TOC entry 226 (class 1259 OID 79608)
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
-- TOC entry 225 (class 1259 OID 79607)
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
-- TOC entry 4975 (class 0 OID 0)
-- Dependencies: 225
-- Name: document_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_items_id_seq OWNED BY public.document_items.id;


--
-- TOC entry 234 (class 1259 OID 79840)
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
    CONSTRAINT documents_doc_type_check CHECK (((doc_type)::text = ANY (ARRAY[('Договор'::character varying)::text, ('Приход'::character varying)::text, ('Чек'::character varying)::text]))),
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY (ARRAY[('Черновик'::character varying)::text, ('Утверждён'::character varying)::text, ('Отклонён'::character varying)::text, ('Расхождение'::character varying)::text, ('Завершён'::character varying)::text, ('Частично исполнен'::character varying)::text, ('Исполнен'::character varying)::text])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 79839)
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
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 233
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 232 (class 1259 OID 79675)
-- Name: kpi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kpi (
    id integer NOT NULL,
    period_date date NOT NULL,
    period_type character varying(20) NOT NULL,
    total_purchases_amount numeric(12,2) DEFAULT 0,
    avg_delivery_days numeric(5,2) DEFAULT 0,
    supplier_count integer DEFAULT 0,
    stock_turnover numeric(10,2) DEFAULT 0,
    stock_value numeric(12,2) DEFAULT 0,
    shortage_count integer DEFAULT 0,
    total_expenses numeric(12,2) DEFAULT 0,
    payment_delay_avg numeric(5,2) DEFAULT 0,
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT kpi_period_type_check CHECK (((period_type)::text = ANY ((ARRAY['month'::character varying, 'quarter'::character varying, 'year'::character varying])::text[])))
);


ALTER TABLE public.kpi OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 79674)
-- Name: kpi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kpi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_id_seq OWNER TO postgres;

--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 231
-- Name: kpi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kpi_id_seq OWNED BY public.kpi.id;


--
-- TOC entry 235 (class 1259 OID 79866)
-- Name: money; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.money (
    money real NOT NULL
);


ALTER TABLE public.money OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 79546)
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 79545)
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
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 221
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 228 (class 1259 OID 79627)
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
-- TOC entry 227 (class 1259 OID 79626)
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
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 227
-- Name: stock_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_balance_id_seq OWNED BY public.storages.id;


--
-- TOC entry 224 (class 1259 OID 79559)
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
-- TOC entry 223 (class 1259 OID 79558)
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
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 223
-- Name: supplier_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_products_id_seq OWNED BY public.vendor_products.id;


--
-- TOC entry 220 (class 1259 OID 79534)
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
-- TOC entry 219 (class 1259 OID 79533)
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
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 219
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.vendors.id;


--
-- TOC entry 218 (class 1259 OID 79523)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'менеджер'::character varying, 'кладовщик'::character varying, 'бухгалтер'::character varying, 'директор'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 79522)
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
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4711 (class 2604 OID 79651)
-- Name: accountings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings ALTER COLUMN id SET DEFAULT nextval('public.accounting_id_seq'::regclass);


--
-- TOC entry 4734 (class 2604 OID 79903)
-- Name: claim_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_items ALTER COLUMN id SET DEFAULT nextval('public.claim_items_id_seq'::regclass);


--
-- TOC entry 4729 (class 2604 OID 79873)
-- Name: claims id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims ALTER COLUMN id SET DEFAULT nextval('public.claims_id_seq'::regclass);


--
-- TOC entry 4705 (class 2604 OID 79611)
-- Name: document_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items ALTER COLUMN id SET DEFAULT nextval('public.document_items_id_seq'::regclass);


--
-- TOC entry 4724 (class 2604 OID 79843)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4714 (class 2604 OID 79678)
-- Name: kpi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi ALTER COLUMN id SET DEFAULT nextval('public.kpi_id_seq'::regclass);


--
-- TOC entry 4699 (class 2604 OID 79549)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4708 (class 2604 OID 79630)
-- Name: storages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages ALTER COLUMN id SET DEFAULT nextval('public.stock_balance_id_seq'::regclass);


--
-- TOC entry 4695 (class 2604 OID 79526)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4702 (class 2604 OID 79562)
-- Name: vendor_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products ALTER COLUMN id SET DEFAULT nextval('public.supplier_products_id_seq'::regclass);


--
-- TOC entry 4697 (class 2604 OID 79537)
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 4957 (class 0 OID 79648)
-- Dependencies: 230
-- Data for Name: accountings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accountings (id, operation_date, operation_type, document_id, supplier_id, amount, vat_amount, description, created_by, created_at) FROM stdin;
8	2026-03-17	expense	34	11	32000.00	0.00	Приход	2	2026-03-17 20:08:18.585963
9	2026-03-17	expense	36	11	160.00	0.00	Приход	2	2026-03-17 20:19:50.844877
10	2026-03-17	expense	38	11	1760.00	0.00	Приход	2	2026-03-17 20:20:33.296511
11	2026-03-17	expense	40	11	1920.00	0.00	Приход	2	2026-03-17 20:22:25.568032
12	2026-03-28	expense	42	11	160.00	0.00	Приход	4	2026-03-28 23:02:51.429303
13	2026-03-28	expense	44	11	160.00	0.00	Приход	4	2026-03-28 23:30:40.93938
14	2026-03-28	expense	46	11	320.00	0.00	Приход	4	2026-03-28 23:51:28.766023
15	2026-03-28	expense	49	11	160.00	0.00	Приход	4	2026-03-28 23:59:47.995336
\.


--
-- TOC entry 4966 (class 0 OID 79900)
-- Dependencies: 239
-- Data for Name: claim_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claim_items (id, claim_id, product_id, quantity, price, amount, issue_type, description, created_at) FROM stdin;
\.


--
-- TOC entry 4964 (class 0 OID 79870)
-- Dependencies: 237
-- Data for Name: claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claims (id, claim_number, document_id, vendor_id, claim_date, claim_type, description, amount, status, resolved_at, resolution, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4953 (class 0 OID 79608)
-- Dependencies: 226
-- Data for Name: document_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_items (id, document_id, product_id, quantity, price, vat_rate, created_at) FROM stdin;
16	33	15	200.00	160.00	0.00	2026-03-17 20:08:10.94241
17	35	15	1.00	160.00	0.00	2026-03-17 20:19:43.42194
18	37	15	11.00	160.00	0.00	2026-03-17 20:20:26.276175
19	39	15	12.00	160.00	0.00	2026-03-17 20:22:17.321785
20	41	15	1.00	160.00	0.00	2026-03-28 22:11:17.055033
21	43	15	1.00	160.00	0.00	2026-03-28 23:29:56.846878
22	45	15	2.00	160.00	0.00	2026-03-28 23:47:05.469976
23	47	15	1.00	160.00	0.00	2026-03-28 23:57:25.21117
24	48	15	2.00	160.00	0.00	2026-03-28 23:58:07.020225
\.


--
-- TOC entry 4961 (class 0 OID 79840)
-- Dependencies: 234
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, doc_number, doc_type, doc_date, vendor_id, user_id, status, total_amount, currency, description, created_at, delivery_date, deadline_date, delivery_days, actual_delivery_date) FROM stdin;
34	PR-1773767298578	Приход		11	2	Завершён	32000.00	RUB	Приход товаров по договору ДОГ-1773767278379-11\n	2026-03-17 20:08:18.579157	\N	\N	\N	\N
33	ДОГ-1773767278379-11	Договор	2026-03-27	11	2	Исполнен	32000.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 200 шт × 160₽ = 32000₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-27\n	2026-03-17 20:08:10.934413	\N	\N	\N	\N
36	PR-1773767990839	Приход		11	2	Завершён	160.00	RUB	Приход товаров по договору ДОГ-1773767974063-11\n	2026-03-17 20:19:50.840356	\N	\N	\N	\N
46	PR-1774731088759	Приход	2026-03-28	11	4	Завершён	320.00	RUB	Приход товаров по договору ДОГ-1774730799415-11\nааа	2026-03-28 23:51:28.760119	2026-04-04	2026-04-27	7	\N
35	ДОГ-1773767974063-11	Договор	2026-03-22	11	2	Исполнен	160.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 1 шт × 160₽ = 160₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-22\n	2026-03-17 20:19:43.413604	\N	\N	\N	\N
38	PR-1773768033291	Приход		11	2	Завершён	1760.00	RUB	Приход товаров по договору ДОГ-1773768012572-11\n	2026-03-17 20:20:33.292223	\N	\N	\N	\N
37	ДОГ-1773768012572-11	Договор	2026-03-20	11	2	Исполнен	1760.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 11 шт × 160₽ = 1760₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-20\n	2026-03-17 20:20:26.267337	\N	\N	\N	\N
40	PR-1773768145563	Приход		11	2	Завершён	1920.00	RUB	Приход товаров по договору ДОГ-1773768124990-11\n	2026-03-17 20:22:25.56443	\N	\N	\N	\N
39	ДОГ-1773768124990-11	Договор	2026-03-29	11	2	Исполнен	1920.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 12 шт × 160₽ = 1920₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-29\n	2026-03-17 20:22:17.313468	\N	\N	\N	\N
45	ДОГ-1774730799415-11	Договор	2026-03-30	11	4	Исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-30\n	2026-03-28 23:47:05.461782	2026-04-06	2026-04-29	7	\N
42	PR-1774728171415	Приход	2026-03-28	11	4	Завершён	160.00	RUB	Приход товаров по договору ДОГ-1774725064283-11\nчото мало	2026-03-28 23:02:51.416196	2026-04-04	2026-04-27	7	\N
41	ДОГ-1774725064283-11	Договор	2026-03-28	11	4	Исполнен	160.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 1 шт × 160₽ = 160₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: \n	2026-03-28 22:11:17.035795	2026-04-20	2026-04-27	7	\N
44	PR-1774729840932	Приход	2026-03-28	11	4	Завершён	160.00	RUB	Приход товаров по договору ДОГ-1774729776683-11\nвфвфвфвф	2026-03-28 23:30:40.932984	2026-04-04	2026-04-27	7	\N
43	ДОГ-1774729776683-11	Договор	2026-03-29	11	4	Исполнен	160.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 1 шт × 160₽ = 160₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-29\n	2026-03-28 23:29:56.828916	2026-04-05	2026-04-28	7	\N
47	ДОГ-1774731421953-11	Договор	2026-04-10	11	4	Исполнен	160.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 1 шт × 160₽ = 160₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-10\n	2026-03-28 23:57:25.203544	2026-04-17	2026-05-10	7	\N
48	ДОГ-1774731461550-11	Договор	2026-04-17	11	4	Черновик	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: Оплата после поставки\nДата доставки: 2026-04-17\n	2026-03-28 23:58:07.012161	2026-04-24	2026-05-17	7	\N
49	PR-1774731587990	Приход	2026-03-28	11	4	Завершён	160.00	RUB	Приход товаров по договору ДОГ-1774731421953-11\n	2026-03-28 23:59:47.990919	2026-04-04	2026-04-27	7	\N
\.


--
-- TOC entry 4959 (class 0 OID 79675)
-- Dependencies: 232
-- Data for Name: kpi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kpi (id, period_date, period_type, total_purchases_amount, avg_delivery_days, supplier_count, stock_turnover, stock_value, shortage_count, total_expenses, payment_delay_avg, calculated_at) FROM stdin;
\.


--
-- TOC entry 4962 (class 0 OID 79866)
-- Dependencies: 235
-- Data for Name: money; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.money (money) FROM stdin;
63360
\.


--
-- TOC entry 4949 (class 0 OID 79546)
-- Dependencies: 222
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, article, name, description, unit, category, min_stock, created_at) FROM stdin;
15	фа	фа	фа	шт	ффу	100	2026-03-17 19:48:21.060559
\.


--
-- TOC entry 4955 (class 0 OID 79627)
-- Dependencies: 228
-- Data for Name: storages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.storages (id, product_id, quantity, last_receipt_date, last_receipt_document_id, updated_at) FROM stdin;
8	15	229.00	2026-03-28 23:59:47.995336	49	2026-03-28 23:59:47.995336
\.


--
-- TOC entry 4945 (class 0 OID 79523)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, login, password, full_name, role, created_at) FROM stdin;
2	artem	$2a$10$v18oJhJsXdERxbeM.64ATOLtNZmXSpvTmho/1ed2yAZaAc8F2LCNi	artem	admin	2026-02-15 16:07:05.594232
4	user	$2a$10$r44twVqEdiHxyWoiz8fHjuS2gR.Bkpx88wi.rzDlcmAyjnXj4R/1W	Олег Олегович Олегов	кладовщик	2026-03-27 23:21:48.98639
\.


--
-- TOC entry 4951 (class 0 OID 79559)
-- Dependencies: 224
-- Data for Name: vendor_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_products (id, vendor_id, product_id, vendor_price, currency, delivery_days, updated_at) FROM stdin;
28	11	15	160.00	RUB	0	0001-01-01 00:00:00
\.


--
-- TOC entry 4947 (class 0 OID 79534)
-- Dependencies: 220
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, company_name, contact_person, phone, email, address, inn, kpp, payment_account, bank_name, created_at) FROM stdin;
8	ООО ТехноПром	Иванов Петр Сергеевич	+7 (495) 123-45-67	info@tehnoprom.ru	г. Москва, ул. Промышленная, д. 10, офис 5	7701234567	770101001	40702810123450000001	ПАО Сбербанк г. Москва	2026-02-17 23:04:10.147301
6	ООО ЛогистикГрупп	Смирнова Ольга Викторовна	+7 (831) 456-78-90	info@logisticgroup.ru	г. Нижний Новгород, ул. Транспортная, д. 8	5263123456	526301001	40702810678900000005	ПАО Банк ФК Открытие	0001-01-01 00:00:00
11	ООО ПромЭнергоСнаб	Козлов Дмитрий Николаевич	+73432345678	zakaz@promenergo.ru	г. Екатеринбург, ул. Энергетиков, д. 45	1	1	1	1	2026-03-17 19:47:53.606558
\.


--
-- TOC entry 4983 (class 0 OID 0)
-- Dependencies: 229
-- Name: accounting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounting_id_seq', 15, true);


--
-- TOC entry 4984 (class 0 OID 0)
-- Dependencies: 238
-- Name: claim_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.claim_items_id_seq', 1, false);


--
-- TOC entry 4985 (class 0 OID 0)
-- Dependencies: 236
-- Name: claims_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.claims_id_seq', 1, false);


--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 225
-- Name: document_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_items_id_seq', 24, true);


--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 233
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 49, true);


--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 231
-- Name: kpi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kpi_id_seq', 1, false);


--
-- TOC entry 4989 (class 0 OID 0)
-- Dependencies: 221
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 15, true);


--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 227
-- Name: stock_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_balance_id_seq', 8, true);


--
-- TOC entry 4991 (class 0 OID 0)
-- Dependencies: 223
-- Name: supplier_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_products_id_seq', 28, true);


--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 219
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 11, true);


--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 4769 (class 2606 OID 79658)
-- Name: accountings accounting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_pkey PRIMARY KEY (id);


--
-- TOC entry 4785 (class 2606 OID 79910)
-- Name: claim_items claim_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_items
    ADD CONSTRAINT claim_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4781 (class 2606 OID 79883)
-- Name: claims claims_claim_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_claim_number_key UNIQUE (claim_number);


--
-- TOC entry 4783 (class 2606 OID 79881)
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- TOC entry 4762 (class 2606 OID 79615)
-- Name: document_items document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4777 (class 2606 OID 79853)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4773 (class 2606 OID 79692)
-- Name: kpi kpi_period_date_period_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi
    ADD CONSTRAINT kpi_period_date_period_type_key UNIQUE (period_date, period_type);


--
-- TOC entry 4775 (class 2606 OID 79690)
-- Name: kpi kpi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi
    ADD CONSTRAINT kpi_pkey PRIMARY KEY (id);


--
-- TOC entry 4752 (class 2606 OID 79557)
-- Name: products products_article_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_article_key UNIQUE (article);


--
-- TOC entry 4754 (class 2606 OID 79555)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4765 (class 2606 OID 79634)
-- Name: storages stock_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_pkey PRIMARY KEY (id);


--
-- TOC entry 4767 (class 2606 OID 79636)
-- Name: storages stock_balance_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_product_id_key UNIQUE (product_id);


--
-- TOC entry 4758 (class 2606 OID 79567)
-- Name: vendor_products supplier_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4760 (class 2606 OID 79569)
-- Name: vendor_products supplier_products_supplier_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_supplier_id_product_id_key UNIQUE (vendor_id, product_id);


--
-- TOC entry 4748 (class 2606 OID 79544)
-- Name: vendors suppliers_inn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT suppliers_inn_key UNIQUE (inn);


--
-- TOC entry 4750 (class 2606 OID 79542)
-- Name: vendors suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 4744 (class 2606 OID 79532)
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- TOC entry 4746 (class 2606 OID 79530)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4770 (class 1259 OID 79699)
-- Name: idx_accounting_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_document ON public.accountings USING btree (document_id);


--
-- TOC entry 4771 (class 1259 OID 79698)
-- Name: idx_accounting_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_supplier ON public.accountings USING btree (supplier_id, operation_date);


--
-- TOC entry 4763 (class 1259 OID 79697)
-- Name: idx_document_items_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_items_document ON public.document_items USING btree (document_id);


--
-- TOC entry 4778 (class 1259 OID 79864)
-- Name: idx_documents_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_supplier ON public.documents USING btree (vendor_id, doc_date);


--
-- TOC entry 4779 (class 1259 OID 79865)
-- Name: idx_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_type ON public.documents USING btree (doc_type, doc_date);


--
-- TOC entry 4755 (class 1259 OID 79696)
-- Name: idx_supplier_products_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_products_product ON public.vendor_products USING btree (product_id);


--
-- TOC entry 4756 (class 1259 OID 79695)
-- Name: idx_supplier_products_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_products_supplier ON public.vendor_products USING btree (vendor_id);


--
-- TOC entry 4790 (class 2606 OID 79669)
-- Name: accountings accounting_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4791 (class 2606 OID 79664)
-- Name: accountings accounting_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.vendors(id);


--
-- TOC entry 4797 (class 2606 OID 79911)
-- Name: claim_items claim_items_claim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_items
    ADD CONSTRAINT claim_items_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE CASCADE;


--
-- TOC entry 4798 (class 2606 OID 79916)
-- Name: claim_items claim_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_items
    ADD CONSTRAINT claim_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4794 (class 2606 OID 79894)
-- Name: claims claims_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4795 (class 2606 OID 79884)
-- Name: claims claims_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4796 (class 2606 OID 79889)
-- Name: claims claims_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- TOC entry 4788 (class 2606 OID 79621)
-- Name: document_items document_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4792 (class 2606 OID 79854)
-- Name: documents documents_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_supplier_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- TOC entry 4793 (class 2606 OID 79859)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4789 (class 2606 OID 79637)
-- Name: storages stock_balance_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4786 (class 2606 OID 79575)
-- Name: vendor_products supplier_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4787 (class 2606 OID 79570)
-- Name: vendor_products supplier_products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_supplier_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


-- Completed on 2026-03-29 00:00:59

--
-- PostgreSQL database dump complete
--

