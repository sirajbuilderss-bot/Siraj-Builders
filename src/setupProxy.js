const { emailResult, loginResult, send } = require("../server/admin-login-http");

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      resolve(req.body);
      return;
    }
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function mount(app, path, handler) {
  app.post(path, async (req, res) => {
    try {
      send(res, handler(await readJson(req)));
    } catch {
      res.status(400).json({ error: "Invalid request." });
    }
  });
}

module.exports = function setupAdminLogin(app) {
  mount(app, "/api/admin/login", loginResult);
  mount(app, "/api/admin/email", emailResult);
};
