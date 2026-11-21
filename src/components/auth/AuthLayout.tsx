import type { ReactNode } from 'react'
import swirlLoginLight from '../../assets/figma/swirl-login-light.svg'
import swirlLoginDark from '../../assets/figma/swirl-login-dark.svg'
import swirlSignupLight from '../../assets/figma/swirl-signup-light.svg'
import swirlSignupDark from '../../assets/figma/swirl-signup-dark.svg'
import swirlProfileLight from '../../assets/figma/swirl-profile-light.svg'
import swirlProfileDark from '../../assets/figma/swirl-profile-dark.svg'

const SWIRLS = {
  login: { light: swirlLoginLight, dark: swirlLoginDark },
  signup: { light: swirlSignupLight, dark: swirlSignupDark },
  profile: { light: swirlProfileLight, dark: swirlProfileDark },
} as const

type Props = {
  swirl: keyof typeof SWIRLS
  children: ReactNode
  className?: string
}

/**
 * Full-screen auth background from the Figma frames: vertical gradient
 * (Bright → Whisper White, dark: Bokara → Dark Hunter Green) with the swirl
 * artwork (2498×1310) centred behind the content.
 */
export function AuthLayout({ swirl, children, className = '' }: Props) {
  const art = SWIRLS[swirl]
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-bright to-whisper supports-[height:100dvh]:min-h-[100dvh] dark:from-bokara dark:to-hunter">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[1310px] w-[2498px] -translate-x-1/2 -translate-y-1/2">
        <img src={art.light} alt="" width={2498} height={1310} className="h-full w-full dark:hidden" />
        <img src={art.dark} alt="" width={2498} height={1310} className="hidden h-full w-full dark:block" />
      </div>
      <main className={`relative flex min-h-screen items-center justify-center px-4 py-8 supports-[height:100dvh]:min-h-[100dvh] ${className}`}>
        {children}
      </main>
    </div>
  )
}

/** The 470px card with 30px corners from the Figma frames. */
export function AuthCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full max-w-[470px] rounded-card border-2 border-whisper bg-bright px-5 pb-10 pt-9 shadow-card sm:px-[31px] dark:border-lime/20 dark:bg-bokara ${className}`}
    >
      {children}
    </div>
  )
}
