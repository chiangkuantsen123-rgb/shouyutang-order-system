import { handleError, json, method, requireRole, supabase } from "./_utils.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  try {
    requireRole(req, "admin");
    const notices = await supabase("notices?select=*&order=created_at.desc&limit=50", { method: "GET" });
    json(res, 200, { notices });
  } catch (error) {
    handleError(res, error);
  }
}
