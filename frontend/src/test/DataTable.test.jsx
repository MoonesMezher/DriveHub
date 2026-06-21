import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from '@/components/ui/DataTable'

describe('DataTable', () => {
  it('shows empty state when no rows', () => {
    render(
      <DataTable
        columns={[{ key: 'name', label: 'الاسم' }]}
        rows={[]}
      />,
    )
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument()
  })

  it('renders rows', () => {
    render(
      <DataTable
        columns={[{ key: 'name', label: 'الاسم' }]}
        rows={[{ id: 1, name: 'أحمد' }]}
      />,
    )
    expect(screen.getAllByText('أحمد').length).toBeGreaterThan(0)
  })
})
