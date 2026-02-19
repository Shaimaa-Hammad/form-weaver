import { expect, test, type Page } from '@playwright/test'

const stringOfLength = (length: number): string => 'a'.repeat(length)

const addField = async (page: Page, fieldName: string) => {
  await page.getByRole('button', { name: 'Add field' }).click()
  await expect(page.getByLabel('Field Name')).toBeVisible()
  await page.getByLabel('Field Name').fill(fieldName)
}

interface PreviewPayload {
  schemaId?: string
  fields: Array<{
    id: string
    fieldName: string
    type: 'string' | 'number' | 'boolean'
    value: string | number | boolean
  }>
}

const readPreviewPayload = async (page: Page): Promise<PreviewPayload> => {
  const rawJson = await page.getByLabel('JSON preview').innerText()
  return JSON.parse(rawJson) as PreviewPayload
}

test.describe('Dynamic Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dynamic Form Builder' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add field' })).toBeVisible({
      timeout: 15000,
    })
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

  test.describe('F) Delete Field', () => {
    test('removes a field from list and JSON preview', async ({ page }) => {
      await addField(page, 'Temporary Field')
      await page.getByLabel('Value').fill('To be deleted')

      await expect(page.getByLabel('JSON preview')).toContainText('Temporary Field')
      await page.getByRole('button', { name: 'Delete Temporary Field' }).click()

      await expect(page.getByRole('button', { name: 'Delete Temporary Field' })).toHaveCount(0)
      await expect(page.getByLabel('JSON preview')).not.toContainText('Temporary Field')
      await expect(page.getByText('No fields yet')).toBeVisible()
    })
  })

  test.describe('G) Type Switch Cleanup', () => {
    test('keeps only relevant typed value after type changes', async ({ page }) => {
      await addField(page, 'Switch Field')
      await page.getByLabel('Value').fill('initial text')

      let payload = await readPreviewPayload(page)
      expect(payload.fields).toHaveLength(1)
      expect(payload.fields[0]?.type).toBe('string')
      expect(payload.fields[0]?.value).toBe('initial text')

      await page.getByRole('button', { name: 'Number' }).click()
      payload = await readPreviewPayload(page)
      expect(payload.fields[0]?.type).toBe('number')
      expect(typeof payload.fields[0]?.value).toBe('number')
      expect(payload.fields[0]?.value).toBe(0)
      expect(JSON.stringify(payload)).not.toContain('initial text')

      await page.getByLabel('Value').fill('42')
      payload = await readPreviewPayload(page)
      expect(payload.fields[0]?.type).toBe('number')
      expect(payload.fields[0]?.value).toBe(42)

      await page.getByRole('button', { name: 'Boolean' }).click()
      payload = await readPreviewPayload(page)
      expect(payload.fields[0]?.type).toBe('boolean')
      expect(typeof payload.fields[0]?.value).toBe('boolean')
      expect(payload.fields[0]?.value).toBe(false)
      expect(JSON.stringify(payload)).not.toContain('"value":42')

      await page.getByRole('button', { name: 'Yes' }).click()
      payload = await readPreviewPayload(page)
      expect(payload.fields[0]?.type).toBe('boolean')
      expect(payload.fields[0]?.value).toBe(true)
    })
  })
})
