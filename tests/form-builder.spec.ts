import { expect, test, type Page } from '@playwright/test'

const stringOfLength = (length: number): string => 'a'.repeat(length)

const addField = async (page: Page, fieldName: string) => {
  await page.getByRole('button', { name: 'Add field' }).click()
  await expect(page.getByLabel('Field Name')).toBeVisible()
  await page.getByLabel('Field Name').fill(fieldName)
}

test.describe('Dynamic Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dynamic Form Builder' })).toBeVisible()
  })

  test.describe('A) Add String Field and Save Successfully', () => {
    test('creates a string field and saves successfully', async ({ page }) => {
      await addField(page, 'Customer Name')
      await page.getByLabel('Value').fill('Jane Doe')

      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByRole('status')).toHaveText(/Schema created successfully via POST\./)
      await expect(page.getByText('PUT (update)')).toBeVisible()
    })
  })

  test.describe('B) Block Save When String > 100 Characters', () => {
    test('shows validation and blocks successful save', async ({ page }) => {
      await addField(page, 'Long String Field')
      await page.getByLabel('Value').fill(stringOfLength(101))

      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByText('String value must be 100 characters or fewer.')).toBeVisible()
      await expect(page.getByRole('alert')).toHaveText(
        /Validation failed\. Fix field errors before saving\./,
      )
      await expect(page.getByText('Schema created successfully via POST.')).toHaveCount(0)
      await expect(page.getByText('POST (create)')).toBeVisible()
    })
  })

  test.describe('C) Block Save When Number > 1000', () => {
    test('shows number validation and blocks successful save', async ({ page }) => {
      await addField(page, 'Order Count')
      await page.getByRole('button', { name: 'Number' }).click()
      await page.getByLabel('Value').fill('1001')

      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByText('Number value must be 1000 or less.')).toBeVisible()
      await expect(page.getByRole('alert')).toHaveText(
        /Validation failed\. Fix field errors before saving\./,
      )
      await expect(page.getByText('Schema created successfully via POST.')).toHaveCount(0)
      await expect(page.getByText('POST (create)')).toBeVisible()
    })
  })

  test.describe('D) Boolean Field Works', () => {
    test('stores true/false and saves boolean field', async ({ page }) => {
      await addField(page, 'Active')
      await page.getByRole('button', { name: 'Boolean' }).click()
      await page.getByRole('button', { name: 'Yes' }).click()

      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByRole('status')).toHaveText(/Schema created successfully via POST\./)
      await expect(page.getByLabel('JSON preview')).toContainText('"value": true')
      await expect(page.getByLabel('JSON preview')).not.toContainText('"Yes"')
    })
  })

  test.describe('E) POST then PUT Behavior', () => {
    test('uses create then update semantics across two saves', async ({ page }) => {
      await addField(page, 'Description')
      await page.getByLabel('Value').fill('First version')
      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByRole('status')).toHaveText(/Schema created successfully via POST\./)
      await expect(page.getByText('PUT (update)')).toBeVisible()
      await page.getByRole('button', { name: 'Close' }).click()

      await page.getByLabel('Value').fill('Second version')
      await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByRole('status')).toHaveText(/Schema updated successfully via PUT\./)
      await expect(page.getByLabel('JSON preview')).toContainText('Second version')
    })
  })
})
