import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'
import { FormError, PrimaryButton } from '../components/auth/Buttons'
import { FieldMessage, ThemedIcon, TextField } from '../components/auth/Fields'
import { useAuth } from '../lib/auth'
import { useProfile, updateProfile, profileErrorMessage } from '../lib/profile'
import { avatarPathFromUrl, isAcceptableAvatar, removeAvatar, uploadAvatar, AVATAR_TYPES } from '../lib/avatar'
import { dobToParts, parseDob, type DobParts } from '../lib/dob'
import { MSG } from '../lib/messages'
import avatarCircleLight from '../assets/figma/avatar-circle-light.svg'
import avatarCircleDark from '../assets/figma/avatar-circle-dark.svg'
import avatarPersonLight from '../assets/raster/avatar-person-light@3x.png'
import avatarPersonDark from '../assets/raster/avatar-person-dark@3x.png'
import badgeLight from '../assets/raster/avatar-edit-badge-light@3x.png'
import badgeDark from '../assets/raster/avatar-edit-badge-dark@3x.png'
import pencilLight from '../assets/figma/icon-pencil-light.svg'
import pencilDark from '../assets/figma/icon-pencil-dark.svg'
import nameLight from '../assets/figma/icon-name-light.svg'
import nameDark from '../assets/figma/icon-name-dark.svg'

type Errors = { name?: string; dob?: string; photo?: string }

/** 140px avatar from Figma: default artwork, or the chosen photo. Edit badge opens the file picker. */
function AvatarPicker({
  previewUrl,
  onPick,
  disabled,
  error,
}: {
  previewUrl: string | null
  onPick: (file: File) => void
  disabled?: boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const msgId = useId()
  const label = previewUrl ? 'Change photo' : 'Add photo'

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (file) onPick(file)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-[140px]">
        {previewUrl ? (
          <img src={previewUrl} alt="Your photo" className="size-[140px] rounded-full object-cover" />
        ) : (
          <>
            <img src={avatarCircleLight} alt="" aria-hidden width={140} height={140} className="absolute inset-0 dark:hidden" />
            <img src={avatarCircleDark} alt="" aria-hidden width={140} height={140} className="absolute inset-0 hidden dark:block" />
            <img src={avatarPersonLight} alt="" aria-hidden width={140} height={140} className="absolute inset-0 dark:hidden" />
            <img src={avatarPersonDark} alt="" aria-hidden width={140} height={140} className="absolute inset-0 hidden dark:block" />
          </>
        )}

        {/* Edit badge: 35px circle at (100,100) inside the avatar; the 43px artwork includes its shadow. */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label={label}
          aria-describedby={error ? msgId : undefined}
          className="absolute left-[96px] top-[100px] h-[43px] w-[43px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-lime disabled:cursor-not-allowed"
        >
          <img src={badgeLight} alt="" aria-hidden width={43} height={43} className="absolute inset-0 dark:hidden" />
          <img src={badgeDark} alt="" aria-hidden width={43} height={43} className="absolute inset-0 hidden dark:block" />
          <span className="absolute left-[14px] top-[11px]">
            <ThemedIcon icon={{ light: pencilLight, dark: pencilDark }} />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          onChange={onChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          data-testid="avatar-input"
        />
      </div>
      <div className="w-full text-center">
        <FieldMessage id={msgId} error={error} />
      </div>
    </div>
  )
}

/** One DD / MM / YYYY box (Figma "DOB": 120×45, 15px corners, centred text). */
function DobBox({
  label,
  placeholder,
  value,
  maxLength,
  invalid,
  describedBy,
  inputRef,
  onChange,
  onKeyDown,
  disabled,
}: {
  label: string
  placeholder: string
  value: string
  maxLength: number
  invalid: boolean
  describedBy?: string
  inputRef?: React.Ref<HTMLInputElement>
  onChange: (v: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
}) {
  return (
    <input
      ref={inputRef}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      maxLength={maxLength}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, maxLength))}
      onKeyDown={onKeyDown}
      className={
        'block h-[45px] w-full min-w-0 appearance-none rounded-input border-2 bg-bright text-center text-[17px] font-bold text-bokara ' +
        'placeholder:text-bokara/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime ' +
        'dark:bg-bokara dark:text-bright dark:placeholder:text-whisper/15 disabled:opacity-60 ' +
        (invalid
          ? 'border-error dark:border-error-dark'
          : 'border-whisper focus:border-lime dark:border-lime/20 dark:focus:border-lime')
      }
    />
  )
}

