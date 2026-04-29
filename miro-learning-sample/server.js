const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const serviceNames = [
  { id: "auth", name: "Auth Service" },
  { id: "billing", name: "Billing API" },
  { id: "notify", name: "Notifications" },
  { id: "search", name: "Search Index" },
  { id: "cdn", name: "CDN Edge" },
];

const statuses = ["online", "degraded", "offline"];

function randomStatus() {
  const r = Math.random();
  if (r < 0.65) return "online";
  if (r < 0.85) return "degraded";
  return "offline";
}

let services = serviceNames.map((s) => ({
  ...s,
  status: randomStatus(),
  updatedAt: new Date().toISOString(),
}));

function tickMockData() {
  services = services.map((s) => ({
    ...s,
    status: Math.random() < 0.35 ? randomStatus() : s.status,
    updatedAt: new Date().toISOString(),
  }));
}

setInterval(tickMockData, 3500);

function summary(list) {
  const counts = { online: 0, degraded: 0, offline: 0 };
  for (const s of list) counts[s.status] = (counts[s.status] || 0) + 1;
  return { total: list.length, ...counts };
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  if (url === "/api/services" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ services, summary: summary(services) }));
    return;
  }

  if (url === "/" || url === "/index.html") {
    const filePath = path.join(__dirname, "public", "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Could not load page");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`API Status Dashboard running on http://localhost:${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/services`);
});
