const express = require("express");
const path = require("path");
const app = express();

// Serve all static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// Always return index.html for any page that exists in your folder
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Render requires PORT = process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
