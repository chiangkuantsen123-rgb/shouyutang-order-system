import { body, createSession, handleError, hashPassword, json, method, requireRole, supabase } from "./_utils.js";

function randomPassword() {
  return `SYT${Math.floor(100000 + Math.random() * 900000)}`;
}

function accountCode() {
  return `STORE-${String(Math.floor(100 + Math.random() * 900)).padStart(3, "0")}`;
}

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    requireRole(req, "admin");

    if (req.method === "GET") {
      const rows = await supabase("merchant_accounts?select=*&order=created_at.desc", { method: "GET" });
      return json(res, 200, { accounts: rows });
    }

    const input = await body(req);
    const password = input.password || randomPassword();
    const code = input.accountCode || accountCode();
    const rows = await supabase("merchant_accounts", {
      method: "POST",
      body: JSON.stringify({
        account_code: code,
        store_name: input.storeName || "",
        contact_name: input.contactName || "",
        phone: input.phone || "",
        address: input.address || "",
        price_level: input.priceLevel || "A级代理价",
        password_hash: hashPassword(password),
        status: "active",
      }),
    });

    await supabase("notices", {
      method: "POST",
      body: JSON.stringify({
        type: "账号创建",
        title: `${input.storeName || code} 的代理账号已创建`,
        content: `账号：${code} / 初始密码：${password}`,
        target_view: "adminAccounts",
        status: "done",
      }),
    });

    json(res, 201, {
      account: rows[0],
      credentials: {
        accountCode: code,
        password,
      },
      merchantToken: createSession({ role: "merchant", merchantId: rows[0].id, accountCode: code }),
    });
  } catch (error) {
    handleError(res, error);
  }
}
