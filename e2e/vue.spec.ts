import { test, expect } from '@playwright/test'

test('completes theme gate then opens portal', async ({ page }) => {
  await page.goto('/admin/spec-lab')
  await expect(page.getByText('Spec Lab Decision Console')).toBeVisible()
  await page.getByRole('button', { name: 'Approve Theme & Continue' }).click()
  await expect(page.getByText('Good Morning, Judha')).toBeVisible()
})
