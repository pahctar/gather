import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MSG } from '../lib/messages'
import { TimeoutError } from '../lib/timeout'
import type { Profile } from '../lib/profile'

const updateProfile = vi.fn()
const setProfile = vi.fn()
const uploadAvatar = vi.fn()
const removeAvatar = vi.fn()

const baseProfile: Profile = { id: 'u1', username: 'mild', display_name: null, date_of_birth: null, avatar_url: null }

vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))
vi.mock('../lib/profile', async (orig) => {
  const actual = await orig<typeof import('../lib/profile')>()
  return {
    ...actual,
    useProfile: () => ({ profile: baseProfile, setProfile, loading: false, error: null, reload: vi.fn() }),
    updateProfile: (...a: unknown[]) => updateProfile(...a),
  }
})
vi.mock('../lib/avatar', async (orig) => {
  const actual = await orig<typeof import('../lib/avatar')>()
  return {
    ...actual,
    uploadAvatar: (...a: unknown[]) => uploadAvatar(...a),
    removeAvatar: (...a: unknown[]) => removeAvatar(...a),
  }
})

const { default: CreateProfile } = await import('./CreateProfile')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/create-profile']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/welcome" element={<p>WELCOME PAGE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  updateProfile.mockReset()
  setProfile.mockReset()
  uploadAvatar.mockReset()
  removeAvatar.mockReset()
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})

const saved = (changes: Partial<Profile>) => ({ ...baseProfile, ...changes })

describe('Create profile page', () => {
  it('renders the Figma copy', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Create profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('placeholder', 'name')
    expect(screen.getByLabelText('Day')).toHaveAttribute('placeholder', 'DD')
    expect(screen.getByLabelText('Month')).toHaveAttribute('placeholder', 'MM')
    expect(screen.getByLabelText('Year')).toHaveAttribute('placeholder', 'YYYY')
    expect(screen.getByRole('button', { name: 'Let’s gather!' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add photo' })).toBeInTheDocument()
  })

  it('requires a name', async () => {
    renderPage()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(screen.getByText(MSG.nameRequired)).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('saves with no date of birth and no photo (both optional), then goes to /welcome', async () => {
    updateProfile.mockResolvedValue(saved({ display_name: 'Mild' }))
    renderPage()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), '  Mild  ')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(await screen.findByText('WELCOME PAGE')).toBeInTheDocument()
    expect(updateProfile).toHaveBeenCalledWith('u1', { display_name: 'Mild', date_of_birth: null, avatar_url: null })
    expect(uploadAvatar).not.toHaveBeenCalled()
  })

  it('moves between date boxes and saves the date', async () => {
    updateProfile.mockResolvedValue(saved({ display_name: 'Mild', date_of_birth: '2000-02-20' }))
    renderPage()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'Mild')
    await user.click(screen.getByLabelText('Day'))
    await user.keyboard('20022000') // auto-advances DD → MM → YYYY
    expect(screen.getByLabelText('Day')).toHaveValue('20')
    expect(screen.getByLabelText('Month')).toHaveValue('02')
    expect(screen.getByLabelText('Year')).toHaveValue('2000')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(await screen.findByText('WELCOME PAGE')).toBeInTheDocument()
    expect(updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ date_of_birth: '2000-02-20' }))
  })

  it('shows the date errors with the exact wording', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'Mild')
    await user.type(screen.getByLabelText('Day'), '31')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(screen.getByText(MSG.dobIncomplete)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Month'), '02')
    await user.type(screen.getByLabelText('Year'), '2000')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(screen.getByText(MSG.dobInvalid)).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('rejects unsupported photos', async () => {
    renderPage()
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(screen.getByTestId('avatar-input'), new File(['x'], 'a.gif', { type: 'image/gif' }))
    expect(screen.getByText(MSG.photoInvalid)).toBeInTheDocument()
  })

  it('uploads the chosen photo, then saves its URL', async () => {
    uploadAvatar.mockResolvedValue({ url: 'https://x/storage/v1/object/public/avatars/u1/avatar-1.jpg', path: 'u1/avatar-1.jpg' })
    updateProfile.mockImplementation((_id, changes) => Promise.resolve(saved(changes)))
    renderPage()
    const user = userEvent.setup()
    await user.upload(screen.getByTestId('avatar-input'), new File(['x'], 'me.jpg', { type: 'image/jpeg' }))
    expect(screen.getByRole('img', { name: 'Your photo' })).toHaveAttribute('src', 'blob:preview')
    expect(screen.getByRole('button', { name: 'Change photo' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Name'), 'Mild')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(await screen.findByText('WELCOME PAGE')).toBeInTheDocument()
    expect(updateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ avatar_url: 'https://x/storage/v1/object/public/avatars/u1/avatar-1.jpg' }))
  })

  it('shows "Couldn\'t upload the photo" and keeps the form when the upload fails', async () => {
    uploadAvatar.mockRejectedValue(new Error('boom'))
    renderPage()
    const user = userEvent.setup()
    await user.upload(screen.getByTestId('avatar-input'), new File(['x'], 'me.jpg', { type: 'image/jpeg' }))
    await user.type(screen.getByLabelText('Name'), 'Mild')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(await screen.findByText(MSG.photoUpload)).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Let’s gather!' })).toBeEnabled()
  })

  it('shows "Saving…", then the timeout message, and removes the orphaned upload', async () => {
    uploadAvatar.mockResolvedValue({ url: 'https://x/a.jpg', path: 'u1/avatar-1.jpg' })
    let reject!: (e: unknown) => void
    updateProfile.mockReturnValue(new Promise((_r, j) => (reject = j)))
    renderPage()
    const user = userEvent.setup()
    await user.upload(screen.getByTestId('avatar-input'), new File(['x'], 'me.jpg', { type: 'image/jpeg' }))
    await user.type(screen.getByLabelText('Name'), 'Mild')
    await user.click(screen.getByRole('button', { name: 'Let’s gather!' }))
    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    reject(new TimeoutError())
    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.timeout)
    expect(screen.getByRole('button', { name: 'Let’s gather!' })).toBeEnabled()
    expect(removeAvatar).toHaveBeenCalledWith('u1/avatar-1.jpg')
  })
})
