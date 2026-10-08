import { writeFileSync } from "node:fs";
// Docker-only runtime file: server credentials never enter the image or Vite variables.
if (process.env.MULTICHAT_DOCKER === "true") {
  writeFileSync(
    ".dev.vars",
    ["TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET", "YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID", "FS25_BISECT_API_KEY", "FS25_BISECT_SERVER_UUID", "FS25_BISECT_PANEL_BASE_URL", "FS25_BISECT_PANEL_USERNAME", "FS25_BISECT_PANEL_PASSWORD", "FS25_XML_CODE"]
      .map((key) => key + "=" + JSON.stringify(process.env[key] || ""))
      .join("\n") + "\n",
    { mode: 0o600 },
  );
}
