import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { MSG } from '../lib/messages'

const signInWithPassword = vi.fn()

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { signInWithPassword: (...args: unknown[]) => signInWithPassword(...args) } },
}))

// Import after the mock is registered.
const { default: Login } = await import('./Login')

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<p>WELCOME PAGE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fill(email: string, password: string) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText('Email address'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Log-in' }))
  return user
}

beforeEach(() => signInWithPassword.mockReset())

describe('Login page', () => {
  it('renders the Figma copy', () => {
    renderLogin()
    expect(screen.getByText('Log-in to pick up where you left off')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled()
  })

  it('shows field errors and does not call Supabase when inputs are invalid', async () => {
    renderLogin()
    await fill('not-an-email', '')
    expect(screen.getByText(MSG.emailInvalid)).toBeInTheDocument()
    expect(screen.getByText(MSG.passwordRequired)).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('shows "Incorrect email or password." and resets the button on wrong credentials', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
    })
    renderLogin()
    await fill('mild@example.com', 'wrongpass')
    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.wrongCredentials)
    expect(screen.getByRole('button', { name: 'Log-in' })).toBeEnabled()
  })

  it('tells unconfirmed users to check their inbox', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'),
    })
    renderLogin()
    await fill('mild@example.com', 'password123')
    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.emailNotConfirmed)
  })

  it('shows the timeout message and re-enables the button when the request times out', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthRetryableFetchError(MSG.timeout, 0),
    })
    renderLogin()
    await fill('mild@example.com', 'password123')
    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.timeout)
    expect(screen.getByRole('button', { name: 'Log-in' })).toBeEnabled()
  })

  it('shows "Logging in…" while waiting, then goes to /welcome on success', async () => {
    let resolve!: (v: unknown) => void
    signInWithPassword.mockReturnValue(new Promise((r) => (resolve = r)))
    renderLogin()
    await fill('mild@example.com', 'password123')
    expect(screen.getByRole('button', { name: 'Logging in…' })).toBeDisabled()
    resolve({ data: { user: {}, session: {} }, error: null })
    expect(await screen.findByText('WELCOME PAGE')).toBeInTheDocument()
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'mild@example.com', password: 'password123' })
  })

  it('toggles password visibility', async () => {
    renderLogin()
    const user = userEvent.setup()
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    await waitFor(() => expect(input).toHaveAttribute('type', 'password'))
  })
})
