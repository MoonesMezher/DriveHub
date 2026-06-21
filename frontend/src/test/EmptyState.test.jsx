import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  it('renders preset unauthorized', () => {
    render(<EmptyState preset="unauthorized" />)
    expect(screen.getByText('غير مصرّح')).toBeInTheDocument()
  })

  it('renders custom title and action', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="لا شيء هنا"
        description="جرّب لاحقاً"
        actionLabel="إعادة"
        onAction={onAction}
      />,
    )
    expect(screen.getByText('لا شيء هنا')).toBeInTheDocument()
    screen.getByText('إعادة').click()
    expect(onAction).toHaveBeenCalled()
  })
})
