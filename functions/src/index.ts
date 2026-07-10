import { onRequest } from "firebase-functions/v2/https";
import next from "next";

const dev = process.env.NODE_ENV !== "production";

const nextApp = next({
  dev,
  dir: "../../",
  conf: {
    distDir: "./.next",
  },
});

const handle = nextApp.getRequestHandler();

export const nextjs = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    await nextApp.prepare();
    return handle(req, res);
  }
);
