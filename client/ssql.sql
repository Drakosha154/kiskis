--
-- PostgreSQL database dump
--

\restrict FQmDuowYzHERgqPKgSgnLjweH3fESUSjt4p7aSkbEPBN8dyDb3uYrduK0xy2MP4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-03-29 19:43:12

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
-- TOC entry 217 (class 1259 OID 25092)
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
-- TOC entry 218 (class 1259 OID 25100)
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
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 218
-- Name: accounting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounting_id_seq OWNED BY public.accountings.id;


--
-- TOC entry 236 (class 1259 OID 25308)
-- Name: claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claims (
    id uuid NOT NULL,
    document_id integer,
    marriage boolean,
    deadline boolean,
    quantity boolean,
    created_at time without time zone
);


ALTER TABLE public.claims OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 25120)
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
-- TOC entry 220 (class 1259 OID 25125)
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
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 220
-- Name: document_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_items_id_seq OWNED BY public.document_items.id;


--
-- TOC entry 221 (class 1259 OID 25126)
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
-- TOC entry 222 (class 1259 OID 25137)
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
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 222
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 223 (class 1259 OID 25138)
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
    CONSTRAINT kpi_period_type_check CHECK (((period_type)::text = ANY (ARRAY[('month'::character varying)::text, ('quarter'::character varying)::text, ('year'::character varying)::text])))
);


ALTER TABLE public.kpi OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 25151)
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
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 224
-- Name: kpi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kpi_id_seq OWNED BY public.kpi.id;


--
-- TOC entry 225 (class 1259 OID 25152)
-- Name: money; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.money (
    money real NOT NULL
);


ALTER TABLE public.money OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 25155)
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
-- TOC entry 227 (class 1259 OID 25162)
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
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 227
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 228 (class 1259 OID 25163)
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
-- TOC entry 229 (class 1259 OID 25168)
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
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 229
-- Name: stock_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_balance_id_seq OWNED BY public.storages.id;


--
-- TOC entry 230 (class 1259 OID 25169)
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
-- TOC entry 231 (class 1259 OID 25174)
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
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 231
-- Name: supplier_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_products_id_seq OWNED BY public.vendor_products.id;


--
-- TOC entry 232 (class 1259 OID 25175)
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
-- TOC entry 233 (class 1259 OID 25181)
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
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 233
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.vendors.id;


--
-- TOC entry 234 (class 1259 OID 25182)
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
-- TOC entry 235 (class 1259 OID 25187)
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
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4743 (class 2604 OID 25188)
-- Name: accountings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings ALTER COLUMN id SET DEFAULT nextval('public.accounting_id_seq'::regclass);


--
-- TOC entry 4746 (class 2604 OID 25191)
-- Name: document_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items ALTER COLUMN id SET DEFAULT nextval('public.document_items_id_seq'::regclass);


--
-- TOC entry 4749 (class 2604 OID 25192)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4754 (class 2604 OID 25193)
-- Name: kpi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi ALTER COLUMN id SET DEFAULT nextval('public.kpi_id_seq'::regclass);


--
-- TOC entry 4764 (class 2604 OID 25194)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4767 (class 2604 OID 25195)
-- Name: storages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages ALTER COLUMN id SET DEFAULT nextval('public.stock_balance_id_seq'::regclass);


--
-- TOC entry 4775 (class 2604 OID 25196)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4770 (class 2604 OID 25197)
-- Name: vendor_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products ALTER COLUMN id SET DEFAULT nextval('public.supplier_products_id_seq'::regclass);


