import { expect, test } from "@playwright/test";

test("stage 1 starts locally without old cloud dependencies", async ({ page }) => {
  const networkTargets: string[] = [];
  page.on("request", (request) => networkTargets.push(request.url()));

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RHIA 2.0" })).toBeVisible();
  await expect(page.getByText("Das lokale Datenfundament wird aufgebaut.")).toBeVisible();
  await expect(page.getByText("IndexedDB")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Kein stiller Rückfall");

  const foreignTargets = networkTargets.filter((target) => {
    const url = new URL(target);
    return url.hostname !== "127.0.0.1";
  });

  expect(foreignTargets).toEqual([]);
});

test("local note survives reload, trash and restore without reanimation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Bereit", { exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "Bereich" }).fill("RHIA Browser-Test");
  await page.getByRole("textbox", { name: "Titel" }).fill("Bordeaux 47");
  await page.getByRole("textbox", { name: "Notiz" }).fill("Nur künstliche E2E-Testdaten");
  await page.getByRole("button", { name: "Lokal speichern" }).click();
  await expect(page.getByText("Bordeaux 47")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Bordeaux 47")).toBeVisible();
  await page.getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByRole("button", { name: "Wiederherstellen" })).toBeVisible();

  await page.reload();
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
  await expect(page.getByText("Bordeaux 47")).not.toBeVisible();

  await page.reload();
  await expect(page.getByText("Bordeaux 47")).not.toBeVisible();
  await expect(page.getByText("0 aktiv", { exact: false })).toBeVisible();
});
