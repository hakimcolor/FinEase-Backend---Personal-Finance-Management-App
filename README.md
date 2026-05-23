# FinTrack Backend - Node.js + Express + MongoDB

## 🚀 Quick Start

```bash
npm install
node index.js
```

## 🔐 Admin Setup

### Step 1: Run Setup Script

```bash
node setup-admin.js
```

### Step 2: Admin Credentials

```
Email: admin@fintrack.com
Password: Admin@123456

Your Email: hakimcolor777@gmail.com
Password: (your existing password)
```

## 📡 API Endpoints

### User Routes

- `GET /users/by-email?email=` - Get user by email
- `POST /users` - Create/update user
- `GET /users/all` - Get all users (Admin)
- `PATCH /users/:id/role` - Update user role (Admin)

### Transaction Routes

- `GET /transactions?email=` - Get user transactions
- `GET /transactions/overview?email=` - Get overview
- `GET /transactions/category-total?email=` - Get category totals
- `GET /transactions/:id` - Get single transaction
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Category Routes (Admin)

- `GET /categories` - Get all categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Admin Reports

- `GET /admin/reports` - Get platform-wide financial reports

### Financial Tips Management

- `GET /tips` - Get all financial tips
- `GET /tips?featured=true` - Get featured tips only
- `POST /tips` - Create financial tip
- `PUT /tips/:id` - Update financial tip
- `DELETE /tips/:id` - Delete financial tip

### Savings Goals

- `GET /savings-goals?email=` - Get user goals
- `POST /savings-goals` - Create goal
- `PUT /savings-goals/:id` - Update goal
- `DELETE /savings-goals/:id` - Delete goal

### Budgets

- `GET /budgets?email=` - Get user budgets
- `POST /budgets` - Create budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

### Financial Insights

- `GET /insights?email=` - Get personalized insights

## 🗄️ Database Collections

- `user` - User accounts (with role field)
- `add` - Transactions
- `categories` - Transaction categories
- `savingsGoals` - Savings goals
- `budgets` - Monthly budgets
- `billReminders` - Bill reminders
- `financialTips` - Featured financial tips

## ⚙️ Environment Variables

Create `.env` file:

```env
DB_USERNAME=your_mongodb_username
DB_Password=your_mongodb_password
JWT_SECRET=fintrack-secret-key
PORT=3000
```

## 🎯 Features

✅ JWT Authentication
✅ Password Hashing (bcryptjs)
✅ Role-Based Access Control
✅ Transaction Management
✅ Category Management
✅ Savings Goals
✅ Budget Planning
✅ Financial Insights
✅ Bill Reminders
✅ Admin Reports Monitoring
✅ Financial Tips Management

## 📊 Server Status

Server runs on: `http://localhost:3000`

Test endpoint: `http://localhost:3000/`
Response: "Server is running fine.."