--
-- TOC entry 4773 (class 2604 OID 25198)
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 4974 (class 0 OID 25092)
-- Dependencies: 217
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
16	2026-03-29	expense	52	11	160.00	0.00	Приход	4	2026-03-29 18:02:15.16115
17	2026-03-29	expense	55	11	160.00	0.00	Приход	4	2026-03-29 18:20:07.721628
18	2026-03-29	expense	56	11	160.00	0.00	Приход	4	2026-03-29 18:23:03.909838
19	2026-03-29	expense	57	11	160.00	0.00	Приход	4	2026-03-29 18:24:47.233241
20	2026-03-29	expense	59	11	1440.00	0.00	Приход	4	2026-03-29 18:28:17.287598
21	2026-03-29	expense	61	11	160.00	0.00	Приход	4	2026-03-29 18:33:57.655477
22	2026-03-29	expense	63	11	3200.00	0.00	Приход	4	2026-03-29 18:39:28.650535
23	2026-03-29	expense	65	11	1760.00	0.00	Приход	4	2026-03-29 18:41:36.076387
24	2026-03-29	expense	67	11	160.00	0.00	Приход	4	2026-03-29 18:44:11.107659
25	2026-03-29	expense	69	11	320.00	0.00	Приход	4	2026-03-29 18:50:15.359886
26	2026-03-29	expense	71	11	160.00	0.00	Приход	4	2026-03-29 18:51:57.649344
27	2026-03-29	expense	73	11	160.00	0.00	Приход	4	2026-03-29 18:53:47.472818
28	2026-03-29	expense	75	11	160.00	0.00	Приход	4	2026-03-29 19:09:44.46286
\.


--
-- TOC entry 4993 (class 0 OID 25308)
-- Dependencies: 236
-- Data for Name: claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claims (id, document_id, marriage, deadline, quantity, created_at) FROM stdin;
\.


--
-- TOC entry 4976 (class 0 OID 25120)
-- Dependencies: 219
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
25	50	15	2.00	160.00	0.00	2026-03-29 15:58:03.359277
26	51	15	1.00	160.00	0.00	2026-03-29 16:07:42.827235
27	53	15	2.00	160.00	0.00	2026-03-29 18:16:14.330689
28	58	15	10.00	160.00	0.00	2026-03-29 18:28:01.518792
29	60	15	2.00	160.00	0.00	2026-03-29 18:33:10.611241
30	62	15	21.00	160.00	0.00	2026-03-29 18:39:11.716381
31	64	15	12.00	160.00	0.00	2026-03-29 18:41:16.461257
32	66	15	2.00	160.00	0.00	2026-03-29 18:43:57.020862
33	68	15	3.00	160.00	0.00	2026-03-29 18:50:03.904579
34	70	15	2.00	160.00	0.00	2026-03-29 18:51:47.185123
35	72	15	2.00	160.00	0.00	2026-03-29 18:53:29.342458
36	74	15	2.00	160.00	0.00	2026-03-29 19:09:28.1899
\.


