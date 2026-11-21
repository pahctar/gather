import type { CSSProperties, ReactNode } from 'react'
import groupPerson from '../../assets/raster/feature-group-person@3x.png'
import groupPencil from '../../assets/raster/feature-group-pencil@3x.png'
import pin from '../../assets/raster/feature-pin@3x.png'
import pinXLight from '../../assets/raster/feature-pin-x-light@3x.png'
import pinXDark from '../../assets/raster/feature-pin-x-dark@3x.png'

/*
 * The three Sign-up feature cards from Figma (360×180, 45px corners).
 * Positions inside each card are taken from the Figma frame; the cards are
 * slightly rotated and overlap on wide screens, and stack on small screens.
 */

type Variant = 'available' | 'plan' | 'group'

// Radial background: Figma's ellipse is 220×110 around the card centre.
const BG: Record<Variant, { light: string; dark: string; border: string }> = {
  available: {
    light: 'radial-gradient(220px 110px at 50% 50%, #C3CCB2 0%, #F6F2F1 100%)',
    dark: 'radial-gradient(220px 110px at 50% 50%, #444739 0%, #2A2725 100%)',
    border: 'border-bright dark:border-lime/20',
  },
  plan: {
    light: 'radial-gradient(220px 110px at 50% 50%, #D2C1A8 0%, #F6F2F1 100%)',
    dark: 'radial-gradient(220px 110px at 50% 50%, #4B4134 0%, #2A2725 100%)',
    border: 'border-bright dark:border-[rgba(174,143,96,0.2)]',
  },
  group: {
    light: 'radial-gradient(220px 110px at 50% 50%, #9BAD9B 0%, #C8CFC6 50%, #F6F2F1 100%)',
    dark: 'radial-gradient(220px 110px at 50% 50%, #3A4A3F 0%, #2A2725 100%)',
    border: 'border-bright dark:border-hunter',
  },
}

function Card({
  variant,
  title,
  subtitle,
  subtitleSolid,
  icon,
  className = '',
  style,
  compact,
}: {
  variant: Variant
  title: [string, string]
  subtitle: string
  /** "Available Day" subtitle is solid Dark Hunter Green in light mode; others use the text gradient. */
  subtitleSolid?: boolean
  icon: ReactNode
  className?: string
  style?: CSSProperties
  /** Stacked layout: on phones narrower than 400px the text is scaled down to fit. */
  compact?: boolean
}) {
  const bg = BG[variant]
  const titleCls = compact
    ? 'left-[140px] top-[38px] text-[27px] min-[400px]:left-[153px] min-[400px]:top-[36px] min-[400px]:text-[31.5px]'
    : 'left-[153px] top-[36px] text-[31.5px]'
  const subCls = compact
    ? 'left-[30px] text-[16px] min-[400px]:left-[40px] min-[400px]:text-[18px]'
    : 'left-[40px] text-[18px]'
  return (
    <li
      className={`relative h-[180px] w-full max-w-[360px] list-none overflow-hidden rounded-[45px] border-[1.8px] shadow-[1.8px_1.8px_13.5px_7.2px_rgba(0,0,0,0.03)] ${bg.border} ${className}`}
      style={style}
    >
      {/* Two backgrounds so light/dark follow prefers-color-scheme without JS. */}
      <div aria-hidden className="absolute inset-0 dark:hidden" style={{ backgroundImage: bg.light }} />
      <div aria-hidden className="absolute inset-0 hidden dark:block" style={{ backgroundImage: bg.dark }} />

      {/* Icon tile: 90×90, 18px corners */}
      <div
        aria-hidden
        className="absolute left-[36px] top-[26px] size-[90px] rounded-[18px] bg-bright shadow-[0px_4.5px_13.5px_0px_rgba(0,0,0,0.05)] dark:bg-bokara"
      >
        {icon}
      </div>

      <h2 className={`absolute ${titleCls} bg-gradient-to-b from-bokara to-hunter bg-clip-text font-bold leading-[normal] text-transparent dark:from-bright dark:to-sage`}>
        {title[0]}
        <br />
        {title[1]}
      </h2>
      <p
        className={`absolute ${subCls} top-[132px] whitespace-nowrap font-medium leading-[normal] dark:bg-none dark:text-sage ${
          subtitleSolid
            ? 'text-hunter'
            : 'bg-gradient-to-b from-bokara to-hunter bg-clip-text text-transparent'
        }`}
      >
        {subtitle}
      </p>
    </li>
  )
}

