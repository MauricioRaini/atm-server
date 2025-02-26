# ATM_API

An advanced RESTful API simulating an ATM machine. The API supports secure user authentication, balance inquiries, deposits, withdrawals, internal and external transfers, and (in the near future) financial data reporting. Built in **Node.js (TypeScript)** using **Express and Prisma with PostgreSQL**, this API follows a **modular monolith architecture** and has been developed using **Test-Driven Development (TDD)**.

> **Note:** For development, every time the image is built, the database is reset and seeded with sample data so that new developers start with a **clean** environment immediately.

## 📌 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Modules Overview](#modules-overview)
- [Transactions API Documentation](#transactions-api-documentation)
- [Routes Protection](#routes-protection)
- [Running the Project](#running-the-project)
  - [Using Docker](#using-docker)
  - [Local Development (npm)](#local-development-npm)
- [Test-Driven Development & Test Coverage](#test-driven-development--test-coverage)
- [Contribution Guidelines](#contribution-guidelines)
- [Future Roadmap](#future-roadmap)

---

## 🔍 Overview

The **ATM_API** is a backend service that mimics the functionality of a real ATM. It supports:

- **User Authentication**: Secure PIN-based login using JWT.
- **Financial Transactions**: Deposit, withdrawal, internal transfer (between cards on the same account), and external transfer (between different accounts).
- **Financial Data Reporting (Planned Feature)**: A dedicated service to retrieve complete financial information (account balance, daily limits, and associated cards) is designed but not yet implemented.

The API has been built using a **Test-Driven Development (TDD)** approach to ensure robustness, maintainability, and ease of future extensions.

---

## ⚙️ Tech Stack

- **Language:** TypeScript, Node.js
- **Framework:** Express
- **Database:** PostgreSQL (accessed via Prisma ORM)
- **Authentication:** JSON Web Tokens (JWT)
- **Containerization:** Docker & Docker Compose
- **Testing:** Jest (using a Given/When/Then approach)
- **Code Quality:** ESLint, Prettier

---

## 🏗️ Architecture & Design Patterns

### **Modular Monolith Architecture**
We chose a **modular monolith architecture** for the following reasons:

✅ **Simplicity** – Avoids the operational complexity and overhead of microservices while maintaining clear separation of concerns.  
✅ **Structured & Scalable** – Each domain (e.g., Authentication, Transactions) is organized into its own module with dedicated controllers, services, and repositories.  
✅ **Maintainability** – Business logic is cleanly separated from data access, facilitating easier testing and maintenance.  

### **Design Patterns Employed**

- **Repository Pattern**: Encapsulates database interactions within repositories, ensuring a **single source of truth** for data access.
- **Service Layer**: Encapsulates business logic and transactional flows (e.g., deposit, withdrawal, transfer).
- **Controller Layer**: Handles HTTP requests, delegates to services, and formats responses.
- **Middleware**: Manages **CORS, JWT authentication, and error handling** for secure request processing.
- **TDD (Test-Driven Development)**: Ensures correctness and facilitates future changes through structured **unit tests**.

---

## 📦 Modules Overview

### **Auth Module**
Manages **user authentication**, **PIN validation**, **JWT token generation/verification**, and **PIN changes**.

#### **User Credentials from Seed Data**:

| User | Account/Card Number | PIN    |
|------|--------------------|--------|
| 1    | 123456             | 000000 | Peter Parker
| 2    | 654321             | 000000 | Canelo Alvarez

### **Transactions Module**
Handles **deposit, withdrawal, internal transfer, and external transfer** operations.

🔹 **Planned Feature**: A **financial info service** that returns the user’s **account details, card data, balances, and daily limits** is designed but not yet implemented.

### **Shared Module**
Contains **common utilities and middlewares** (e.g., JWT middleware, logger) used across the application.

### **Config Module**
Manages **environment variables, Prisma client initialization, and dependency injection**.

---

## 🔄 Transactions API Documentation

### **1. Deposit**
- **Endpoint:** `POST /api/transactions/deposit`
- **Authorization:** JWT token required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "accountNumber": "123456",
    "depositAmount": 100
  }
  ```
- **Success Response:**
  ```json
  {
    "message": "Deposit successful"
  }
  ```

### **2. Withdrawal**
- **Endpoint:** `POST /api/transactions/withdraw`
- **Authorization:** JWT token required
- **Request Body:**
  ```json
  {
    "accountId": "ACC123",
    "cardId": "CARD1",
    "withdrawalAmount": 100
  }
  ```

[Full API Documentation Here](#transactions-api-documentation)

---

## 🔐 Routes Protection

### **Public vs Protected Routes**

- **Public Routes**: The **Auth Module endpoints** (e.g., login, change PIN) are accessible without a JWT token.
- **Protected Routes**: All **Transactions Module endpoints** (deposit, withdrawal, transfers) require **JWT authentication**.

---

## 🚀 Running the Project

### **Using Docker**
```bash
git clone https://github.com/YourUsername/atm-server.git
cd atm-server
docker-compose up --build
```
- API available at: `http://localhost:3000`

### **Local Development (npm)**
```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm start
```
- API available at: `http://localhost:3000`

---

## ✅ Test-Driven Development & Test Coverage

This project follows **TDD (Test-Driven Development)**:

- **Unit Tests**: Jest tests for **services, repositories, controllers, middlewares**.
- **Integration Tests**: (Planned) Future integration tests to verify **end-to-end flows**.

**📌 Coverage Report:**
[Insert Coverage Badge or Image Here]

---

## 🔗 Contribution Guidelines

1️⃣ **Fork** the repository & create a new branch for your feature or bug fix.  
2️⃣ **Write tests first (TDD).**  
3️⃣ **Follow the code style guidelines** (ESLint, Prettier).  
4️⃣ **Commit messages should be clear and descriptive.**  
5️⃣ **Submit a Pull Request (PR)** with a detailed explanation.  

🔹 **All changes must pass existing tests and maintain high quality before merging.**

---

## 📌 Future Roadmap

🔹 **Enhanced Security** – Implement **rate limiting & advanced authentication mechanisms**.  
🔹 **Financial Data Reporting** – Build a **comprehensive financial info service**.  
🔹 **AI Assistant** – Develop a **voice/AI-powered ATM interface**.  
🔹 **Production CI/CD** – Set up **automated deployment pipelines**.  
🔹 **Microservices Migration** – Transition to a **distributed architecture** if needed.  

---

📌 **Maintainer**: *[Your Name]*  
📌 **License**: MIT  

🔥 **Happy Coding!**