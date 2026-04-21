(function(){
  const PER_PAGE = 12;

  function unique(values){
    return Array.from(new Set(values)).filter(Boolean).sort((a,b) => a.localeCompare(b));
  }

  function parseNumber(value, fallback){
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function getUrl(){
    return new URL(window.location.href);
  }

  function readFilters(){
    const url = getUrl();
    const min = parseNumber(url.searchParams.get("min"), 0);
    const max = parseNumber(url.searchParams.get("max"), 999999);
    const sort = url.searchParams.get("sort") || "featured";
    const inStockOnly = url.searchParams.get("stock") === "1";
    const rating4 = url.searchParams.get("r4") === "1";
    const brands = url.searchParams.getAll("brand");
    const page = parseNumber(url.searchParams.get("page"), 1);
    return { min, max, sort, inStockOnly, rating4, brands, page: Math.max(1, page) };
  }

  function writeFilters(next){
    const url = getUrl();
    url.searchParams.set("min", String(next.min));
    url.searchParams.set("max", String(next.max));
    url.searchParams.set("sort", next.sort);
    url.searchParams.set("stock", next.inStockOnly ? "1" : "0");
    url.searchParams.set("r4", next.rating4 ? "1" : "0");
    url.searchParams.delete("brand");
    (next.brands || []).forEach(b => url.searchParams.append("brand", b));
    url.searchParams.set("page", String(next.page || 1));
    window.location.href = url.toString();
  }

  function sortProducts(list, sort){
    const items = list.slice();
    if(sort === "price-asc") items.sort((a,b) => a.price - b.price);
    else if(sort === "price-desc") items.sort((a,b) => b.price - a.price);
    else if(sort === "newest") items.sort((a,b) => (b.id||"").localeCompare(a.id||""));
    else if(sort === "rating") items.sort((a,b) => (b.rating||0) - (a.rating||0));
    else {
      items.sort((a,b) => ((b.rating||0) * Math.log10((b.reviewsCount||1)+10)) - ((a.rating||0) * Math.log10((a.reviewsCount||1)+10)));
    }
    return items;
  }

  function renderFiltersSidebar(category, brands, filters, priceMin, priceMax){
    return `
      <div class="card card-pad">
        <div class="filters-header">
          <div>
            <div style="font-weight:750">Filters</div>
            <div class="tiny">${category.title}</div>
          </div>
          <a class="btn btn-ghost" href="collections.html?handle=${encodeURIComponent(category.handle)}">Reset</a>
        </div>
        <div class="divider"></div>

        <div class="filter-group">
          <h3>Price (₹)</h3>
          <div class="grid grid-2">
            <div>
              <div class="label">Min</div>
              <input class="input" type="number" min="${priceMin}" max="${priceMax}" step="50" id="minPrice" value="${filters.min}"/>
            </div>
            <div>
              <div class="label">Max</div>
              <input class="input" type="number" min="${priceMin}" max="${priceMax}" step="50" id="maxPrice" value="${filters.max}"/>
            </div>
          </div>
          <div class="spacer" style="height:10px"></div>
          <button class="btn btn-primary" type="button" id="applyPrice">Apply</button>
        </div>

        <div class="spacer" style="height:12px"></div>
        <div class="filter-group">
          <h3>Availability</h3>
          <label class="checkrow"><input type="checkbox" id="stockOnly" ${filters.inStockOnly ? "checked" : ""}/> In stock only</label>
          <label class="checkrow"><input type="checkbox" id="rating4" ${filters.rating4 ? "checked" : ""}/> 4★ & up</label>
        </div>

        <div class="spacer" style="height:12px"></div>
        <div class="filter-group">
          <h3>Brand</h3>
          ${brands.map(b => `
            <label class="checkrow">
              <input type="checkbox" data-brand="${b}" ${filters.brands.includes(b) ? "checked" : ""}/>
              ${b}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderPagination(filters, total){
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(filters.page, totalPages);
    const prevDisabled = page <= 1;
    const nextDisabled = page >= totalPages;
    const pages = [];
    for(let p=1; p<=totalPages; p++){
      if(p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    }
    const compact = Array.from(new Set(pages));
    let last = 0;
    const pageButtons = compact.map(p => {
      const gap = p - last;
      last = p;
      const ellipsis = gap > 1 ? `<span class="tiny" style="padding:0 6px">…</span>` : "";
      const btn = `<button class="btn ${p===page ? "btn-primary" : ""}" type="button" data-page="${p}">${p}</button>`;
      return ellipsis + btn;
    }).join("");

    return `
      <div class="pagination">
        <button class="btn" type="button" data-page="${page-1}" ${prevDisabled ? "disabled" : ""}>Prev</button>
        ${pageButtons}
        <button class="btn" type="button" data-page="${page+1}" ${nextDisabled ? "disabled" : ""}>Next</button>
      </div>
    `;
  }

  function render(){
    const { initSite, getCategories, getProducts, renderProductCard, bindQuickAdd, setTitle } = window.AMNKART;
    initSite();

    const handle = window.AMNKART.readParam("handle") || "chargers";
    const category = getCategories().find(c => c.handle === handle) || getCategories()[0];
    setTitle(category.title);

    const all = getProducts().filter(p => p.category === category.handle);
    const allBrands = unique(all.map(p => p.brand));
    const prices = all.map(p => p.price);
    const priceMin = Math.min(...prices, 0);
    const priceMax = Math.max(...prices, 0);

    const filters = readFilters();
    filters.min = Math.max(priceMin, filters.min);
    filters.max = Math.min(priceMax, filters.max);

    let filtered = all.filter(p => p.price >= filters.min && p.price <= filters.max);
    if(filters.inStockOnly) filtered = filtered.filter(p => p.inStock);
    if(filters.rating4) filtered = filtered.filter(p => (p.rating||0) >= 4);
    if(filters.brands.length) filtered = filtered.filter(p => filters.brands.includes(p.brand));

    filtered = sortProducts(filtered, filters.sort);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    const host = document.getElementById("page");
    host.innerHTML = `
      <div class="section">
        <div class="container">
          <div class="breadcrumbs">
            <a href="index.html">Home</a>
            <span>›</span>
            <span>${category.title}</span>
          </div>
          <div class="spacer"></div>

          <div class="pillbar">
            <div>
              <div style="font-weight:750; font-size:18px">${category.title}</div>
              <div class="tiny">${total.toLocaleString("en-IN")} items</div>
            </div>
            <div class="row wrap">
              <div style="min-width:220px">
                <div class="label">Sort</div>
                <select class="select" id="sort">
                  <option value="featured" ${filters.sort==="featured"?"selected":""}>Featured</option>
                  <option value="price-asc" ${filters.sort==="price-asc"?"selected":""}>Price: Low to High</option>
                  <option value="price-desc" ${filters.sort==="price-desc"?"selected":""}>Price: High to Low</option>
                  <option value="newest" ${filters.sort==="newest"?"selected":""}>Newest</option>
                  <option value="rating" ${filters.sort==="rating"?"selected":""}>Rating</option>
                </select>
              </div>
              <a class="btn" href="search.html">Search</a>
            </div>
          </div>

          <div class="spacer"></div>
          <div class="layout">
            <aside id="filters">
              ${renderFiltersSidebar(category, allBrands, filters, priceMin, priceMax)}
            </aside>
            <div>
              ${pageItems.length ? `
                <div class="grid grid-3" id="collection-grid">
                  ${pageItems.map(renderProductCard).join("")}
                </div>
              ` : `
                <div class="card card-pad">
                  <div style="font-weight:750">No results</div>
                  <div class="tiny" style="margin-top:6px">Try adjusting filters or resetting.</div>
                </div>
              `}
              <div class="spacer"></div>
              ${renderPagination(filters, total)}
            </div>
          </div>
        </div>
      </div>
    `;

    const grid = host.querySelector("#collection-grid");
    if(grid) bindQuickAdd(grid);

    host.querySelector("#sort")?.addEventListener("change", (e) => {
      writeFilters({ ...filters, sort: e.target.value, page: 1 });
    });

    host.querySelector("#applyPrice")?.addEventListener("click", () => {
      const min = Number(host.querySelector("#minPrice")?.value || priceMin);
      const max = Number(host.querySelector("#maxPrice")?.value || priceMax);
      writeFilters({ ...filters, min, max, page: 1 });
    });

    host.querySelector("#stockOnly")?.addEventListener("change", (e) => {
      writeFilters({ ...filters, inStockOnly: e.target.checked, page: 1 });
    });

    host.querySelector("#rating4")?.addEventListener("change", (e) => {
      writeFilters({ ...filters, rating4: e.target.checked, page: 1 });
    });

    const nextBrands = new Set(filters.brands);
    host.querySelectorAll("[data-brand]").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const b = e.target.getAttribute("data-brand");
        if(e.target.checked) nextBrands.add(b);
        else nextBrands.delete(b);
        writeFilters({ ...filters, brands: Array.from(nextBrands), page: 1 });
      });
    });

    host.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => {
      const p = Number(btn.getAttribute("data-page"));
      if(!Number.isFinite(p)) return;
      writeFilters({ ...filters, page: Math.max(1, p) });
    }));
  }

  window.addEventListener("DOMContentLoaded", render);
})();

