const fs = require('fs');
const path = require('path');

const files = [
  'product.html', 'categories.html', 'checkout.html', 'profile.html', 
  'track-order.html', 'shipping.html', 'refunds.html', 'help.html', 'sell.html'
];

const cssToInject = `
  .util-bar{background:#f8f9fa;font-size:.8rem;color:#666;padding:8px 0;border-bottom:1px solid var(--line);}
  .util-bar a{color:#666;margin-left:15px;text-decoration:none;transition:.2s;}
  .util-bar a:hover{color:var(--ink);}

  .site-header{background:#fff;border-bottom:1px solid var(--line);padding:16px 0;position:sticky;top:0;z-index:1000;box-shadow:0 4px 20px rgba(0,0,0,.02);}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none!important;}
  .brand img{height:42px;width:42px;border-radius:10px;}
  .brand .name{font-family:'Poppins',sans-serif;font-weight:800;font-size:1.6rem;color:var(--ink);line-height:1;}
  .brand .name span{color:var(--red);}
  .brand .tagline{font-size:.75rem;color:#9a8f86;font-weight:600;}

  .search-wrap{position:relative;}
  .search-wrap input{width:100%;background:#f4f0ec;border:2px solid transparent;border-radius:12px;padding:12px 20px 12px 46px;font-size:.95rem;color:var(--ink);transition:.3s;outline:none;}
  .search-wrap input:focus{background:#fff;border-color:var(--orange);box-shadow:0 0 0 4px rgba(255,138,61,.1);}
  .search-wrap i{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#9a8f86;font-size:1.1rem;}
  .search-wrap button{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--ink);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-weight:600;font-size:.85rem;transition:.2s;}
  .search-wrap button:hover{background:var(--red);}
  
  .header-icon-btn{background:none;border:none;color:var(--ink);font-weight:600;font-size:.95rem;display:flex;align-items:center;gap:8px;transition:.2s;padding:8px 12px;border-radius:10px;}
  .header-icon-btn:hover{background:var(--cream);color:var(--red);}
  .icon-wrap{position:relative;font-size:1.3rem;display:flex;align-items:center;}
`;

const headerToInject = `
<div class="util-bar">
  <div class="container d-flex justify-content-between">
    <div>Free delivery on orders above ₹499</div>
    <div class="d-none d-md-block">
      <a href="track-order.html">Track Order</a>
      <a href="help.html">Help Center</a>
      <a href="sell.html">Sell on Swcart</a>
    </div>
  </div>
</div>

<header class="site-header">
  <div class="container">
    <div class="row align-items-center g-3">
      <div class="col-6 col-lg-2 d-flex align-items-center gap-2">
        <a href="index.html" class="brand">
          <img src="https://tools.swinfosystems.online/icon-192.png" alt="Swcart logo">
          <div>
            <div class="name">Sw<span>cart</span></div>
            <div class="tagline d-none d-sm-block">Everything, one cart</div>
          </div>
        </a>
      </div>
      <div class="col-12 col-lg-6 order-3 order-lg-2">
        <div class="search-wrap">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Search for products, brands and more">
          <button>Search</button>
        </div>
      </div>
      <div class="col-6 col-lg-4 order-2 order-lg-3">
        <div class="d-flex justify-content-end gap-3">
          <a href="profile.html" class="header-icon-btn d-none d-sm-flex">
            <i class="bi bi-person-circle"></i>
            <span class="d-none d-md-inline">Account</span>
          </a>
          <a href="index.html" class="header-icon-btn">
            <span class="icon-wrap"><i class="bi bi-heart"></i></span>
            <span class="d-none d-md-inline">Wishlist</span>
          </a>
          <a href="checkout.html" class="header-icon-btn">
            <span class="icon-wrap"><i class="bi bi-cart3"></i><span class="badge-count" id="globalCartCount" style="position:absolute;top:-6px;right:-8px;background:var(--red);color:#fff;font-size:.65rem;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;display:none;">0</span></span>
            <span class="d-none d-md-inline">Cart</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</header>
`;

const jsToInject = `
<script>
  // Global Cart Count Sync
  document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('swcart_cart') || '{}');
    const count = Object.values(cart).reduce((a,b)=>a+b, 0);
    const badge = document.getElementById('globalCartCount');
    if(badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  });
</script>
</body>
`;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace CSS
    if (!content.includes('.search-wrap')) {
      content = content.replace('</style>', cssToInject + '\n</style>');
    }

    // Replace Header
    const headerRegex = /<header class="site-header">[\s\S]*?<\/header>/;
    if (headerRegex.test(content)) {
      content = content.replace(headerRegex, headerToInject);
    }

    // Inject JS before </body>
    if (!content.includes('globalCartCount')) {
      content = content.replace('</body>', jsToInject);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
});