--
-- TOC entry 4978 (class 0 OID 25126)
-- Dependencies: 221
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
49	PR-1774731587990	Приход	2026-03-28	11	4	Завершён	160.00	RUB	Приход товаров по договору ДОГ-1774731421953-11\n	2026-03-28 23:59:47.990919	2026-04-04	2026-04-27	7	\N
48	ДОГ-1774731461550-11	Договор	2026-04-17	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Екатеринбург, ул. Энергетиков, д. 45\nУсловия оплаты: Оплата после поставки\nДата доставки: 2026-04-17\n\n\nПриёмка завершена. Создан документ: PR-1774797887219\nСоздана претензия.	2026-03-28 23:58:07.012161	2026-04-24	2026-05-17	7	\N
52	PR-1774796535105	Приход	2026-03-29	11	4	Завершён	160.00	RUB	Приход товаров по договору ДОГ-1774789637548-11\n	2026-03-29 18:02:15.110203	\N	2026-04-28	7	\N
51	ДОГ-1774789637548-11	Договор	2026-04-01	11	4	Исполнен	160.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 1 шт × 160₽ = 160₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-01\n	2026-03-29 16:07:42.808025	2026-04-01	2026-05-01	0	\N
50	ДОГ-1774789026460-11	Договор	2026-04-30	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-30\n\n\nПриёмка завершена. Создан документ: PR-1774797783870\nСоздана претензия.	2026-03-29 15:58:03.330842	2026-05-07	2026-05-30	7	\N
55	PR-1774797607703	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774797353892-11\n123	2026-03-29 18:20:07.706093	\N	2026-04-28	7	\N
53	ДОГ-1774797353892-11	Договор	2026-03-31	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-03-31\n\n\nПриёмка завершена. Создан документ: PR-1774797607703\nСоздана претензия.	2026-03-29 18:16:14.303006	\N	2026-04-30	7	\N
56	PR-1774797783870	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774789026460-11\n321	2026-03-29 18:23:03.874437	\N	2026-04-28	7	\N
57	PR-1774797887219	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774731461550-11\n222	2026-03-29 18:24:47.220106	\N	2026-04-28	7	\N
64	ДОГ-1774798849200-11	Договор	2026-04-01	11	4	Частично исполнен	1920.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 12 шт × 160₽ = 1920₽\n\n---\nАдрес доставки: 213123113213\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-01\n\n\nПриёмка завершена. Создан документ: PR-1774798896010\nСоздана претензия.	2026-03-29 18:41:16.354307	\N	2026-05-01	7	\N
59	PR-1774798097252	Приход	2026-03-29	11	4	Расхождение	1440.00	RUB	Приход товаров по договору ДОГ-1774798059726-11\n123213	2026-03-29 18:28:17.256068	\N	2026-04-28	7	\N
58	ДОГ-1774798059726-11	Договор	2026-04-02	11	4	Частично исполнен	1600.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 10 шт × 160₽ = 1600₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-02\n\n\nПриёмка завершена. Создан документ: PR-1774798097252\nСоздана претензия.	2026-03-29 18:28:01.461394	\N	2026-05-02	7	\N
61	PR-1774798437557	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774798370688-11\n333222111	2026-03-29 18:33:57.561584	\N	2026-04-28	7	\N
60	ДОГ-1774798370688-11	Договор	2026-04-03	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-03\n\n\nПриёмка завершена. Создан документ: PR-1774798437557\nСоздана претензия.	2026-03-29 18:33:10.588293	\N	2026-05-03	7	\N
68	ДОГ-1774799389592-11	Договор	2026-04-25	11	4	Частично исполнен	480.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 3 шт × 160₽ = 480₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-25\n\n\nПриёмка завершена. Создан документ: PR-1774799415336\nСоздана претензия.	2026-03-29 18:50:03.83768	\N	2026-05-25	7	\N
63	PR-1774798768612	Приход	2026-03-29	11	4	Расхождение	3200.00	RUB	Приход товаров по договору ДОГ-1774798735080-11\n4321	2026-03-29 18:39:28.615139	\N	2026-04-28	7	\N
62	ДОГ-1774798735080-11	Договор	2026-04-01	11	4	Частично исполнен	3360.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 21 шт × 160₽ = 3360₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-01\n\n\nПриёмка завершена. Создан документ: PR-1774798768612\nСоздана претензия.	2026-03-29 18:39:11.680088	\N	2026-05-01	7	\N
65	PR-1774798896010	Приход	2026-03-29	11	4	Расхождение	1760.00	RUB	Приход товаров по договору ДОГ-1774798849200-11\n2131231232131	2026-03-29 18:41:36.016115	\N	2026-04-28	7	\N
67	PR-1774799051063	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774799014686-11\n3333111	2026-03-29 18:44:11.070067	\N	2026-04-28	7	\N
66	ДОГ-1774799014686-11	Договор	2026-04-01	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: 12321332131\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-01\n\n\nПриёмка завершена. Создан документ: PR-1774799051063\nСоздана претензия.	2026-03-29 18:43:56.931689	\N	2026-05-01	7	\N
71	PR-1774799517607	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774799492993-11\n	2026-03-29 18:51:57.610068	\N	2026-04-28	7	\N
69	PR-1774799415336	Приход	2026-03-29	11	4	Расхождение	320.00	RUB	Приход товаров по договору ДОГ-1774799389592-11\n	2026-03-29 18:50:15.337594	\N	2026-04-28	7	\N
70	ДОГ-1774799492993-11	Договор	2026-04-21	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-21\n\n\nПриёмка завершена. Создан документ: PR-1774799517607\nСоздана претензия.	2026-03-29 18:51:47.152633	\N	2026-05-21	7	\N
73	PR-1774799627440	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774799595522-11\n	2026-03-29 18:53:47.441985	\N	2026-04-28	7	\N
72	ДОГ-1774799595522-11	Договор	2026-04-10	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-10\n\n\nПриёмка завершена. Создан документ: PR-1774799627440\nСоздана претензия.	2026-03-29 18:53:29.287735	\N	2026-05-10	7	\N
75	PR-1774800584419	Приход	2026-03-29	11	4	Расхождение	160.00	RUB	Приход товаров по договору ДОГ-1774800556658-11\n	2026-03-29 19:09:44.424067	\N	2026-04-28	7	\N
74	ДОГ-1774800556658-11	Договор	2026-04-15	11	4	Частично исполнен	320.00	RUB	Поставщик: ООО ПромЭнергоСнаб\n\nСостав поставки:\n- фа: 2 шт × 160₽ = 320₽\n\n---\nАдрес доставки: г. Нижний Новгород, ул. Транспортная, д. 8\nУсловия оплаты: 100% предоплата\nДата доставки: 2026-04-15\n\n\nПриёмка завершена. Создан документ: PR-1774800584419\nСоздана претензия.	2026-03-29 19:09:28.153249	\N	2026-05-15	7	\N
\.


