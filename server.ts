import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database (SQL-compliant relational database)
const db = new Database('ecommerce.db');

// Database Schema Initialization
db.exec(`
  -- Users Table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Categories Table
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
  );

  -- Products Table
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  -- Orders Table
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  -- Order Items Table (Relationship between Orders and Products)
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  );
`);

// Seed Initial Data
const seedData = () => {
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as any;
  if (categoryCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
    insertCat.run('Electronics', 'electronics');
    insertCat.run('Apparel', 'apparel');
    
    const insertProd = db.prepare('INSERT INTO products (category_id, name, description, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)');
    insertProd.run(1, 'UltraBook Pro', 'High performance laptop', 1299.99, 10, 'https://picsum.photos/seed/laptop/400/300');
    insertProd.run(1, 'Noise-Cancelling Headphones', 'Premium audio experience', 249.50, 25, 'https://picsum.photos/seed/audio/400/300');
    insertProd.run(2, 'Cotton Crewneck T-Shirt', '100% organic cotton', 25.00, 100, 'https://picsum.photos/seed/shirt/400/300');
  }
};
seedData();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Endpoints

/**
 * @route   GET /api/products
 * @desc    Get all products with category info
 */
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Database error fetching products' });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Create a new order (Transactional)
 */
app.post('/api/orders', (req, res) => {
  const { userId, items, shippingAddress } = req.body;

  if (!userId || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required order data' });
  }

  const createOrder = db.transaction(() => {
    let totalPrice = 0;
    
    // 1. Validate stock and calculate total
    for (const item of items) {
      const product = db.prepare('SELECT price, stock_quantity FROM products WHERE id = ?').get(item.productId) as any;
      if (!product || product.stock_quantity < item.quantity) {
        throw new Error(`Product ID ${item.productId} is out of stock or invalid`);
      }
      totalPrice += product.price * item.quantity;
    }

    // 2. Create Order record
    const orderStmt = db.prepare('INSERT INTO orders (user_id, total_price, shipping_address) VALUES (?, ?, ?)');
    const orderResult = orderStmt.run(userId, totalPrice, shippingAddress);
    const orderId = orderResult.lastInsertRowid;

    // 3. Create Order Items and Update Stock
    const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    const stockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');

    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.productId) as any;
      itemStmt.run(orderId, item.productId, item.quantity, product.price);
      stockStmt.run(item.quantity, item.productId);
    }

    return { orderId, totalPrice };
  });

  try {
    const result = createOrder();
    res.status(201).json({ message: 'Order created successfully', ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /
 * @desc    API Documentation Landing Page
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-Commerce Backend API</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #050505; color: #a1a1aa; }
            code { font-family: 'JetBrains Mono', monospace; }
        </style>
    </head>
    <body class="p-8 md:p-16">
        <div class="max-w-4xl mx-auto">
            <header class="mb-12 border-b border-white/10 pb-8">
                <h1 class="text-4xl font-bold text-white mb-2 tracking-tight">E-Commerce Backend <span class="text-emerald-500">API</span></h1>
                <p class="text-zinc-500">Node.js + Express + SQL Database Integration</p>
            </header>

            <section class="space-y-8">
                <div>
                    <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Available Endpoints
                    </h2>
                    <div class="grid gap-4">
                        <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                            <div class="flex items-center justify-between mb-2">
                                <code class="text-emerald-400 font-bold">GET /api/products</code>
                                <span class="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Public</span>
                            </div>
                            <p class="text-sm text-zinc-400">Returns a list of all products including their category details.</p>
                            <a href="/api/products" class="inline-block mt-4 text-xs text-emerald-500 hover:underline">Try it &rarr;</a>
                        </div>

                        <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                            <div class="flex items-center justify-between mb-2">
                                <code class="text-emerald-400 font-bold">POST /api/orders</code>
                                <span class="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Secure</span>
                            </div>
                            <p class="text-sm text-zinc-400">Creates a new order. Validates stock levels and calculates totals using SQL transactions.</p>
                            <div class="mt-4 bg-black/40 p-3 rounded-lg border border-white/5">
                                <p class="text-[10px] text-zinc-600 mb-2 uppercase font-bold">Payload Example</p>
                                <pre class="text-[11px] text-zinc-500"><code>{
  "userId": 1,
  "shippingAddress": "123 Main St",
  "items": [{"productId": 1, "quantity": 2}]
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl">
                    <h3 class="text-emerald-400 font-semibold mb-2">Relational Database Integration</h3>
                    <p class="text-sm text-emerald-400/70 leading-relaxed">
                        The system uses a relational SQL database with 5 interconnected tables. It enforces data integrity through 
                        <span class="text-emerald-400 font-bold">Foreign Keys</span> and ensures consistency during checkouts using 
                        <span class="text-emerald-400 font-bold">ACID Transactions</span>.
                    </p>
                </div>
            </section>

            <footer class="mt-16 pt-8 border-t border-white/10 text-[10px] text-zinc-600 uppercase tracking-widest font-bold text-center">
                Backend Service Active &bull; Port 3000
            </footer>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
