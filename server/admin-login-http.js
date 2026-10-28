const {
  emailMatchesAdmin,
  hasAdminLoginConfig,
  verifyAdminCredentials,
} = require("./admin-auth");

function loginResult(body) {
  if (!hasAdminLoginConfig()) {
    return {
      status: 503,
      body: {
        error: "Add ADMIN_EMAIL and ADMIN_PASSWORD to .env, then restart the dev server.",
      },
    };
  }
  if (!verifyAdminCredentials(body?.email, body?.password)) {
    return { status: 401, body: { error: "Incorrect email or password." } };
  }
  return { status: 200, body: { ok: true } };
}

function emailResult(body) {
  if (!hasAdminLoginConfig()) {
    return { status: 503, body: { error: "Admin sign-in is not configured." } };
  }
  if (!emailMatchesAdmin(body?.email)) {
    return { status: 401, body: { ok: false } };
  }
  return { status: 200, body: { ok: true } };
}

function send(res, result) {
  res.status(result.status).json(result.body);
}

module.exports = { loginResult, emailResult, send };
