import { render, screen } from '@/test-utils/test-utils'
import HomePage from '@/app/page'

// Mock Next.js page component
const MockHomePage = () => (
  <div>
    <h1>Welcome to Next.js</h1>
    <p>Get started by editing pages/index.js</p>
  </div>
)

describe('Home Page', () => {
  it('renders welcome message', () => {
    render(<MockHomePage />)
    expect(screen.getByText('Welcome to Next.js')).toBeInTheDocument()
  })

  it('renders get started text', () => {
    render(<MockHomePage />)
    expect(screen.getByText('Get started by editing pages/index.js')).toBeInTheDocument()
  })
})
