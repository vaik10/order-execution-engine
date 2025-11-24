# 🚀 Order Execution Engine (Mock DEX + WebSocket Updates)

This project implements a full **Order Execution Engine** using **Node.js**, **TypeScript**, **LoopBack 4**, **BullMQ**, **PostgreSQL**, and **WebSockets**.  
It simulates real-time DEX routing, order lifecycle events, and concurrent execution queues.  
The design follows the assignment specification, prioritizing clean architecture, reliability, and production-grade error handling.

---

## 📌 Features

### ✔ Supports *Market Orders*
Other order types (Limit, Sniper) can be easily added by extending the worker logic.

### ✔ Mock DEX Execution (Raydium + Meteora simulation)
- Realistic price variance  
- Artificial network delay  
- Slippage protection  
- Simulated transaction hash  

### ✔ DEX Router
Fetches quotes from:
- Mock Raydium Adapter  
- Mock Meteora Adapter  

Automatically selects the best output venue.

### ✔ WebSocket Live Updates
Each order emits real-time lifecycle events: pending → routing → building → submitted → confirmed / failed


### ✔ High-throughput Queue (BullMQ)
- Redis-backed  
- Up to 10 concurrent orders  
- Auto retry with exponential backoff (3 retries)  
- Durable job state  

### ✔ PostgreSQL Persistence
Stores:
- OrderId  
- Tokens, slippage  
- Selected DEX  
- Tx hash  
- Full order lifecycle  
- Failure reason (if any)
---

## 🧱 Architecture Overview

The system is composed of five core components working together to provide
real-time order execution with DEX routing and guaranteed delivery via
queue workers.

```text
┌──────────────────────────────┐
│        REST Controller       │
│    POST /api/orders/execute  │
└───────────────┬──────────────┘
                │ validates + stores order in DB
                ▼
┌──────────────────────────────┐
│        OrderService          │
│ - create order record        │
│ - enqueue job in BullMQ      │
└───────────────┬──────────────┘
                │ jobId = orderId
                ▼
┌──────────────────────────────┐
│         BullMQ Queue         │
│     "order-execution"        │
└───────────────┬──────────────┘
                │ pulls jobs concurrently
                ▼
┌──────────────────────────────┐
│         OrderWorker          │
│ - emits WS lifecycle events  │
│ - fetches quotes (mock DEX)  │
│ - routes to best DEX         │
│ - simulates swap execution   │
│ - retries on failure         │
│ - updates DB with results    │
└───────────────┬──────────────┘
                │ broadcasts events
                ▼
┌──────────────────────────────┐
│       WebSocketManager       │
│ Streams real-time updates:   │
│ pending → routing → building │
│ →submitted →confirmed/failed │
└──────────────────────────────┘
```
At a high level:

- The **API** receives an order → stores it → pushes the job to the queue.
- The **worker** processes the order independently, ensuring the API stays fast.
- The **router** queries mock Raydium & Meteora pools to determine best execution.
- The **WebSocket manager** streams live updates back to the client.
- **PostgreSQL** stores all state transitions and final execution results.
- **Redis/BullMQ** ensures reliability, retries, and parallel processing.


## 🎯 Why Market Orders?

Market orders are ideal for a foundational execution engine because they:
1. Require immediate execution  
2. Demonstrate routing + slippage + retry mechanics cleanly  
3. Produce straightforward WebSocket event flows  

### Extending for limit/sniper orders:
- **Limit order**: Worker checks live quote price; executes when threshold is reached.  
- **Sniper order**: Worker polls for token launch/liquidity or price spike.  

The architecture supports these without structural changes.

---

# 🛠 Setup Instructions

## 1. Clone repo

```
git clone https://github.com/vaik10/order-execution-engine.git
cd order-execution-engine
```

## 2. Install dependencies
```
npm install
```

## 3. Create .env
```
Create the env file using env.example
```
## 4. Start database & redis (recommended via Docker)
```
docker compose up -d
```
## 5. Run database migration
```
npm run migrate
```
## 6. Start server
```
npm run build
npm start
```


