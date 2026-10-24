import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('affiche le nom accessible de l’application', () => {
    render(<BrandMark />)

    expect(screen.getByLabelText('Multipli’Champions')).toBeInTheDocument()
    expect(screen.getByText('Multipli’Champions')).toBeVisible()
  })
})
