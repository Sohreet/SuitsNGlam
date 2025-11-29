# SuitsnGlam Backend (Full)

This backend implements a full e-commerce API (Node.js + Express + MongoDB).
Features:
- User signup/login (JWT)
- Admin login
- Product CRUD (admin)
- Cart & order creation
- Razorpay order creation & verification (placeholders)
- File uploads for product images (multer)

Usage:
1. Copy `.env.example` to `.env` and fill values.
2. `npm install`
3. `npm start` (or `npm run dev` with nodemon)
4. Deploy to Render: build command `npm install`, start command `npm start`, set environment variables on Render (MONGO_URI, JWT_SECRET, RAZORPAY keys).
