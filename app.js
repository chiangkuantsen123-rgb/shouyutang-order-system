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
const materialStorageKey = "syt-material-groups";

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
    if (heroPoster.dataset.liveBanner === "1") return;
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
  button.addEventListener("click", () => {
    const liveControlledIds = new Set(["saveShipmentButton", "saveProductButton", "createAccountButton", "submitApplication"]);
    if (liveControlledIds.has(button.id) || button.closest(".banner-form")) return;
    showToast(button.dataset.feedback);
  });
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

function readGroupFromCard(card) {
  return {
    id: card.dataset.group || card.dataset.agentGroup || `group-${Date.now()}`,
    title: card.querySelector("strong")?.textContent?.trim() || "海报组",
    description: card.querySelector("p")?.textContent?.trim() || "",
    category: card.closest(".material-section")?.querySelector("h3")?.textContent?.trim() || "宣传物料",
    images: [...card.querySelectorAll(".group-cover img")].map((image, index) => ({
      title: image.alt || `海报 ${index + 1}`,
      url: image.getAttribute("src") || "./assets/poster-06.jpg",
    })),
  };
}

function saveStoredGroup(group) {
  const stored = JSON.parse(localStorage.getItem(materialStorageKey) || "{}");
  stored[group.id] = group;
  localStorage.setItem(materialStorageKey, JSON.stringify(stored));
}

function materialSession() {
  return localStorage.getItem("syt-live-session") || "";
}

async function saveRemoteGroup(group) {
  const session = materialSession();
  if (!session) return false;
  const response = await fetch("/api/materials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify(group),
  });
  if (!response.ok) throw new Error("物料后台保存失败");
  return true;
}

