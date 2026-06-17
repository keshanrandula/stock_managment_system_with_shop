# 📊 Stock Management System with Shop

A modern, full-stack Stock Management System built with **React (Vite)**, **Node.js (Express)**, and **MongoDB**. This system helps businesses track inventory, manage purchases/sales, coordinate with suppliers, apply coupons, and run an integrated customer-facing shop.

---

## 🚀 Key Features

*   **📦 Inventory Management**: Track stock levels, add/update products, categorize items, and view real-time stock logs.
*   **🛒 Integrated Shop & Customer Orders**: A public catalog page where customers can browse items, add them to a cart, place orders, and apply coupons.
*   **👥 Supplier Coordination**: Manage supplier database, contact details, and record purchase orders.
*   **📈 Dashboard & Analytics**: Visual representation of sales, low stock alerts, top products, and overall business health.
*   **🎟️ Coupon System**: Create and manage promotional coupons for discount campaigns.
*   **🔑 Role-Based Authentication**: Secure login and sign-up with access control for admins, staff, and customers.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Vite, Vanilla CSS (Glassmorphism design style), React Router
*   **Backend**: Node.js, Express.js, JWT (JSON Web Tokens), Mongoose
*   **Database**: MongoDB

---

## ⚙️ Project Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/try/download/community) installed locally.

### 1. Clone the repository
```bash
git clone https://github.com/keshanrandula/stock_managment_system_with_shop.git
cd stock_managment_system_with_shop
```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and update the connection values:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/stock_management
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```
4. Run database seed scripts (optional - to add mock data):
   ```bash
   node seed_mock_products.js
   node seed_user.js
   node seed_more.js
   ```
5. Start the backend server:
   ```bash
   npm run dev  # or node server.js
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📂 Folder Structure

```text
├── backend/
│   ├── config/          # Database config
│   ├── controllers/     # API controllers / logic
│   ├── middleware/      # Authentication & Error handler middlewares
│   ├── models/          # Mongoose database models
│   ├── routes/          # Express API route endpoints
│   ├── uploads/         # Local product image uploads
│   ├── server.js        # Backend entry point
│   └── .env.example     # Reference configuration file
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components (Sidebar, ProtectedRoute)
│   │   ├── context/     # Auth state context
│   │   ├── pages/       # Dashboard, Shop, Inventory, Orders pages
│   │   ├── services/    # API calling functions
│   │   ├── App.jsx      # Main application router
│   │   └── main.jsx     # Frontend entry point
└── .gitignore           # Global git ignore configuration
```
