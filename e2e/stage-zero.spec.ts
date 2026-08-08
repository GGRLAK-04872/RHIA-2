import { expect, test } from "@playwright/test";

test("stage 0 starts without old cloud dependencies", async ({ page }) => {
  const networkTargets: string[] = [];
  page.on("request", (request) => networkTargets.push(request.url()));

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RHIA 2.0" })).toBeVisible();
  await expect(page.getByText("Die lokale Neustartbasis ist bereit.")).toBeVisible();
  await expect(page.getByText("keine Cloud-Dienste", { exact: false })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Kein stiller Rückfall");

  const foreignTargets = networkTargets.filter((target) => {
    const url = new URL(target);
    return url.hostname !== "127.0.0.1";
  });

  expect(foreignTargets).toEqual([]);
});
