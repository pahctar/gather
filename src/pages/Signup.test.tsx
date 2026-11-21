import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthApiError, AuthRetryableFetchError, AuthWeakPasswordError } from '@supabase/supabase-js'
import { MSG } from '../lib/messages'

const signUp = vi.fn()
const rpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: { signUp: (...a: unknown[]) => signUp(...a) },
    rpc: (...a: unknown[]) => rpc(...a),
  },
}))

const { default: Signup } = await import('./Signup')

const FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true }

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']} future={FUTURE}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/welcome" element={<p>WELCOME PAGE</p>} />
        <Route path="/login" element={<p>LOGIN PAGE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

type Form = { username?: string; email?: string; password?: string; confirm?: string }
const GOOD: Required<Form> = {
  username: 'mild_01',
  email: 'mild@example.com',
  password: 'password123',
  confirm: 'password123',
}

async function submit(values: Form = GOOD) {
  const user = userEvent.setup()
  if (values.username) await user.type(screen.getByLabelText('Username'), values.username)
  if (values.email) await user.type(screen.getByLabelText('Email address'), values.email)
  if (values.password) await user.type(screen.getByLabelText('Password'), values.password)
  if (values.confirm) await user.type(screen.getByLabelText('Confirm password'), values.confirm)
  await user.click(screen.getByRole('button', { name: 'Sign-up' }))
  return user
}

const newUser = { data: { user: { identities: [{ id: 'x' }] }, session: null }, error: null }

beforeEach(() => {
  signUp.mockReset()
  rpc.mockReset()
  rpc.mockResolvedValue({ data: true, error: null }) // username free by default
})

describe('Sign-up page', () => {
  it('renders the Figma copy and the password hint', () => {
    renderSignup()
    expect(screen.getByRole('heading', { name: 'Get started' })).toBeInTheDocument()
    expect(screen.getByText('Welcome to gather! Let’s create an account')).toBeInTheDocument()
    expect(screen.getByText('go together, plan together')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('username')).toBeInTheDocument()
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
    for (const title of [/Available\s*Day/, /Plan Every\s*Stops/, /Go as a\s*Group/]) {
      expect(screen.getAllByRole('heading', { name: title }).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled()
  })

  it('lower-cases the username as you type', async () => {
    renderSignup()
    await userEvent.setup().type(screen.getByLabelText('Username'), 'Mild 01')
    expect(screen.getByLabelText('Username')).toHaveValue('mild01')
  })

  it('shows every field error with the exact wording', async () => {
    renderSignup()
    await submit({ username: 'ab', email: 'nope', password: 'short', confirm: 'different' })
    expect(screen.getByText(MSG.usernameFormat)).toBeInTheDocument()
    expect(screen.getByText(MSG.emailInvalid)).toBeInTheDocument()
    expect(screen.getByText(MSG.passwordShort)).toBeInTheDocument()
    expect(screen.getByText(MSG.passwordMismatch)).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('accepts exactly 8 characters with no numbers or symbols', async () => {
    signUp.mockResolvedValue(newUser)
    renderSignup()
    await submit({ ...GOOD, password: 'abcdefgh', confirm: 'abcdefgh' })
    expect(signUp).toHaveBeenCalled()
  })

  it('stops when the username is taken', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    renderSignup()
    await submit()
    expect(await screen.findByText(MSG.usernameTaken)).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('username_available', { name: 'mild_01' })
  })

  it('sends the username as sign-up metadata and shows "Check your inbox"', async () => {
    signUp.mockResolvedValue(newUser)
    renderSignup()
    await submit()
    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument()
    expect(screen.getByText('mild@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to log-in' })).toHaveAttribute('href', '/login')
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'mild@example.com',
        password: 'password123',
        options: expect.objectContaining({ data: { username: 'mild_01' } }),
      }),
    )
  })

  it('says the email exists when Supabase returns a user with no identities', async () => {
    signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null })
    renderSignup()
    await submit()
    expect(await screen.findByText(MSG.emailTaken)).toBeInTheDocument()
  })

  it('says the email exists when Supabase reports it directly', async () => {
    signUp.mockResolvedValue({ data: { user: null, session: null }, error: new AuthApiError('User already registered', 422, 'user_already_exists') })
    renderSignup()
    await submit()
    expect(await screen.findByText(MSG.emailTaken)).toBeInTheDocument()
  })

  it('explains a server-side password rule conflict', async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthWeakPasswordError('Password should contain at least one character of each', 422, ['characters']),
    })
    renderSignup()
    await submit()
    expect(await screen.findByText(MSG.passwordRejected)).toBeInTheDocument()
  })

  it('explains Supabase’s built-in email only sending to team addresses', async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Email address "x@example.com" cannot be used as it is not authorized', 400, 'email_address_not_authorized'),
    })
    renderSignup()
    await submit()
    expect(await screen.findByText(MSG.emailNotAuthorized)).toBeInTheDocument()
  })

  it('says the database is not set up when the username check function is missing', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.username_available(name)' } })
    renderSignup()
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.dbNotSetUp)
    expect(signUp).not.toHaveBeenCalled()
  })

  it('shows the error code for anything unexpected', async () => {
    signUp.mockResolvedValue({ data: { user: null, session: null }, error: new AuthApiError('Something odd', 500, 'hook_timeout') })
    renderSignup()
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(`${MSG.unknown} (hook_timeout / 500)`)
  })

  it('reports a username taken in a race (database error) as taken', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: false, error: null })
    signUp.mockResolvedValue({ data: { user: null, session: null }, error: new AuthApiError('Database error saving new user', 500, 'unexpected_failure') })
    renderSignup()
    await submit()
    expect(await screen.findByText(MSG.usernameTaken)).toBeInTheDocument()
  })

  it('shows "Creating account…" while waiting and resets after a timeout', async () => {
    let resolve!: (v: unknown) => void
    signUp.mockReturnValue(new Promise((r) => (resolve = r)))
    renderSignup()
    await submit()
    expect(await screen.findByRole('button', { name: 'Creating account…' })).toBeDisabled()
    resolve({ data: { user: null, session: null }, error: new AuthRetryableFetchError(MSG.timeout, 0) })
    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.timeout)
    expect(screen.getByRole('button', { name: 'Sign-up' })).toBeEnabled()
  })

  it('goes straight to /welcome when Supabase email confirmation is off', async () => {
    signUp.mockResolvedValue({ data: { user: { identities: [{ id: 'x' }] }, session: { access_token: 't' } }, error: null })
    renderSignup()
    await submit()
    expect(await screen.findByText('WELCOME PAGE')).toBeInTheDocument()
  })
})
