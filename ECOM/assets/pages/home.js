(function(){
  function renderCategoryTiles(){
    const { getCategories } = window.AMNKART;
    return `
      <div class="grid grid-4">
        ${getCategories().map(c => `
          <a class="card card-pad" href="collections.html?handle=${encodeURIComponent(c.handle)}">
            <div class="row" style="justify-content:space-between">
              <div style="font-weight:750">${c.title}</div>
              <span class="chip">Shop</span>
            </div>
            <div class="tiny" style="margin-top:10px">Browse top picks in ${c.title.toLowerCase()}.</div>
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderBestSellers(){
    const { getProducts, renderProductCard, bindQuickAdd } = window.AMNKART;
    const best = getProducts()
      .filter(p => p.inStock)
      .slice()
      .sort((a,b) => (b.rating * Math.log10((b.reviewsCount||1)+10)) - (a.rating * Math.log10((a.reviewsCount||1)+10)))
      .slice(0, 8);
    const html = `
      <div class="grid grid-4" id="best-sellers">
        ${best.map(renderProductCard).join("")}
      </div>
    `;
    setTimeout(() => {
      const root = document.getElementById("best-sellers");
      if(root) bindQuickAdd(root);
    }, 0);
    return html;
  }

  function render(){
    const { setTitle, getData } = window.AMNKART;
    const data = getData();
    setTitle("Home");

    const host = document.getElementById("page");
    host.innerHTML = `
      <div class="hero">
        <div class="container">
          <div class="hero-inner">
            <div class="chip"><span aria-hidden="true">⚡</span> New arrivals weekly</div>
            <h1 style="margin-top:12px">Power up your everyday tech.</h1>
            <p>Shop chargers, cables, earbuds, smart home, and accessories—built for speed, reliability, and clean design.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="collections.html?handle=chargers">Shop New Arrivals</a>
              <a class="btn" href="collections.html?handle=accessories">Explore Accessories</a>
            </div>
            <div class="hero-strip" aria-label="Store benefits">
              <span class="chip">Free shipping over ${window.AMNKART.money(data.freeShippingThreshold)}</span>
              <span class="chip">1-year warranty</span>
              <span class="chip">7-day returns</span>
              <span class="chip">Secure packaging</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="container">
          <div class="section-title">
            <h2>Shop by category</h2>
            <div class="muted">Curated picks for every setup</div>
          </div>
          ${renderCategoryTiles()}
        </div>
      </div>

      <div class="section">
        <div class="container">
          <div class="section-title">
            <h2>Best sellers</h2>
            <div class="muted">Top-rated products customers love</div>
          </div>
          ${renderBestSellers()}
        </div>
      </div>

      <div class="section">
        <div class="container">
          <div class="card card-pad" style="display:flex; gap:14px; align-items:center; justify-content:space-between; flex-wrap:wrap">
            <div>
              <div style="font-weight:750; font-size:16px">Get deals & drops</div>
              <div class="tiny" style="margin-top:6px">Monthly updates—no spam. Unsubscribe anytime.</div>
            </div>
            <form class="row wrap" onsubmit="return false" aria-label="Newsletter signup">
              <input class="input" type="email" placeholder="Email address" style="width:min(340px, 86vw)" />
              <button class="btn btn-primary" type="button" id="newsletter-btn">Subscribe</button>
            </form>
          </div>
        </div>
      </div>
    `;

    host.querySelector("#newsletter-btn")?.addEventListener("click", () => {
      window.AMNKART.toast("Thanks! You’re subscribed (mock).");
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    window.AMNKART.initSite();
    render();
  });
})();

