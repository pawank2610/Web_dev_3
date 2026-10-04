# Assignment 3 – Inventory and Data Management System

RESTful backend built with **Node.js, Express, MongoDB (Mongoose) and dotenv**.

## Setup
1. Install and start MongoDB locally (or use a MongoDB Atlas URI).
2. `npm install`
3. Edit `.env` if needed (see `.env.example`):
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
   NODE_ENV=development
   ```
4. (Optional) `npm run seed` – inserts 12 sample products in 5 categories.
5. `npm start` (or `npm run dev` for auto-reload). API: `http://localhost:5000/api/products`

## Project structure
```
server.js                      app entry point
seed.js                        sample data
src/config/db.js               MongoDB connection
src/models/Product.js          schema + validation + stockValue virtual
src/controllers/productController.js
src/routes/productRoutes.js
src/middleware/validate.js     ObjectId / body / stock-change validation
src/middleware/errorHandler.js centralized error handling
src/utils/                     ApiError, asyncHandler
```

## Endpoints
| Method | URL | Purpose |
|---|---|---|
| POST | `/api/products` | Create product (201) |
| GET | `/api/products` | List with filter / sort / pagination |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update details (partial body allowed) |
| PATCH | `/api/products/:id/stock` | Restock / sale, body `{ "change": 10 }` or `{ "change": -3 }` |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/low-stock` | Items where `quantity <= reorderLevel` |
| GET | `/api/products/summary` | Category-wise aggregation report |

### Query parameters for `GET /api/products`
`category`, `supplier`, `search` (name/SKU), `minPrice`, `maxPrice`, `inStock=true|false`,
`sort` (e.g. `price`, `-quantity`, `category,-price`), `page` (default 1), `limit` (default 10, max 100).

Example: `/api/products?category=Electronics&minPrice=500&sort=-price&page=1&limit=5`

### Sample bodies
POST:
```json
{ "name": "Gel Pen Pack of 15", "sku": "STNY-PN-713", "category": "Stationery",
  "price": 120, "quantity": 40, "reorderLevel": 20, "supplier": "Cello Pens" }
```
PUT: `{ "name": "Gel Pen Pack of 15", "sku": "STNY-PN-713", "category": "Stationery", "price": 140, "quantity": 60 }`

PATCH `/stock`: `{ "change": 10 }`

## Key design points
- **Validation:** required fields, trimmed/uppercased unique SKU (regex), category enum, non-negative price, integer non-negative quantity/reorderLevel. Validators also run on updates.
- **Safe stock handling:** single atomic `$inc`; a sale with insufficient stock is rejected (400) and quantity can never go negative, even under concurrent requests.
- **Virtual `stockValue`** = price × quantity.
- **Aggregation:** `$group` by category → totalItems, totalQuantity, totalStockValue, avgPrice, sorted by stock value.
- **Centralized errors:** validation → 400, bad id/cast → 400, duplicate SKU → 409, not found → 404, malformed JSON → 400, other → 500.
- Static routes (`/low-stock`, `/summary`) are declared before `/:id`.