async function deleteRemoteGroup(id) {
  const session = materialSession();
  if (!session) return false;
  const response = await fetch("/api/materials", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error("物料后台删除失败");
  return true;
}

async function loadRemoteGroups() {
  const session = materialSession();
  if (!session) return;
  try {
    const response = await fetch("/api/materials", {
      headers: { Authorization: `Bearer ${session}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    (data.groups || []).forEach((remoteGroup) => {
      const group = {
        id: remoteGroup.id,
        category: remoteGroup.category,
        title: remoteGroup.title,
        description: remoteGroup.description,
        images: remoteGroup.images || [],
      };
      saveStoredGroup(group);
      document.querySelectorAll(`[data-group="${group.id}"], [data-agent-group="${group.id}"]`).forEach((card) => {
        renderCardFromGroup(card, group);
      });
    });
  } catch (error) {
    console.warn(error);
  }
}

function loadStoredGroup(card) {
  const id = card.dataset.group || card.dataset.agentGroup;
  const stored = JSON.parse(localStorage.getItem(materialStorageKey) || "{}");
  return stored[id] || readGroupFromCard(card);
}

function renderCardFromGroup(card, group) {
  const cover = card.querySelector(".group-cover");
  const title = card.querySelector("strong");
  const description = card.querySelector("p");
  const count = card.querySelector("span");

  if (cover) {
    cover.innerHTML = group.images
      .slice(0, 4)
      .map((image) => `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.title)}" />`)
      .join("");
  }
  if (title) title.textContent = group.title;
  if (description) description.textContent = group.description;
  if (count) count.textContent = `${group.images.length} 张海报`;
}

function ensureGroupEditForm() {
  if (!groupEditor || document.querySelector("#materialGroupForm")) return;
  const form = document.createElement("div");
  form.className = "material-group-form";
  form.id = "materialGroupForm";
  form.innerHTML = `
    <div class="form-grid">
      <label>整组名称<input id="editGroupTitle" /></label>
      <label>所在分区<input id="editGroupCategory" /></label>
      <label class="wide">整组说明<input id="editGroupDescription" /></label>
    </div>
    <div class="material-editor-head">
      <h4>组内图片</h4>
      <button class="secondary-button" id="addGroupPoster" type="button">新增图片</button>
    </div>
    <div class="poster-edit-list" id="posterEditList"></div>
    <button class="primary-button" id="saveGroupEdit" type="button">保存整组编辑</button>
  `;
  groupEditor.insertBefore(form, groupEditor.querySelector(".crop-panel"));
}

function renderPosterEditList(group) {
  const list = document.querySelector("#posterEditList");
  if (!list) return;
  list.innerHTML = group.images
    .map(
      (image, index) => `
        <article class="poster-edit-row" data-index="${index}">
          <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.title)}" />
          <label>图片标题<input class="poster-title-input" value="${escapeHtml(image.title)}" /></label>
          <label>图片地址<input class="poster-url-input" value="${escapeHtml(image.url)}" /></label>
          <button class="text-button crop-row-button" type="button">裁剪</button>
          <button class="text-button danger delete-row-button" type="button">删除</button>
        </article>
      `,
    )
    .join("");
}

function collectEditorGroup() {
  const card = document.querySelector(".poster-group-card.editing");
  if (!card) return null;
  return {
    id: card.dataset.group || card.dataset.agentGroup,
    title: document.querySelector("#editGroupTitle")?.value.trim() || "海报组",
    category: document.querySelector("#editGroupCategory")?.value.trim() || "宣传物料",
    description: document.querySelector("#editGroupDescription")?.value.trim() || "",
    images: [...document.querySelectorAll(".poster-edit-row")].map((row, index) => ({
      title: row.querySelector(".poster-title-input")?.value.trim() || `海报 ${index + 1}`,
      url: row.querySelector(".poster-url-input")?.value.trim() || "./assets/poster-06.jpg",
    })),
  };
}

function openGroupEditor(card) {
  const group = loadStoredGroup(card);
  const editorTitle = document.querySelector("#groupEditorTitle");
  const previewImage = document.querySelector("#cropPreview");

  ensureGroupEditForm();
  document.querySelectorAll(".poster-group-card.editing").forEach((item) => item.classList.remove("editing"));
  card.classList.add("editing");

  if (editorTitle) editorTitle.textContent = `正在编辑：${group.title}`;
  if (previewImage && group.images[0]) previewImage.src = group.images[0].url;
  const titleInput = document.querySelector("#editGroupTitle");
  const categoryInput = document.querySelector("#editGroupCategory");
  const descriptionInput = document.querySelector("#editGroupDescription");
  if (titleInput) titleInput.value = group.title;
  if (categoryInput) categoryInput.value = group.category;
  if (descriptionInput) descriptionInput.value = group.description;
  renderPosterEditList(group);

  groupEditor?.classList.add("open");
  groupEditor?.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("已打开整组编辑");
}

document.querySelectorAll(".poster-group-card").forEach((card) => {
  renderCardFromGroup(card, loadStoredGroup(card));

  card.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button?.textContent.includes("删除整组")) {
      const stored = JSON.parse(localStorage.getItem(materialStorageKey) || "{}");
      const groupId = card.dataset.group || card.dataset.agentGroup;
      delete stored[groupId];
      localStorage.setItem(materialStorageKey, JSON.stringify(stored));
      card.remove();
      showToast("已删除整组");
      deleteRemoteGroup(groupId).catch(() => showToast("本地已删除，联网后台稍后再同步"));
      return;
    }
    if (button?.textContent.includes("进入编辑")) {
      openGroupEditor(card);
      return;
    }
    if (button) return;

    if (card.dataset.group) {
      openGroupEditor(card);
      return;
    }

    const title = card.querySelector("strong")?.textContent || "海报组";
    const agentTitle = document.querySelector("#agentGroupTitle");
    if (agentGroupView && agentTitle) {
      agentTitle.textContent = title;
      agentGroupView.classList.add("open");
      agentGroupView.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

groupEditor?.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".delete-row-button");
  const cropButton = event.target.closest(".crop-row-button");
  const addButton = event.target.closest("#addGroupPoster");
  const saveButton = event.target.closest("#saveGroupEdit");

  if (deleteButton) {
    deleteButton.closest(".poster-edit-row")?.remove();
    showToast("已删除这张海报");
  }

  if (cropButton) {
    const image = cropButton.closest(".poster-edit-row")?.querySelector("img");
    const previewImage = document.querySelector("#cropPreview");
    if (image && previewImage) previewImage.src = image.src;
    document.querySelector(".crop-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("已切换到这张海报裁剪");
  }

  if (addButton) {
    const group = collectEditorGroup();
    if (!group) return;
    group.images.push({ title: "新海报", url: "./assets/poster-06.jpg" });
    renderPosterEditList(group);
    showToast("已新增图片位");
  }

  if (saveButton) {
    const group = collectEditorGroup();
    const card = document.querySelector(".poster-group-card.editing");
    if (!group || !card) return;
    saveStoredGroup(group);
    renderCardFromGroup(card, group);
    document.querySelector("#groupEditorTitle").textContent = `正在编辑：${group.title}`;
    try {
      const savedOnline = await saveRemoteGroup(group);
      showToast(savedOnline ? "整组编辑已保存到后台" : "整组编辑已保存");
    } catch (error) {
      showToast("已暂存在当前浏览器，后台同步失败");
    }
  }
});

loadRemoteGroups();

groupEditor?.addEventListener("input", (event) => {
  const urlInput = event.target.closest(".poster-url-input");
  if (!urlInput) return;
  const row = urlInput.closest(".poster-edit-row");
  const image = row?.querySelector("img");
  if (image) image.src = urlInput.value.trim() || "./assets/poster-06.jpg";
});

document.querySelectorAll(".group-download").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "整组 PDF 已准备";
    showToast("整组 PDF 已准备，可提供给门店下载");
  });
});

