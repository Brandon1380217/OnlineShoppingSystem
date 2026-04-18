const { getDb, initializeDatabase } = require('./schema');
const bcrypt = require('bcryptjs');

function seed() {
  initializeDatabase();
  const db = getDb();

  db.exec('DELETE FROM chat_messages');
  db.exec('DELETE FROM chat_conversations');
  db.exec('DELETE FROM shop_reviews');
  db.exec('DELETE FROM notifications');
  db.exec('DELETE FROM shop_follows');
  db.exec('DELETE FROM return_items');
  db.exec('DELETE FROM returns');
  db.exec('DELETE FROM invoices');
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM cart_items');
  db.exec('DELETE FROM reviews');
  db.exec('DELETE FROM product_variants');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM brands');
  db.exec('DELETE FROM categories');
  db.exec('DELETE FROM users');

  const hash = bcrypt.hashSync('password123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password, first_name, last_name, phone, address, city, state, zip_code, role, company_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('customer@demo.com', hash, 'John', 'Doe', '555-0101', '123 Main St', 'New York', 'NY', '10001', 'customer', null);
  insertUser.run('business@demo.com', hash, 'Jane', 'Smith', '555-0202', '456 Commerce Ave', 'San Francisco', 'CA', '94102', 'business', 'TechMart Inc.');
  insertUser.run('alice@demo.com', hash, 'Alice', 'Wang', '555-0303', '789 Oak Dr', 'Chicago', 'IL', '60601', 'customer', null);
  insertUser.run('admin@demo.com', hash, 'Admin', 'User', '555-0404', '100 Admin Blvd', 'Seattle', 'WA', '98101', 'admin', null);
  insertUser.run('business2@demo.com', hash, 'Bob', 'Chen', '555-0505', '200 Market St', 'Los Angeles', 'CA', '90001', 'business', 'BookWorm Shop');

  const insertCategory = db.prepare('INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)');
  const cats = [
    ['Electronics', 'electronics', 'Smartphones, laptops, gadgets and more', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'],
    ['Clothing & Fashion', 'clothing', 'Trending apparel for men and women', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'],
    ['Home & Kitchen', 'home-kitchen', 'Furniture, appliances, and home decor', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'],
    ['Books', 'books', 'Bestsellers, textbooks, and more', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'],
    ['Sports & Outdoors', 'sports', 'Fitness equipment and outdoor gear', 'https://images.unsplash.com/photo-1461896836934-bd45ba8a0028?w=400'],
    ['Beauty & Personal Care', 'beauty', 'Skincare, makeup, and grooming', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'],
    ['Toys & Games', 'toys', 'Fun for all ages', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400'],
    ['Grocery & Gourmet', 'grocery', 'Fresh food and gourmet items', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
  ];
  cats.forEach(c => insertCategory.run(...c));

  const insertBrand = db.prepare('INSERT INTO brands (name, slug, logo_url) VALUES (?, ?, ?)');
  const brands = [
    ['Apple', 'apple', null], ['Samsung', 'samsung', null], ['Sony', 'sony', null],
    ['Nike', 'nike', null], ['Adidas', 'adidas', null], ['Dyson', 'dyson', null],
    ['Lego', 'lego', null], ['Penguin Books', 'penguin-books', null],
    ['Neutrogena', 'neutrogena', null], ['KitchenAid', 'kitchenaid', null],
    ['Dell', 'dell', null], ['Bose', 'bose', null], ['Under Armour', 'under-armour', null],
    ['Instant Pot', 'instant-pot', null], ['Patagonia', 'patagonia', null],
  ];
  brands.forEach(b => insertBrand.run(...b));

  const insertProductFor = db.prepare(`
    INSERT INTO products (name, slug, description, price, compare_at_price, cost_price, sku, stock_quantity,
      category_id, brand_id, image_url, images, rating, review_count, purchase_count, is_deal, deal_discount,
      release_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `);
  const insertProduct = { run: (...args) => insertProductFor.run(...args, 2) };
  const insertProductB2 = { run: (...args) => insertProductFor.run(...args, 5) };

  const today = new Date();
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
  const daysLater = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

  const products = [
    // Electronics
    ['iPhone 16 Pro Max', 'iphone-16-pro-max', 'The most advanced iPhone ever. Featuring the A18 Pro chip, 48MP camera system with 5x optical zoom, titanium design, and all-day battery life. Available in Desert Titanium.', 1199.00, 1299.00, 850.00, 'ELEC-001', 150, 1, 1,
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600","https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600"]',
      4.8, 2340, 18500, 0, 0, daysAgo(60)],

    ['Samsung Galaxy S25 Ultra', 'samsung-galaxy-s25-ultra', 'Galaxy AI is here. The Galaxy S25 Ultra features a 200MP camera, Snapdragon 8 Elite, built-in S Pen, and a stunning 6.9" Dynamic AMOLED display.', 1299.99, null, 900.00, 'ELEC-002', 200, 1, 2,
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', '["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600"]',
      4.7, 1890, 14200, 1, 10, daysAgo(20)],

    ['Sony WH-1000XM6 Headphones', 'sony-wh1000xm6', 'Industry-leading noise cancellation with Auto NC Optimizer. 40-hour battery life, multipoint connection, and Hi-Res Audio support.', 349.99, 399.99, 200.00, 'ELEC-003', 500, 1, 3,
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600', '["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600"]',
      4.9, 5670, 42000, 1, 12, daysAgo(45)],

    ['Dell XPS 15 Laptop', 'dell-xps-15', '15.6" OLED 3.5K display, Intel Core Ultra 9, 32GB RAM, 1TB SSD. Stunning InfinityEdge display with incredible color accuracy.', 1849.99, 1999.99, 1300.00, 'ELEC-004', 75, 1, 11,
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600', '["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"]',
      4.6, 890, 6700, 1, 8, daysAgo(30)],

    ['Bose QuietComfort Ultra Earbuds', 'bose-qc-ultra-earbuds', 'Immersive Audio with spatial sound. World-class noise cancellation, CustomTune technology, and up to 6 hours of battery life.', 299.00, null, 170.00, 'ELEC-005', 300, 1, 12,
      'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600', '["https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600"]',
      4.5, 2100, 15800, 0, 0, daysAgo(90)],

    // Clothing
    ['Nike Air Max 270 React', 'nike-air-max-270', 'Combining two of Nike\'s best technologies for a smooth ride. Lightweight, breathable, and incredibly responsive. Available in multiple colorways.', 150.00, 170.00, 65.00, 'CLTH-001', 400, 2, 4,
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"]',
      4.4, 3200, 28000, 1, 15, daysAgo(10)],

    ['Adidas Ultraboost 24', 'adidas-ultraboost-24', 'Experience incredible energy return with BOOST midsole. Primeknit+ upper adapts to your foot for unmatched comfort on every run.', 190.00, null, 80.00, 'CLTH-002', 250, 2, 5,
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', '["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"]',
      4.6, 1750, 19500, 0, 0, daysAgo(15)],

    ['Patagonia Better Sweater Jacket', 'patagonia-better-sweater', '100% recycled polyester fleece with a sweater-knit face. Fair Trade Certified sewn. Perfect for layering or wearing on its own.', 139.00, null, 55.00, 'CLTH-003', 180, 2, 15,
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', '["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"]',
      4.7, 980, 8900, 0, 0, daysAgo(120)],

    ['Under Armour HeatGear T-Shirt', 'ua-heatgear-tshirt', 'Ultra-tight second-skin fit. HeatGear fabric wicks sweat and dries fast. UPF 30+ sun protection. 4-way stretch construction.', 29.99, 35.00, 10.00, 'CLTH-004', 800, 2, 13,
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"]',
      4.3, 4500, 52000, 1, 20, daysAgo(5)],

    // Home & Kitchen
    ['Dyson V15 Detect Vacuum', 'dyson-v15-detect', 'Laser reveals microscopic dust. Piezo sensor measures particles. HEPA whole-machine filtration. Up to 60 minutes of runtime.', 749.99, 799.99, 400.00, 'HOME-001', 120, 3, 6,
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', '["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600"]',
      4.7, 1560, 11000, 1, 6, daysAgo(50)],

    ['KitchenAid Artisan Stand Mixer', 'kitchenaid-artisan-mixer', '5-quart stainless steel bowl, 10 speeds, and 59-point planetary mixing action. Includes flat beater, dough hook, and wire whip.', 379.99, 449.99, 220.00, 'HOME-002', 90, 3, 10,
      'https://images.unsplash.com/photo-1594385208974-2f8bb07b7d0c?w=600', '["https://images.unsplash.com/photo-1594385208974-2f8bb07b7d0c?w=600"]',
      4.8, 3400, 29000, 1, 16, daysAgo(180)],

    ['Instant Pot Duo Plus 6-Quart', 'instant-pot-duo-plus', '9-in-1 programmable pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, warmer, and sterilizer.', 89.99, 119.99, 40.00, 'HOME-003', 600, 3, 14,
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600', '["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"]',
      4.7, 8900, 95000, 1, 25, daysAgo(200)],

    // Books (owned by business2, added below separately)

    // Sports & Outdoors
    ['Nike Dri-FIT Running Shorts', 'nike-dri-fit-shorts', 'Lightweight running shorts with Dri-FIT technology that moves sweat away from your skin. Built-in brief for support. Reflective details.', 35.00, 45.00, 12.00, 'SPRT-001', 600, 5, 4,
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600', '["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600"]',
      4.4, 2800, 35000, 1, 22, daysAgo(8)],

    ['Yoga Mat Premium 6mm', 'yoga-mat-premium', 'Non-slip, eco-friendly TPE yoga mat. 72" x 24", 6mm thick. Perfect for yoga, pilates, and floor exercises. Includes carrying strap.', 39.99, null, 12.00, 'SPRT-002', 350, 5, null,
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', '["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600"]',
      4.3, 1200, 18000, 0, 0, daysAgo(150)],

    // Beauty
    ['Neutrogena Hydro Boost Gel-Cream', 'neutrogena-hydro-boost', 'Oil-free, non-comedogenic moisturizer with hyaluronic acid. Instantly quenches dry skin. For extra-dry skin.', 19.99, 24.99, 7.00, 'BEAU-001', 700, 6, 9,
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600', '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600"]',
      4.5, 6700, 78000, 1, 20, daysAgo(90)],

    // Toys
    ['LEGO Star Wars Millennium Falcon', 'lego-millennium-falcon', '7,541 pieces. The ultimate LEGO Star Wars set. Includes minifigures of Han Solo, Chewbacca, Princess Leia, and C-3PO.', 849.99, null, 450.00, 'TOYS-001', 30, 7, 7,
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600', '["https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600"]',
      4.9, 4500, 32000, 0, 0, daysAgo(365)],

    ['LEGO Technic Porsche 911 GT3 RS', 'lego-technic-porsche', '2,704 pieces. Features a detailed flat-six engine with moving pistons, working gearbox, and functional steering.', 379.99, 449.99, 200.00, 'TOYS-002', 65, 7, 7,
      'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600', '["https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600"]',
      4.8, 2100, 18000, 1, 15, daysAgo(25)],

    // Coming soon products
    ['Apple Vision Pro 2', 'apple-vision-pro-2', 'The next generation of spatial computing. Lighter, more powerful M4 chip, improved passthrough, and expanded app ecosystem.', 2999.00, null, 1800.00, 'ELEC-006', 0, 1, 1,
      'https://images.unsplash.com/photo-1693711942336-f4f9963bd364?w=600', '["https://images.unsplash.com/photo-1693711942336-f4f9963bd364?w=600"]',
      0, 0, 0, 0, 0, daysLater(30)],

    ['Samsung Galaxy Ring 2', 'samsung-galaxy-ring-2', 'Next-gen health tracking ring with sleep analysis, heart rate monitoring, and seamless Galaxy ecosystem integration.', 399.99, null, 200.00, 'ELEC-007', 0, 1, 2,
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', '["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"]',
      0, 0, 0, 0, 0, daysLater(15)],

    // More new releases
    ['Sony PS5 Pro Controller', 'sony-ps5-pro-controller', 'DualSense Edge wireless controller with customizable buttons, adjustable triggers, and swappable stick caps. Pro-grade gaming.', 199.99, null, 100.00, 'ELEC-008', 200, 1, 3,
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600', '["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600"]',
      4.6, 3400, 25000, 0, 0, daysAgo(7)],

    ['Adidas Samba OG', 'adidas-samba-og', 'The iconic indoor football shoe. Leather upper, suede T-toe overlay, and gum rubber outsole. A timeless classic revived.', 100.00, null, 40.00, 'CLTH-005', 300, 2, 5,
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600"]',
      4.7, 5600, 72000, 0, 0, daysAgo(3)],
  ];

  products.forEach(p => insertProduct.run(...p));

  // Books - owned by business2 (BookWorm Shop, user id 5)
  const booksProducts = [
    ['The Midnight Library', 'midnight-library', 'Between life and death there is a library. Nora Seed finds herself in the Midnight Library, where she can try out different lives she could have lived.', 14.99, 18.99, 5.00, 'BOOK-001', 1000, 4, 8,
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', '["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600"]',
      4.5, 12400, 89000, 0, 0, daysAgo(400)],
    ['Atomic Habits', 'atomic-habits', 'Tiny Changes, Remarkable Results. James Clear reveals practical strategies to form good habits, break bad ones, and master the tiny behaviors that lead to results.', 16.99, null, 6.00, 'BOOK-002', 2000, 4, 8,
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600', '["https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600"]',
      4.8, 28000, 250000, 0, 0, daysAgo(600)],
    ['Project Hail Mary', 'project-hail-mary', 'From the author of The Martian. Ryland Grace is the sole survivor on a desperate mission—and he doesn\'t even remember his own name.', 15.99, 19.99, 5.50, 'BOOK-003', 800, 4, 8,
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', '["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600"]',
      4.7, 9800, 67000, 1, 20, daysAgo(300)],
  ];
  booksProducts.forEach(p => insertProductB2.run(...p));

  // Sample shop follows
  db.prepare('INSERT INTO shop_follows (user_id, business_id) VALUES (?, ?)').run(1, 2);
  db.prepare('INSERT INTO shop_follows (user_id, business_id) VALUES (?, ?)').run(1, 5);
  db.prepare('INSERT INTO shop_follows (user_id, business_id) VALUES (?, ?)').run(3, 2);

  const insertVariant = db.prepare('INSERT INTO product_variants (product_id, name, sku, price, stock_quantity, attributes) VALUES (?, ?, ?, ?, ?, ?)');
  // iPhone variants
  insertVariant.run(1, '256GB - Desert Titanium', 'ELEC-001-256-DT', 1199.00, 50, '{"storage":"256GB","color":"Desert Titanium"}');
  insertVariant.run(1, '512GB - Desert Titanium', 'ELEC-001-512-DT', 1399.00, 40, '{"storage":"512GB","color":"Desert Titanium"}');
  insertVariant.run(1, '1TB - Black Titanium', 'ELEC-001-1TB-BT', 1599.00, 30, '{"storage":"1TB","color":"Black Titanium"}');
  // Nike shoes variants
  insertVariant.run(6, 'US 8 - Black/White', 'CLTH-001-8-BW', 150.00, 50, '{"size":"US 8","color":"Black/White"}');
  insertVariant.run(6, 'US 9 - Black/White', 'CLTH-001-9-BW', 150.00, 50, '{"size":"US 9","color":"Black/White"}');
  insertVariant.run(6, 'US 10 - Red/Black', 'CLTH-001-10-RB', 150.00, 50, '{"size":"US 10","color":"Red/Black"}');

  const insertReview = db.prepare('INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)');
  insertReview.run(1, 1, 5, 'Best iPhone ever!', 'The camera is absolutely incredible. Battery lasts all day.');
  insertReview.run(1, 3, 4, 'Great but pricey', 'Amazing phone but the price is steep. Camera alone might be worth it though.');
  insertReview.run(3, 1, 5, 'Unbeatable noise cancellation', 'These headphones are incredible for travel and focus work.');
  insertReview.run(6, 3, 4, 'Super comfortable', 'Best running shoes I have owned. Great cushioning.');
  insertReview.run(11, 1, 5, 'Game changer', 'Makes baking so much easier. Built like a tank.');
  insertReview.run(12, 3, 5, 'Worth every penny', 'Replaced 5 appliances in my kitchen. Amazing value.');
  insertReview.run(14, 1, 5, 'Life changing book', 'Completely transformed my daily routine. Must read.');

  // Create sample orders for customer
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, user_id, status, subtotal, shipping_cost, tax, discount, total,
      shipping_method, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
      payment_method, payment_status, tracking_number, channel, created_at, shipped_at, delivered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run('ORD-2026-0001', 1, 'delivered', 1199.00, 0, 95.92, 0, 1294.92,
    'express', '123 Main St', 'New York', 'NY', '10001', 'US',
    'credit_card', 'paid', 'TRK-1234567890', 'web', daysAgo(30), daysAgo(28), daysAgo(25));

  insertOrder.run('ORD-2026-0002', 1, 'shipped', 349.99, 5.99, 28.48, 42.00, 342.46,
    'standard', '123 Main St', 'New York', 'NY', '10001', 'US',
    'credit_card', 'paid', 'TRK-9876543210', 'web', daysAgo(5), daysAgo(3), null);

  insertOrder.run('ORD-2026-0003', 1, 'processing', 89.99, 0, 7.20, 22.50, 74.69,
    'standard', '123 Main St', 'New York', 'NY', '10001', 'US',
    'credit_card', 'paid', null, 'web', daysAgo(1), null, null);

  insertOrder.run('ORD-2026-0004', 3, 'delivered', 150.00, 5.99, 12.48, 22.50, 145.97,
    'standard', '789 Oak Dr', 'Chicago', 'IL', '60601', 'US',
    'credit_card', 'paid', 'TRK-1111111111', 'web', daysAgo(15), daysAgo(13), daysAgo(10));

  insertOrder.run('ORD-2026-0005', 3, 'pending', 379.99, 12.99, 31.44, 60.00, 364.42,
    'express', '789 Oak Dr', 'Chicago', 'IL', '60601', 'US',
    'credit_card', 'pending', null, 'sales_team', daysAgo(0), null, null);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_image, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrderItem.run(1, 1, 1, 'iPhone 16 Pro Max - 256GB Desert Titanium', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200', 1, 1199.00, 1199.00);
  insertOrderItem.run(2, 3, null, 'Sony WH-1000XM6 Headphones', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=200', 1, 349.99, 349.99);
  insertOrderItem.run(3, 12, null, 'Instant Pot Duo Plus 6-Quart', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=200', 1, 89.99, 89.99);
  insertOrderItem.run(4, 6, 4, 'Nike Air Max 270 React - US 8 Black/White', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', 1, 150.00, 150.00);
  insertOrderItem.run(5, 11, null, 'KitchenAid Artisan Stand Mixer', 'https://images.unsplash.com/photo-1594385208974-2f8bb07b7d0c?w=200', 1, 379.99, 379.99);

  const insertInvoice = db.prepare('INSERT INTO invoices (invoice_number, order_id, amount, status, due_date, paid_at) VALUES (?, ?, ?, ?, ?, ?)');
  insertInvoice.run('INV-2026-0001', 1, 1294.92, 'paid', daysAgo(23), daysAgo(25));
  insertInvoice.run('INV-2026-0002', 2, 342.46, 'paid', daysAgo(0), daysAgo(3));
  insertInvoice.run('INV-2026-0003', 3, 74.69, 'unpaid', daysLater(30), null);
  insertInvoice.run('INV-2026-0004', 4, 145.97, 'paid', daysAgo(8), daysAgo(10));
  insertInvoice.run('INV-2026-0005', 5, 364.42, 'unpaid', daysLater(30), null);

  const insertReturn = db.prepare(`
    INSERT INTO returns (return_number, order_id, user_id, status, reason, refund_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertReturn.run('RET-2026-0001', 1, 1, 'refunded', 'Changed my mind, want the 512GB model instead', 1294.92, daysAgo(20));

  const insertReturnItem = db.prepare('INSERT INTO return_items (return_id, order_item_id, quantity, condition) VALUES (?, ?, ?, ?)');
  insertReturnItem.run(1, 1, 1, 'unopened');

  // Shop reviews (customers review shops after buying from them)
  // business user 2 = TechMart (products owned), business 5 = BookWorm
  const insertShopReview = db.prepare('INSERT INTO shop_reviews (business_id, user_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)');
  insertShopReview.run(2, 1, 1, 5, 'Fast shipping and the product was exactly as described. Will buy from TechMart again!');
  insertShopReview.run(2, 3, 4, 4, 'Great customer service. Shoes arrived a day early and well packaged.');
  insertShopReview.run(2, 1, 2, 5, 'Reliable shop with a great catalog. Solid 5 stars.');

  // Chat conversations and sample messages
  const insertConv = db.prepare('INSERT INTO chat_conversations (customer_id, business_id) VALUES (?, ?)');
  const convA = insertConv.run(1, 2).lastInsertRowid; // John <-> TechMart
  const convB = insertConv.run(3, 2).lastInsertRowid; // Alice <-> TechMart
  const convC = insertConv.run(1, 5).lastInsertRowid; // John <-> BookWorm

  const insertMsg = db.prepare('INSERT INTO chat_messages (conversation_id, sender_id, sender_role, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
  const minsAgo = (n) => { const d = new Date(Date.now() - n * 60 * 1000); return d.toISOString().replace('T', ' ').slice(0, 19); };

  insertMsg.run(convA, 1, 'customer', 'Hi! Is the iPhone 16 Pro Max still in stock in 512GB?', 1, minsAgo(120));
  insertMsg.run(convA, 2, 'business', 'Hello John! Yes, the 512GB variant is in stock. We can ship today if you order before 3pm.', 1, minsAgo(115));
  insertMsg.run(convA, 1, 'customer', 'Perfect, thanks! One more question - how long does express shipping take?', 1, minsAgo(60));
  insertMsg.run(convA, 2, 'business', 'Express shipping takes 1-2 business days within the US. Free for orders over $50.', 0, minsAgo(55));

  insertMsg.run(convB, 3, 'customer', 'Do you offer international shipping for the Sony headphones?', 0, minsAgo(30));

  insertMsg.run(convC, 1, 'customer', 'Are there any ongoing promotions or discounts?', 1, minsAgo(200));
  insertMsg.run(convC, 5, 'business', 'Hi John! "Project Hail Mary" is currently 20% off. Check our shop page for more deals!', 1, minsAgo(195));

  db.close();
  console.log('Database seeded successfully!');
}

seed();
