const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const file = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(file)) return;

  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile();

function digest(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

function signaturesMatch(left, right) {
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function hasAdminLoginConfig() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

function verifyAdminCredentials(email, password) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword || !email || !password) return false;

  const emailMatches = signaturesMatch(
    String(email).trim().toLowerCase(),
    expectedEmail.trim().toLowerCase()
  );
  const passwordMatches = signaturesMatch(String(password), expectedPassword);
  return emailMatches && passwordMatches;
}

function emailMatchesAdmin(email) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  if (!expectedEmail || !email) return false;
  return signaturesMatch(
    String(email).trim().toLowerCase(),
    expectedEmail.trim().toLowerCase()
  );
}

module.exports = {
  hasAdminLoginConfig,
  verifyAdminCredentials,
  emailMatchesAdmin,
};
