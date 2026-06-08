const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const steppers = document.querySelectorAll(".stepper");
const cartLines = document.querySelector("#cartLines");
const subtotal = document.querySelector("#subtotal");
const orderCount = document.querySelector("#orderCount");
const heroPoster = document.querySelector("#heroPoster");
const posterIndex = document.querySelector("#posterIndex");
const trainingItems = document.querySelectorAll(".training-item");
const trainingPages = document.querySelectorAll(".training-page");
const shipmentOrders = document.querySelectorAll(".shipment-order");
const trainingList = document.querySelector("#trainingList");
const trainingReader = document.querySelector("#trainingReader");
const posterForm = document.querySelector("#posterForm");
const groupEditor = document.querySelector("#groupEditor");
const agentGroupView = document.querySelector("#agentGroupView");
const cropBox = document.querySelector(".crop-box");
const cropPreview = document.querySelector(".crop-preview");
const notificationList = document.querySelector("#notificationList");
const notificationCount = document.querySelector("#notificationCount");
const noticeStorageKey = "syt-head-office-notices";

document.querySelectorAll("form button").forEach((button) => {
  button.type = "button";
});

const posters = [
  "./assets/poster-06.jpg",
  "./assets/poster-01.jpg",
  "./assets/poster-02.jpg",
  "./assets/poster-03.jpg",
  "./assets/poster-04.jpg",
  "./assets/poster-05.jpg",
  "./assets/poster-07.jpg",
  "./assets/poster-08.jpg",
  "./assets/poster-09.jpg",
  "./assets/poster-10.jpg",
  "./assets/poster-11.jpg",
  "./assets/poster-12.jpg",
  "./assets/poster-13.jpg",
];

function money(value) {
  return `¥${value.toFixed(2)}`;
}

function updateCart() {
  if (!cartLines || !subtotal || !orderCount) return;
  let total = 0;
  let count = 0;
  const lines = [];

  steppers.forEach((stepper) => {
    const input = stepper.querySelector("input");
    const qty = Math.max(0, Number(input.value || 0));
    const price = Number(stepper.dataset.price);
    const name = stepper.dataset.name;

    if (qty > 0) {
      count += qty;
      total += qty * price;
      lines.push(`<div class="cart-line"><span>${name} x ${qty}</span><strong>${money(qty * price)}</strong></div>`);
    }
  });

  cartLines.innerHTML = lines.join("") || '<div class="cart-line"><span>暂未选择产品</span><strong>¥0.00</strong></div>';
  subtotal.textContent = money(total);
  orderCount.textContent = `${count} 件`;
}

function showView(viewId) {
  navItems.forEach((nav) => nav.classList.toggle("active", nav.dataset.view === viewId));
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  const activeView = document.querySelector(`#${viewId}`);
  if (activeView) {
    activeView.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.remove(), 1800);
}

function readStoredNotices() {
  try {
    return JSON.parse(localStorage.getItem(noticeStorageKey) || "[]");
  } catch {
    return [];
  }
}

function writeStoredNotice(notice) {
  const notices = readStoredNotices();
  notices.unshift({ id: Date.now(), createdAt: new Date().toLocaleString("zh-CN"), ...notice });
  localStorage.setItem(noticeStorageKey, JSON.stringify(notices.slice(0, 30)));
}

function getApplicationValue(labelText) {
  const label = [...document.querySelectorAll(".application-form label")].find((item) =>
    item.textContent.trim().startsWith(labelText),
  );
  return label?.querySelector("input")?.value.trim() || "";
}

function renderStoredNotices() {
  if (!notificationList || !notificationCount) return;
  const storedNotices = readStoredNotices();
  const storedHtml = storedNotices
    .map(
      (notice) => `
        <article class="live-notice">
          <span>${escapeHtml(notice.type)}</span>
          <strong>${escapeHtml(notice.store || "新申请")}提交${escapeHtml(notice.type)}</strong>
          <p>联系人：${escapeHtml(notice.contact || "-")} / 电话：${escapeHtml(notice.phone || "-")} / 原因：${escapeHtml(notice.reason || "-")} / 提交时间：${escapeHtml(notice.createdAt)}</p>
          <button class="text-button" data-jump-view="${notice.targetView || "adminAccounts"}">去处理</button>
        </article>
      `,
    )
    .join("");

  if (storedHtml) {
    notificationList.insertAdjacentHTML("afterbegin", storedHtml);
  }
  notificationCount.textContent = `${notificationList.querySelectorAll("article").length} 条待处理`;
}

renderStoredNotices();

navItems.forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.view));
});

