import { expect, test } from "@playwright/test";

test("stage 4 starts locally without old cloud dependencies", async ({ page }) => {
  const networkTargets: string[] = [];
  page.on("request", (request) => networkTargets.push(request.url()));

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RHIA 2.0" })).toBeVisible();
  await expect(page.getByText("Wissen und Arbeit bleiben unter deiner Kontrolle.")).toBeVisible();
  await expect(page.getByText("IndexedDB")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Kein stiller Rückfall");

  const foreignTargets = networkTargets.filter((target) => {
    const url = new URL(target);
    return url.hostname !== "127.0.0.1";
  });

  expect(foreignTargets).toEqual([]);
});

test("compact shell exposes all modules and preserves unfinished form input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Übersicht" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("tab", { name: "Gedächtnis" }).click();
  const property = page.getByRole("textbox", { name: "Eigenschaft" });
  await property.fill("ui-navigation-test");

  await page.getByRole("tab", { name: "Aufgaben" }).click();
  await expect(page.getByRole("button", { name: "Bestätigte Aufgabe speichern" })).toBeVisible();

  await page.getByRole("tab", { name: "Planung" }).click();
  await expect(page.getByRole("tab", { name: "Tagesplan" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Woche" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Briefings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Feedback" })).toBeVisible();

  await page.getByRole("tab", { name: "Daten & Sicherung" }).click();
  await expect(page.getByRole("heading", { name: "Notizen testen" })).toBeVisible();

  await page.getByRole("tab", { name: "Gedächtnis" }).click();
  await expect(property).toHaveValue("ui-navigation-test");
});

test("daily planning creates a local explained protection block", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Planung" }).click();
  const planningPanel = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Begründet planen" }),
  });
  await expect(planningPanel).toBeVisible();
  await planningPanel.getByRole("button", { name: "Tagesplan vorschlagen" }).click();
  await expect(
    planningPanel.getByRole("heading", { name: "Morgenbriefing und Tagesplan", level: 4 }),
  ).toBeVisible();
  await expect(planningPanel.getByText("Schutzzeit", { exact: true }).first()).toBeVisible();
  await expect(planningPanel.getByText(/Fristen, Wichtigkeit, Blockaden/)).toBeVisible();

  await planningPanel.getByLabel(/^Ergebnis für/).selectOption("partial");
  await planningPanel.getByLabel(/^Grund für/).selectOption("time-too-short");
  await planningPanel.getByLabel(/^Tatsächliche Minuten für/).fill("15");
  await planningPanel.getByRole("button", { name: "Rückmeldung speichern" }).click();
  await expect(planningPanel.getByText(/Teilweise erledigt · Zeit war zu kurz/)).toBeVisible();

  await planningPanel.getByRole("tab", { name: "Briefings" }).click();
  await planningPanel.getByRole("button", { name: "Rückblick erstellen" }).click();
  await expect(
    planningPanel.getByRole("heading", { name: "Abendrückblick", level: 4 }),
  ).toBeVisible();
  await expect(
    planningPanel
      .getByText("0 erledigt, 1 teilweise, 0 ausgelassen, 0 ohne Rückmeldung.", { exact: true })
      .first(),
  ).toBeVisible();
});

test("weekly planning protects RHIA and Shadow Grown locally", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Planung" }).click();
  const planningPanel = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Begründet planen" }),
  });
  await planningPanel.getByRole("tab", { name: "Woche" }).click();
  await planningPanel.getByRole("button", { name: "Woche vorschlagen" }).click();
  await expect(
    planningPanel.getByRole("heading", { name: "Wochenplanung", level: 4 }),
  ).toBeVisible();
  await expect(
    planningPanel.getByRole("heading", { name: "Schutzzeit RHIA" }).first(),
  ).toBeVisible();
  await expect(
    planningPanel.getByRole("heading", { name: "Schutzzeit Shadow Grown" }),
  ).toBeVisible();
  const protectionMetric = planningPanel.locator("dt", { hasText: "Schutzzeit" }).locator("..");
  await expect(protectionMetric.getByText("150 Min.", { exact: true })).toBeVisible();
});

