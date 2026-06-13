import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const shots = process.argv.includes("--shots");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
const errors = [];
const requests = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`page: ${e.message}`));
page.on("request", (r) => requests.push(r.url()));

const money = async () => Number((await bankroll()).replace(/[$,]/g, ""));

// The credits meter animates (count-up); settle before reading it.
const settle = () => page.waitForTimeout(800);
const bankroll = async () => {
  await settle();
  return page.getByTestId("bankroll").textContent();
};

async function expectEq(label, actual, expected) {
  if (actual !== expected) {
    console.log(`FAIL ${label}: expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${label}`);
  }
}

// Three.js code is reachable only after taking a seat (dice overlay/3D view).
const isLibChunk = (u) => /node_modules.*(three|rapier)/i.test(u);

// --- Lobby ---
await page.goto(BASE);
await page.getByText("Pull up to the rail.").waitFor();
console.log("ok   lobby renders");
const lobbyCredits = await page.getByTestId("lobby-credits").textContent();
await expectEq("lobby shows credits balance", /\$\d/.test(lobbyCredits), true);
await page.getByRole("radio", { name: "Dice" }).click();
await expectEq("dice filter narrows the grid", await page.locator("main img[alt]").count(), 2);
await page.getByRole("radio", { name: "All games" }).click();
await expectEq("all-games filter restores the grid", await page.locator("main img[alt]").count(), 5);
for (const t of ["Walnut & Brass", "Holo Table", "Stylized Toon", "Neon Noir"]) {
  await page.getByRole("radio", { name: t }).click();
  await page.waitForTimeout(200);
}
console.log("ok   theme switcher cycles on the lobby");
await expectEq("lobby loads no three.js", requests.filter(isLibChunk).length, 0);

// --- Standard table (auto-seats; 2D board sections) ---
await page.getByRole("link", { name: "Play Craps", exact: true }).click();
await page.waitForSelector("canvas", { timeout: 25000 });
console.log("ok   lobby card auto-seats at the craps table");
// 3D is the default; these sections exercise the 2D board.
await page.getByRole("radio", { name: "2D" }).click();
await page.getByRole("button", { name: /^PASS LINE, bet/ }).waitFor();
await expectEq("fresh bankroll", await bankroll(), "$1,000");

await page.getByRole("button", { name: /^PASS LINE, bet/ }).click();
await expectEq("bankroll after $5 pass bet", await bankroll(), "$995");

// Place 6 during come-out should show an OFF badge
await page.getByRole("button", { name: /^6, bet/ }).click();
await expectEq("bankroll after place 6", await bankroll(), "$990");
const offBadge = await page.getByRole("button", { name: /click to call on/ }).count();
await expectEq("place bet shows OFF badge on come-out", offBadge >= 1, true);

// Field bet then roll
await page.getByRole("button", { name: /^FIELD, bet/ }).click();
await expectEq("bankroll after field bet", await bankroll(), "$985");
await expectEq(
  "on-the-felt meter sums active bets",
  await page.getByTestId("on-felt").textContent(),
  "$15",
);

if (shots) await page.screenshot({ path: "/tmp/craps-standard-before-roll.png" });

await page.getByRole("button", { name: "ROLL" }).click();
await page.waitForSelector("[data-dice-overlay] canvas", { timeout: 8000 });
console.log("ok   3D dice overlay appears over the 2D board");
await page.waitForFunction(
  () => document.querySelector("p.text-lg")?.textContent !== "Dice are out!",
  { timeout: 9000 },
);
const banner = await page.locator("p.text-lg").textContent();
console.log(`     banner after roll: "${banner}"`);
await page.waitForFunction(() => !document.querySelector("[data-dice-overlay]"), {
  timeout: 5000,
});
console.log("ok   dice overlay fades out after settle");
const historyDice = await page.locator('[aria-label="Roll history"] svg').count();
await expectEq("roll history shows dice-pair pips", historyDice >= 2, true);
const latestOutlined = await page
  .locator('[aria-label="Roll history"] .ring-white')
  .count();
await expectEq("newest roll is outlined (leftmost)", latestOutlined >= 1, true);
const freqBars = await page.locator('[aria-label="Roll frequency"] div').count();
await expectEq("frequency strip rendered", freqBars >= 11, true);

