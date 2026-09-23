import { randomBytes, createHmac } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
const destination = new URL("../.env.docker", import.meta.url);
if (existsSync(destination)) {
  console.log(".env.docker já existe; preservado.");
  process.exit(0);
}
const secret = randomBytes(32).toString("hex");
function jwt(role) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const value =
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({
      role,
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 315360000,
    });
  return (
    value + "." + createHmac("sha256", secret).update(value).digest("base64url")
  );
}
const values = {
  POSTGRES_PASSWORD: randomBytes(24).toString("hex"),
  JWT_SECRET: secret,
  ANON_KEY: jwt("anon"),
  SERVICE_ROLE_KEY: jwt("service_role"),
  TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
  INTERNAL_WAKE_SECRET: randomBytes(32).toString("hex"),
  MOCK_PLATFORM_SECRET: randomBytes(32).toString("hex"),
  SECRET_KEY_BASE: randomBytes(64).toString("hex"),
  REALTIME_DB_ENC_KEY: randomBytes(8).toString("hex"),
};
writeFileSync(
  destination,
  Object.entries(values)
    .map(([key, value]) => key + "=" + value)
    .join("\n") + "\n",
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Criado .env.docker com segredos exclusivos para este ambiente local.",
);
