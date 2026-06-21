import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImageCard } from '@/components/ui/ImageCard'

describe('ImageCard', () => {
  it('renders title and subtitle', () => {
    render(
      <ImageCard
        image="https://example.com/img.jpg"
        title="رخصة B"
        subtitle="سيارات خاصة"
      />,
    )
    expect(screen.getByText('رخصة B')).toBeInTheDocument()
    expect(screen.getByText('سيارات خاصة')).toBeInTheDocument()
  })
})
