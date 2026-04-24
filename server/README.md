# Book Bridge — Backend Setup

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (test keys)
- Cloudinary account (free tier)

## Setup

```bash
cd server
npm install

# Copy env file and fill in your values
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/bookbridge
JWT_SECRET=any_long_random_string
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=5000
CLIENT_URL=http://127.0.0.1:5500
```

## Seed the database

```bash
node scripts/seedBooks.js
```

## Run

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/signup | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/books | — | List books (filter: ?category=&author=&q=) |
| GET | /api/books/authors | — | Distinct authors |
| POST | /api/books | Writer | Add book |
| PUT | /api/books/:id | Writer | Update own book |
| DELETE | /api/books/:id | Writer | Soft-delete own book |
| GET | /api/cart | ✅ | Get cart |
| POST | /api/cart/add | ✅ | Add item |
| DELETE | /api/cart/item/:id | ✅ | Remove item |
| DELETE | /api/cart/clear | ✅ | Clear cart |
| POST | /api/orders/create | ✅ | Create Razorpay order |
| POST | /api/orders/verify | ✅ | Verify payment signature |
| POST | /api/orders/webhook | — | Razorpay webhook |
| GET | /api/orders/my | ✅ | Order history |
| POST | /api/upload/cover/:bookId | Writer | Upload cover → Cloudinary |
| POST | /api/upload/manuscript/:bookId | Writer | Upload PDF → Cloudinary |

## Frontend

Open `index.html` with a live server (VS Code Live Server, port 5500).
The frontend talks to `http://localhost:5000/api`.
