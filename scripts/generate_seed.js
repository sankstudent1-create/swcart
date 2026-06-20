const fs = require('fs');

// Mock Data
const CATEGORIES = [
  {name:"Electronics", img:"https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80"},
  {name:"Fashion", img:"https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=200&q=80"},
  {name:"Home", img:"https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=200&q=80", label:"Home & Kitchen"},
  {name:"Grocery", img:"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"},
  {name:"Beauty", img:"https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=200&q=80"},
  {name:"Sports", img:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=200&q=80"},
  {name:"Toys", img:"https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=200&q=80", label:"Toys & Games"},
  {name:"Books", img:"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=200&q=80"},
  {name:"Tools", img:"https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=200&q=80"},
];

const PRODUCTS = [
  {id:"p1", name:"Over-ear Wireless Headphones", cat:"Electronics", price:1999, old:2499, tag:"-20%"},
  {id:"p2", name:"Fitness Smartwatch, AMOLED", cat:"Electronics", price:2799},
  {id:"p3", name:"Portable Bluetooth Speaker", cat:"Electronics", price:1299, tag:"Bestseller"},
  {id:"p4", name:"20,000mAh Fast-Charge Power Bank", cat:"Electronics", price:1599},
  {id:"p5", name:"1080p HD Webcam with Mic", cat:"Electronics", price:1099, tag:"New"},
  {id:"p6", name:"Mechanical RGB Keyboard", cat:"Electronics", price:2299},
  {id:"p7", name:"Everyday Running Sneakers", cat:"Fashion", price:1399, old:1999, tag:"-30%"},
  {id:"p8", name:"Lightweight Bomber Jacket", cat:"Fashion", price:2199},
  {id:"p9", name:"Structured Tote Handbag", cat:"Fashion", price:1799},
  {id:"p10", name:"Polarised Aviator Sunglasses", cat:"Fashion", price:899, tag:"New"},
  {id:"p11", name:"Minimalist Analog Watch", cat:"Fashion", price:1649},
  {id:"p12", name:"Water-resistant Travel Backpack", cat:"Fashion", price:1529, old:1799, tag:"-15%"},
  {id:"p13", name:"Non-stick Cookware Set, 5pc", cat:"Home", price:2899},
  {id:"p14", name:"Airtight Storage Jars, Set of 6", cat:"Home", price:899, old:1199, tag:"-25%"},
  {id:"p15", name:"All-purpose Cleaning Kit", cat:"Grocery", price:699},
  {id:"p16", name:"Daily Essentials Pantry Combo", cat:"Grocery", price:1049},
  {id:"p17", name:"Cotton Bedsheet Set, King", cat:"Home", price:1349, tag:"New"},
  {id:"p18", name:"Wooden Base Table Lamp", cat:"Home", price:999},
  {id:"p19", name:"Hydrating Face Serum, 30ml", cat:"Beauty", price:649, tag:"New"},
  {id:"p20", name:"Matte Lipstick Set, 3pc", cat:"Beauty", price:799},
  {id:"p21", name:"Yoga Mat, Non-slip 6mm", cat:"Sports", price:899},
  {id:"p22", name:"Adjustable Dumbbell Set", cat:"Sports", price:3299, old:3999, tag:"-18%"},
  {id:"p23", name:"Building Blocks Set, 500pc", cat:"Toys", price:1199},
  {id:"p24", name:"Bestselling Fiction Bundle, 3 Books", cat:"Books", price:899},
  {id:"p25", name:"Cordless Drill Machine", cat:"Tools", price:2499, tag:"Bestseller"},
];

let sql = `
-- ==========================================
-- SUPABASE STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true) ON CONFLICT DO NOTHING;

-- ==========================================
-- SEED DATA: Dummy User and Seller
-- ==========================================
INSERT INTO "User" (id, name, email, "passwordHash", "createdAt", "updatedAt") 
VALUES ('system-user', 'System Admin', 'admin@swcart.com', 'dummyhash', NOW(), NOW()) ON CONFLICT DO NOTHING;

INSERT INTO "Seller" (id, "userId", "companyName", "isVerified")
VALUES ('system-seller', 'system-user', 'Swcart Originals', true) ON CONFLICT DO NOTHING;

-- ==========================================
-- SEED DATA: Categories
-- ==========================================
`;

const catIds = {};

CATEGORIES.forEach((c, idx) => {
  const id = 'cat-' + idx;
  catIds[c.name] = id;
  // Note: in Prisma schema Category has no "img" field by default. 
  // Let's assume we store it somehow or just create Categories without images for the DB layer if they don't exist.
  // Actually, wait, let me check Prisma schema for Category.
  sql += `INSERT INTO "Category" (id, name) VALUES ('${id}', '${c.name}') ON CONFLICT (name) DO NOTHING;\n`;
});

sql += `
-- ==========================================
-- SEED DATA: Products
-- ==========================================
`;

PRODUCTS.forEach((p) => {
  const catId = catIds[p.cat];
  const imagesArray = "'{\"" + p.id + ".png\"}'";
  sql += `INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('${p.id}', 'system-seller', '${catId}', '${p.name.replace(/'/g, "''")}', 'A great product.', ${p.price}, ${imagesArray}, NOW(), NOW()) ON CONFLICT DO NOTHING;\n`;
});

fs.writeFileSync('seed_data.sql', sql);
console.log('Generated seed_data.sql');
