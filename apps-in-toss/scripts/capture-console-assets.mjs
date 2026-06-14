import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = "http://127.0.0.1:5173/";
const captureUrl = `${origin}?giftDate=2026-06-12`;
const outDir = fileURLToPath(new URL("../console-assets/", import.meta.url));
const profileDir = "/tmp/project-tax-ait-chrome-capture";

let nextId = 1;

async function main() {
  await rm(profileDir, { force: true, recursive: true });
  await mkdir(profileDir, { recursive: true });

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-debugging-port=9229",
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  try {
    await waitForDebugger();
    const tab = await createTab();
    const socket = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });

    const send = createSender(socket);
    await send("Page.enable");
    await send("Runtime.enable");

    await capture(send, {
      fileName: "qa-360.png",
      height: 800,
      width: 360,
    });
    await capture(send, {
      fileName: "qa-390.png",
      height: 844,
      width: 390,
    });
    await capture(send, {
      fileName: "qa-430.png",
      height: 932,
      width: 430,
    });
    await capture(send, {
      fileName: "screenshot-vertical-1.png",
      height: 1048,
      width: 636,
    });
    await capture(send, {
      fileName: "screenshot-vertical-2.png",
      height: 1048,
      scrollY: 650,
      width: 636,
    });
    await capture(send, {
      fileName: "screenshot-vertical-3.png",
      height: 1048,
      scrollY: 1440,
      showPreview: true,
      width: 636,
    });
    await capture(send, {
      fileName: "screenshot-horizontal-1.png",
      height: 741,
      width: 1504,
    });

    socket.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9229/json/version");
      if (response.ok) return;
    } catch {
      await delay(100);
    }
  }

  throw new Error("Chrome debugger did not start");
}

async function createTab() {
  const response = await fetch(`http://127.0.0.1:9229/json/new?${encodeURIComponent(origin)}`, {
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(`Failed to create tab: ${response.status}`);
  }
  return response.json();
}

function createSender(socket) {
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) {
      entry.reject(new Error(message.error.message));
    } else {
      entry.resolve(message.result);
    }
  });

  return (method, params = {}) => {
    const id = nextId;
    nextId += 1;

    socket.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve, reject) => {
      pending.set(id, { reject, resolve });
    });
  };
}

async function capture(send, { fileName, height, scrollY = 0, showPreview = false, width }) {
  await send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height,
    mobile: false,
    width,
  });
  await send("Page.navigate", { url: captureUrl });
  await delay(900);
  if (showPreview) {
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent?.trim().includes('미리보기'));
          button?.click();
        })();
      `,
    });
    await delay(300);
  }
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        window.scrollTo(0, ${scrollY});
      })();
    `,
  });
  await delay(500);

  const result = await send("Page.captureScreenshot", {
    captureBeyondViewport: false,
    format: "png",
    fromSurface: true,
  });

  await writeFile(join(outDir, fileName), Buffer.from(result.data, "base64"));
  console.log(`${fileName}: ${width}x${height}`);
}

await main();
