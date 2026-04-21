(function(){
  function randomOrderId(){
    const part = () => Math.floor(Math.random()*1e6).toString().padStart(6,"0");
    return "AMN-" + part() + "-" + part();
  }

  function render(){
    const { initSite, cartRead, cartSubtotal, getProductByHandle, money, clearCart, setTitle } = window.AMNKART;
    initSite();
    setTitle("Checkout");

    const host = document.getElementById("page");
    const cart = cartRead();
    const subtotal = cartSubtotal();

    const lines = cart.items.map(it => {
      const p = getProductByHandle(it.handle);
      if(!p) return "";
      const variantText = it.variant ? Object.entries(it.variant).map(([k,v]) => `${k}: ${v}`).join(", ") : "";
      return `
        <div class="row" style="justify-content:space-between; align-items:start; padding:8px 0">
          <div style="min-width:0">
            <div style="font-weight:650">${p.title}</div>
            <div class="tiny">${p.brand}${variantText ? ` • ${variantText}` : ""} • Qty ${it.qty}</div>
          </div>
          <div style="font-weight:750">${money(p.price * (Number(it.qty)||1))}</div>
        </div>
      `;
    }).join('<div class="divider"></div>');

    if(!cart.items.length){
      host.innerHTML = `
        <div class="section">
          <div class="container">
            <div class="card card-pad">
              <div style="font-weight:750">Cart is empty</div>
              <div class="tiny" style="margin-top:6px">Add items before checking out.</div>
              <div class="spacer"></div>
              <a class="btn btn-primary" href="collections.html?handle=chargers">Shop chargers</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    host.innerHTML = `
      <div class="section">
        <div class="container">
          <div class="breadcrumbs">
            <a href="index.html">Home</a>
            <span>›</span>
            <span>Checkout</span>
          </div>
          <div class="spacer"></div>

          <div class="layout" style="grid-template-columns: minmax(0, 1fr) 360px">
            <div>
              <div class="card card-pad">
                <div style="font-weight:750; font-size:18px">Delivery details</div>
                <div class="spacer"></div>
                <form id="checkoutForm">
                  <div class="grid grid-2">
                    <div>
                      <div class="label">Full name</div>
                      <input class="input" name="name" required placeholder="Your name" />
                    </div>
                    <div>
                      <div class="label">Phone</div>
                      <input class="input" name="phone" required inputmode="tel" placeholder="10-digit number" />
                    </div>
                  </div>
                  <div class="spacer"></div>
                  <div>
                    <div class="label">Address</div>
                    <input class="input" name="address" required placeholder="House/Flat, Street, Area" />
                  </div>
                  <div class="spacer"></div>
                  <div class="grid grid-3">
                    <div>
                      <div class="label">City</div>
                      <input class="input" name="city" required placeholder="City" />
                    </div>
                    <div>
                      <div class="label">State</div>
                      <input class="input" name="state" required placeholder="State" />
                    </div>
                    <div>
                      <div class="label">PIN</div>
                      <input class="input" name="pin" required inputmode="numeric" placeholder="PIN code" />
                    </div>
                  </div>
                  <div class="spacer"></div>
                  <div class="filter-group">
                    <h3>Delivery</h3>
                    <label class="checkrow"><input type="radio" name="delivery" value="standard" checked/> Standard (2–5 days) — Free over ₹1999</label>
                    <label class="checkrow"><input type="radio" name="delivery" value="express"/> Express (1–2 days) — ₹149</label>
                  </div>
                  <div class="spacer"></div>
                  <div class="filter-group">
                    <h3>Payment</h3>
                    <label class="checkrow"><input type="radio" name="payment" value="cod" checked/> Cash on Delivery (mock)</label>
                    <label class="checkrow"><input type="radio" name="payment" value="upi"/> UPI (mock)</label>
                  </div>
                  <div class="spacer"></div>
                  <button class="btn btn-primary" type="submit" style="width:100%">Place order</button>
                  <div class="spacer" style="height:8px"></div>
                  <div class="tiny">This is a demo checkout—no payment is processed.</div>
                </form>
              </div>
            </div>

            <aside>
              <div class="card card-pad">
                <div style="font-weight:750">Order summary</div>
                <div class="spacer" style="height:10px"></div>
                ${lines}
                <div class="divider"></div>
                <div class="row" style="justify-content:space-between">
                  <div class="tiny">Subtotal</div>
                  <div style="font-weight:750">${money(subtotal)}</div>
                </div>
                <div class="spacer" style="height:8px"></div>
                <div class="tiny">Shipping updates after delivery selection (mock).</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    `;

    const form = host.querySelector("#checkoutForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const phone = String(fd.get("phone")||"").replace(/\D/g, "");
      if(phone.length < 10){
        window.AMNKART.toast("Enter a valid phone number.");
        return;
      }
      const orderId = randomOrderId();
      clearCart();
      host.innerHTML = `
        <div class="section">
          <div class="container">
            <div class="card card-pad">
              <div class="chip">Order placed</div>
              <div style="font-weight:900; font-size:22px; margin-top:10px">Thanks for shopping with AMNKART.</div>
              <div class="tiny" style="margin-top:6px">Order ID: <strong>${orderId}</strong></div>
              <div class="spacer"></div>
              <div class="notice">
                This is a mock confirmation page. Integrate a real payment gateway (Stripe/Razorpay) when ready.
              </div>
              <div class="spacer"></div>
              <div class="row wrap">
                <a class="btn btn-primary" href="index.html">Continue shopping</a>
                <a class="btn" href="collections.html?handle=accessories">Browse accessories</a>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  window.addEventListener("DOMContentLoaded", render);
})();