export default function CreateProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, setProfile } = useProfile()

  const [name, setName] = useState(profile?.display_name ?? '')
  const [dob, setDob] = useState<DobParts>(() => dobToParts(profile?.date_of_birth))
  const [photo, setPhoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const dobMsgId = useId()
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  const dayRef = useRef<HTMLInputElement>(null)

  // Free the object URL of a previewed photo.
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function onPick(file: File) {
    if (!isAcceptableAvatar(file)) {
      setErrors((e) => ({ ...e, photo: MSG.photoInvalid }))
      return
    }
    setErrors((e) => ({ ...e, photo: undefined }))
    setPhoto(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function setDobPart(part: keyof DobParts, value: string) {
    setDob((d) => ({ ...d, [part]: value }))
    if (errors.dob) setErrors((e) => ({ ...e, dob: undefined }))
    // Jump to the next box once a box is full.
    if (part === 'day' && value.length === 2) monthRef.current?.focus()
    if (part === 'month' && value.length === 2) yearRef.current?.focus()
  }

  // Backspace in an empty box goes back to the previous one.
  const backTo = (ref: React.RefObject<HTMLInputElement | null>, current: string) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && current === '') ref.current?.focus()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving || !user) return
    setFormError(null)

    const trimmed = name.trim()
    const parsed = parseDob(dob)
    const next: Errors = {
      name: trimmed ? undefined : MSG.nameRequired,
      dob: parsed.ok ? undefined : parsed.error,
      photo: errors.photo,
    }
    setErrors(next)
    if (next.name || next.dob || next.photo || !parsed.ok) return

    setSaving(true)
    let uploadedPath: string | null = null
    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (photo) {
        try {
          const uploaded = await uploadAvatar(user.id, photo)
          avatarUrl = uploaded.url
          uploadedPath = uploaded.path
        } catch {
          setErrors((e) => ({ ...e, photo: MSG.photoUpload }))
          return
        }
      }

      const saved = await updateProfile(user.id, {
        display_name: trimmed,
        date_of_birth: parsed.value,
        avatar_url: avatarUrl,
      })

      // Replaced an earlier photo: tidy up the old file.
      const oldPath = avatarPathFromUrl(profile?.avatar_url)
      if (uploadedPath && oldPath && oldPath !== uploadedPath) void removeAvatar(oldPath)

      setProfile(saved)
      navigate('/welcome', { replace: true })
    } catch (err) {
      if (uploadedPath) void removeAvatar(uploadedPath)
      setFormError(profileErrorMessage(err) === MSG.profileLoad ? MSG.unknown : profileErrorMessage(err))
    } finally {
      // Always reset, on success and failure (brief: never hang on "…ing").
      setSaving(false)
    }
  }

  return (
    <AuthLayout swirl="profile">
      <AuthCard>
        <h1 className="text-center text-[40px] font-bold leading-[normal] text-bokara dark:text-whisper">Create profile</h1>

        <form noValidate onSubmit={onSubmit}>
          <div className="mt-[21px]">
            <AvatarPicker previewUrl={previewUrl} onPick={onPick} disabled={saving} error={errors.photo} />
          </div>

          <TextField
            className="mt-[30px]"
            label="Name"
            name="name"
            autoComplete="name"
            maxLength={50}
            placeholder="name"
            icon={{ light: nameLight, dark: nameDark }}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((er) => ({ ...er, name: undefined }))
            }}
            error={errors.name}
            disabled={saving}
          />

          <fieldset className="mt-5" aria-describedby={errors.dob ? dobMsgId : undefined}>
            <legend className="mb-[4px] block pl-0.5 text-[12px] font-medium text-bokara dark:text-whisper">Date of birth</legend>
            <div className="grid grid-cols-3 gap-5">
              <DobBox
                inputRef={dayRef}
                label="Day"
                placeholder="DD"
                maxLength={2}
                value={dob.day}
                invalid={Boolean(errors.dob)}
                onChange={(v) => setDobPart('day', v)}
                disabled={saving}
              />
              <DobBox
                inputRef={monthRef}
                label="Month"
                placeholder="MM"
                maxLength={2}
                value={dob.month}
                invalid={Boolean(errors.dob)}
                onChange={(v) => setDobPart('month', v)}
                onKeyDown={backTo(dayRef, dob.month)}
                disabled={saving}
              />
              <DobBox
                inputRef={yearRef}
                label="Year"
                placeholder="YYYY"
                maxLength={4}
                value={dob.year}
                invalid={Boolean(errors.dob)}
                onChange={(v) => setDobPart('year', v)}
                onKeyDown={backTo(monthRef, dob.year)}
                disabled={saving}
              />
            </div>
            <FieldMessage id={dobMsgId} error={errors.dob} />
          </fieldset>

          {formError && (
            <div className="mt-5">
              <FormError message={formError} />
            </div>
          )}

          <PrimaryButton type="submit" className="mt-[38px]" loading={saving} loadingText="Saving…">
            Let’s{' '}
            <span className="bg-gradient-to-b from-lime to-hunter bg-clip-text text-transparent dark:from-bright dark:to-sage">
              gather!
            </span>
          </PrimaryButton>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
