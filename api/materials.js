import { body, handleError, json, method, readSession, requireRole, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET", "POST", "DELETE"])) return;
  try {
    const session = readSession(req);
    if (!session) return json(res, 401, { error: "Unauthorized" });

    if (req.method === "GET") {
      const rows = await supabase("material_groups?status=eq.active&select=*&order=updated_at.desc", { method: "GET" });
      return json(res, 200, { groups: rows });
    }

    requireRole(req, "admin");
    const input = await body(req);

    if (req.method === "DELETE") {
      await supabase(`material_groups?id=eq.${encodeURIComponent(input.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted", updated_at: new Date().toISOString() }),
      });
      return json(res, 200, { ok: true });
    }

    const rows = await supabase("material_groups?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: input.id,
        category: input.category || "宣传物料",
        title: input.title || "海报组",
        description: input.description || "",
        images: input.images || [],
        status: "active",
        updated_at: new Date().toISOString(),
      }),
    });

    json(res, 200, { group: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
}
