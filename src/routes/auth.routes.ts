import type { Request, Response } from "express";
import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import passport from "passport";
import { googleAuthCallback, googleSuccessRedirect, protectedRoute, signin, signup } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const projectRootPath = path.resolve(currentDirPath, "..", "..");
const viewsPath = path.join(projectRootPath, "views");

router.get("/", (_req: Request, res: Response) => {
  res.redirect("/signup");
});

router.get("/signup", (_req: Request, res: Response) => {
  res.sendFile(path.join(viewsPath, "signup.html"));
});

router.get("/signin", (_req: Request, res: Response) => {
  res.sendFile(path.join(viewsPath, "signin.html"));
});

router.get("/protected-page", (_req: Request, res: Response) => {
  res.sendFile(path.join(viewsPath, "protected.html"));
});

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/protected", protect, protectedRoute);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/signin?error=authentication_failed" }), googleAuthCallback);
router.get("/google/success", googleSuccessRedirect);

export default router;
