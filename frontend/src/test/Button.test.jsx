import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>اختبار</Button>)
    expect(screen.getByRole('button', { name: 'اختبار' })).toBeInTheDocument()
  })

  it('applies primary variant', () => {
    render(<Button variant="primary">حفظ</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-primary')
    expect(btn).toHaveClass('!text-white')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">حذف</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-error')
  })
})
