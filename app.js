/* PinkPeony – static mini e‑commerce (no frameworks) */
(() => {
  const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

  const CATALOG = [
    { id: "D001", name: "Floral Summer Dress", price: 1299, category: "Dresses", sizes: ["XS","S","M","L"], image: "floral-summer-dress.png", rating: 4.6 },
    { id: "T101", name: "Pastel Puff Sleeve Top", price: 699, category: "Tops", sizes: ["S","M","L"], image: "puff-sleeve-dress.png", rating: 4.3 },
    { id: "J201", name: "High-Waist Blue Jeans", price: 1499, category: "Jeans", sizes: ["S","M","L","XL"], image: "high-waist-jean.png", rating: 4.5 },
    { id: "S301", name: "Pleated Tennis Skirt", price: 999, category: "Sharara", sizes: ["XS","S","M"], image: "sharara.png", rating: 4.4 },
    { id: "E401", name: "Festive Anarkali Kurta", price: 1999, category: "gowns", sizes: ["S","M","L","XL"], image: "gown.png", rating: 4.7 },
    { id: "T102", name: "Graphic Tee – Girl Power", price: 599, category: "Crop Tops", sizes: ["XS","S","M","L","XL"], image: "crop-tops.png", rating: 4.2 },
    { id: "D002", name: "Polka Dot Midi Dress", price: 1399, category: "Anarkali", sizes: ["S","M","L"], image: "anarkali.png", rating: 4.5 }
  ];

  const state = {
    filters: { q: "", category: "All", sizes: [], minPrice: undefined, maxPrice: undefined },
    cart: loadCart()
  };

  function loadCart() {
    try { return JSON.parse(localStorage.getItem("pp_cart") || "{}"); }
    catch { return {}; }
  }
  function saveCart() {
    localStorage.setItem("pp_cart", JSON.stringify(state.cart));
  }

  // Routing (hash-based)
  function route() {
    const hash = (location.hash || "#shop").toLowerCase();
    showSection(hash.replace("#",""));
  }
  function showSection(name) {
    for (const id of ["shop","cart","checkout","success"]) {
      document.getElementById(`section-${id}`).classList.toggle("hidden", id !== name);
    }
    if (name === "shop") renderProducts();
    if (name === "cart") renderCart();
    if (name === "checkout") renderCheckoutSummary();
  }

  // ---------- Filters UI ----------
  const sizeOptions = ["XS","S","M","L","XL"];
  const sizeChips = document.getElementById("sizeChips");
  sizeOptions.forEach(s => {
    const el = document.createElement("button");
    el.className = "size-chip";
    el.textContent = s;
    el.onclick = () => {
      const set = new Set(state.filters.sizes);
      set.has(s) ? set.delete(s) : set.add(s);
      state.filters.sizes = [...set];
      renderFilters();
      renderProducts();
    };
    sizeChips.appendChild(el);
  });

  function renderFilters() {
    // text / category / price
    document.getElementById("searchInput").value = state.filters.q;
    document.getElementById("categorySelect").value = state.filters.category;
    document.getElementById("minPrice").value = state.filters.minPrice ?? "";
    document.getElementById("maxPrice").value = state.filters.maxPrice ?? "";
    // size chips
    [...sizeChips.children].forEach(chip => {
      const active = state.filters.sizes.includes(chip.textContent);
      chip.classList.toggle("active", active);
    });
  }

  // attach inputs
  document.getElementById("searchInput").addEventListener("input", e => { state.filters.q = e.target.value; renderProducts(); });
  document.getElementById("categorySelect").addEventListener("change", e => { state.filters.category = e.target.value; renderProducts(); });
  document.getElementById("minPrice").addEventListener("input", e => { state.filters.minPrice = e.target.value ? Number(e.target.value) : undefined; renderProducts(); });
  document.getElementById("maxPrice").addEventListener("input", e => { state.filters.maxPrice = e.target.value ? Number(e.target.value) : undefined; renderProducts(); });
  document.getElementById("resetFilters").addEventListener("click", () => {
    state.filters = { q:"", category:"All", sizes:[], minPrice:undefined, maxPrice:undefined };
    renderFilters(); renderProducts();
  });

  // ---------- Product Grid ----------
  function filteredProducts() {
    const f = state.filters;
    return CATALOG.filter(p => {
      if (f.category !== "All" && p.category !== f.category) return false;
      if (f.q && !p.name.toLowerCase().includes(f.q.toLowerCase())) return false;
      if (f.sizes.length && !f.sizes.some(s => p.sizes.includes(s))) return false;
      if (typeof f.minPrice === "number" && p.price < f.minPrice) return false;
      if (typeof f.maxPrice === "number" && p.price > f.maxPrice) return false;
      return true;
    });
  }

  function renderProducts() {
    const grid = document.getElementById("productGrid");
    const list = filteredProducts();
    grid.innerHTML = "";
    if (list.length === 0) {
      document.getElementById("noProducts").classList.remove("hidden");
    } else {
      document.getElementById("noProducts").classList.add("hidden");
      for (const p of list) {
        const card = document.createElement("div");
        card.className = "product-card bg-white rounded-2xl shadow-sm border overflow-hidden";
        card.innerHTML = `
          <div class="aspect-[4/3] overflow-hidden"><img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover"></div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold leading-tight">${p.name}</h3>
              <span class="text-pink-600 font-bold">${INR.format(p.price)}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">${p.category} • ⭐ ${p.rating}</p>
            <div class="flex items-center gap-2 mt-3">
              <select class="rounded-xl border px-2 py-1 text-sm">${p.sizes.map(s => `<option>${s}</option>`).join("")}</select>
              <button class="ml-auto bg-pink-600 text-white rounded-xl px-4 py-2 text-sm hover:bg-pink-700">Add to cart</button>
            </div>
          </div>
        `;
        const sizeSel = card.querySelector("select");
        card.querySelector("button").onclick = () => addToCart(p, sizeSel.value);
        grid.appendChild(card);
      }
    }
  }

  // ---------- Cart ----------
  function cartKey(id, size) { return `${id}-${size||"F"}`; }

  function addToCart(product, size) {
    const key = cartKey(product.id, size);
    const it = state.cart[key] || { id: product.id, name: product.name, price: product.price, image: product.image, size, qty: 0 };
    it.qty += 1;
    state.cart[key] = it;
    saveCart();
    updateCartCount();
  }

  function updateCartCount() {
    const count = Object.values(state.cart).reduce((s, it) => s + it.qty, 0);
    document.getElementById("cartCount").textContent = count;
  }

  function cartSummary() {
    const items = Object.entries(state.cart);
    const subtotal = items.reduce((s, [, v]) => s + v.price * v.qty, 0);
    const shipping = subtotal > 0 ? 79 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;
    return { items, subtotal, shipping, tax, total };
  }

  function renderCart() {
    const wrap = document.getElementById("cartItems");
    wrap.innerHTML = "";
    const { items, subtotal, shipping, tax, total } = cartSummary();

    if (items.length === 0) {
      wrap.innerHTML = `<div class="border rounded-2xl p-10 text-center text-slate-500">Your cart is empty.</div>`;
    } else {
      for (const [key, it] of items) {
        const row = document.createElement("div");
        row.className = "flex items-center gap-4 border rounded-2xl p-3 bg-white";
        row.innerHTML = `
          <img src="${it.image}" alt="${it.name}" class="w-24 h-20 object-cover rounded-xl" />
          <div class="flex-1">
            <div class="font-medium">${it.name}</div>
            <div class="text-xs text-slate-500">Size: ${it.size}</div>
            <div class="text-sm text-slate-700 mt-1">${INR.format(it.price)}</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1 border rounded-lg">-</button>
            <span class="w-8 text-center">${it.qty}</span>
            <button class="px-3 py-1 border rounded-lg">+</button>
          </div>
          <button class="text-sm underline ml-2">Remove</button>
        `;
        const [decBtn, incBtn] = row.querySelectorAll("button");
        const removeBtn = row.querySelectorAll("button")[2];
        incBtn.onclick = () => { it.qty += 1; state.cart[key] = it; saveCart(); renderCart(); updateCartCount(); };
        decBtn.onclick = () => { it.qty -= 1; if (it.qty <= 0) delete state.cart[key]; else state.cart[key]=it; saveCart(); renderCart(); updateCartCount(); };
        removeBtn.onclick = () => { delete state.cart[key]; saveCart(); renderCart(); updateCartCount(); };
        wrap.appendChild(row);
      }
    }
    document.getElementById("sumSubtotal").textContent = INR.format(subtotal);
    document.getElementById("sumShipping").textContent = INR.format(shipping);
    document.getElementById("sumTax").textContent = INR.format(tax);
    document.getElementById("sumTotal").textContent = INR.format(total);
    document.getElementById("toCheckout").classList.toggle("pointer-events-none", items.length===0);
    document.getElementById("toCheckout").classList.toggle("opacity-50", items.length===0);
  }

  // ---------- Checkout ----------
  function renderCheckoutSummary() {
    const { subtotal, shipping, tax, total } = cartSummary();
    document.getElementById("coSubtotal").textContent = INR.format(subtotal);
    document.getElementById("coShipping").textContent = INR.format(shipping);
    document.getElementById("coTax").textContent = INR.format(tax);
    document.getElementById("coTotal").textContent = INR.format(total);
  }

  document.getElementById("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const errors = validateForm(data);
    const errEl = document.getElementById("formErrors");
    if (Object.keys(errors).length) {
      errEl.textContent = Object.values(errors).join(" • ");
      for (const [name, msg] of Object.entries(errors)) {
        const input = e.target.querySelector(`[name='${name}']`);
        input.classList.add("err");
        input.title = msg;
      }
      return;
    }
    // success
    const { total } = cartSummary();
    const order = { ...data, amount: total, date: new Date().toISOString() };
    localStorage.removeItem("pp_cart");
    state.cart = {};
    updateCartCount();
    // success UI
    document.getElementById("successMsg").textContent = `Thank you, ${order.fullName}. We sent a confirmation to ${order.email}.`;
    const box = document.getElementById("successSummary");
    box.innerHTML = `
      <div class="flex justify-between"><span>Amount</span><span>${INR.format(order.amount)}</span></div>
      <div class="flex justify-between"><span>Payment</span><span>${order.payment}</span></div>
      <div class="flex justify-between"><span>City</span><span>${order.city}</span></div>
      <div class="flex justify-between"><span>PIN</span><span>${order.pin}</span></div>
    `;
    location.hash = "#success";
  });

  function validateForm(f) {
    const e = {};
    if (!f.fullName || !f.fullName.trim()) e.fullName = "Name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email||"")) e.email = "Valid email required";
    if (!/^\d{10}$/.test(f.phone||"")) e.phone = "Enter 10‑digit phone";
    if (!f.address || f.address.trim().length < 6) e.address = "Address too short";
    if (!f.city || !f.city.trim()) e.city = "City is required";
    if (!/^\d{6}$/.test(f.pin||"")) e.pin = "6‑digit PIN required";
    return e;
  }

  // ---------- Init ----------
  document.getElementById("year").textContent = new Date().getFullYear();
  renderFilters();
  renderProducts();
  updateCartCount();
  window.addEventListener("hashchange", route);
  route();
})();