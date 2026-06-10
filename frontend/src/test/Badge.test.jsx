import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders label', () => {
    render(<Badge>قيد المراجعة</Badge>)
    expect(screen.getByText('قيد المراجعة')).toBeInTheDocument()
  })

  it('applies success variant', () => {
    render(<Badge variant="success">ناجح</Badge>)
    expect(screen.getByText('ناجح')).toHaveClass('bg-success-container')
  })
})