// --- Spacebar rolls — regression: placing a bet by mouse must not steal Space ---
await page.waitForTimeout(2400); // let the previous overlay finish + fade
await page.getByRole("button", { name: /^FIELD, bet/ }).click();
await settle();
const feltAtSpace = await page.getByTestId("on-felt").textContent();
await page.keyboard.press("Space");
await page.waitForTimeout(250);
await expectEq(
  "space after clicking a zone rolls instead of pressing the bet",
  await page.getByTestId("on-felt").textContent(),
  feltAtSpace,
);
await page.waitForSelector("[data-dice-overlay] canvas", { timeout: 8000 });
console.log("ok   spacebar starts a roll");
await page.waitForFunction(
  () => document.querySelector("p.text-lg")?.textContent !== "Dice are out!",
  { timeout: 9000 },
);
await page.waitForFunction(() => !document.querySelector("[data-dice-overlay]"), {
  timeout: 6000,
});

// --- Drag & drop: move a bet (9 → 10, both untouched zones), then drag it off ---
const feltBefore = await page.getByTestId("on-felt").textContent();
await page.getByRole("button", { name: /^9, bet/ }).click();
await settle();
const boardBox = await page.locator("[data-board-container]").boundingBox();
const toClient = (bx, by) => [
  boardBox.x + (bx / 1600) * boardBox.width,
  boardBox.y + (by / 800) * boardBox.height,
];
// standard table (6 boxes, step 180): 9 box cx=1310, 10 box cx=1490;
// PLACE is the bottom half — chips anchored around y 256
const [sx, sy] = toClient(1310, 256);
const [tx, ty] = toClient(1490, 270);
await page.mouse.move(sx, sy);
await page.mouse.down();
await page.mouse.move(tx, ty, { steps: 10 });
await page.mouse.up();
await settle();
await expectEq(
  "drag moves the bet (felt total unchanged)",
  await page.getByTestId("on-felt").textContent(),
  await (async () => {
    const v = Number(feltBefore.replace(/[$,]/g, "")) + 5;
    return `$${v}`;
  })(),
);
const [ox, oy] = toClient(1490, 256);
await page.mouse.move(ox, oy);
await page.mouse.down();
await page.mouse.move(boardBox.x - 80, boardBox.y - 60, { steps: 10 });
await page.mouse.up();
await settle();
await expectEq(
  "drag off the board takes the bet down",
  await page.getByTestId("on-felt").textContent(),
  feltBefore,
);

if (shots) await page.screenshot({ path: "/tmp/craps-standard-after-roll.png" });

// Hop picker opens and places a bet
await page.getByRole("button", { name: /^HOP BETS, bet/ }).click();
await page.getByText("Hop the dice").waitFor();
await page.getByRole("button", { name: "3-3", exact: true }).click();
console.log("ok   hop picker placed 3-3");

// --- Crapless table (auto-seats from the URL) ---
await page.goto(`${BASE}/craps?variant=crapless`);
await page.getByRole("button", { name: /^PASS LINE, bet/ }).waitFor();

