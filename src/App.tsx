// Filtered Figma artwork is pre-rendered to 3x PNG (see scripts/rasterize-assets.cjs)
// because Safari renders SVG filter effects at low resolution.
import logo from './assets/raster/logo@3x.png'
import wordLight from './assets/raster/wordmark-gather-light@3x.png'
import wordDark from './assets/raster/wordmark-gather-dark@3x.png'
import { isSupabaseConfigured } from './lib/supabase'

// Step 1 placeholder: confirms fonts, colours, light/dark and env setup.
// Replaced by the router in step 2.
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bright to-whisper px-4 dark:from-bokara dark:to-hunter">
      <div className="w-full max-w-[470px] rounded-card border-2 border-whisper bg-bright p-8 text-center shadow-card dark:border-lime/20 dark:bg-bokara">
        <img src={logo} alt="Gather" width={90} height={69} className="mx-auto" />
        <h1 className="mt-5 flex items-end justify-center gap-3 text-[40px] leading-none">
          <span>Let’s</span>
          <img src={wordLight} alt="gather" width={130} height={41} className="dark:hidden" />
          <img src={wordDark} alt="gather" width={130} height={41} className="hidden dark:block" />
        </h1>
        <p className="mt-6 text-[15px] text-bokara/70 dark:text-whisper/70">Setup check</p>
        <p className="mt-2 text-[15px]" role="status">
          Supabase env:{' '}
          {isSupabaseConfigured ? (
            <span className="text-lime">configured ✓</span>
          ) : (
            <span className="text-[#C0392B] dark:text-[#E07B6E]">missing — copy .env.example to .env.local</span>
          )}
        </p>
      </div>
    </main>
  )
}