document.querySelector("#createAccountButton")?.addEventListener("click", () => {
  if (localStorage.getItem("syt-live-session")) return;
  const credentialResult = document.querySelector("#credentialResult");
  credentialResult?.classList.add("open");
  credentialResult?.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("账号已创建：STORE-002 / 初始密码 SYT888");
});

function cropDimensions(value) {
  if (!cropPreview) return null;
  const parentRect = cropPreview.getBoundingClientRect();
  if (!parentRect.width || !parentRect.height) return null;
  const ratio = value === "banner" ? 16 / 9 : value === "square" ? 1 : 3 / 4;
  const maxWidth = parentRect.width * 0.84;
  const maxHeight = parentRect.height * 0.84;
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    parentRect,
    width,
    height,
    left: (parentRect.width - width) / 2,
    top: (parentRect.height - height) / 2,
  };
}

function placeCropBox(value = document.querySelector("#cropRatio")?.value || "poster", mode = document.querySelector("#cropMode")?.value || "center") {
  if (!cropBox || !cropPreview) return;
  const dimensions = cropDimensions(value);
  if (!dimensions) return;
  let top = dimensions.top;
  if (mode.includes("靠上")) top = dimensions.parentRect.height * 0.06;
  if (mode.includes("靠下")) top = dimensions.parentRect.height - dimensions.height - dimensions.parentRect.height * 0.06;

  cropBox.style.left = `${dimensions.left}px`;
  cropBox.style.top = `${Math.max(0, top)}px`;
  cropBox.style.right = "auto";
  cropBox.style.bottom = "auto";
  cropBox.style.width = `${dimensions.width}px`;
  cropBox.style.height = `${dimensions.height}px`;
  cropBox.style.aspectRatio = value === "banner" ? "16 / 9" : value === "square" ? "1 / 1" : "3 / 4";
}

function setCropRatio(value) {
  if (!cropBox || !cropPreview) return;
  cropPreview.classList.toggle("ratio-banner", value === "banner");
  cropPreview.classList.toggle("ratio-square", value === "square");
  placeCropBox(value);
}

document.querySelector("#cropRatio")?.addEventListener("change", (event) => {
  const value = event.target.value;
  setCropRatio(value);
  showToast("裁剪比例已切换");
});

document.querySelector("#cropMode")?.addEventListener("change", (event) => {
  placeCropBox(document.querySelector("#cropRatio")?.value || "poster", event.target.value);
  showToast("显示区域已切换");
});

document.querySelector("#saveCrop")?.addEventListener("click", () => {
  showToast("裁剪已保存");
});

if (cropBox && cropPreview) {
  placeCropBox();
  window.addEventListener("resize", () => placeCropBox());
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
