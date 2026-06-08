import { body, handleError, json, method, readSession, requireRole, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;
  try {
    if (req.method === "GET") {
      const rows = await supabase("banners?status=eq.active&select=*&order=sort_order.asc", { method: "GET" });
      return json(res, 200, { banners: rows });
    }

    const session = readSession(req);
    if (!session) return json(res, 401, { error: "Unauthorized" });
    requireRole(req, "admin");
    const input = await body(req);

    if (req.method === "DELETE") {
      await supabase(`banners?id=eq.${encodeURIComponent(input.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted" }),
      });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH") {
      const rows = await supabase(`banners?id=eq.${encodeURIComponent(input.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: input.title,
          subtitle: input.subtitle,
          image_url: input.imageUrl,
          target_view: input.targetView,
          location: input.location,
          sort_order: Number(input.sortOrder || 1),
          status: input.status || "active",
        }),
      });
      return json(res, 200, { banner: rows[0] });
    }

    const rows = await supabase("banners", {
      method: "POST",
      body: JSON.stringify({
        title: input.title || "首浴堂 Banner",
        subtitle: input.subtitle || "",
        image_url: input.imageUrl || "./assets/poster-04.jpg",
        target_view: input.targetView || "materials",
        location: input.location || "agent",
        sort_order: Number(input.sortOrder || 1),
        status: "active",
      }),
    });
    json(res, 201, { banner: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
}
