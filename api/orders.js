import { body, handleError, json, method, readSession, requireRole, supabase } from "./_utils.js";

function orderNo() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `SYT${stamp}${Math.floor(1000 + Math.random() * 9000)}`;
}

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST", "PATCH"])) return;
  try {
    const session = readSession(req);
    if (!session) return json(res, 401, { error: "Unauthorized" });

    if (req.method === "GET") {
      const query =
        session.role === "admin"
          ? "orders?select=*,merchant_accounts(store_name,phone,address)&order=created_at.desc"
          : `orders?merchant_id=eq.${session.merchantId}&select=*&order=created_at.desc`;
      const rows = await supabase(query, { method: "GET" });
      return json(res, 200, { orders: rows });
    }

    if (req.method === "POST") {
      if (session.role !== "merchant") return json(res, 403, { error: "Only merchants can submit orders" });
      const input = await body(req);
      const rows = await supabase("orders", {
        method: "POST",
        body: JSON.stringify({
          order_no: orderNo(),
          merchant_id: session.merchantId,
          items: input.items || [],
          total_amount: Number(input.totalAmount || 0),
          status: "preparing",
          logistics_company: "",
          logistics_no: "",
        }),
      });
      const order = rows[0];
      await supabase("notices", {
        method: "POST",
        body: JSON.stringify({
          type: "拿货申请",
          title: `${session.accountCode} 提交拿货单 ${order.order_no}`,
          content: `金额：¥${order.total_amount} / 等待总台备货并填写物流。`,
          target_view: "adminOrders",
          status: "pending",
        }),
      });
      return json(res, 201, { order });
    }

    requireRole(req, "admin");
    const input = await body(req);
    const rows = await supabase(`orders?id=eq.${encodeURIComponent(input.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status || "shipped",
        logistics_company: input.logisticsCompany || "",
        logistics_no: input.logisticsNo || "",
        operator: input.operator || "",
        shipped_at: new Date().toISOString(),
      }),
    });
    json(res, 200, { order: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
}
