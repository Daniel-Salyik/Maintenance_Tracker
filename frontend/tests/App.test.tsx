import { render, screen } from '@testing-library/react'
import App from '../src/App'

it('renders heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Maintenance Tracker' })).toBeInTheDocument()
})
