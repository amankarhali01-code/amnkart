(function(){
  function renderLine(it){
    const { getProductByHandle, money, makePlaceholderSvgDataUri } = window.AMNKART;
    const p = getProductByHandle(it.handle);
    if(!p) return "";
    const variantText = it.variant ? Object.entries(it.variant).map(([k,v]) => `${k}: ${v}`).join(" • ") : "";
    const tone = (p.category === "smart-home" || p.category === "speakers") ? "cyan" : "blue";
    const img = makePlaceholderSvgDataUri(p.title.split(" ").slice(0,3).join(" "), tone);
    return `
      <div class="line">
        <a class="line-media" href="product.html?handle=${encodeURIComponent(p.handle)}">
          <img alt="" src="${img}"/>
        </a>
        <div>
          <div class="row" style="justify-content:space-between; align-items:start">
            <div>
              <p class="line-title">${p.title}</p>
              <div class="line-sub">
                <span>${p.brand}</span>
                ${variantText ? `<span>•</span><span>${variantText}</span>` : ``}
              </div>
            </div>
            <button class="btn btn-ghost" type="button" data-remove="${it.key}">Remove</button>
          </div>
          <div class="row" style="justify-content:space-between; margin-top:10px">
            <div class="qty">
              <button type="button" class="icon-btn" style="width:30px;height:30px" data-dec="${it.key}" aria-label="Decrease quantity">−</button>
              <input inputmode="numeric" value="${Number(it.qty)||1}" data-qty="${it.key}"/>
              <button type="button" class="icon-btn" style="width:30px;height:30px" data-inc="${it.key}" aria-label="Increase quantity">+</button>
            </div>
            <div style="font-weight:750">${money(p.price * (Number(it.qty)||1))}</div>
          </div>
        </div>
      </div>
    `;
  }

  function clampInt(value, min, max){
    const n = Math.floor(Number(value));
    if(Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function render(){
    const { initSite, cartRead, cartSubtotal, getData, money, setLineQty, removeLine, clearCart, setTitle } = window.AMNKART;
    initSite();
    setTitle("Cart");

    const host = document.getElementById("page");
    const cart = cartRead();
    const subtotal = cartSubtotal();
    const threshold = getData().freeShippingThreshold;
    const remaining = Math.max(0, threshold - subtotal);
    const progress = Math.min(1, subtotal / threshold);

    host.innerHTML = `
      <div class="section">
        <div class="container">
          <div class="breadcrumbs">
            <a href="index.html">Home</a>
            <span>›</span>
            <span>Cart</span>
          </div>
          <div class="spacer"></div>

          <div class="layout" style="grid-template-columns: minmax(0, 1fr) 360px">
            <div>
              <div class="card card-pad">
                <div class="row" style="justify-content:space-between">
                  <div>
                    <div style="font-weight:750; font-size:18px">Cart</div>
                    <div class="tiny">${cart.items.length ? `${cart.items.length} item types` : "No items yet"}</div>
                  </div>
                  ${cart.items.length ? `<button class="btn btn-ghost" type="button" id="clear">Clear</button>` : ``}
                </div>
                <div class="divider"></div>
                ${cart.items.length ? cart.items.map(renderLine).join("") : `
                  <div class="notice">
                    Your cart is empty. Start with our best sellers.
                  </div>
                  <div class="spacer"></div>
                  <a class="btn btn-primary" href="collections.html?handle=chargers">Shop chargers</a>
                `}
              </div>
            </div>

            <aside>
              <div class="card card-pad">
                <div style="font-weight:750">Order summary</div>
                <div class="spacer" style="height:10px"></div>
                <div class="notice">
                  <div class="row" style="justify-content:space-between">
                    <div><strong>Free shipping</strong> over ${money(threshold)}</div>
                    <div class="tiny">${remaining === 0 ? "Unlocked" : `${money(remaining)} to go`}</div>
                  </div>
                  <div class="spacer" style="height:10px"></div>
                  <div class="meter"><div style="width:${Math.round(progress*100)}%"></div></div>
                </div>
                <div class="divider"></div>
                <div class="row" style="justify-content:space-between">
                  <div class="tiny">Subtotal</div>
                  <div style="font-weight:750">${money(subtotal)}</div>
                </div>
                <div class="spacer"></div>
                <a class="btn btn-primary" href="checkout.html" style="width:100%; ${cart.items.length ? "" : "pointer-events:none; opacity:.5"}">Checkout</a>
                <div class="spacer" style="height:8px"></div>
                <div class="tiny">Taxes and shipping calculated at checkout (mock).</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    `;

    host.querySelector("#clear")?.addEventListener("click", () => clearCart());

    host.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => removeLine(btn.getAttribute("data-remove"))));
    host.querySelectorAll("[data-dec]").forEach(btn => btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-dec");
      const c = cartRead();
      const line = c.items.find(x => x.key === key);
      if(!line) return;
      setLineQty(key, clampInt((line.qty||1) - 1, 1, 99));
    }));
    host.querySelectorAll("[data-inc]").forEach(btn => btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-inc");
      const c = cartRead();
      const line = c.items.find(x => x.key === key);
      if(!line) return;
      setLineQty(key, clampInt((line.qty||1) + 1, 1, 99));
    }));
    host.querySelectorAll("input[data-qty]").forEach(input => {
      input.addEventListener("change", () => setLineQty(input.getAttribute("data-qty"), input.value));
      input.addEventListener("blur", () => setLineQty(input.getAttribute("data-qty"), input.value));
    });

    window.addEventListener("amnkart:cart-changed", () => render());
  }

  window.addEventListener("DOMContentLoaded", render);
})();

