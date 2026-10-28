const { loginResult, send } = require("../../server/admin-login-http");

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  send(res, loginResult(req.body || {}));
};