test("local note survives edit, reload, trash and restore without reanimation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Daten & Sicherung" }).click();
  const notePanel = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Notizen testen" }),
  });
  await expect(notePanel.getByText("Bereit", { exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "Bereich" }).fill("RHIA Browser-Test");
  await page.getByRole("textbox", { name: "Titel", exact: true }).fill("Bordeaux 47");
  await page.getByRole("textbox", { name: "Notiz" }).fill("Nur künstliche E2E-Testdaten");
  await page.getByRole("button", { name: "Lokal speichern" }).click();
  await expect(page.getByText("Bordeaux 47")).toBeVisible();

  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.getByRole("textbox", { name: "Titel bearbeiten" }).fill("Bordeaux 47 geändert");
  await page.getByRole("button", { name: "Änderung speichern" }).click();
  await expect(page.getByText("Bordeaux 47 geändert")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Daten & Sicherung" }).click();
  await expect(page.getByText("Bordeaux 47 geändert")).toBeVisible();
  await page.getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByRole("button", { name: "Wiederherstellen" })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Daten & Sicherung" }).click();
  await expect(page.getByRole("button", { name: "Wiederherstellen" })).toBeVisible();
  await page.getByRole("button", { name: "Wiederherstellen" }).click();
  await expect(page.getByRole("button", { name: "Löschen" })).toBeVisible();

  await page.getByText("Sicherung und Löschung").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sicherung exportieren" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^rhia-backup-\d{4}-\d{2}-\d{2}\.json$/);

  await page.locator("details input:not([type=file])").fill("RHIA LOKALDATEN LÖSCHEN");
  await page.getByRole("button", { name: "Alle lokalen Daten löschen" }).click();
  await expect(page.getByText("Bordeaux 47 geändert")).not.toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Daten & Sicherung" }).click();
  await expect(page.getByText("Bordeaux 47 geändert")).not.toBeVisible();
  await expect(page.getByText("0 aktiv", { exact: false })).toBeVisible();
});

test("memory fact stays local through proposal, confirmation, reload and search", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Gedächtnis" }).click();
  const memoryPanel = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Fakten und Entscheidungen" }),
  });
  await expect(memoryPanel.getByText("Bereit", { exact: true })).toBeVisible();

  await memoryPanel.getByRole("textbox", { name: "Eigenschaft" }).fill("preferred-address");
  await memoryPanel
    .getByRole("textbox", { name: "Konfliktschlüssel" })
    .fill("sir.profile.preferred-address");
  await memoryPanel.getByRole("textbox", { name: "Wert" }).fill("Sir");
  await memoryPanel
    .getByRole("textbox", { name: "Verständliche Anzeige" })
    .fill("Die bevorzugte Anrede ist Sir.");
  await memoryPanel.getByRole("button", { name: "Als Vorschlag speichern" }).click();
  await memoryPanel.getByRole("button", { name: "Bestätigen" }).click();
  await expect(
    memoryPanel.getByRole("listitem").getByText("Bestätigt", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Gedächtnis" }).click();
  await expect(memoryPanel.getByText("Die bevorzugte Anrede ist Sir.")).toBeVisible();
  await memoryPanel.getByRole("searchbox", { name: "Gedächtnis durchsuchen" }).fill("anrede sir");
  await memoryPanel.getByRole("button", { name: "Filter anwenden" }).click();
  await expect(memoryPanel.getByText("1 Treffer · 0 offene Konflikte")).toBeVisible();
});

test("memory controls remain usable without horizontal overflow in portrait and landscape", async ({
  page,
}) => {
  const viewports = [
    { width: 412, height: 915 },
    { width: 915, height: 412 },
    { width: 800, height: 1280 },
    { width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("tab", { name: "Gedächtnis" }).click();
    await expect(page.getByRole("heading", { name: "Fakten und Entscheidungen" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Als Vorschlag speichern" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Filter anwenden" })).toBeVisible();
    await page.getByRole("tab", { name: "Planung" }).click();
    await expect(page.getByRole("button", { name: "Tagesplan vorschlagen" })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  }
});
