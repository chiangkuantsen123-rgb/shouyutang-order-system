import { body, handleError, json, method, requireRole, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    if (req.method === "GET") {
      requireRole(req, "admin");
      const rows = await supabase("applications?select=*&order=created_at.desc", { method: "GET" });
      return json(res, 200, { applications: rows });
    }

    const input = await body(req);
    const application = await supabase("applications", {
      method: "POST",
      body: JSON.stringify({
        type: input.type || "代理申请",
        reason: input.reason || "",
        store_info: input.storeInfo || "",
        contact_name: input.contactName || "",
        phone: input.phone || "",
        status: "pending",
      }),
    });

    await supabase("notices", {
      method: "POST",
      body: JSON.stringify({
        type: input.type || "代理申请",
        title: `${input.storeInfo || "新门店"}提交${input.type || "代理申请"}`,
        content: `联系人：${input.contactName || "-"} / 电话：${input.phone || "-"} / 原因：${input.reason || "-"}`,
        target_view: "adminAccounts",
        status: "pending",
      }),
    });

    json(res, 201, { application: application[0] });
  } catch (error) {
    handleError(res, error);
  }
}
