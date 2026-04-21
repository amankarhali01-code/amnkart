(function(){
  function scoreProduct(p, q){
    const s = q.toLowerCase().trim();
    if(!s) return 0;
    const hay = [
      p.title,
      p.brand,
      p.category,
      (p.tags||[]).join(" "),
    ].join(" ").toLowerCase();
    if(hay === s) return 100;
    if(hay.includes(s)) return 40;
    const parts = s.split(/\s+/).filter(Boolean);
    let hit = 0;
    for(const part of parts){
      if(hay.includes(part)) hit += 10;
    }
    return hit;
  }

  function render(){
    const { initSite, getProducts, renderProductCard, bindQuickAdd, setTitle } = window.AMNKART;
    initSite();
    setTitle("Search");

    const q = window.AMNKART.readParam("q") || "";
    const products = getProducts()
      .map(p => ({ p, score: scoreProduct(p, q) }))
      .filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score)
      .map(x => x.p);

    const host = document.getElementById("page");
    host.innerHTML = `
      <div class="section">
        <div class="container">
          <div class="breadcrumbs">
            <a href="index.html">Home</a>
            <span>›</span>
            <span>Search</span>
          </div>
          <div class="spacer"></div>

          <div class="card card-pad">
            <div class="row wrap" style="justify-content:space-between">
              <div>
                <div style="font-weight:750; font-size:18px">Search</div>
                <div class="tiny">${q ? `Results for “${q}”` : "Type a search term in the header search box."}</div>
              </div>
              <a class="btn" href="collections.html?handle=chargers">Browse collections</a>
            </div>
          </div>

          <div class="spacer"></div>
          ${q ? (products.length ? `
            <div class="grid grid-4" id="search-grid">
              ${products.map(renderProductCard).join("")}
            </div>
          ` : `
            <div class="card card-pad">
              <div style="font-weight:750">No matches</div>
              <div class="tiny" style="margin-top:6px">Try “charger”, “USB-C”, “earbuds”, or “smart”.</div>
            </div>
          `) : `
            <div class="card card-pad">
              <div class="tiny">Popular searches:</div>
              <div class="spacer" style="height:10px"></div>
              <div class="row wrap">
                <a class="chip" href="search.html?q=charger">charger</a>
                <a class="chip" href="search.html?q=usb-c">usb-c</a>
                <a class="chip" href="search.html?q=power">power</a>
                <a class="chip" href="search.html?q=earbuds">earbuds</a>
                <a class="chip" href="search.html?q=smart">smart</a>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    const grid = host.querySelector("#search-grid");
    if(grid) bindQuickAdd(grid);
  }

  window.addEventListener("DOMContentLoaded", render);
})();

