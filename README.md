# Payment Store - Full Stack E-Commerce Application

A complete e-commerce application with credit card payment processing powered by a payment gateway (Sandbox). Implements a 5-step checkout flow with real-time stock management, transaction tracking, and delivery assignment.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Business Flow](#business-flow)
- [Setup & Run](#setup--run)
- [Test Coverage](#test-coverage)
- [Security](#security)
- [Design Decisions](#design-decisions)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI library (SPA) |
| | Redux Toolkit | State management (Flux architecture) |
| | TypeScript | Type safety |
| | Tailwind CSS 4 | Utility-first CSS (flexbox/grid, mobile-first) |
| | Vite | Build tool & dev server |
| | Axios | HTTP client |
| **Backend** | NestJS | API framework |
| | TypeScript | Type safety |
| | TypeORM | ORM for PostgreSQL |
| | class-validator | DTO validation |
| | Swagger/OpenAPI | API documentation |
| | Helmet | Security headers |
| **Database** | PostgreSQL | Relational database (ACID transactions) |
| **Testing** | Jest | Unit testing framework (FE & BE) |
| | Testing Library | React component testing |
| **Architecture** | Hexagonal (Ports & Adapters) | Separation of concerns |
| | Railway Oriented Programming | Error handling in use cases |

---

## Architecture

### Hexagonal Architecture (Ports & Adapters)

The backend follows a strict hexagonal architecture with three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Controllers (HTTP) ─→ DTOs (Validation) ─→ Swagger Docs   │
│                                                             │
│  • ProductController     GET /products, GET /products/:id   │
│  • TransactionController POST /transactions                 │
│                          POST /transactions/:id/pay         │
│                          GET  /transactions/:id             │
│                          POST /transactions/tokenize        │
│                          GET  /transactions/acceptance/token │
└───────────────────────────┬─────────────────────────────────┘
                            │ calls
┌───────────────────────────▼─────────────────────────────────┐
│                      DOMAIN LAYER                            │
│                                                             │
│  Entities:                                                  │
│  • Product  (id, name, description, priceCents, imageUrl,   │
│              stock, createdAt)                               │
│  • Customer (id, email, fullName, phone, address, city,     │
│              createdAt)                                      │
│  • Transaction (id, reference, customerId, productId,       │
│                 quantity, amountCents, baseFeeCents,         │
│                 deliveryFeeCents, totalCents, status,        │
│                 gatewayTransactionId, createdAt, updatedAt)  │
│  • Delivery (id, transactionId, customerId, address, city,  │
│              status, createdAt)                              │
│                                                             │
│  Ports (Interfaces):                                        │
│  • ProductRepositoryPort     findAll, findById, updateStock │
│  • CustomerRepositoryPort    create, findById, findByEmail  │
│  • TransactionRepositoryPort create, findById,              │
│                              findByReference, updateStatus   │
│  • DeliveryRepositoryPort    create, findByTransactionId    │
│  • PaymentGatewayPort        tokenizeCard, getAcceptance,   │
│                              createTransaction, getTransaction│
│                                                             │
│  Use Cases (Railway Oriented Programming):                  │
│  • CreateTransactionUseCase                                 │
│    1. Validate product exists & has stock                   │
│    2. Find or create customer                               │
│    3. Calculate amounts (product + base fee + delivery fee) │
│    4. Create transaction in PENDING status                  │
│    Returns: Result<Transaction, string>                     │
│                                                             │
│  • CompletePaymentUseCase                                   │
│    1. Find transaction (must be PENDING)                    │
│    2. Call payment gateway to create payment                │
│    3. Map gateway status to internal status                 │
│    4. Update transaction with result                        │
│    5. If APPROVED: update stock + create delivery           │
│    Returns: Result<Transaction, string>                     │
│                                                             │
│  Result<T, E> Monad:                                        │
│  • Result.ok(value) / Result.fail(error)                    │
│  • .map(fn)     → transform value if ok                     │
│  • .flatMap(fn) → chain operations (railway switch)         │
│  • .isOk() / .isFailure()                                   │
│  • .getValue() / .getError()                                 │
│  • Result.combine([...]) → fail on first error              │
└───────────────────────────┬─────────────────────────────────┘
                            │ implements
┌───────────────────────────▼─────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                         │
│                                                             │
│  PostgreSQL Adapters (TypeORM):                             │
│  • ProductRepository      implements ProductRepositoryPort  │
│  • CustomerRepository     implements CustomerRepositoryPort │
│  • TransactionRepository  implements TransactionRepositoryPort│
│  • DeliveryRepository     implements DeliveryRepositoryPort │
│                                                             │
│  External Service Adapters:                                 │
│  • WompiPaymentAdapter    implements PaymentGatewayPort      │
│    - POST /tokens/cards          (tokenize card)            │
│    - GET  /merchants/{pub_key}   (acceptance tokens)        │
│    - POST /transactions          (create payment)           │
│    - GET  /transactions/{id}     (get payment status)       │
│                                                             │
│  Database:                                                  │
│  • TypeORM configuration (PostgreSQL)                       │
│  • Auto-sync entities to DB schema                          │
│  • ProductSeed (6 dummy products on startup)                │
│                                                             │
│  Config:                                                    │
│  • Environment variables (.env)                             │
│  • Database connection settings                             │
│  • Payment gateway API keys                                 │
└─────────────────────────────────────────────────────────────┘
```

### Frontend - Flux Architecture (Redux Toolkit)

```
┌─────────────────────────────────────────────────────────────┐
│                       REACT APP                              │
│                                                             │
│  App.tsx (Router by checkout step)                          │
│  ├── Step 1: ProductPage                                    │
│  │   └── ProductCard (per product)                          │
│  │       • Product image, name, description, price          │
│  │       • Stock count                                      │
│  │       • Quantity selector (+/-)                           │
│  │       • "Pay with credit card" button                    │
│  │                                                          │
│  ├── Step 2: CreditCardModal (overlay)                      │
│  │   ├── Credit Card Section                                │
│  │   │   • Card number (formatted, Luhn validated)          │
│  │   │   • Visa/MasterCard logo detection                   │
│  │   │   • Card holder name                                 │
│  │   │   • Expiry (MM/YY) + CVC                             │
│  │   └── Delivery Section                                   │
│  │       • Email, Full Name, Phone                          │
│  │       • Address, City                                    │
│  │                                                          │
│  ├── Step 3: SummaryBackdrop (Material backdrop)            │
│  │   ├── Back layer: product + card + delivery summary      │
│  │   └── Front layer: fee breakdown + Pay button            │
│  │       • Product amount × quantity                        │
│  │       • Base fee ($5,000 COP)                            │
│  │       • Delivery fee ($10,000 COP)                       │
│  │       • Total                                            │
│  │                                                          │
│  └── Step 4: TransactionResult                              │
│      • Status icon + label (APPROVED/DECLINED/ERROR/etc.)   │
│      • Transaction reference                                │
│      • Fee breakdown                                        │
│      • Payment gateway transaction ID                       │
│      • "Back to Store" button → reloads products            │
│                                                             │
│  Redux Store:                                               │
│  ├── products: { items[], loading, error }                  │
│  │   └── loadProducts (async thunk → GET /api/products)     │
│  ├── checkout: { step, selectedProductId, quantity,          │
│  │              customerInfo, cardInfo, transactionId,       │
│  │              loading, error }                             │
│  │   └── Actions: selectProduct, setCustomerInfo,           │
│  │       setCardInfo, setTransactionId, setStep,            │
│  │       setLoading, setError, resetCheckout                │
│  └── transaction: { current }                               │
│      └── Actions: setTransaction, clearTransaction          │
│                                                             │
│  Services:                                                  │
│  • api.ts (Axios instance → /api proxy to backend)          │
│    - fetchProducts, createTransaction, completePayment      │
│    - getTransaction, tokenizeCard, getAcceptanceToken       │
│                                                             │
│  Utils:                                                     │
│  • cardValidator.ts                                         │
│    - detectCardBrand (Visa/MasterCard/unknown)              │
│    - luhnCheck (card number validation)                     │
│    - formatCardNumber (groups of 4)                         │
│    - formatExpiry (MM/YY)                                   │
│    - validateExpiry (future date check)                     │
│  • persistence.ts                                           │
│    - saveState / loadState / clearState (localStorage)      │
│    - Persists: step, product, quantity, customer, txn ID    │
│    - NEVER persists: full card number, CVC                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

### Backend (`Back/`)

```
Back/
├── src/
│   ├── main.ts                                    # Bootstrap, Swagger, Helmet, CORS, ValidationPipe
│   ├── app.module.ts                              # Root module, DI wiring, seed on init
│   │
│   ├── domain/                                    # DOMAIN LAYER (0 framework dependencies)
│   │   ├── entities/
│   │   │   ├── product.entity.ts                  # Product entity (TypeORM decorated)
│   │   │   ├── customer.entity.ts                 # Customer entity
│   │   │   ├── transaction.entity.ts              # Transaction entity + TransactionStatus enum
│   │   │   └── delivery.entity.ts                 # Delivery entity + DeliveryStatus enum
│   │   ├── ports/
│   │   │   ├── product.repository.port.ts         # ProductRepositoryPort interface
│   │   │   ├── customer.repository.port.ts        # CustomerRepositoryPort interface
│   │   │   ├── transaction.repository.port.ts     # TransactionRepositoryPort interface
│   │   │   ├── delivery.repository.port.ts        # DeliveryRepositoryPort interface
│   │   │   └── payment-gateway.port.ts            # PaymentGatewayPort interface + DTOs
│   │   └── use-cases/
│   │       ├── result.ts                          # Result<T,E> monad (ROP)
│   │       ├── create-transaction.use-case.ts     # Create PENDING transaction
│   │       ├── complete-payment.use-case.ts       # Process payment + update stock
│   │       ├── result.spec.ts                     # Result monad tests
│   │       ├── create-transaction.use-case.spec.ts
│   │       └── complete-payment.use-case.spec.ts
│   │
│   ├── infrastructure/                            # INFRASTRUCTURE LAYER (adapters)
│   │   ├── adapters/
│   │   │   ├── postgres/
│   │   │   │   ├── product.repository.ts          # ProductRepository adapter
│   │   │   │   ├── customer.repository.ts         # CustomerRepository adapter
│   │   │   │   ├── transaction.repository.ts      # TransactionRepository adapter
│   │   │   │   ├── delivery.repository.ts         # DeliveryRepository adapter
│   │   │   │   ├── product.repository.spec.ts
│   │   │   │   ├── customer.repository.spec.ts
│   │   │   │   ├── transaction.repository.spec.ts
│   │   │   │   └── delivery.repository.spec.ts
│   │   │   └── wompi/
│   │   │       ├── wompi-payment.adapter.ts       # Payment gateway adapter
│   │   │       └── wompi-payment.adapter.spec.ts
│   │   ├── database/
│   │   │   └── seeds/
│   │   │       ├── product.seed.ts                # Seeds 6 dummy products
│   │   │       └── product.seed.spec.ts
│   │   └── config/
│   │       └── configuration.ts                   # Environment config
│   │
│   └── application/                               # APPLICATION LAYER (HTTP)
│       ├── controllers/
│       │   ├── product.controller.ts              # GET /products, GET /products/:id
│       │   ├── transaction.controller.ts          # POST/GET transactions, tokenize, acceptance
│       │   ├── product.controller.spec.ts
│       │   └── transaction.controller.spec.ts
│       └── dtos/
│           ├── create-transaction.dto.ts          # Validated input for creating transactions
│           ├── complete-payment.dto.ts            # Validated input for payment completion
│           └── tokenize-card.dto.ts               # Validated input for card tokenization
│
├── .env                                           # Environment variables
├── package.json                                   # Dependencies + Jest config
└── tsconfig.json                                  # TypeScript config
```

### Frontend (`Front/`)

```
Front/
├── src/
│   ├── main.tsx                                   # Entry point, Redux Provider
│   ├── App.tsx                                    # Step-based routing (1-4)
│   ├── App.spec.tsx                               # App component tests
│   ├── index.css                                  # Tailwind imports + custom theme
│   ├── setupTests.ts                              # Jest DOM matchers
│   │
│   ├── app/
│   │   ├── store.ts                               # Redux store (products + checkout + transaction)
│   │   └── hooks.ts                               # useAppDispatch, useAppSelector typed hooks
│   │
│   ├── features/
│   │   ├── products/
│   │   │   ├── ProductPage.tsx                    # Product listing page (step 1)
│   │   │   ├── ProductCard.tsx                    # Individual product card + formatPrice
│   │   │   ├── productsSlice.ts                   # Products state + loadProducts thunk
│   │   │   ├── ProductPage.spec.tsx
│   │   │   ├── ProductCard.spec.tsx
│   │   │   └── productsSlice.spec.ts
│   │   │
│   │   ├── checkout/
│   │   │   ├── CreditCardModal.tsx                # Card + delivery form modal (step 2)
│   │   │   ├── checkoutSlice.ts                   # Checkout state + persistence
│   │   │   ├── CreditCardModal.spec.tsx
│   │   │   └── checkoutSlice.spec.ts
│   │   │
│   │   ├── summary/
│   │   │   ├── SummaryBackdrop.tsx                # Payment summary backdrop (step 3)
│   │   │   └── SummaryBackdrop.spec.tsx
│   │   │
│   │   └── transaction/
│   │       ├── TransactionResult.tsx              # Transaction result page (step 4)
│   │       ├── transactionSlice.ts                # Transaction state
│   │       ├── TransactionResult.spec.tsx
│   │       └── transactionSlice.spec.ts
│   │
│   ├── services/
│   │   ├── api.ts                                 # Axios HTTP client + all API functions + types
│   │   └── api.spec.ts
│   │
│   └── utils/
│       ├── cardValidator.ts                       # Luhn, brand detection, formatting
│       ├── persistence.ts                         # localStorage save/load/clear
│       ├── cardValidator.spec.ts
│       └── persistence.spec.ts
│
├── jest.config.ts                                 # Jest config (jsdom, ts-jest, coverage)
├── vite.config.ts                                 # Vite config (Tailwind, proxy /api → backend)
├── tailwind.config.js                             # Tailwind configuration
├── package.json
└── tsconfig.json / tsconfig.app.json
```

---

## Data Model

### Entity Relationship Diagram

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
│   products   │       │  transactions   │       │  customers   │
├──────────────┤       ├─────────────────┤       ├──────────────┤
│ id (PK, UUID)│◄──────│ product_id (FK) │       │ id (PK, UUID)│
│ name         │       │ customer_id (FK)│──────►│ email        │
│ description  │       │ id (PK, UUID)   │       │ fullName     │
│ priceCents   │       │ reference       │       │ phone        │
│ imageUrl     │       │ quantity        │       │ address      │
│ stock        │       │ amountCents     │       │ city         │
│ createdAt    │       │ baseFeeCents    │       │ createdAt    │
└──────────────┘       │ deliveryFeeCents│       └──────────────┘
                       │ totalCents      │
                       │ status          │       ┌──────────────┐
                       │ gatewayTxnId      │       │  deliveries  │
                       │ createdAt       │       ├──────────────┤
                       │ updatedAt       │◄──────│ transaction_id│
                       └─────────────────┘       │ id (PK, UUID)│
                                                 │ customer_id  │
                                                 │ address      │
                                                 │ city         │
                                                 │ status       │
                                                 │ createdAt    │
                                                 └──────────────┘
```

### Products Table

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK, auto-generated | Unique product identifier |
| name | VARCHAR | NOT NULL | Product name |
| description | TEXT | NOT NULL | Product description |
| priceCents | INT | NOT NULL | Price in Colombian cents (÷100 = COP) |
| imageUrl | VARCHAR | NOT NULL | Product image URL |
| stock | INT | NOT NULL | Available units in stock |
| createdAt | TIMESTAMP | auto-generated | Creation timestamp |

### Customers Table

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK, auto-generated | Unique customer identifier |
| email | VARCHAR | NOT NULL | Customer email address |
| fullName | VARCHAR | NOT NULL | Customer full name |
| phone | VARCHAR | NULLABLE | Phone number |
| address | VARCHAR | NULLABLE | Delivery address |
| city | VARCHAR | NULLABLE | City |
| createdAt | TIMESTAMP | auto-generated | Creation timestamp |

### Transactions Table

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK, auto-generated | Unique transaction identifier |
| reference | VARCHAR | UNIQUE, NOT NULL | Transaction reference (TXN-XXXXXXXX) |
| customer_id | UUID | FK → customers.id | Customer who made the purchase |
| product_id | UUID | FK → products.id | Product being purchased |
| quantity | INT | DEFAULT 1 | Quantity purchased |
| amountCents | INT | NOT NULL | Product subtotal (price × quantity) |
| baseFeeCents | INT | NOT NULL | Base fee ($5,000 COP = 500000 cents) |
| deliveryFeeCents | INT | NOT NULL | Delivery fee ($10,000 COP = 1000000 cents) |
| totalCents | INT | NOT NULL | Total = amount + baseFee + deliveryFee |
| status | ENUM | NOT NULL | PENDING, APPROVED, DECLINED, ERROR, VOIDED |
| gatewayTransactionId | VARCHAR | NULLABLE | External payment gateway transaction ID |
| createdAt | TIMESTAMP | auto-generated | Creation timestamp |
| updatedAt | TIMESTAMP | auto-updated | Last update timestamp |

### Deliveries Table

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK, auto-generated | Unique delivery identifier |
| transaction_id | UUID | FK → transactions.id, UNIQUE | Associated transaction |
| customer_id | UUID | FK → customers.id | Customer receiving delivery |
| address | VARCHAR | NOT NULL | Delivery address |
| city | VARCHAR | NOT NULL | Delivery city |
| status | ENUM | NOT NULL | PENDING, SHIPPED, DELIVERED |
| createdAt | TIMESTAMP | auto-generated | Creation timestamp |

---

## API Endpoints

### Products

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/products` | List all products with stock | - | `Product[]` |
| GET | `/api/products/:id` | Get product by ID | - | `Product` |

### Transactions

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| POST | `/api/transactions` | Create transaction (PENDING) | `CreateTransactionDto` | `Transaction` |
| POST | `/api/transactions/:id/pay` | Complete payment | `CompletePaymentDto` | `Transaction` |
| GET | `/api/transactions/:id` | Get transaction by ID | - | `Transaction` |
| POST | `/api/transactions/tokenize` | Tokenize credit card | `TokenizeCardDto` | `{tokenId, brand}` |
| GET | `/api/transactions/acceptance/token` | Get acceptance tokens | - | `{acceptanceToken, ...}` |

### DTO Schemas

**CreateTransactionDto:**
```json
{
  "productId": "uuid",
  "quantity": 1,
  "customerEmail": "user@example.com",
  "customerFullName": "John Doe",
  "customerPhone": "+573001234567",
  "customerAddress": "Calle 123 #45-67",
  "customerCity": "Bogota"
}
```

**CompletePaymentDto:**
```json
{
  "cardToken": "tok_stagtest_...",
  "installments": 1,
  "acceptanceToken": "eyJ...",
  "acceptPersonalAuth": "eyJ..."
}
```

**TokenizeCardDto:**
```json
{
  "number": "4242424242424242",
  "cvc": "123",
  "expMonth": "12",
  "expYear": "28",
  "cardHolder": "John Doe"
}
```

**Swagger documentation**: Available at `http://localhost:3001/api/docs`

### cURL Examples (Full Payment Flow)

**1. List all products:**
```bash
curl -s http://localhost:3001/api/products | jq
```

**2. Create a transaction (PENDING):**
```bash
curl -s -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<PRODUCT_UUID>",
    "quantity": 1,
    "customerEmail": "john@example.com",
    "customerFullName": "John Doe",
    "customerPhone": "+573001234567",
    "customerAddress": "Calle 123 #45-67",
    "customerCity": "Bogota"
  }' | jq
```

**3. Tokenize a credit card:**
```bash
curl -s -X POST http://localhost:3001/api/transactions/tokenize \
  -H "Content-Type: application/json" \
  -d '{
    "number": "4242424242424242",
    "cvc": "789",
    "expMonth": "12",
    "expYear": "29",
    "cardHolder": "John Doe"
  }' | jq
```
> Sandbox test cards: `4242424242424242` (APPROVED), `4111111111111111` (DECLINED)

**4. Get acceptance tokens:**
```bash
curl -s http://localhost:3001/api/transactions/acceptance/token | jq
```

**5. Complete payment:**
```bash
curl -s -X POST http://localhost:3001/api/transactions/<TRANSACTION_UUID>/pay \
  -H "Content-Type: application/json" \
  -d '{
    "cardToken": "tok_stagtest_...",
    "installments": 1,
    "acceptanceToken": "eyJ...",
    "acceptPersonalAuth": "eyJ..."
  }' | jq
```

**6. Check transaction status:**
```bash
curl -s http://localhost:3001/api/transactions/<TRANSACTION_UUID> | jq
```

### Postman Collection

Import the Swagger spec directly into Postman:
1. Open Postman → **Import** → **Link**
2. Enter: `http://localhost:3001/api/docs-json`
3. All endpoints will be imported with schemas and examples

---

## Business Flow

```
Step 1: PRODUCT PAGE               Step 2: CREDIT CARD + DELIVERY
┌─────────────────────┐            ┌─────────────────────────┐
│ Browse products     │            │ Card Number (Luhn)      │
│ See stock & prices  │──Click────►│ Visa/MC auto-detect     │
│ Select quantity     │  "Pay"     │ Expiry + CVC            │
│ "Pay with card"     │            │ ─────────────────────── │
└─────────────────────┘            │ Email, Name, Phone      │
                                   │ Address, City           │
                                   │ "Continue to Summary"   │
                                   └──────────┬──────────────┘
                                              │
Step 4: RESULT                     Step 3: SUMMARY (BACKDROP)
┌─────────────────────┐            ┌─────────────────────────┐
│ ✓ APPROVED          │            │ Product × Qty  $100,000 │
│ ✗ DECLINED          │◄───Pay────│ Base Fee        $5,000  │
│ ! ERROR             │  Button    │ Delivery Fee   $10,000  │
│                     │            │ ─────────────────────── │
│ Reference: TXN-XXX  │            │ TOTAL         $115,000  │
│ Amounts breakdown   │            │                         │
│ "Back to Store"     │            │ [PAY $115,000]          │
└────────┬────────────┘            └─────────────────────────┘
         │
         │ Back to Store
         ▼
Step 5: PRODUCT PAGE (stock updated)
```

### Payment Processing (Step 3 → Step 4):
1. **POST /api/transactions** → Creates PENDING transaction, returns `transactionId`
2. **POST /api/transactions/tokenize** → Tokenizes card via payment gateway, returns `cardToken`
3. **GET /api/transactions/acceptance/token** → Gets acceptance + personal auth tokens
4. **POST /api/transactions/:id/pay** → Sends payment to gateway:
   - If **APPROVED**: updates transaction status, decreases product stock, creates delivery record
   - If **DECLINED/ERROR**: updates transaction status only
5. Frontend displays result and navigates to Step 4

---

## Setup & Run

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** running on `localhost:5432`
- Create database: `CREATE DATABASE payment_store;`

### Backend

```bash
cd Back
npm install

# Configure environment (edit .env if needed)
# Default: PostgreSQL on localhost:5432, user: postgres, password: postgres, db: payment_store

npm run start:dev     # Development mode (auto-reload)
# or
npm run build && npm run start:prod   # Production mode
```

Backend runs on `http://localhost:3001`
Swagger docs at `http://localhost:3001/api/docs`

### Frontend

```bash
cd Front
npm install
npm run dev           # Development mode (HMR)
# or
npm run build         # Production build (outputs to dist/)
```

Frontend runs on `http://localhost:5173`
API requests proxied to backend via Vite proxy config.

### Environment Variables (Backend `.env`)

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=payment_store
PAYMENT_GATEWAY_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
PAYMENT_GATEWAY_PUBLIC_KEY=pub_stagtest_...
PAYMENT_GATEWAY_PRIVATE_KEY=prv_stagtest_...
PAYMENT_GATEWAY_INTEGRITY_KEY=stagtest_integrity_...
FRONTEND_URL=http://localhost:5173
```

---

## Test Coverage

### Running Tests

```bash
# Backend tests + coverage
cd Back
npm run test:cov

# Frontend tests + coverage
cd Front
npx jest --coverage
```

### Backend Results (86.24% statements, 59 tests, 11 suites)

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| **All files** | **86.24%** | **62.31%** | **85.96%** | **85.71%** |
| application/controllers | 100% | 71.42% | 100% | 100% |
| application/dtos | 100% | 100% | 100% | 100% |
| domain/entities | 95.65% | 77.77% | 40% | 95.08% |
| domain/ports | 100% | 100% | 100% | 100% |
| domain/use-cases | 100% | 67.21% | 100% | 100% |
| infrastructure/adapters/postgres | 100% | 77.27% | 100% | 100% |
| infrastructure/adapters/wompi | 100% | 75% | 100% | 100% |
| infrastructure/database/seeds | 100% | 83.33% | 100% | 100% |

### Frontend Results (92.94% statements, 88 tests, 12 suites)

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| **All files** | **92.94%** | **87.91%** | **94.73%** | **92.27%** |
| App.tsx | 100% | 66.66% | 100% | 100% |
| features/checkout | 99.04% | 88.29% | 100% | 100% |
| features/products | 97.56% | 80% | 93.75% | 97.43% |
| features/summary | 58.33% | 81.81% | 57.14% | 54.83% |
| features/transaction | 100% | 83.33% | 100% | 100% |
| services | 100% | 100% | 100% | 100% |
| utils | 100% | 100% | 100% | 100% |

### Combined: 147 tests passing, > 80% coverage on both FE & BE

---

## Security

| Feature | Implementation |
|---------|---------------|
| **Security Headers** | Helmet middleware (X-Content-Type-Options, X-Frame-Options, etc.) |
| **CORS** | Configured for frontend origin only |
| **Input Validation** | class-validator decorators on all DTOs (whitelist, transform) |
| **Card Data** | Never stored - tokenized via payment gateway, card numbers excluded from localStorage |
| **API Keys** | Stored in environment variables, never exposed to frontend |
| **SQL Injection** | TypeORM parameterized queries |
| **XSS Protection** | React default escaping + Helmet headers |

---

## Design Decisions

### Railway Oriented Programming (ROP)

Use cases return `Result<T, E>` instead of throwing exceptions. This makes error handling explicit and composable:

```typescript
// Example: CreateTransactionUseCase
async execute(input): Promise<Result<Transaction>> {
  const product = await this.productRepo.findById(input.productId);
  if (!product) return Result.fail('Product not found');
  if (product.stock < input.quantity) return Result.fail('Insufficient stock');
  // ... continue on success path
  return Result.ok(transaction);
}
```

### Hexagonal Architecture

- **Domain layer** has zero NestJS/framework imports (only TypeORM decorators on entities)
- **Ports** are TypeScript interfaces injected via NestJS DI tokens
- **Adapters** can be swapped without changing domain logic (e.g., swap PostgreSQL for DynamoDB)

### State Persistence (Refresh Resilience)

Redux checkout state is persisted to `localStorage` on every mutation. On page refresh:
- Checkout step, selected product, quantity, and customer info are restored
- Card number and CVC are **never** persisted (security)
- Transaction ID is restored so the user can see their pending transaction

### Mobile-First Responsive Design

- Tailwind CSS utility classes with responsive breakpoints (`sm:`, `lg:`)
- CSS Grid for product listing (1 col mobile → 2 col tablet → 3 col desktop)
- Minimum screen size: iPhone SE (375px width)
- Modal and backdrop components designed for touch interaction
