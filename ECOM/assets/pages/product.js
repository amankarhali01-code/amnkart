(function(){
  function renderSpecs(specs){
    const entries = Object.entries(specs || {});
    if(!entries.length) return `<div class="tiny">No specs listed.</div>`;
    return `
      <div class="card card-pad">
        ${entries.map(([k,v]) => `
          <div class="row" style="justify-content:space-between; align-items:start; padding:8px 0">
            <div class="tiny">${k}</div>
            <div style="color: rgba(255,255,255,.86); text-align:right">${v}</div>
          </div>
        `).join('<div class="divider"></div>')}
      </div>
    `;
  }

  function render(){
    const {
      initSite, getProductByHandle, getCategories, setTitle, money,
      addToCart, toast, openCartDrawer, renderStars, makePlaceholderSvgDataUri
    } = window.AMNKART;

    initSite();

    const handle = window.AMNKART.readParam("handle");
    const product = handle ? getProductByHandle(handle) : null;

    const host = document.getElementById("page");
    if(!product){
      setTitle("Product");
      host.innerHTML = `
        <div class="section">
          <div class="container">
            <div class="card card-pad">
              <div style="font-weight:750">Product not found</div>
              <div class="tiny" style="margin-top:6px">Go back to collections and try again.</div>
              <div class="spacer"></div>
              <a class="btn btn-primary" href="collections.html?handle=chargers">Browse chargers</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    setTitle(product.title);

    const category = getCategories().find(c => c.handle === product.category);
    const tone = (product.category === "smart-home" || product.category === "speakers") ? "cyan" : "blue";
    const galleryImages = [
      makePlaceholderSvgDataUri(product.title.split(" ").slice(0,3).join(" "), tone),
      makePlaceholderSvgDataUri("Detail view", tone),
      makePlaceholderSvgDataUri("In the box", tone),
    ];

    const optionBlocks = (product.options || []).map(opt => `
      <div>
        <div class="label">${opt.name}</div>
        <select class="select" data-option="${opt.name}">
          ${opt.values.map(v => `<option value="${v}">${v}</option>`).join("")}
        </select>
      </div>
    `).join("");

    const highlights = (product.highlights || []).slice(0,5).map(h => `<li style="margin:8px 0; color: var(--muted)">${h}</li>`).join("");

    host.innerHTML = `
      <div class="section">
        <div class="container">
          <div class="breadcrumbs">
            <a href="index.html">Home</a>
            <span>›</span>
            <a href="collections.html?handle=${encodeURIComponent(product.category)}">${category ? category.title : "Collection"}</a>
            <span>›</span>
            <span>${product.title}</span>
          </div>
          <div class="spacer"></div>

          <div class="product-page">
            <div class="gallery" aria-label="Product images">
              <div class="gallery-main">
                <img id="mainImg" alt="" src="${galleryImages[0]}"/>
              </div>
              <div class="gallery-thumbs" role="listbox" aria-label="Thumbnails">
                ${galleryImages.map((src, idx) => `
                  <button class="thumb" type="button" data-img="${src}" aria-current="${idx===0 ? "true" : "false"}" aria-label="Image ${idx+1}">
                    <img alt="" src="${src}"/>
                  </button>
                `).join("")}
              </div>
            </div>

            <div>
              <div class="card card-pad">
                <div class="row wrap" style="justify-content:space-between; align-items:start">
                  <div>
                    <div class="chip">${product.brand}</div>
                    <h1 style="margin:10px 0 0; font-size:22px; letter-spacing:-.2px">${product.title}</h1>
                    <div class="row wrap" style="margin-top:10px; color: var(--muted)">
                      <div>${renderStars(product.rating)}</div>
                      <div class="tiny">${(product.reviewsCount||0).toLocaleString("en-IN")} reviews</div>
                      <div class="chip" style="${product.inStock ? "" : "border-color: rgba(239,68,68,.35)"}">${product.inStock ? "In stock" : "Out of stock"}</div>
                    </div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-weight:800; font-size:22px">${money(product.price)}</div>
                    ${product.compareAtPrice ? `<div class="compare" style="margin-top:4px">${money(product.compareAtPrice)}</div>` : ``}
                  </div>
                </div>

                <div class="divider"></div>
                <ul style="margin:0; padding-left:18px">${highlights}</ul>

                <div class="divider"></div>
                <div class="grid grid-2">
                  ${optionBlocks || `<div class="tiny">No variants</div>`}
                  <div>
                    <div class="label">Quantity</div>
                    <input class="input" type="number" id="qty" min="1" max="99" value="1" />
                  </div>
                </div>

                <div class="spacer"></div>
                <button class="btn btn-primary" type="button" id="addBtn" ${product.inStock ? "" : "disabled"}>Add to cart</button>
                <div class="spacer" style="height:8px"></div>
                <div class="tiny">7-day returns • 1-year warranty • Support via WhatsApp (mock)</div>
              </div>

              <div class="spacer"></div>
              <div class="accordion">
                <button type="button" data-acc="desc">Description</button>
                <div class="panel" id="panel-desc" hidden>
                  ${product.description || "Reliable electronics built for daily use. Clean design, strong performance, and quality you can trust."}
                </div>
                <div class="spacer" style="height:10px"></div>
                <button type="button" data-acc="specs">Specs</button>
                <div class="panel" id="panel-specs" hidden>
                  ${renderSpecs(product.specs)}
                </div>
                <div class="spacer" style="height:10px"></div>
                <button type="button" data-acc="ship">Shipping & Returns</button>
                <div class="panel" id="panel-ship" hidden>
                  Ships in 24–48 hours (mock). Free shipping over ${money(window.AMNKART.getData().freeShippingThreshold)}. Returns accepted within 7 days on eligible items.
                </div>
                <div class="spacer" style="height:10px"></div>
                <button type="button" data-acc="warranty">Warranty</button>
                <div class="panel" id="panel-warranty" hidden>
                  Standard 1-year warranty unless otherwise mentioned in product specs. Keep your invoice for warranty claims (mock).
                </div>
              </div>
            </div>
          </div>

          <div class="spacer"></div>
          <div class="section-title">
            <h2>Related picks</h2>
            <div class="muted">More from ${category ? category.title : "this collection"}</div>
          </div>
          <div class="grid grid-4" id="related"></div>
        </div>
      </div>
    `;

    // gallery
    const mainImg = host.querySelector("#mainImg");
    host.querySelectorAll(".thumb").forEach(btn => {
      btn.addEventListener("click", () => {
        host.querySelectorAll(".thumb").forEach(t => t.setAttribute("aria-current", "false"));
        btn.setAttribute("aria-current", "true");
        mainImg.src = btn.getAttribute("data-img");
      });
    });

    // accordion
    const map = { desc: "panel-desc", specs: "panel-specs", ship: "panel-ship", warranty: "panel-warranty" };
    host.querySelectorAll("[data-acc]").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-acc");
        const panel = host.querySelector("#" + map[key]);
        const isHidden = panel.hasAttribute("hidden");
        host.querySelectorAll(".accordion .panel").forEach(p => p.setAttribute("hidden", ""));
        if(isHidden) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      });
    });

    // add to cart
    host.querySelector("#addBtn")?.addEventListener("click", () => {
      const qty = Number(host.querySelector("#qty")?.value || 1);
      const variant = {};
      host.querySelectorAll("select[data-option]").forEach(sel => {
        variant[sel.getAttribute("data-option")] = sel.value;
      });
      const res = addToCart(product.handle, qty, variant);
      toast(res.message);
      if(res.ok) openCartDrawer();
    });

    // related
    const related = window.AMNKART.getProducts()
      .filter(p => p.category === product.category && p.handle !== product.handle)
      .slice()
      .sort((a,b) => (b.rating||0) - (a.rating||0))
      .slice(0, 4);
    const relHost = host.querySelector("#related");
    relHost.innerHTML = related.map(window.AMNKART.renderProductCard).join("");
    window.AMNKART.bindQuickAdd(relHost);
  }

  window.addEventListener("DOMContentLoaded", render);
})();

