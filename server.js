const express = require("express");
const path = require("path");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve EVERYTHING inside /public
app.use(express.static(path.join(__dirname, "public")));

// Catch-all → always return /public/index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Render requires process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
