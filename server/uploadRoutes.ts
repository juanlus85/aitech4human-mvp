import { Router, Request, Response } from "express";
import multer from "multer";
import { getUserFromToken } from "./auth";
import { upsertProfile } from "./db";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

async function getAuthUser(req: Request) {
  const token = req.cookies?.["auth_token"];
  if (!token) return null;
  return getUserFromToken(token);
}

const router = Router();

// POST /api/upload/photo  — multipart field: "photo"
router.post(
  "/photo",
  upload.single("photo"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getAuthUser(req);
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
      if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

      const key = `profiles/${user.id}/photo-${Date.now()}.jpg`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      await upsertProfile(user.id, { photoUrl: url, photoKey: key });
      res.json({ url });
    } catch (err: any) {
      console.error("[upload/photo]", err);
      res.status(500).json({ error: err.message ?? "Upload failed" });
    }
  }
);

// POST /api/upload/cv  — multipart field: "cv"
router.post(
  "/cv",
  upload.single("cv"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getAuthUser(req);
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
      if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

      const key = `profiles/${user.id}/cv-${Date.now()}.pdf`;
      const { url } = await storagePut(key, req.file.buffer, "application/pdf");
      await upsertProfile(user.id, { cvPdfUrl: url, cvPdfKey: key });
      res.json({ url });
    } catch (err: any) {
      console.error("[upload/cv]", err);
      res.status(500).json({ error: err.message ?? "Upload failed" });
    }
  }
);

export default router;
