(function(){
  const LS_CART_KEY = "amnkart_cart_v1";

  const svgEscape = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  function formatINR(amount){
    try{
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
    }catch{
      return "₹" + Math.round(amount).toLocaleString("en-IN");
    }
  }

  function clampInt(value, min, max){
    const n = Math.floor(Number(value));
    if(Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function getData(){
    if(!window.AMNKART_DATA) throw new Error("AMNKART data missing (assets/data.js not loaded).");
    return window.AMNKART_DATA;
  }

  function getProducts(){ return getData().products; }
  function getCategories(){ return getData().categories; }

  function getProductByHandle(handle){
    return getProducts().find(p => p.handle === handle) || null;
  }

  function makePlaceholderSvgDataUri(text, tone){
    const t = svgEscape(text);
    const toneA = tone === "cyan" ? "#22D3EE" : "#2563EB";
    const toneB = tone === "cyan" ? "#2563EB" : "#22D3EE";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${toneA}" stop-opacity=".85"/>
            <stop offset=".7" stop-color="${toneB}" stop-opacity=".55"/>
            <stop offset="1" stop-color="#0b1020" stop-opacity="1"/>
          </linearGradient>
          <filter id="n">
            <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values=".25"/>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 .10 .12"/>
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="900" height="675" fill="url(#g)"/>
        <rect width="900" height="675" filter="url(#n)" opacity=".55"/>
        <circle cx="160" cy="120" r="190" fill="#ffffff" opacity=".10"/>
        <circle cx="760" cy="560" r="260" fill="#ffffff" opacity=".06"/>
        <text x="60" y="600" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto,Arial" font-size="44" fill="#ffffff" opacity=".92" font-weight="700">${t}</text>
        <text x="60" y="635" font-family="ui-sans-serif,system-ui,Segoe UI,Roboto,Arial" font-size="18" fill="#ffffff" opacity=".72">AMNKART • Electronics</text>
      </svg>
    `.trim();
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function cartRead(){
    try{
      const raw = localStorage.getItem(LS_CART_KEY);
      if(!raw) return { items: [] };
      const parsed = JSON.parse(raw);
      if(!parsed || !Array.isArray(parsed.items)) return { items: [] };
      return parsed;
    }catch{
      return { items: [] };
    }
  }

  function cartWrite(cart){
    localStorage.setItem(LS_CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("amnkart:cart-changed"));
  }

  function cartCount(){
    const cart = cartRead();
    return cart.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }

  function cartSubtotal(){
    const cart = cartRead();
    return cart.items.reduce((sum, it) => {
      const p = getProductByHandle(it.handle);
      if(!p) return sum;
      return sum + p.price * (Number(it.qty) || 0);
    }, 0);
  }

  function normalizeVariant(variant){
    if(!variant || typeof variant !== "object") return null;
    const clean = {};
    for(const [k,v] of Object.entries(variant)){
      if(typeof v === "string" && v.trim()) clean[k] = v.trim();
    }
    return Object.keys(clean).length ? clean : null;
  }

  function lineKey(handle, variant){
    const v = normalizeVariant(variant);
    return handle + "::" + (v ? JSON.stringify(v) : "{}");
  }

  function addToCart(handle, qty, variant){
    const product = getProductByHandle(handle);
    if(!product) return { ok:false, message:"Product not found." };
    if(!product.inStock) return { ok:false, message:"This item is currently out of stock." };

    const count = clampInt(qty, 1, 99);
    const cart = cartRead();
    const key = lineKey(handle, variant);

    const existing = cart.items.find(it => it.key === key);
    if(existing){
      existing.qty = clampInt((existing.qty || 0) + count, 1, 99);
    }else{
      cart.items.push({
        key,
        handle,
        qty: count,
        variant: normalizeVariant(variant),
        addedAt: Date.now(),
      });
    }
    cartWrite(cart);
    return { ok:true, message:"Added to cart." };
  }

  function setLineQty(key, qty){
    const cart = cartRead();
    const line = cart.items.find(it => it.key === key);
    if(!line) return;
    const n = clampInt(qty, 1, 99);
    line.qty = n;
    cartWrite(cart);
  }

  function removeLine(key){
    const cart = cartRead();
    cart.items = cart.items.filter(it => it.key !== key);
    cartWrite(cart);
  }

  function clearCart(){
    cartWrite({ items: [] });
  }

  function toast(message){
    const id = "amnkart-toast";
    let el = document.getElementById(id);
    if(!el){
      el = document.createElement("div");
      el.id = id;
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.style.position = "fixed";
      el.style.bottom = "18px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.zIndex = "60";
      el.style.maxWidth = "min(720px, 92vw)";
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="notice" style="box-shadow: var(--shadow);">
        ${svgEscape(message)}
      </div>
    `;
    setTimeout(() => { if(el) el.innerHTML = ""; }, 2400);
  }

  function icon(name){
    const common = `width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    if(name === "search") return `<svg ${common}><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>`;
    if(name === "cart") return `<svg ${common}><path d="M6 6h15l-1.5 9h-12L6 6Z"></path><path d="M6 6 5 3H2"></path><circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg>`;
    if(name === "x") return `<svg ${common}><path d="M18 6 6 18"></path><path d="M6 6l12 12"></path></svg>`;
    if(name === "user") return `<svg ${common}><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>`;
    if(name === "spark") return `<svg ${common}><path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z"></path></svg>`;
    return "";
  }

  function renderHeader(){
    const host = document.getElementById("site-header");
    if(!host) return;
    const data = getData();

    const navLinks = getCategories()
      .map(c => `<a href="collections.html?handle=${encodeURIComponent(c.handle)}">${svgEscape(c.title)}</a>`)
      .join("");

    host.innerHTML = `
      <div class="topbar">
        <div class="container">
          <div class="topbar-inner">
            <a class="brand" href="index.html" aria-label="${svgEscape(data.brandName)} home">
              <div class="brand-mark" aria-hidden="true"></div>
              <div>${svgEscape(data.brandName)}</div>
            </a>
            <nav class="nav" aria-label="Categories">
              ${navLinks}
            </nav>
            <div class="searchbar" role="search">
              <form action="search.html" method="get">
                <label class="sr-only" for="site-search">Search</label>
                <input id="site-search" class="input" type="search" name="q" placeholder="Search chargers, cables, earbuds…" />
                <button class="btn btn-ghost" type="submit" aria-label="Search">
                  ${icon("search")}
                </button>
              </form>
            </div>
            <a class="icon-btn" href="#" aria-label="Account (mock)">
              ${icon("user")}
            </a>
            <button class="icon-btn" type="button" id="cart-open" aria-haspopup="dialog" aria-controls="cart-drawer" aria-label="Open cart">
              ${icon("cart")}
              <span class="sr-only">Cart</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const cartButton = host.querySelector("#cart-open");
    cartButton?.addEventListener("click", (e) => {
      e.preventDefault();
      openCartDrawer();
    });

    updateCartBadge();
  }

  function renderFooter(){
    const host = document.getElementById("site-footer");
    if(!host) return;
    const data = getData();

    host.innerHTML = `
      <div class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="row" style="gap:10px; align-items:center">
                <div class="brand-mark" aria-hidden="true"></div>
                <div style="font-weight:750; letter-spacing:.2px">${svgEscape(data.brandName)}</div>
              </div>
              <p class="tiny" style="margin:10px 0 0; max-width:60ch">
                Premium electronics and everyday essentials—fast shipping, easy returns, and reliable support.
              </p>
              <div class="spacer"></div>
              <div class="tiny">© ${new Date().getFullYear()} ${svgEscape(data.brandName)}. All rights reserved.</div>
            </div>
            <div>
              <h4>Shop</h4>
              ${getCategories().slice(0,4).map(c => `<a href="collections.html?handle=${encodeURIComponent(c.handle)}">${svgEscape(c.title)}</a>`).join("")}
            </div>
            <div>
              <h4>Support</h4>
              <a href="#">Shipping</a>
              <a href="#">Returns</a>
              <a href="#">Warranty</a>
              <a href="#">Contact</a>
            </div>
            <div>
              <h4>Policies</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Refund Policy</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function ensureDrawerShell(){
    const id = "cart-drawer-backdrop";
    let host = document.getElementById(id);
    if(host) return host;
    host = document.createElement("div");
    host.id = id;
    host.className = "drawer-backdrop";
    host.setAttribute("data-open", "false");
    host.innerHTML = `
      <div class="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart" id="cart-drawer" tabindex="-1">
        <div class="drawer-head">
          <div style="font-weight:750">Your cart</div>
          <button type="button" class="icon-btn" id="cart-close" aria-label="Close cart">${icon("x")}</button>
        </div>
        <div class="drawer-body" id="cart-body"></div>
        <div class="drawer-foot" id="cart-foot"></div>
      </div>
    `;
    document.body.appendChild(host);

    const close = () => closeCartDrawer();
    host.addEventListener("click", (e) => { if(e.target === host) close(); });
    host.querySelector("#cart-close")?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && host.getAttribute("data-open") === "true") close();
    });
    return host;
  }

  function updateCartBadge(){
    const n = cartCount();
    const cartButton = document.querySelector("#cart-open");
    if(!cartButton) return;
    let badge = cartButton.querySelector(".badge");
    if(n <= 0){
      badge?.remove();
      return;
    }
    if(!badge){
      badge = document.createElement("span");
      badge.className = "badge";
      badge.style.position = "absolute";
      badge.style.marginLeft = "18px";
      badge.style.marginTop = "-18px";
      cartButton.style.position = "relative";
      cartButton.appendChild(badge);
    }
    badge.textContent = String(n);
  }

  function renderCartContents(){
    const shell = ensureDrawerShell();
    const body = shell.querySelector("#cart-body");
    const foot = shell.querySelector("#cart-foot");
    const data = getData();
    const cart = cartRead();

    if(!cart.items.length){
      body.innerHTML = `
        <div class="card card-pad">
          <div style="font-weight:750">Cart is empty</div>
          <div class="tiny" style="margin-top:6px">Browse best sellers and add your favorites.</div>
          <div class="spacer"></div>
          <a class="btn btn-primary" href="collections.html?handle=chargers">Shop chargers</a>
        </div>
      `;
      foot.innerHTML = "";
      return;
    }

    const linesHtml = cart.items.map(it => {
      const p = getProductByHandle(it.handle);
      if(!p) return "";
      const variantText = it.variant ? Object.entries(it.variant).map(([k,v]) => `${k}: ${v}`).join(" • ") : "";
      const tone = (p.category === "smart-home" || p.category === "speakers") ? "cyan" : "blue";
      const img = makePlaceholderSvgDataUri(p.title.split(" ").slice(0,3).join(" "), tone);
      return `
        <div class="line">
          <a class="line-media" href="product.html?handle=${encodeURIComponent(p.handle)}" aria-label="${svgEscape(p.title)}">
            <img alt="" src="${img}"/>
          </a>
          <div>
            <div class="row" style="justify-content:space-between; align-items:start">
              <div>
                <p class="line-title">${svgEscape(p.title)}</p>
                <div class="line-sub">
                  <span>${svgEscape(p.brand)}</span>
                  ${variantText ? `<span>•</span><span>${svgEscape(variantText)}</span>` : ``}
                </div>
              </div>
              <button type="button" class="btn btn-ghost" data-remove="${svgEscape(it.key)}" aria-label="Remove item">Remove</button>
            </div>
            <div class="row" style="justify-content:space-between; margin-top:10px">
              <div class="qty" aria-label="Quantity">
                <button type="button" class="icon-btn" style="width:30px;height:30px" data-dec="${svgEscape(it.key)}" aria-label="Decrease quantity">−</button>
                <input inputmode="numeric" aria-label="Quantity" value="${Number(it.qty)||1}" data-qty="${svgEscape(it.key)}"/>
                <button type="button" class="icon-btn" style="width:30px;height:30px" data-inc="${svgEscape(it.key)}" aria-label="Increase quantity">+</button>
              </div>
              <div style="font-weight:750">${formatINR(p.price * (Number(it.qty)||1))}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const subtotal = cartSubtotal();
    const remaining = Math.max(0, data.freeShippingThreshold - subtotal);
    const progress = Math.min(1, subtotal / data.freeShippingThreshold);

    body.innerHTML = `
      <div class="notice">
        <div class="row" style="justify-content:space-between">
          <div><strong>Free shipping</strong> over ${formatINR(data.freeShippingThreshold)}</div>
          <div class="tiny">${remaining === 0 ? "Unlocked" : `${formatINR(remaining)} to go`}</div>
        </div>
        <div class="spacer" style="height:10px"></div>
        <div class="meter" aria-label="Free shipping progress"><div style="width:${Math.round(progress*100)}%"></div></div>
      </div>
      <div class="spacer" style="height:10px"></div>
      <div class="card card-pad">
        ${linesHtml}
      </div>
    `;

    foot.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div class="tiny">Subtotal</div>
        <div style="font-weight:750">${formatINR(subtotal)}</div>
      </div>
      <div class="spacer" style="height:10px"></div>
      <div class="row">
        <a class="btn" href="cart.html" style="flex:1">View cart</a>
        <a class="btn btn-primary" href="checkout.html" style="flex:1">Checkout</a>
      </div>
      <div class="spacer" style="height:8px"></div>
      <button class="btn btn-ghost" type="button" id="cart-clear" style="width:100%">Clear cart</button>
    `;

    body.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => removeLine(btn.getAttribute("data-remove"))));
    body.querySelectorAll("[data-dec]").forEach(btn => btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-dec");
      const cart2 = cartRead();
      const line = cart2.items.find(x => x.key === key);
      if(!line) return;
      const next = clampInt((line.qty||1) - 1, 1, 99);
      setLineQty(key, next);
    }));
    body.querySelectorAll("[data-inc]").forEach(btn => btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-inc");
      const cart2 = cartRead();
      const line = cart2.items.find(x => x.key === key);
      if(!line) return;
      const next = clampInt((line.qty||1) + 1, 1, 99);
      setLineQty(key, next);
    }));
    body.querySelectorAll("input[data-qty]").forEach(input => {
      input.addEventListener("change", () => setLineQty(input.getAttribute("data-qty"), input.value));
      input.addEventListener("blur", () => setLineQty(input.getAttribute("data-qty"), input.value));
    });

    foot.querySelector("#cart-clear")?.addEventListener("click", () => clearCart());
  }

  function openCartDrawer(){
    const shell = ensureDrawerShell();
    shell.setAttribute("data-open", "true");
    renderCartContents();
    const dialog = shell.querySelector("#cart-drawer");
    setTimeout(() => dialog?.focus(), 0);
  }
  function closeCartDrawer(){
    const shell = ensureDrawerShell();
    shell.setAttribute("data-open", "false");
  }

  function renderProductCard(product){
    const tone = (product.category === "smart-home" || product.category === "speakers") ? "cyan" : "blue";
    const img = makePlaceholderSvgDataUri(product.title.split(" ").slice(0,3).join(" "), tone);
    const stars = renderStars(product.rating);
    const stock = product.inStock ? `<span class="chip">In stock</span>` : `<span class="chip" style="border-color: rgba(239,68,68,.35); color: rgba(255,255,255,.84)">Out of stock</span>`;

    return `
      <div class="card product-card">
        <a class="product-media" href="product.html?handle=${encodeURIComponent(product.handle)}" aria-label="${svgEscape(product.title)}">
          <img alt="" src="${img}"/>
        </a>
        <div class="product-body">
          <div class="product-meta">
            <span>${svgEscape(product.brand)}</span>
            <span>•</span>
            <span>${stars}</span>
            <span class="tiny">(${Number(product.reviewsCount||0).toLocaleString("en-IN")})</span>
          </div>
          <p class="product-title" style="margin-top:8px">${svgEscape(product.title)}</p>
          <div class="price-row">
            <div>
              <span class="price">${formatINR(product.price)}</span>
              ${product.compareAtPrice ? `<span class="compare" style="margin-left:8px">${formatINR(product.compareAtPrice)}</span>` : ``}
            </div>
            ${stock}
          </div>
          <div class="quick-actions">
            <a class="btn" href="product.html?handle=${encodeURIComponent(product.handle)}">View</a>
            <button class="btn btn-primary" type="button" data-quick-add="${svgEscape(product.handle)}" ${product.inStock ? "" : "disabled"}>Add</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStars(rating){
    const r = Math.max(0, Math.min(5, Number(rating)||0));
    const full = Math.floor(r);
    const half = (r - full) >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    const star = (filled) => filled
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.1L22 9.2l-5 4.8 1.2 7L12 18.8 5.8 21l1.2-7-5-4.8 7.1-1.1L12 2z"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l2.9 6.1L22 9.2l-5 4.8 1.2 7L12 18.8 5.8 21l1.2-7-5-4.8 7.1-1.1L12 2z"/></svg>`;
    let html = `<span class="stars" aria-label="${r.toFixed(1)} out of 5">`;
    for(let i=0;i<full;i++) html += star(true);
    if(half) html += `<span style="position:relative; display:inline-block; width:14px; height:14px">
      <span style="position:absolute; inset:0; overflow:hidden; width:7px">${star(true)}</span>
      <span style="position:absolute; inset:0; color: rgba(255,255,255,.55)">${star(false)}</span>
    </span>`;
    for(let i=0;i<empty;i++) html += `<span style="color: rgba(255,255,255,.55)">${star(false)}</span>`;
    html += `</span>`;
    return html;
  }

  function bindQuickAdd(root){
    root.querySelectorAll("[data-quick-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const handle = btn.getAttribute("data-quick-add");
        const res = addToCart(handle, 1, null);
        toast(res.message);
        if(res.ok) openCartDrawer();
      });
    });
  }

  function readParam(name){
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function setTitle(title){
    const data = getData();
    document.title = `${title} • ${data.brandName}`;
  }

  function money(amount){ return formatINR(amount); }

  function initSite(){
    renderHeader();
    renderFooter();
    ensureDrawerShell();
    window.addEventListener("amnkart:cart-changed", () => {
      updateCartBadge();
      renderCartContents();
    });
  }

  window.AMNKART = {
    initSite,
    getData,
    getCategories,
    getProducts,
    getProductByHandle,
    renderProductCard,
    bindQuickAdd,
    readParam,
    setTitle,
    formatINR,
    money,
    cartRead,
    cartWrite,
    cartCount,
    cartSubtotal,
    addToCart,
    setLineQty,
    removeLine,
    clearCart,
    toast,
    renderStars,
    makePlaceholderSvgDataUri,
  };
})();