--
-- TOC entry 4980 (class 0 OID 25138)
-- Dependencies: 223
-- Data for Name: kpi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kpi (id, period_date, period_type, total_purchases_amount, avg_delivery_days, supplier_count, stock_turnover, stock_value, shortage_count, total_expenses, payment_delay_avg, calculated_at) FROM stdin;
\.


--
-- TOC entry 4982 (class 0 OID 25152)
-- Dependencies: 225
-- Data for Name: money; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.money (money) FROM stdin;
55200
\.


--
-- TOC entry 4983 (class 0 OID 25155)
-- Dependencies: 226
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, article, name, description, unit, category, min_stock, created_at) FROM stdin;
15	фа	фа	фа	шт	ффу	100	2026-03-17 19:48:21.060559
\.


--
-- TOC entry 4985 (class 0 OID 25163)
-- Dependencies: 228
-- Data for Name: storages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.storages (id, product_id, quantity, last_receipt_date, last_receipt_document_id, updated_at) FROM stdin;
8	15	280.00	2026-03-29 19:09:44.461479	75	2026-03-29 19:09:44.461479
\.


--
-- TOC entry 4991 (class 0 OID 25182)
-- Dependencies: 234
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, login, password, full_name, role, created_at) FROM stdin;
2	artem	$2a$10$v18oJhJsXdERxbeM.64ATOLtNZmXSpvTmho/1ed2yAZaAc8F2LCNi	artem	admin	2026-02-15 16:07:05.594232
4	user	$2a$10$r44twVqEdiHxyWoiz8fHjuS2gR.Bkpx88wi.rzDlcmAyjnXj4R/1W	Олег Олегович Олегов	кладовщик	2026-03-27 23:21:48.98639
\.


--
-- TOC entry 4987 (class 0 OID 25169)
-- Dependencies: 230
-- Data for Name: vendor_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_products (id, vendor_id, product_id, vendor_price, currency, delivery_days, updated_at) FROM stdin;
28	11	15	160.00	RUB	0	0001-01-01 00:00:00
\.


--
-- TOC entry 4989 (class 0 OID 25175)
-- Dependencies: 232
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, company_name, contact_person, phone, email, address, inn, kpp, payment_account, bank_name, created_at) FROM stdin;
8	ООО ТехноПром	Иванов Петр Сергеевич	+7 (495) 123-45-67	info@tehnoprom.ru	г. Москва, ул. Промышленная, д. 10, офис 5	7701234567	770101001	40702810123450000001	ПАО Сбербанк г. Москва	2026-02-17 23:04:10.147301
6	ООО ЛогистикГрупп	Смирнова Ольга Викторовна	+7 (831) 456-78-90	info@logisticgroup.ru	г. Нижний Новгород, ул. Транспортная, д. 8	5263123456	526301001	40702810678900000005	ПАО Банк ФК Открытие	0001-01-01 00:00:00
11	ООО ПромЭнергоСнаб	Козлов Дмитрий Николаевич	+73432345678	zakaz@promenergo.ru	г. Екатеринбург, ул. Энергетиков, д. 45	1	1	1	1	2026-03-17 19:47:53.606558
\.


--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 218
-- Name: accounting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounting_id_seq', 28, true);


--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 220
-- Name: document_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_items_id_seq', 36, true);


