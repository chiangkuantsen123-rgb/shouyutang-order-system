const liveSessionKey = "syt-live-session";
const liveUserKey = "syt-live-user";

function liveToast(message) {
  if (typeof showToast === "function") {
    showToast(message);
    return;
  }
  alert(message);
}

function liveUser() {
  try {
    return JSON.parse(localStorage.getItem(liveUserKey) || "null");
  } catch {
    return null;
  }
}

function liveToken() {
  return localStorage.getItem(liveSessionKey) || "";
}

function saveLiveSession(data) {
  localStorage.setItem(liveSessionKey, data.token);
  localStorage.setItem(liveUserKey, JSON.stringify(data.user));
}

async function liveFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(liveToken() ? { Authorization: `Bearer ${liveToken()}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "联网接口暂时不可用");
  return data;
}

function fieldValue(form, labelText) {
  const label = [...form.querySelectorAll("label")].find((item) => item.textContent.trim().startsWith(labelText));
  return label?.querySelector("input, select, textarea")?.value.trim() || "";
}

function moneyLive(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function orderItemsText(items) {
  if (!Array.isArray(items)) return "";
  return items.map((item) => `${item.name} x${item.quantity}`).join(" / ");
}

function bindSteppersLive() {
  document.querySelectorAll(".stepper").forEach((stepper) => {
    if (stepper.dataset.liveBound) return;
    stepper.dataset.liveBound = "1";
    const input = stepper.querySelector("input");
    stepper.querySelector(".minus")?.addEventListener("click", () => {
      input.value = Math.max(0, Number(input.value || 0) - 1);
      updateCartLive();
    });
    stepper.querySelector(".plus")?.addEventListener("click", () => {
      input.value = Number(input.value || 0) + 1;
      updateCartLive();
    });
    input?.addEventListener("input", updateCartLive);
  });
  updateCartLive();
}

function updateCartLive() {
  const cartLines = document.querySelector("#cartLines");
  const subtotal = document.querySelector("#subtotal");
  const orderCount = document.querySelector("#orderCount");
  if (!cartLines || !subtotal || !orderCount) return;
  const order = collectCart();
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  cartLines.innerHTML =
    order.items.map((item) => `<div class="cart-line"><span>${escapeHtml(item.name)} x ${item.quantity}</span><strong>${moneyLive(item.quantity * item.price)}</strong></div>`).join("") ||
    '<div class="cart-line"><span>暂未选择产品</span><strong>¥0.00</strong></div>';
  subtotal.textContent = moneyLive(order.totalAmount);
  orderCount.textContent = `${count} 件`;
}

async function loginLive() {
  const account = document.querySelector("#loginAccount")?.value.trim();
  const password = document.querySelector("#loginPassword")?.value || "";
  if (!account || !password) {
    liveToast("请输入账号和密码");
    return;
  }
  const data = await liveFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ account, password }),
  });
  saveLiveSession(data);
  liveToast("登录成功");
  window.location.href = data.user.role === "admin" ? "./admin.html" : "./index.html";
}

async function submitApplicationLive() {
  const type = document.querySelector("#applicationType")?.textContent || "代理申请";
  await liveFetch("/api/applications", {
    method: "POST",
    body: JSON.stringify({
      type,
      reason: fieldValue(document, "申请原因"),
      storeInfo: fieldValue(document, "店家信息"),
      contactName: fieldValue(document, "联系人"),
      phone: fieldValue(document, "电话号码"),
    }),
  });
  liveToast("申请已提交，总台会收到真实通知");
}

function installAdminLoginPanel() {
  if (!document.body.classList.contains("admin-mode") && !document.querySelector(".admin-shell")) return;
  const user = liveUser();
  if (user?.role === "admin") return;
  const panel = document.createElement("section");
  panel.className = "live-login-panel";
  panel.innerHTML = `
    <div>
      <p class="eyebrow">真实后台登录</p>
      <h2>总台员工先登录，才能读取 Supabase 数据</h2>
    </div>
    <label>后台账号<input id="adminLiveAccount" value="admin" /></label>
    <label>后台密码<input id="adminLivePassword" type="password" placeholder="填写 Vercel 环境变量里的 ADMIN_PASSWORD" /></label>
    <button class="primary-button" id="adminLiveLogin">登录总台后台</button>
    <p class="hint">登录后会读取真实代理申请、订单、账号、商品。</p>
  `;
  document.querySelector(".main")?.prepend(panel);
  panel.querySelector("#adminLiveLogin").addEventListener("click", async () => {
    try {
      const data = await liveFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({
          account: panel.querySelector("#adminLiveAccount").value.trim(),
          password: panel.querySelector("#adminLivePassword").value,
        }),
      });
      saveLiveSession(data);
      panel.remove();
      liveToast("总台登录成功，正在读取真实数据");
      loadAdminLiveData();
    } catch (error) {
      liveToast(error.message);
    }
  });
}

async function loadAdminLiveData() {
  if (!document.querySelector(".admin-shell") || liveUser()?.role !== "admin") return;
  await Promise.allSettled([loadNoticesLive(), loadAccountsLive(), loadProductsLive(), loadOrdersLive()]);
}

async function loadNoticesLive() {
  const list = document.querySelector("#notificationList");
  if (!list) return;
  const data = await liveFetch("/api/notices");
  if (!data.notices?.length) return;
  list.innerHTML = data.notices
    .map(
      (notice) => `
        <article class="live-notice">
          <span>${escapeHtml(notice.type)}</span>
          <strong>${escapeHtml(notice.title)}</strong>
          <p>${escapeHtml(notice.content || "")}</p>
          <button class="text-button" data-jump-view="${escapeHtml(notice.target_view || "adminOrders")}">去处理</button>
        </article>
      `,
    )
    .join("");
  document.querySelector("#notificationCount").textContent = `${data.notices.length} 条待处理`;
  list.querySelectorAll("[data-jump-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.jumpView));
  });
}

async function loadAccountsLive() {
  const body = document.querySelector("#adminAccountsBody");
  if (!body) return;
  const data = await liveFetch("/api/accounts");
  body.innerHTML = data.accounts
    .map(
      (account) => `
        <tr>
          <td>${escapeHtml(account.account_code)} ${escapeHtml(account.store_name)}</td>
          <td>门店账号</td>
          <td>待统计</td>
          <td>月结</td>
          <td>-</td>
          <td><span class="status done">${escapeHtml(account.status)}</span></td>
        </tr>
      `,
    )
    .join("");
}

async function loadProductsLive() {
  const body = document.querySelector("#adminProductsBody");
  if (!body) return;
  const data = await liveFetch("/api/products");
  body.innerHTML = data.products
    .map(
      (product) => `
        <tr>
          <td>${escapeHtml(product.name)}</td>
          <td>${escapeHtml(product.specification || "")}</td>
          <td>${escapeHtml(product.box_spec || "")}</td>
          <td>${moneyLive(product.price_a)}</td>
          <td>${escapeHtml(product.image_url || "")}</td>
          <td>${product.stock || 0}</td>
          <td><span class="status done">已上架</span></td>
        </tr>
      `,
    )
    .join("");
}

async function loadOrdersLive() {
  const panel = document.querySelector(".order-select-panel");
  if (!panel) return;
  const data = await liveFetch("/api/orders");
  const orders = data.orders || [];
  const buttons = orders
    .map((order, index) => {
      const merchant = order.merchant_accounts || {};
      return `
        <button class="shipment-order ${index === 0 ? "active" : ""}" data-live-id="${order.id}" data-order-id="${escapeHtml(order.order_no)}" data-agent="${escapeHtml(merchant.store_name || "")}" data-phone="${escapeHtml(merchant.phone || "")}" data-address="${escapeHtml(merchant.address || "")}" data-items="${escapeHtml(orderItemsText(order.items))}" data-total="${moneyLive(order.total_amount)}" data-logistics="${escapeHtml([order.logistics_company, order.logistics_no].filter(Boolean).join(" ") || "待填写")}">
          <span>${escapeHtml(order.order_no)}</span>
          <strong>${escapeHtml(merchant.store_name || order.merchant_id || "")}</strong>
          <small>${escapeHtml(order.status)} / ${moneyLive(order.total_amount)}</small>
        </button>
      `;
    })
    .join("");
  panel.querySelectorAll(".shipment-order").forEach((item) => item.remove());
  panel.insertAdjacentHTML("beforeend", buttons || '<p class="hint">暂无订单</p>');
  bindLiveShipmentOrders();
}

function bindLiveShipmentOrders() {
  document.querySelectorAll(".shipment-order").forEach((order) => {
    order.addEventListener("click", () => {
      document.querySelectorAll(".shipment-order").forEach((button) => button.classList.toggle("active", button === order));
      document.querySelector("#selectedOrderId").textContent = order.dataset.orderId || "-";
      document.querySelector("#selectedAgent").textContent = order.dataset.agent || "-";
      document.querySelector("#selectedPhone").textContent = order.dataset.phone || "-";
      document.querySelector("#selectedAddress").textContent = order.dataset.address || "-";
      document.querySelector("#selectedItems").textContent = order.dataset.items || "-";
      document.querySelector("#selectedTotal").textContent = order.dataset.total || "-";
      document.querySelector("#selectedLogistics").textContent = order.dataset.logistics || "待填写";
      document.querySelector("#shipOrderInput").value = order.dataset.orderId || "";
      document.querySelector("#shipmentDetail").dataset.liveId = order.dataset.liveId || "";
    });
  });
}

async function createAccountLive() {
  const form = document.querySelector(".agent-form");
  if (!form || liveUser()?.role !== "admin") {
    liveToast("请先登录总台后台，再创建真实账号");
    return;
  }
  const data = await liveFetch("/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      storeName: fieldValue(form, "代理或门店名称"),
      contactName: fieldValue(form, "负责人"),
      phone: fieldValue(form, "手机号码"),
      address: fieldValue(form, "收货地址"),
      priceLevel: fieldValue(form, "价格等级"),
    }),
  });
  const result = document.querySelector("#credentialResult");
  result.classList.add("open");
  result.querySelector("dl").innerHTML = `
    <div><dt>登录账号</dt><dd>${escapeHtml(data.credentials.accountCode)}</dd></div>
    <div><dt>初始密码</dt><dd>${escapeHtml(data.credentials.password)}</dd></div>
    <div><dt>账号归属</dt><dd>${escapeHtml(data.account.store_name)}</dd></div>
    <div><dt>价格等级</dt><dd>${escapeHtml(data.account.price_level)}</dd></div>
  `;
  liveToast(`账号已创建：${data.credentials.accountCode} / ${data.credentials.password}`);
  loadAccountsLive();
}

async function saveProductLive() {
  const form = document.querySelector(".product-admin-form");
  if (!form || liveUser()?.role !== "admin") {
    liveToast("请先登录总台后台，再上架真实商品");
    return;
  }
  await liveFetch("/api/products", {
    method: "POST",
    body: JSON.stringify({
      name: fieldValue(form, "商品名称"),
      specification: fieldValue(form, "规格"),
      boxSpec: fieldValue(form, "箱规"),
      priceA: fieldValue(form, "A级代理价"),
      stock: fieldValue(form, "库存"),
      category: fieldValue(form, "商品分类"),
      imageUrl: "./assets/poster-01.jpg",
    }),
  });
  liveToast("商品已真实上架到数据库");
  loadProductsLive();
}

async function saveShipmentLive() {
  const detail = document.querySelector("#shipmentDetail");
  const id = detail?.dataset.liveId;
  if (!id || liveUser()?.role !== "admin") return;
  const form = document.querySelector(".shipment-form");
  await liveFetch("/api/orders", {
    method: "PATCH",
    body: JSON.stringify({
      id,
      logisticsCompany: fieldValue(form, "物流公司"),
      logisticsNo: fieldValue(form, "物流单号"),
      operator: fieldValue(form, "经办人"),
      status: "shipped",
    }),
  });
  liveToast("物流已写入数据库，代理端可查看");
  loadOrdersLive();
}

async function loadMerchantLiveData() {
  if (!document.querySelector("#agentOrdersBody") || liveUser()?.role !== "merchant") return;
  const user = liveUser();
  document.querySelector(".account-box strong").textContent = user.storeName || user.accountCode;
  document.querySelector(".account-box small").textContent = `${user.accountCode} / ${user.priceLevel || "代理价"} / 月结`;
  await Promise.allSettled([loadMerchantProductsLive(), loadMerchantOrdersLive()]);
}

async function loadMerchantProductsLive() {
  const list = document.querySelector(".product-list");
  if (!list) return;
  const data = await liveFetch("/api/products");
  list.innerHTML = data.products
    .map(
      (product) => `
        <article class="product-row">
          <img class="product-thumb" src="${escapeHtml(product.image_url || "./assets/poster-01.jpg")}" alt="${escapeHtml(product.name)}" />
          <div class="product-info">
            <strong>${escapeHtml(product.name)}</strong>
            <span>规格 ${escapeHtml(product.specification || "-")} / 箱规 ${escapeHtml(product.box_spec || "-")} / 当前账号 ${escapeHtml(liveUser()?.priceLevel || "代理价")}</span>
          </div>
          <div class="price">${moneyLive(product.price_a)}</div>
          <div class="stepper" data-price="${product.price_a}" data-name="${escapeHtml(product.name)}">
            <button class="minus">-</button>
            <input type="number" value="0" min="0" />
            <button class="plus">+</button>
          </div>
        </article>
      `,
    )
    .join("");
  bindSteppersLive();
}

async function loadMerchantOrdersLive() {
  const body = document.querySelector("#agentOrdersBody");
  if (!body) return;
  const data = await liveFetch("/api/orders");
  body.innerHTML = (data.orders || [])
    .map(
      (order) => `
        <tr>
          <td>${escapeHtml(order.order_no)}</td>
          <td>${escapeHtml(orderItemsText(order.items))}</td>
          <td>${moneyLive(order.total_amount)}</td>
          <td><span class="status ${order.status === "shipped" ? "shipped" : "preparing"}">${order.status === "shipped" ? "已发货" : "总台备货中"}</span></td>
          <td>${escapeHtml([order.logistics_company, order.logistics_no].filter(Boolean).join(" ") || "待总台填写")}</td>
          <td>${new Date(order.created_at).toLocaleString("zh-CN")}</td>
        </tr>
      `,
    )
    .join("");
}

function collectCart() {
  const items = [];
  let totalAmount = 0;
  document.querySelectorAll(".stepper").forEach((stepper) => {
    const quantity = Number(stepper.querySelector("input")?.value || 0);
    const price = Number(stepper.dataset.price || 0);
    if (quantity > 0) {
      items.push({ name: stepper.dataset.name, quantity, price });
      totalAmount += quantity * price;
    }
  });
  return { items, totalAmount };
}

async function submitOrderLive() {
  if (liveUser()?.role !== "merchant") {
    liveToast("请先用代理商账号登录");
    window.location.href = "./login.html";
    return;
  }
  const order = collectCart();
  if (!order.items.length) {
    liveToast("请先选择拿货数量");
    return;
  }
  await liveFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
  liveToast("拿货单已提交，总台后台会收到通知");
  showView("orders");
  loadMerchantOrdersLive();
}

function wireLiveApi() {
  document.querySelector("#loginButton")?.addEventListener("click", async () => {
    try {
      await loginLive();
    } catch (error) {
      liveToast(error.message);
    }
  });
  document.querySelector("#submitApplication")?.addEventListener("click", async () => {
    try {
      await submitApplicationLive();
    } catch (error) {
      liveToast(error.message);
    }
  });
  document.querySelector("#createAccountButton")?.addEventListener("click", async () => {
    try {
      await createAccountLive();
    } catch (error) {
      liveToast(error.message);
    }
  });
  document.querySelector("#saveProductButton")?.addEventListener("click", async () => {
    try {
      await saveProductLive();
    } catch (error) {
      liveToast(error.message);
    }
  });
  document.querySelector("#saveShipmentButton")?.addEventListener("click", async () => {
    try {
      await saveShipmentLive();
    } catch (error) {
      liveToast(error.message);
    }
  });
  document.querySelector("#submitOrderButton")?.addEventListener("click", async () => {
    try {
      await submitOrderLive();
    } catch (error) {
      liveToast(error.message);
    }
  });
  document.querySelector("#submitOrderTop")?.addEventListener("click", () => document.querySelector("#submitOrderButton")?.click());
}

installAdminLoginPanel();
wireLiveApi();
loadAdminLiveData();
loadMerchantLiveData();
