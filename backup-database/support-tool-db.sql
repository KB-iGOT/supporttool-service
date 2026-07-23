--
-- PostgreSQL database dump
--

\restrict Iyvz4YbBBlENJLB7HnmSTSgj805tM8OTHblIrh2E3b3aY3SMcdV29xuLPzzfN3A

-- Dumped from database version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)

-- Started on 2026-04-30 11:58:32 IST

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

--
-- TOC entry 2 (class 3079 OID 16915)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16953)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    user_id uuid,
    module text,
    sub_module text,
    action text,
    entity_id text,
    request_payload jsonb,
    modified_payload jsonb,
    response_payload jsonb,
    ip_address text,
    user_agent text,
    status text,
    message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    jira_link text NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO stuser;

--
-- TOC entry 221 (class 1259 OID 16962)
-- Name: modules; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    root character varying(100),
    url text,
    "isAdminModule" boolean DEFAULT false,
    "isRootModule" boolean DEFAULT false,
    "isVisible" boolean DEFAULT true
);


ALTER TABLE public.modules OWNER TO stuser;

--
-- TOC entry 222 (class 1259 OID 16972)
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: stuser
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO stuser;

--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 222
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stuser
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- TOC entry 223 (class 1259 OID 16973)
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: stuser
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO stuser;

--
-- TOC entry 224 (class 1259 OID 16974)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.role_permissions (
    id integer DEFAULT nextval('public.role_permissions_id_seq'::regclass) NOT NULL,
    role_id integer,
    module_id integer,
    can_read boolean DEFAULT false,
    can_write boolean DEFAULT false,
    can_delete boolean DEFAULT false
);


ALTER TABLE public.role_permissions OWNER TO stuser;

--
-- TOC entry 225 (class 1259 OID 16982)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: stuser
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO stuser;

