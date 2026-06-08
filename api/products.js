import { body, handleError, json, method, readSession, requireRole, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;
  try {
    const session = readSession(req);
    if (!session) return json(res, 401, { error: "Unauthorized" });

    if (req.method === "GET") {
      const query =
        session.role === "admin"
          ? "products?status=neq.deleted&select=*&order=created_at.desc"
          : "products?status=eq.active&select=*&order=created_at.desc";
      const rows = await supabase(query, { method: "GET" });
      return json(res, 200, { products: rows });
    }

    requireRole(req, "admin");
    const input = await body(req);

    if (req.method === "PATCH") {
      const rows = await supabase(`products?id=eq.${encodeURIComponent(input.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          specification: input.specification,
          box_spec: input.boxSpec,
          price_a: input.priceA === undefined ? undefined : Number(input.priceA || 0),
          stock: input.stock === undefined ? undefined : Number(input.stock || 0),
          category: input.category,
          image_url: input.imageUrl,
          status: input.status,
        }),
      });
      return json(res, 200, { product: rows[0] });
    }

    if (req.method === "DELETE") {
      await supabase(`products?id=eq.${encodeURIComponent(input.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted" }),
      });
      return json(res, 200, { ok: true });
    }

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