steppers.forEach((stepper) => {
  const input = stepper.querySelector("input");
  stepper.querySelector(".minus").addEventListener("click", () => {
    input.value = Math.max(0, Number(input.value || 0) - 1);
    updateCart();
  });
  stepper.querySelector(".plus").addEventListener("click", () => {
    input.value = Number(input.value || 0) + 1;
    updateCart();
  });
  input.addEventListener("input", updateCart);
});

let currentPoster = 0;
if (heroPoster && posterIndex) {
  setInterval(() => {
    currentPoster = (currentPoster + 1) % posters.length;
    heroPoster.src = posters[currentPoster];
    posterIndex.textContent = String(currentPoster + 1);
  }, 2800);
}

document.querySelector(".light-button")?.addEventListener("click", () => showView("materials"));
document.querySelector(".ghost-button")?.addEventListener("click", () => showView("orders"));

document.querySelectorAll(".promo-link").forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.targetView));
});

document.querySelectorAll("[data-jump-view]").forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.jumpView);
    showToast("已跳转");
  });
});

document.querySelectorAll("[data-open-apply]").forEach((button) => {
  button.addEventListener("click", () => {
    const applicationPanel = document.querySelector("#applicationPanel");
    const applicationType = document.querySelector("#applicationType");
    const type = button.dataset.openApply;
    if (applicationType) {
      applicationType.textContent = type === "agent" ? "代理申请" : "开通账号申请";
    }
    applicationPanel?.classList.add("open");
    applicationPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("请填写申请资料");
  });
});

document.querySelector("#submitApplication")?.addEventListener("click", () => {
  const applicationType = document.querySelector("#applicationType")?.textContent || "申请";
  writeStoredNotice({
    type: applicationType,
    reason: getApplicationValue("申请原因"),
    store: getApplicationValue("店家信息"),
    contact: getApplicationValue("联系人"),
    phone: getApplicationValue("电话号码"),
    targetView: "adminAccounts",
  });
  showToast(`${applicationType}已提交，总台通知框会收到`);
});

document.querySelector("#openPosterForm")?.addEventListener("click", () => {
  posterForm?.classList.toggle("open");
  showToast(posterForm?.classList.contains("open") ? "已打开新增海报表单" : "已收起新增海报表单");
});

document.querySelectorAll("[data-feedback]").forEach((button) => {
  button.addEventListener("click", () => showToast(button.dataset.feedback));
});

document.querySelectorAll(".file-upload input[type='file']").forEach((input) => {
  input.addEventListener("change", () => {
    const labelText = input.files?.[0]?.name || "选择文件";
    input.closest(".file-upload")?.querySelector("span").replaceChildren(labelText);
  });
});

document.querySelectorAll(".download-button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "PDF 已准备";
  });
});

document.querySelectorAll(".manage-card .text-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.textContent.includes("删除")) {
      button.closest(".poster-card")?.remove();
      showToast("已删除");
      return;
    }
    posterForm?.classList.add("open");
    showView("adminMaterials");
    showToast("已打开编辑表单");
  });
});

document.querySelectorAll(".banner-edit").forEach((button) => {
  button.addEventListener("click", () => {
    posterForm?.classList.add("open");
    showToast("已打开 Banner 编辑");
  });
});

document.querySelectorAll(".banner-delete").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest("article")?.remove();
    showToast("Banner 已删除");
  });
});

document.querySelectorAll(".poster-group-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    const title = card.querySelector("strong")?.textContent || "海报组";
    const firstImage = card.querySelector("img")?.getAttribute("src") || "./assets/poster-06.jpg";
    const editorTitle = document.querySelector("#groupEditorTitle");
    const cropPreview = document.querySelector("#cropPreview");
    if (groupEditor && editorTitle && cropPreview) {
      editorTitle.textContent = title;
      cropPreview.src = firstImage;
      groupEditor.classList.add("open");
      groupEditor.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast("已进入海报组编辑");
    }
    const agentTitle = document.querySelector("#agentGroupTitle");
    if (agentGroupView && agentTitle) {
      agentTitle.textContent = title;
      agentGroupView.classList.add("open");
      agentGroupView.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.querySelectorAll(".group-download").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "整组 PDF 已准备";
    showToast("整组 PDF 已准备，可提供给门店下载");
  });
});

document.querySelector("#createAccountButton")?.addEventListener("click", () => {
  const credentialResult = document.querySelector("#credentialResult");
  credentialResult?.classList.add("open");
  credentialResult?.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("账号已创建：STORE-002 / 初始密码 SYT888");
});

