export default function adminCheck(req, res, next) {
  const adminEmails = ["sohabrar10@gmail.com"];

  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: "Admins only" });
  }

  next();
}