--
-- TOC entry 226 (class 1259 OID 16983)
-- Name: roles; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.roles (
    id integer DEFAULT nextval('public.roles_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.roles OWNER TO stuser;

--
-- TOC entry 227 (class 1259 OID 16989)
-- Name: sessions; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL,
    token text,
    user_id text
);


ALTER TABLE public.sessions OWNER TO stuser;

--
-- TOC entry 228 (class 1259 OID 16997)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.user_roles (
    user_id character varying(100) NOT NULL,
    role_ids integer[] NOT NULL
);


ALTER TABLE public.user_roles OWNER TO stuser;

--
-- TOC entry 229 (class 1259 OID 17004)
-- Name: users; Type: TABLE; Schema: public; Owner: stuser
--

CREATE TABLE public.users (
    id character varying(100) NOT NULL,
    "userId" character varying(100) NOT NULL,
    "userName" character varying(100) NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    email character varying(200) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO stuser;

--
-- TOC entry 3371 (class 2604 OID 17017)
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- TOC entry 3547 (class 0 OID 16953)
-- Dependencies: 220
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.audit_logs (id, user_id, module, sub_module, action, entity_id, request_payload, modified_payload, response_payload, ip_address, user_agent, status, message, created_at, jira_link) FROM stdin;
ac2534be-c1fb-4616-b0a2-ecd71fae07e6	8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc	users	RESET_PASSWORD	UPDATE	4eb61d68-04f3-4085-a872-4801838cf698	{"request": {"key": "test", "type": "email", "userId": "4eb61d68-04f3-4085-a872-4801838cf698"}}	""	"{\\"id\\":\\".private.user.v1.password.reset\\",\\"ver\\":\\"private\\",\\"ts\\":\\"2026-04-09 13:01:52:089+0000\\",\\"params\\":{\\"resmsgid\\":\\"e51bc8c60a0c733be91a57bb26e6f89f\\",\\"msgid\\":\\"e51bc8c60a0c733be91a57bb26e6f89f\\",\\"err\\":null,\\"status\\":\\"SUCCESS\\",\\"errmsg\\":null},\\"responseCode\\":\\"OK\\",\\"result\\":{\\"response\\":\\"SUCCESS\\",\\"link\\":\\"https://portal.uat.karmayogibharat.net/auth/realms/sunbird/login-actions/action-token?key=eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIxMzYxOThkMC0xYTMyLTQ3M2YtYmJlYS1iZjdiN2ExNDM3NzAifQ.eyJqdGkiOiJhZDA3YWE3Mi0xYWU2LTRlYWItYTZlNi1iNTRjZWRhMjMyZjgiLCJleHAiOjE3NzgzMzE3MTIsIm5iZiI6MCwiaWF0IjoxNzc1NzM5NzEyLCJpc3MiOiJodHRwczovL3BvcnRhbC51YXQua2FybWF5b2dpYmhhcmF0Lm5ldC9hdXRoL3JlYWxtcy9zdW5iaXJkIiwiYXVkIjoiaHR0cHM6Ly9wb3J0YWwudWF0Lmthcm1heW9naWJoYXJhdC5uZXQvYXV0aC9yZWFsbXMvc3VuYmlyZCIsInN1YiI6ImY6OTFlYzk1ZDItYTNkNS00MTNlLWI0ZTQtNTNiMGRjYzk2NDg1OjRlYjYxZDY4LTA0ZjMtNDA4NS1hODcyLTQ4MDE4MzhjZjY5OCIsInR5cCI6ImV4ZWN1dGUtYWN0aW9ucyIsImF6cCI6ImxtcyIsIm5vbmNlIjoiYWQwN2FhNzItMWFlNi00ZWFiLWE2ZTYtYjU0Y2VkYTIzMmY4IiwicmVkdXJpIjoiaHR0cHM6Ly9wb3J0YWwudWF0Lmthcm1heW9naWJoYXJhdC5uZXQiLCJycWFjIjpbIlVQREFURV9QQVNTV09SRCJdLCJycWFjIjpbIlVQREFURV9QQVNTV09SRCJdLCJTRVRfUkVESVJFQ1RfVVJJX0FGVEVSX1JFUVVJUkVEX0FDVElPTlMiOiJ0cnVlIiwicmVkdXJpIjoiaHR0cHM6Ly9wb3J0YWwudWF0Lmthcm1heW9naWJoYXJhdC5uZXQifQ.scIojLrddnVXzpBi563OqOOn8gB_C4Q3NgQnX2rc1Uc\\"}}"	::1	\N	SUCCESS	Password reset successful for user	2026-04-09 18:31:52.238307+05:30	https://karmayogibharat.atlassian.net/browse/KB-13617
60dee954-7fb0-4e8f-a72f-31a78d866b81	8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc	users	RESET_PASSWORD	UPDATE	4eb61d68-04f3-4085-a872-4801838cf698	{"request": {"key": "test", "type": "email", "userId": "4eb61d68-04f3-4085-a872-4801838cf698"}}	""	"{\\"id\\":\\".private.user.v1.password.reset\\",\\"ver\\":\\"private\\",\\"ts\\":\\"2026-04-09 13:03:59:269+0000\\",\\"params\\":{\\"resmsgid\\":\\"98f065b59b1311f2021b95f6a1265870\\",\\"msgid\\":\\"98f065b59b1311f2021b95f6a1265870\\",\\"err\\":null,\\"status\\":\\"SUCCESS\\",\\"errmsg\\":null},\\"responseCode\\":\\"OK\\",\\"result\\":{\\"response\\":\\"SUCCESS\\",\\"link\\":\\"https://portal.uat.karmayogibharat.net/auth/realms/sunbird/login-actions/action-token?key=eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIxMzYxOThkMC0xYTMyLTQ3M2YtYmJlYS1iZjdiN2ExNDM3NzAifQ.eyJqdGkiOiI3ZmQxY2JhMC1hMmUxLTRkZGItOTRmNS1kM2Q1MDIyOTdlYzQiLCJleHAiOjE3NzgzMzE4MzksIm5iZiI6MCwiaWF0IjoxNzc1NzM5ODM5LCJpc3MiOiJodHRwczovL3BvcnRhbC51YXQua2FybWF5b2dpYmhhcmF0Lm5ldC9hdXRoL3JlYWxtcy9zdW5iaXJkIiwiYXVkIjoiaHR0cHM6Ly9wb3J0YWwudWF0Lmthcm1heW9naWJoYXJhdC5uZXQvYXV0aC9yZWFsbXMvc3VuYmlyZCIsInN1YiI6ImY6OTFlYzk1ZDItYTNkNS00MTNlLWI0ZTQtNTNiMGRjYzk2NDg1OjRlYjYxZDY4LTA0ZjMtNDA4NS1hODcyLTQ4MDE4MzhjZjY5OCIsInR5cCI6ImV4ZWN1dGUtYWN0aW9ucyIsImF6cCI6ImxtcyIsIm5vbmNlIjoiN2ZkMWNiYTAtYTJlMS00ZGRiLTk0ZjUtZDNkNTAyMjk3ZWM0IiwicmVkdXJpIjoiaHR0cHM6Ly9wb3J0YWwudWF0Lmthcm1heW9naWJoYXJhdC5uZXQiLCJycWFjIjpbIlVQREFURV9QQVNTV09SRCJdLCJycWFjIjpbIlVQREFURV9QQVNTV09SRCJdLCJTRVRfUkVESVJFQ1RfVVJJX0FGVEVSX1JFUVVJUkVEX0FDVElPTlMiOiJ0cnVlIiwicmVkdXJpIjoiaHR0cHM6Ly9wb3J0YWwudWF0Lmthcm1heW9naWJoYXJhdC5uZXQifQ.DfW9fR-svSmYmziQ58OQeDRHCXw9BsdQxj91XSCBI6U\\"}}"	14.143.127.34	\N	SUCCESS	Password reset successful for user	2026-04-09 18:33:59.32005+05:30	https://karmayogibharat.atlassian.net/browse/KB-13617
\.


--
-- TOC entry 3548 (class 0 OID 16962)
-- Dependencies: 221
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.modules (id, name, root, url, "isAdminModule", "isRootModule", "isVisible") FROM stdin;
5	System settings	\N	/system-settings	f	t	t
7	Non Loggedin page	\N	/non-logged-in-page	f	t	t
8	Forms	\N	/forms	f	t	t
9	Organisations	\N	/organisations	f	t	t
10	Org hierarchy Delete	\N	/org-delete	f	t	t
11	Domain	\N	/domain	f	t	t
3	Support Users	/support-users	/support-users	t	f	t
2	Roles	\N	/roles	t	f	t
1	Modules	/modules	/modules	t	f	t
6	Users	\N	/users	f	t	t
12	Analytics	\N	/analytics	t	f	t
4	Contents	\N	/contents	f	t	t
14	Bulk upload		/bulk-upload	f	t	t
15	Master Designation	bulk-upload	/bulk-upload/master-designation	f	f	t
16	Migrate users	bulk-upload	/bulk-upload/migrate-users	f	f	t
17	Competency		\t/competency	t	t	t
18	Zoho Automation		/zoho-automation	f	t	t
\.


--
-- TOC entry 3551 (class 0 OID 16974)
-- Dependencies: 224
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.role_permissions (id, role_id, module_id, can_read, can_write, can_delete) FROM stdin;
153	1	5	t	t	t
154	1	7	t	t	t
155	1	8	t	t	t
156	1	9	t	t	t
157	1	10	t	t	t
158	1	11	t	t	t
159	1	3	t	t	t
160	1	2	t	t	t
161	1	1	t	t	t
162	1	6	t	t	f
163	1	12	t	t	t
164	1	4	t	t	t
165	1	14	t	t	t
166	1	15	t	t	t
167	1	16	t	t	t
168	1	17	t	t	t
169	1	18	t	t	t
170	2	5	t	f	f
171	2	6	t	f	f
\.


--
-- TOC entry 3553 (class 0 OID 16983)
-- Dependencies: 226
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.roles (id, name) FROM stdin;
1	ADMIN
2	viewer1
\.


--
-- TOC entry 3554 (class 0 OID 16989)
-- Dependencies: 227
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.sessions (sid, sess, expire, token, user_id) FROM stdin;
9zslN3AY2w8b6pYTqiTEsXLJmWZVyNP9	{"cookie":{"originalMaxAge":86400000,"expires":"2026-04-10T09:30:51.545Z","secure":false,"httpOnly":false,"path":"/"},"user":{"id":"8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc","userId":"8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc","name":"publisher two two","token":"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhMTk5WXh3UkxNQWpBb3JVRmJUSkl4YjZDWE1JdUk4WVp4Y0pLaGxMdHQwIn0.eyJqdGkiOiI3NWEwZmJlYy1mYWRjLTQ1ZGYtOGQxNy01ZjNjYjAxZTY0MzUiLCJleHAiOjE3NzU3NDM5OTYsIm5iZiI6MCwiaWF0IjoxNzc1NzM5NjE2LCJpc3MiOiJodHRwczovL3BvcnRhbC51YXQua2FybWF5b2dpYmhhcmF0Lm5ldC9hdXRoL3JlYWxtcy9zdW5iaXJkIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImY6OTFlYzk1ZDItYTNkNS00MTNlLWI0ZTQtNTNiMGRjYzk2NDg1OjhhMzJiZjk5LTA4MGEtNGExYS1hNTZmLTZjZTVhMjljZjBmYyIsInR5cCI6IkJlYXJlciIsImF6cCI6InN1cHBvcnRfaWdvdCIsImF1dGhfdGltZSI6MCwic2Vzc2lvbl9zdGF0ZSI6ImZmN2I5MTAzLWM2OTEtNGMyOC1iYjc1LWNiOTMxYTU0ZjMyNCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiIiwibmFtZSI6IlB1Ymxpc2hlciBUd28gVWF0IiwicHJlZmVycmVkX3VzZXJuYW1lIjoicHVibGlzaGVydHdvX3M3bDIiLCJnaXZlbl9uYW1lIjoiUHVibGlzaGVyIFR3byBVYXQiLCJlbWFpbCI6InNwKioqKioqKioqKioqQHlvcG1haWwuY29tIn0.I0cKefL-pSGsrx2qbZqlhHvhVdBVmKRniXGH7VAeuemecbdWdaFbnz-ge95roICVZcTLkLm7w7n8GRLyxdf2B7zG9hJzQtkBcZ0Dx9sIC5JHK3pmFiYMN0ndluXLfTHqoj0X6E8-tpd1CFRf7ZFjwD42SW2vu8z85-1jGIpV8SMmYgvOcZTHi_lCA8FfSeJy3iQIGMHhBC7oruu_SG1qrI1C12Y39Jp6qtt-5Jj1pLhwdOwHlQ-lZESywJn45qzzY_tnYNLjCNxttH4EJy9vUORmv_nJg5UYRNreQGxfIyx2aCg8uQelPjbs556U27Wb5QOU5kx-PAPG2cSCtGDKmA","roles":[{"role_id":1,"role_name":"ADMIN"}],"rolePermissions":[{"role_id":1,"role_name":"ADMIN","module_id":5,"module_name":"System settings","module_url":"/system-settings","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":7,"module_name":"Non Loggedin page","module_url":"/non-logged-in-page","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":8,"module_name":"Forms","module_url":"/forms","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":9,"module_name":"Organisations","module_url":"/organisations","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":10,"module_name":"Org hierarchy Delete","module_url":"/org-delete","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":11,"module_name":"Domain","module_url":"/domain","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":3,"module_name":"Support Users","module_url":"/support-users","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":2,"module_name":"Roles","module_url":"/roles","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":1,"module_name":"Modules","module_url":"/modules","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":6,"module_name":"Users","module_url":"/users","can_read":true,"can_write":true,"can_delete":false},{"role_id":1,"role_name":"ADMIN","module_id":12,"module_name":"Analytics","module_url":"/analytics","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":4,"module_name":"Contents","module_url":"/contents","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":14,"module_name":"Bulk upload","module_url":"/bulk-upload","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":15,"module_name":"Master Designation","module_url":"/bulk-upload/master-designation","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":16,"module_name":"Migrate users","module_url":"/bulk-upload/migrate-users","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":17,"module_name":"Competency","module_url":"\\t/competency","can_read":true,"can_write":true,"can_delete":true},{"role_id":1,"role_name":"ADMIN","module_id":18,"module_name":"Zoho Automation","module_url":"/zoho-automation","can_read":true,"can_write":true,"can_delete":true}],"email":"spv.publisher2@yopmail.com"}}	2026-04-11 14:15:11	eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhMTk5WXh3UkxNQWpBb3JVRmJUSkl4YjZDWE1JdUk4WVp4Y0pLaGxMdHQwIn0.eyJqdGkiOiI3NWEwZmJlYy1mYWRjLTQ1ZGYtOGQxNy01ZjNjYjAxZTY0MzUiLCJleHAiOjE3NzU3NDM5OTYsIm5iZiI6MCwiaWF0IjoxNzc1NzM5NjE2LCJpc3MiOiJodHRwczovL3BvcnRhbC51YXQua2FybWF5b2dpYmhhcmF0Lm5ldC9hdXRoL3JlYWxtcy9zdW5iaXJkIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImY6OTFlYzk1ZDItYTNkNS00MTNlLWI0ZTQtNTNiMGRjYzk2NDg1OjhhMzJiZjk5LTA4MGEtNGExYS1hNTZmLTZjZTVhMjljZjBmYyIsInR5cCI6IkJlYXJlciIsImF6cCI6InN1cHBvcnRfaWdvdCIsImF1dGhfdGltZSI6MCwic2Vzc2lvbl9zdGF0ZSI6ImZmN2I5MTAzLWM2OTEtNGMyOC1iYjc1LWNiOTMxYTU0ZjMyNCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiIiwibmFtZSI6IlB1Ymxpc2hlciBUd28gVWF0IiwicHJlZmVycmVkX3VzZXJuYW1lIjoicHVibGlzaGVydHdvX3M3bDIiLCJnaXZlbl9uYW1lIjoiUHVibGlzaGVyIFR3byBVYXQiLCJlbWFpbCI6InNwKioqKioqKioqKioqQHlvcG1haWwuY29tIn0.I0cKefL-pSGsrx2qbZqlhHvhVdBVmKRniXGH7VAeuemecbdWdaFbnz-ge95roICVZcTLkLm7w7n8GRLyxdf2B7zG9hJzQtkBcZ0Dx9sIC5JHK3pmFiYMN0ndluXLfTHqoj0X6E8-tpd1CFRf7ZFjwD42SW2vu8z85-1jGIpV8SMmYgvOcZTHi_lCA8FfSeJy3iQIGMHhBC7oruu_SG1qrI1C12Y39Jp6qtt-5Jj1pLhwdOwHlQ-lZESywJn45qzzY_tnYNLjCNxttH4EJy9vUORmv_nJg5UYRNreQGxfIyx2aCg8uQelPjbs556U27Wb5QOU5kx-PAPG2cSCtGDKmA	8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc
\.


--
-- TOC entry 3555 (class 0 OID 16997)
-- Dependencies: 228
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.user_roles (user_id, role_ids) FROM stdin;
1	{1}
8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc	{1}
b8489cc5-9136-437d-8214-e93833d62180	{1}
28ceb12f-593a-4527-8e5c-600f98d48b97	{1}
4eb61d68-04f3-4085-a872-4801838cf698	{2}
\.


--
-- TOC entry 3556 (class 0 OID 17004)
-- Dependencies: 229
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: stuser
--

COPY public.users (id, "userId", "userName", "firstName", "lastName", email, "createdAt", "updatedAt") FROM stdin;
8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc	8a32bf99-080a-4a1a-a56f-6ce5a29cf0fc	publishertwo_s7l2	publisher two	two	spv.publisher2@yopmail.com	2025-06-17 12:34:20.406504+05:30	2025-06-17 12:34:20.406504+05:30
28ceb12f-593a-4527-8e5c-600f98d48b97	28ceb12f-593a-4527-8e5c-600f98d48b97	spvadmintwo_cafr	Spv Admintwo		uat.spvadmin2@yopmail.com	2025-06-17 12:50:00.875993+05:30	2025-06-17 12:50:00.875993+05:30
b8489cc5-9136-437d-8214-e93833d62180	b8489cc5-9136-437d-8214-e93833d62180	spvuserone_5vnk	Spv User One 		spv.uat.userone@yopmail.com	2025-06-27 14:26:22.867311+05:30	2025-06-27 14:26:22.867311+05:30
4eb61d68-04f3-4085-a872-4801838cf698	4eb61d68-04f3-4085-a872-4801838cf698	bharath_wmkz	Bharath Ravi1		bharath@yopmail.com	2026-03-28 23:35:36.222266+05:30	2026-03-28 23:35:36.222266+05:30
\.


--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 222
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stuser
--

SELECT pg_catalog.setval('public.modules_id_seq', 18, true);


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 223
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stuser
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 171, true);


--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 225
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stuser
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- TOC entry 3383 (class 2606 OID 17113)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3388 (class 2606 OID 17115)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- TOC entry 3390 (class 2606 OID 17117)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3392 (class 2606 OID 17119)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3394 (class 2606 OID 17121)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 3396 (class 2606 OID 17123)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3398 (class 2606 OID 17125)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3384 (class 1259 OID 17126)
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: stuser
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- TOC entry 3385 (class 1259 OID 17127)
-- Name: idx_audit_logs_module_id; Type: INDEX; Schema: public; Owner: stuser
--

CREATE INDEX idx_audit_logs_module_id ON public.audit_logs USING btree (module);


--
-- TOC entry 3386 (class 1259 OID 17128)
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: stuser
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- TOC entry 3399 (class 2606 OID 17129)
-- Name: role_permissions role_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stuser
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


-- Completed on 2026-04-30 11:58:32 IST

--
-- PostgreSQL database dump complete
--

\unrestrict Iyvz4YbBBlENJLB7HnmSTSgj805tM8OTHblIrh2E3b3aY3SMcdV29xuLPzzfN3A

