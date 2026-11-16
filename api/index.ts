import { app } from "../backend/mvp/src/app.js";
import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url?.startsWith("/api/")) req.url = req.url.slice(4);
  return app(req, res);
}