/** Available Day icon: three bars drawn in CSS in Figma (Mustard, Leaf, Crimson gradients). */
function BarsIcon() {
  const bar = 'shadow-[0px_3.6px_3.6px_0px_rgba(0,0,0,0.15)]'
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-[4.5px] pb-[20.5px]">
      <span
        className={`block h-[36px] w-[16.2px] rounded-[7.2px] bg-gradient-to-b from-[#EBD28A] to-[#BB7826] ${bar}`}
        style={{ boxShadow: '0px 3.6px 3.6px 0px rgba(0,0,0,0.15), inset 2.7px 2.7px 11.52px -4.5px #F6F2F1' }}
      />
      <span
        className={`block h-[49.5px] w-[22.5px] rounded-[9.9px] bg-gradient-to-b from-lime to-hunter ${bar}`}
        style={{ boxShadow: '0px 3.6px 3.6px 0px rgba(0,0,0,0.15), inset 2.7px 2.7px 11.52px -4.5px #BECF9C' }}
      />
      <span
        className={`block h-[30.6px] w-[10.8px] rounded-[4.5px] bg-gradient-to-b from-[#D95C4B] to-[#7A2B24] ${bar}`}
        style={{ boxShadow: '0px 3.6px 3.6px 0px rgba(0,0,0,0.15), inset 2.7px 2.7px 11.52px -4.5px #F6F2F1' }}
      />
    </div>
  )
}

function PinIcon() {
  return (
    <>
      <img src={pin} alt="" width={38.7} height={54.24} className="absolute left-[19px] top-[18px] h-[54.24px] w-[38.7px]" />
      <img src={pinXLight} alt="" width={33.82} height={33.82} className="absolute left-[39px] top-[47px] size-[33.82px] dark:hidden" />
      <img src={pinXDark} alt="" width={33.82} height={33.82} className="absolute left-[39px] top-[47px] hidden size-[33.82px] dark:block" />
    </>
  )
}

function GroupIcon() {
  return (
    <>
      <img src={groupPerson} alt="" width={50} height={55} className="absolute left-[23px] top-[23px] h-[55px] w-[50px]" />
      <img
        src={groupPencil}
        alt=""
        width={18.57}
        height={43.21}
        className="absolute left-[16.5px] top-[21px] h-[43.21px] w-[18.57px] -rotate-[17.72deg]"
      />
    </>
  )
}

export function FeatureCards({ layout }: { layout: 'scattered' | 'stacked' }) {
  if (layout === 'stacked') {
    return (
      <ul className="flex flex-col items-center gap-4" aria-label="What you can do with gather">
        <Card compact variant="available" title={['Available', 'Day']} subtitle="See who’s free, pick the dates" subtitleSolid icon={<BarsIcon />} />
        <Card compact variant="plan" title={['Plan Every', 'Stops']} subtitle="Add places, set stay times" icon={<PinIcon />} />
        <Card compact variant="group" title={['Go as a', 'Group']} subtitle="Invite friends to trip or go solo" icon={<GroupIcon />} />
      </ul>
    )
  }

  // Wide screens: Figma positions relative to the hero's top-left (x 95, y 149 in the 1440 frame).
  // Card centres: Available (276, 473) +0.61°, Plan (594, 604) −1.91°, Group (367, 764) +3.86°.
  // Paint order from Figma: Available, Group, then Plan on top.
  const at = (cx: number, cy: number, deg: number): CSSProperties => ({
    position: 'absolute',
    left: cx - 95 - 180,
    top: cy - 149 - 90,
    transform: `rotate(${deg}deg)`,
  })
  return (
    <ul aria-label="What you can do with gather">
      <Card variant="available" title={['Available', 'Day']} subtitle="See who’s free, pick the dates" subtitleSolid icon={<BarsIcon />} style={at(276, 473, 0.61)} />
      <Card variant="group" title={['Go as a', 'Group']} subtitle="Invite friends to trip or go solo" icon={<GroupIcon />} style={at(367, 764, 3.86)} />
      <Card variant="plan" title={['Plan Every', 'Stops']} subtitle="Add places, set stay times" icon={<PinIcon />} style={at(594, 604, -1.91)} />
    </ul>
  )
}
