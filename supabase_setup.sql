CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Role" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT
);

CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL
);

CREATE TABLE "CustomerProfile" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "dob" TIMESTAMP(3),
    "preferences" JSONB
);

CREATE TABLE "Address" (
    "id" TEXT PRIMARY KEY,
    "customerProfileId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "Seller" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "companyName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "bankDetails" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "Category" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "parentId" TEXT
);

CREATE TABLE "Product" (
    "id" TEXT PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ProductVariant" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL UNIQUE,
    "size" TEXT,
    "color" TEXT,
    "price" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "Inventory" (
    "id" TEXT PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Cart" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE
);

CREATE TABLE "CartItem" (
    "id" TEXT PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE "Wishlist" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE
);

CREATE TABLE "WishlistItem" (
    "id" TEXT PRIMARY KEY,
    "wishlistId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL
);

CREATE TABLE "Review" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "mediaUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Order" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shippingAddressId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "couponId" TEXT
);

CREATE TABLE "OrderItem" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtBuy" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "Payment" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "razorpayOrderId" TEXT UNIQUE,
    "razorpayPaymentId" TEXT UNIQUE,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Refund" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Warehouse" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL
);

CREATE TABLE "ShippingProvider" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKeys" JSONB
);

CREATE TABLE "Vehicle" (
    "id" TEXT PRIMARY KEY,
    "licensePlate" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION
);

CREATE TABLE "DeliveryPerson" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "vehicleId" TEXT
);

CREATE TABLE "Route" (
    "id" TEXT PRIMARY KEY,
    "deliveryPersonId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "pathData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED'
);

CREATE TABLE "TrackingHistory" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SupportTicket" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Conversation" (
    "id" TEXT PRIMARY KEY,
    "supportTicketId" TEXT NOT NULL
);

CREATE TABLE "Message" (
    "id" TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Coupon" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "discountType" TEXT NOT NULL,
    "discountVal" DOUBLE PRECISION NOT NULL,
    "minSpend" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Offer" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bannerImage" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "SiteSetting" (
    "id" TEXT PRIMARY KEY DEFAULT 'GLOBAL',
    "brandName" TEXT NOT NULL DEFAULT 'Swcart',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "companyAddr" TEXT,
    "defaultGst" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "codFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "freeShippingThresh" DOUBLE PRECISION NOT NULL DEFAULT 499.0,
    "razorpayKeyId" TEXT,
    "razorpaySecret" TEXT,
    "gmailSmtpUser" TEXT,
    "gmailSmtpPass" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT
);

CREATE TABLE "DynamicPage" (
    "id" TEXT PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "FAQ" (
    "id" TEXT PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0
);


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
INSERT INTO "Category" (id, name) VALUES ('cat-0', 'Electronics') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-1', 'Fashion') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-2', 'Home') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-3', 'Grocery') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-4', 'Beauty') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-5', 'Sports') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-6', 'Toys') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-7', 'Books') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Category" (id, name) VALUES ('cat-8', 'Tools') ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- SEED DATA: Products
-- ==========================================
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p1', 'system-seller', 'cat-0', 'Over-ear Wireless Headphones', 'A great product.', 1999, '{"p1.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p2', 'system-seller', 'cat-0', 'Fitness Smartwatch, AMOLED', 'A great product.', 2799, '{"p2.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p3', 'system-seller', 'cat-0', 'Portable Bluetooth Speaker', 'A great product.', 1299, '{"p3.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p4', 'system-seller', 'cat-0', '20,000mAh Fast-Charge Power Bank', 'A great product.', 1599, '{"p4.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p5', 'system-seller', 'cat-0', '1080p HD Webcam with Mic', 'A great product.', 1099, '{"p5.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p6', 'system-seller', 'cat-0', 'Mechanical RGB Keyboard', 'A great product.', 2299, '{"p6.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p7', 'system-seller', 'cat-1', 'Everyday Running Sneakers', 'A great product.', 1399, '{"p7.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p8', 'system-seller', 'cat-1', 'Lightweight Bomber Jacket', 'A great product.', 2199, '{"p8.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p9', 'system-seller', 'cat-1', 'Structured Tote Handbag', 'A great product.', 1799, '{"p9.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p10', 'system-seller', 'cat-1', 'Polarised Aviator Sunglasses', 'A great product.', 899, '{"p10.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p11', 'system-seller', 'cat-1', 'Minimalist Analog Watch', 'A great product.', 1649, '{"p11.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p12', 'system-seller', 'cat-1', 'Water-resistant Travel Backpack', 'A great product.', 1529, '{"p12.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p13', 'system-seller', 'cat-2', 'Non-stick Cookware Set, 5pc', 'A great product.', 2899, '{"p13.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p14', 'system-seller', 'cat-2', 'Airtight Storage Jars, Set of 6', 'A great product.', 899, '{"p14.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p15', 'system-seller', 'cat-3', 'All-purpose Cleaning Kit', 'A great product.', 699, '{"p15.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p16', 'system-seller', 'cat-3', 'Daily Essentials Pantry Combo', 'A great product.', 1049, '{"p16.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p17', 'system-seller', 'cat-2', 'Cotton Bedsheet Set, King', 'A great product.', 1349, '{"p17.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p18', 'system-seller', 'cat-2', 'Wooden Base Table Lamp', 'A great product.', 999, '{"p18.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p19', 'system-seller', 'cat-4', 'Hydrating Face Serum, 30ml', 'A great product.', 649, '{"p19.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p20', 'system-seller', 'cat-4', 'Matte Lipstick Set, 3pc', 'A great product.', 799, '{"p20.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p21', 'system-seller', 'cat-5', 'Yoga Mat, Non-slip 6mm', 'A great product.', 899, '{"p21.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p22', 'system-seller', 'cat-5', 'Adjustable Dumbbell Set', 'A great product.', 3299, '{"p22.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p23', 'system-seller', 'cat-6', 'Building Blocks Set, 500pc', 'A great product.', 1199, '{"p23.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p24', 'system-seller', 'cat-7', 'Bestselling Fiction Bundle, 3 Books', 'A great product.', 899, '{"p24.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Product" (id, "sellerId", "categoryId", title, description, "basePrice", images, "createdAt", "updatedAt")
VALUES ('p25', 'system-seller', 'cat-8', 'Cordless Drill Machine', 'A great product.', 2499, '{"p25.png"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
