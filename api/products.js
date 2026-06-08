import { body, handleError, json, method, readSession, requireRole, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST"])) return;
  try {
    const session = readSession(req);
    if (!session) return json(res, 401, { error: "Unauthorized" });

    if (req.method === "GET") {
      const rows = await supabase("products?status=eq.active&select=*&order=created_at.desc", { method: "GET" });
      return json(res, 200, { products: rows });
    }

    requireRole(req, "admin");
    const input = await body(req);
    const rows = await supabase("products", {
      method: "POST",
      body: JSON.stringify({
        name: input.name || "",
        specification: input.specification || "",
        box_spec: input.boxSpec || "",
        price_a: Number(input.priceA || 0),
        stock: Number(input.stock || 0),
        category: input.category || "",
        image_url: input.imageUrl || "./assets/poster-01.jpg",
        status: "active",
      }),
    });
    json(res, 201, { product: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
}