const dontPass = await page.getByRole("button", { name: /DON'T PASS/ }).count();
await expectEq("crapless hides don't pass", dontPass, 0);
const place12 = await page.getByRole("button", { name: /^12, bet/ }).count();
await expectEq("crapless offers place 12", place12, 1);

if (shots) await page.screenshot({ path: "/tmp/craps-crapless.png" });

// Reload persists bankroll (and auto-seats again)
const before = await bankroll();
await page.reload();
await page.getByRole("button", { name: /^PASS LINE, bet/ }).waitFor();
await expectEq("bankroll persists across reload", await bankroll(), before);

// Back to the standard table for the remaining sections (geometry assumptions).
await page.goto(`${BASE}/craps`);
await page.getByRole("button", { name: /^PASS LINE, bet/ }).waitFor();

// --- Help mode & odds chart (standard table) ---
await page.locator('svg [role="button"]').first().hover();
await page.waitForTimeout(250);
await expectEq(
  "hover tooltip is OFF by default",
  await page.getByText("House edge").count(),
  0,
);
await page.locator('button[title^="Hover hints"]').click();
await page.locator('svg [role="button"]').first().hover();
await page.waitForTimeout(250);
const tooltip = await page.getByText("House edge").count();
await expectEq("tooltip toggle enables hover hints", tooltip >= 1, true);
await page.locator('button[title^="Hover hints"]').click();

await page.getByRole("button", { name: "?" }).click();
await page.getByRole("button", { name: /^Learn about PASS LINE$/ }).click();
await page.getByRole("dialog").waitFor();
const cardText = await page.getByRole("dialog").textContent();
await expectEq("help card shows pass edge", cardText.includes("1.41"), true);
await page.getByText("Got it").click();
await page.getByRole("button", { name: "?" }).click();

await page.getByText("Odds chart").click();
await page.getByText("Every bet, ranked by house edge").waitFor();
const chartText = await page.getByRole("dialog").textContent();
await expectEq("odds chart lists free odds at 0%", chartText.includes("0%"), true);
await page.getByRole("dialog").getByText("Close").click();
console.log("ok   help mode + odds chart");

if (shots) await page.screenshot({ path: "/tmp/craps-final.png" });

// --- 3D mode: felt betting ---
await page.getByRole("radio", { name: "3D" }).click();
await page.waitForSelector("canvas");
await page.waitForTimeout(2500);

// Use HARD 10 (untouched anywhere else in this run) at board (401, 124).
const felt3dBefore = await page.getByTestId("on-felt").textContent();
const felt3dNum = Number(felt3dBefore.replace(/[$,]/g, ""));
const hardTen = await page.evaluate(() =>
  window.__boardToScreen ? window.__boardToScreen(401, 124) : null,
);
await expectEq("dev projection hook available", hardTen !== null, true);
await page.mouse.click(hardTen.x, hardTen.y);
await settle();
await expectEq(
  "clicking the felt places a bet in 3D",
  await page.getByTestId("on-felt").textContent(),
  `$${felt3dNum + 5}`,
);

// Left click on your chip presses it; right click takes the whole bet down
await page.mouse.click(hardTen.x, hardTen.y);
await settle();
await expectEq(
  "left-click on a chip presses the bet",
  await page.getByTestId("on-felt").textContent(),
  `$${felt3dNum + 10}`,
);
await page.mouse.click(hardTen.x, hardTen.y, { button: "right" });
await settle();
await expectEq(
  "right-click takes the bet down",
  await page.getByTestId("on-felt").textContent(),
  felt3dBefore,
);

await page.getByRole("button", { name: "ROLL" }).click();
await page.waitForFunction(
  () => document.querySelector("p.text-lg")?.textContent !== "Dice are out!",
  { timeout: 9000 },
);
console.log("ok   3D roll revealed via dice settle");
if (shots) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/tmp/craps-3d-full.png" });
}

// Themes render in 3D without errors
for (const t of ["Walnut & Brass", "Holo Table", "Stylized Toon", "Neon Noir"]) {
  await page.getByRole("radio", { name: t }).click();
  await page.waitForTimeout(700);
}
console.log("ok   all four themes render in 3D");

// Mid-session switch back to 2D preserves state
const bank3d = await money();
await page.getByRole("radio", { name: "2D" }).click();
await page.waitForTimeout(300);
await expectEq("canvas removed in 2D", await page.locator("canvas").count(), 0);
await expectEq("bankroll preserved across view switch", await money(), bank3d);

// --- Credits cheat + insufficient-funds clamp ---
const beforeCheat = await money();
await page.getByTestId("bankroll").click();
await settle();
await expectEq("CREDITS click adds $1,000", await money(), beforeCheat + 1000);

await page.getByRole("radio", { name: "$100" }).click();
for (let i = 0; i < 60; i++) {
  const m = Number(
    (await page.getByTestId("bankroll").textContent()).replace(/[$,]/g, ""),
  );
  if (m <= 0) break;
  await page.getByRole("button", { name: /^FIELD, bet/ }).click();
  await page.waitForTimeout(120);
}
await settle();
await expectEq("short stack clamps to remaining credits", await money(), 0);
await page.getByRole("button", { name: /^FIELD, bet/ }).click();
await page.getByText(/Out of credits/).waitFor({ timeout: 3000 });
console.log("ok   out-of-credits message shown");
await page.getByTestId("bankroll").click(); // leave the session funded

// --- Bets persist across leave/return ---
const feltSaved = await page.getByTestId("on-felt").textContent();
await page.goto(BASE);
await page.getByText("Pull up to the rail.").waitFor();
await page.goto(`${BASE}/craps`);
await page.getByRole("button", { name: /^PASS LINE, bet/ }).waitFor();
await expectEq(
  "bets persist across leave/return",
  await page.getByTestId("on-felt").textContent(),
  feltSaved,
);

if (errors.length) {
  console.log("BROWSER ERRORS:");
  for (const e of errors) console.log("  " + e);
  process.exitCode = 1;
} else {
  console.log("ok   no browser errors");
}

await browser.close();