document.querySelector("#cropRatio")?.addEventListener("change", (event) => {
  if (!cropBox) return;
  const value = event.target.value;
  if (value === "banner") cropBox.style.inset = "28% 8%";
  if (value === "poster") cropBox.style.inset = "10% 18%";
  if (value === "square") cropBox.style.inset = "18% 18%";
  showToast("裁剪比例已切换");
});

document.querySelector("#cropMode")?.addEventListener("change", (event) => {
  if (!cropBox) return;
  if (event.target.value.includes("靠上")) cropBox.style.inset = "4% 16% 24% 16%";
  if (event.target.value.includes("靠下")) cropBox.style.inset = "24% 16% 4% 16%";
  if (event.target.value.includes("居中")) cropBox.style.inset = "12% 14%";
  showToast("显示区域已切换");
});

document.querySelector("#saveCrop")?.addEventListener("click", () => {
  showToast("裁剪已保存");
});

if (cropBox && cropPreview) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  cropBox.addEventListener("pointerdown", (event) => {
    dragging = true;
    cropBox.setPointerCapture(event.pointerId);
    const boxRect = cropBox.getBoundingClientRect();
    const parentRect = cropPreview.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = boxRect.left - parentRect.left;
    startTop = boxRect.top - parentRect.top;
  });

  cropBox.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const boxRect = cropBox.getBoundingClientRect();
    const parentRect = cropPreview.getBoundingClientRect();
    const nextLeft = Math.max(0, Math.min(parentRect.width - boxRect.width, startLeft + event.clientX - startX));
    const nextTop = Math.max(0, Math.min(parentRect.height - boxRect.height, startTop + event.clientY - startY));
    cropBox.style.left = `${nextLeft}px`;
    cropBox.style.top = `${nextTop}px`;
    cropBox.style.right = "auto";
    cropBox.style.bottom = "auto";
    cropBox.style.width = `${boxRect.width}px`;
    cropBox.style.height = `${boxRect.height}px`;
  });

  cropBox.addEventListener("pointerup", () => {
    dragging = false;
    showToast("裁剪框位置已调整");
  });
}

document.querySelector("#exportBills")?.addEventListener("click", () => {
  const rows = [
    ["代理", "账期", "订单数", "应结金额", "状态"],
    ["上海静安一店", "2026-06", "8", "6820", "待确认"],
    ["杭州滨江代理", "2026-06", "16", "18400", "待结算"],
  ];
  const csv = rows.map((row) => row.join(",")).join("\\n");
  const blob = new Blob(["\\ufeff" + csv], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "首浴堂月结账单回执.xls";
  link.click();
  URL.revokeObjectURL(url);
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTraining(docId) {
  if (!trainingList || !trainingReader || !window.TRAINING_DOCS) return;
  const docs = window.TRAINING_DOCS;
  const selected = docs.find((doc) => doc.id === docId) || docs[0];

  trainingList.innerHTML = docs
    .map(
      (doc) => `
        <button class="training-item ${doc.id === selected.id ? "active" : ""}" data-training="${escapeHtml(doc.id)}">
          <span>${escapeHtml(doc.category)}</span>
          <strong>${escapeHtml(doc.title)}</strong>
          <small>${doc.count} 段完整正文</small>
        </button>
      `,
    )
    .join("");

  trainingReader.innerHTML = `
    <p class="eyebrow">${escapeHtml(selected.category)}</p>
    <h3>${escapeHtml(selected.title)}</h3>
    <div class="training-meta">
      <span>完整正文</span>
      <span>${selected.count} 段</span>
      <span>代理登录后可见</span>
    </div>
    ${selected.paragraphs.map((paragraph) => `<p class="training-paragraph">${escapeHtml(paragraph)}</p>`).join("")}
  `;

  trainingList.querySelectorAll(".training-item").forEach((item) => {
    item.addEventListener("click", () => renderTraining(item.dataset.training));
  });
}

renderTraining("nano");

shipmentOrders.forEach((order) => {
  order.addEventListener("click", () => {
    shipmentOrders.forEach((button) => button.classList.toggle("active", button === order));
    document.querySelector("#selectedOrderId").textContent = order.dataset.orderId;
    document.querySelector("#selectedAgent").textContent = order.dataset.agent;
    document.querySelector("#selectedPhone").textContent = order.dataset.phone;
    document.querySelector("#selectedAddress").textContent = order.dataset.address;
    document.querySelector("#selectedItems").textContent = order.dataset.items;
    document.querySelector("#selectedTotal").textContent = order.dataset.total;
    document.querySelector("#selectedLogistics").textContent = order.dataset.logistics;
    document.querySelector("#shipOrderInput").value = order.dataset.orderId;
  });
});

updateCart();
