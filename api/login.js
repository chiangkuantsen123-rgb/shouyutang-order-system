import { body, createSession, getEnv, handleError, hashPassword, json, method, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  try {
    const input = await body(req);
    const account = String(input.account || "").trim();
    const password = String(input.password || "");
    const env = getEnv();

    if (account === env.adminLogin && password === env.adminPassword) {
      return json(res, 200, {
        token: createSession({ role: "admin", name: "总台员工" }),
        user: { role: "admin", name: "总台员工" },
      });
    }

    const rows = await supabase(
      `merchant_accounts?account_code=eq.${encodeURIComponent(account)}&status=eq.active&select=*`,
      { method: "GET" },
    );
    const merchant = rows?.[0];
    if (!merchant || merchant.password_hash !== hashPassword(password)) {
      return json(res, 401, { error: "账号或密码不正确" });
    }

    json(res, 200, {
      token: createSession({ role: "merchant", merchantId: merchant.id, accountCode: merchant.account_code }),
      user: {
        id: merchant.id,
        role: "merchant",
        accountCode: merchant.account_code,
        storeName: merchant.store_name,
        priceLevel: merchant.price_level,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
}
