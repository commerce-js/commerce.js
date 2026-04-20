// ---------------------------------------------------------------------------
// admin.deleteCategory / updateCategory guard unit tests
// ---------------------------------------------------------------------------
//
// Mocks the DB layer and exercises:
//   - deleteCategory rejects when attached products exist
//   - deleteCategory still rejects when child categories exist
//   - updateCategory rejects self-parent
//   - updateCategory rejects descendant-cycle (A → B → A)
//   - mapCategory round-trip surfaces sortOrder
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  findCategoryById: vi.fn(),
  insertCategory: vi.fn(),
  updateCategoryById: vi.fn(),
  deleteCategoryById: vi.fn(),
  findCategoryChildren: vi.fn(),
  findCategories: vi.fn(),
  findProductIdsByCategory: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createAdminCategoriesDomain } from '../admin/categories.js'

const domain = createAdminCategoriesDomain()

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset()
})

describe('admin.deleteCategory guard', () => {
  it('rejects when the category has children', async () => {
    mocks.findCategoryChildren.mockResolvedValueOnce([{ id: 'child-1' }])
    mocks.findProductIdsByCategory.mockResolvedValueOnce([])
    await expect(domain.deleteCategory('c1')).rejects.toThrow(/child categories/)
    expect(mocks.deleteCategoryById).not.toHaveBeenCalled()
  })

  it('rejects when the category has attached products', async () => {
    mocks.findCategoryChildren.mockResolvedValueOnce([])
    mocks.findProductIdsByCategory.mockResolvedValueOnce(['p1', 'p2', 'p3'])
    await expect(domain.deleteCategory('c1')).rejects.toThrow(/3 attached products/)
    expect(mocks.deleteCategoryById).not.toHaveBeenCalled()
  })

  it('uses singular phrasing for a single attached product', async () => {
    mocks.findCategoryChildren.mockResolvedValueOnce([])
    mocks.findProductIdsByCategory.mockResolvedValueOnce(['only-one'])
    await expect(domain.deleteCategory('c1')).rejects.toThrow(/1 attached product(?!s)/)
  })

  it('deletes when neither children nor products are attached', async () => {
    mocks.findCategoryChildren.mockResolvedValueOnce([])
    mocks.findProductIdsByCategory.mockResolvedValueOnce([])
    await expect(domain.deleteCategory('c1')).resolves.toBeUndefined()
    expect(mocks.deleteCategoryById).toHaveBeenCalledWith('c1')
  })
})

describe('admin.updateCategory parent-cycle guard', () => {
  it('rejects self-parent', async () => {
    await expect(domain.updateCategory('c1', { parentId: 'c1' })).rejects.toThrow(/its own parent/)
    expect(mocks.updateCategoryById).not.toHaveBeenCalled()
  })

  it('rejects a descendant as the new parent (cycle)', async () => {
    // Tree pre-update:  c1 → c2 → c3 (c3's parent is c2, c2's parent is c1)
    // Attempt: set c1.parentId = c3 → would cycle because c3's ancestry reaches c1.
    mocks.findCategoryById.mockImplementation((id: string) => {
      if (id === 'c3') return Promise.resolve({ id: 'c3', parentId: 'c2' })
      if (id === 'c2') return Promise.resolve({ id: 'c2', parentId: 'c1' })
      return Promise.resolve(null)
    })
    await expect(domain.updateCategory('c1', { parentId: 'c3' })).rejects.toThrow(/cycle/)
    expect(mocks.updateCategoryById).not.toHaveBeenCalled()
  })

  it('accepts a parent that is not a descendant', async () => {
    // c5 → c4 (root). Setting c1's parent to c5 is safe — c5's ancestors never reach c1.
    mocks.findCategoryById.mockImplementation((id: string) => {
      if (id === 'c5') return Promise.resolve({ id: 'c5', parentId: 'c4' })
      if (id === 'c4') return Promise.resolve({ id: 'c4', parentId: null })
      if (id === 'c1') return Promise.resolve({ id: 'c1', parentId: 'c5', sortOrder: 0 })
      return Promise.resolve(null)
    })
    await expect(domain.updateCategory('c1', { parentId: 'c5' })).resolves.toBeTruthy()
    expect(mocks.updateCategoryById).toHaveBeenCalledWith('c1', expect.objectContaining({ parentId: 'c5' }))
  })

  it('skips the cycle walk when parentId is cleared to empty string', async () => {
    mocks.findCategoryById.mockResolvedValueOnce({ id: 'c1', parentId: null, sortOrder: 0 })
    await expect(domain.updateCategory('c1', { parentId: '' })).resolves.toBeTruthy()
    expect(mocks.updateCategoryById).toHaveBeenCalledWith('c1', expect.objectContaining({ parentId: '' }))
  })
})

describe('admin.getCategory mapCategory output', () => {
  it('surfaces sortOrder from the row', async () => {
    mocks.findCategoryById.mockResolvedValueOnce({
      id: 'c1',
      name: 'Shoes',
      nameAr: 'أحذية',
      slug: 'shoes',
      description: null,
      descriptionAr: null,
      image: null,
      parentId: null,
      sortOrder: 42,
    })
    const cat = await domain.getCategory('c1')
    expect(cat.sortOrder).toBe(42)
  })

  it('defaults sortOrder to 0 when the column is null/undefined', async () => {
    mocks.findCategoryById.mockResolvedValueOnce({
      id: 'c1',
      name: 'Shoes',
      slug: 'shoes',
      description: null,
      image: null,
      parentId: null,
    })
    const cat = await domain.getCategory('c1')
    expect(cat.sortOrder).toBe(0)
  })
})
