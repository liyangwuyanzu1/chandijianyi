const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

http.createServer((request, response) => {
  let requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (requestPath === "/") requestPath = "/index.html";

  const targetPath = path.resolve(root, `.${requestPath}`);
  if (!targetPath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(targetPath, (error, file) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream",
    });
    response.end(file);
  });
}).listen(5173, "0.0.0.0", () => {
  console.log("Plant quarantine demo listening on port 5173");
});