--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 222
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 75, true);


--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 224
-- Name: kpi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kpi_id_seq', 1, false);


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 227
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 15, true);


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 229
-- Name: stock_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_balance_id_seq', 8, true);


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 231
-- Name: supplier_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_products_id_seq', 28, true);


--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 233
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 11, true);


--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 4783 (class 2606 OID 25200)
-- Name: accountings accounting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_pkey PRIMARY KEY (id);


--
-- TOC entry 4820 (class 2606 OID 25314)
-- Name: claims claim_report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claim_report_pkey PRIMARY KEY (id);


--
-- TOC entry 4787 (class 2606 OID 25208)
-- Name: document_items document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 25210)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 25212)
-- Name: kpi kpi_period_date_period_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi
    ADD CONSTRAINT kpi_period_date_period_type_key UNIQUE (period_date, period_type);


--
-- TOC entry 4796 (class 2606 OID 25214)
-- Name: kpi kpi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi
    ADD CONSTRAINT kpi_pkey PRIMARY KEY (id);


--
-- TOC entry 4798 (class 2606 OID 25216)
-- Name: products products_article_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_article_key UNIQUE (article);


--
-- TOC entry 4800 (class 2606 OID 25218)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 25220)
-- Name: storages stock_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_pkey PRIMARY KEY (id);


--
-- TOC entry 4804 (class 2606 OID 25222)
-- Name: storages stock_balance_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_product_id_key UNIQUE (product_id);


--
-- TOC entry 4808 (class 2606 OID 25224)
-- Name: vendor_products supplier_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 25226)
-- Name: vendor_products supplier_products_supplier_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_supplier_id_product_id_key UNIQUE (vendor_id, product_id);


--
-- TOC entry 4812 (class 2606 OID 25228)
-- Name: vendors suppliers_inn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT suppliers_inn_key UNIQUE (inn);


--
-- TOC entry 4814 (class 2606 OID 25230)
-- Name: vendors suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 25232)
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- TOC entry 4818 (class 2606 OID 25234)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4784 (class 1259 OID 25235)
-- Name: idx_accounting_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_document ON public.accountings USING btree (document_id);


--
-- TOC entry 4785 (class 1259 OID 25236)
-- Name: idx_accounting_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_supplier ON public.accountings USING btree (supplier_id, operation_date);


--
-- TOC entry 4788 (class 1259 OID 25237)
-- Name: idx_document_items_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_items_document ON public.document_items USING btree (document_id);


--
-- TOC entry 4791 (class 1259 OID 25238)
-- Name: idx_documents_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_supplier ON public.documents USING btree (vendor_id, doc_date);


--
-- TOC entry 4792 (class 1259 OID 25239)
-- Name: idx_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_type ON public.documents USING btree (doc_type, doc_date);


--
-- TOC entry 4805 (class 1259 OID 25240)
-- Name: idx_supplier_products_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_products_product ON public.vendor_products USING btree (product_id);


--
-- TOC entry 4806 (class 1259 OID 25241)
-- Name: idx_supplier_products_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_products_supplier ON public.vendor_products USING btree (vendor_id);


--
-- TOC entry 4821 (class 2606 OID 25242)
-- Name: accountings accounting_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4822 (class 2606 OID 25247)
-- Name: accountings accounting_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accountings
    ADD CONSTRAINT accounting_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.vendors(id);


--
-- TOC entry 4823 (class 2606 OID 25277)
-- Name: document_items document_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4824 (class 2606 OID 25282)
-- Name: documents documents_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_supplier_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- TOC entry 4825 (class 2606 OID 25287)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4826 (class 2606 OID 25292)
-- Name: storages stock_balance_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT stock_balance_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4827 (class 2606 OID 25297)
-- Name: vendor_products supplier_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4828 (class 2606 OID 25302)
-- Name: vendor_products supplier_products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_products
    ADD CONSTRAINT supplier_products_supplier_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


-- Completed on 2026-03-29 19:43:12

--
-- PostgreSQL database dump complete
--

\unrestrict FQmDuowYzHERgqPKgSgnLjweH3fESUSjt4p7aSkbEPBN8dyDb3uYrduK0xy2MP4

