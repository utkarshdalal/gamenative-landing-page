'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Download,
  MessageCircle,
  Coffee,
  Wrench,
  Github,
  ArrowRight,
  Quote,
  Youtube,
  Heart,
  Star,
  Users,
  ChevronDown,
  Twitter,
  Linkedin,
  Mail,
} from 'lucide-react'
import Link from 'next/link'

const DOWNLOAD_URL = 'https://downloads.gamenative.app/releases/1.0.0/gamenative-v1.0.0.apk'
const GITHUB_URL = 'https://github.com/utkarshdalal/GameNative'
const DISCORD_URL = 'https://discord.gg/2hKv4VfZfE'
const KOFI_URL = 'https://ko-fi.com/gamenative'
const X_URL = 'https://x.com/GameNativeApp'
const LINKEDIN_URL = 'https://www.linkedin.com/company/gamenative'
const CONTACT_EMAIL = 'utkarsh@gamenative.app'
const CONTACT_URL = `mailto:${CONTACT_EMAIL}`

const testimonials = [
  {
    name: 'ETA PRIME',
    subscribers: '1.38M subscribers',
    avatar: '/creators/etaprime.jpg',
    url: 'https://www.youtube.com/watch?v=g-ygCXH5tFs',
    quote:
      'In my opinion, this is definitely the easiest way to get Steam up and running on your Android device.',
  },
  {
    name: 'WULFF DEN',
    subscribers: '975K subscribers',
    avatar: '/creators/wulffden.jpg',
    url: 'https://www.youtube.com/watch?v=5wIBqescugc',
    quote:
      'We’re unlocking actual modern PC games on our retro handhelds. This is the future that I want to see.',
  },
  {
    name: 'Retro Game Corps',
    subscribers: '827K subscribers',
    avatar: '/creators/retrogamecorps.jpg',
    url: 'https://www.youtube.com/watch?v=a9ZlYhgnI-g',
    quote:
      'It almost feels like I’m cheating… I shouldn’t be able to play these games so well.',
  },
  {
    name: 'Tech Dweeb',
    subscribers: '281K subscribers',
    avatar: '/creators/techdweeb.jpg',
    url: 'https://www.youtube.com/watch?v=QqIChmAu2_A',
    quote:
      'PC games on your Android doodads is a dream come true… thanks to a lovely new app called GameNative.',
  },
]

const press = [
  {
    name: 'Android Authority',
    logo: '/press/android-authority.png',
    quote:
      'It’s all truly impressive stuff, and… the app could kill handheld PCs once and for all.',
    url: 'https://www.androidauthority.com/gamenative-interview-kill-handheld-pcs-3664176/',
  },
  {
    name: 'Android Police',
    logo: '/press/android-police.svg',
    quote: 'Genuinely very good… I was impressed… I can tell you GameNative works.',
    url: 'https://www.androidpolice.com/played-dark-souls-on-smartphone-went-better-than-i-thought/',
  },
]

const loveImages = Array.from({ length: 29 }, (_, i) =>
  `/love/love-${String(i + 1).padStart(2, '0')}.jpg`,
)

/**
 * "How it works" — three pure-typography steps. No boxes, no icons. Each step
 * fades up in sequence the first time the section enters the viewport.
 */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const steps = [
    { n: '01', title: 'Install', copy: 'Download the free app on Android.' },
    {
      n: '02',
      title: 'Add your games',
      copy: 'Sign in to Steam, Epic or GOG and download your games.',
    },
    { n: '03', title: 'Play', copy: 'Run your games locally, anywhere.' },
  ]

  return (
    <section ref={ref} className="mx-auto max-w-5xl px-6 pb-24 pt-4">
      <h2 className="mb-14 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
        How it works
      </h2>
      <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className="text-center transition-all duration-700 ease-out"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: `${i * 220}ms`,
            }}
          >
            <div className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-5xl font-bold tabular-nums tracking-tight text-transparent sm:text-6xl">
              {s.n}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{s.copy}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Demo video that stays hidden until it scrolls into view, then fades in and
 * autoplays. Pauses when it leaves the viewport so it doesn't burn cycles or
 * play audio off-screen. Kicks off the CRT power-on flash when it appears.
 */
function DemoVideo() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true)
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.2 },
    )
    io.observe(wrap)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={wrapRef}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(48px)',
      }}
    >
      <video
        ref={videoRef}
        className={`aspect-[19.5/9] w-full bg-black object-contain ${revealed ? 'gn-crt-on' : ''}`}
        src="/demo.mp4"
        poster="/demo-poster.jpg"
        controls
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  )
}

/**
 * Wraps the demo video in a sleek modern phone mockup held in landscape: thin
 * uniform bezels, big rounded corners, a punch-hole camera and subtle edge
 * buttons.
 */
function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.75rem] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-cyan-500/30 opacity-70 blur-3xl" />

      {/* Device body */}
      <div className="relative rounded-[2rem] border border-white/15 bg-gradient-to-b from-[#2a2833] to-[#0b0a10] p-2 shadow-2xl shadow-black/70 sm:rounded-[2.4rem] sm:p-2.5">
        {/* Top-edge buttons (phone is in landscape) */}
        <div className="absolute right-[26%] top-[-2px] h-[3px] w-16 rounded-b-full bg-white/15" />
        <div className="absolute right-[44%] top-[-2px] h-[3px] w-9 rounded-b-full bg-white/15" />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[1.55rem] bg-black ring-1 ring-black/60 sm:rounded-[2rem]">
          {children}
          {/* Punch-hole camera */}
          <div className="pointer-events-none absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-black ring-1 ring-white/25 sm:left-3 sm:h-2.5 sm:w-2.5 md:left-4 md:h-3 md:w-3" />
        </div>
      </div>
    </div>
  )
}

// Deterministic pseudo-random in [0,1) so the layout is stable across renders.
function seeded(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * A dense, overlapping wall of player testimonials. Cards are absolutely
 * positioned in balanced columns that deliberately overlap (vertically and
 * horizontally) to feel overwhelming. As the section scrolls into view each
 * card floods in from its side, rotating and scaling into its resting spot —
 * so the deeper you scroll the more it piles up and converges on center.
 */
function DenseWall({ images }: { images: string[] }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    type Card = { x: number; y: number; h: number; rot: number; dir: number }
    let layout: Card[] = []

    const measure = () => {
      const stage = stageRef.current
      if (!stage) return
      const W = stage.clientWidth
      const cols = W < 640 ? 2 : W < 1024 ? 3 : 5
      const colGap = W / cols
      const cardW = Math.min(colGap * 1.32, 320) // wider than the slot → overlap
      const colY = new Array(cols).fill(10)
      const centerX = W / 2

      layout = itemRefs.current.map((el, i) => {
        if (!el) return { x: 0, y: 0, h: 0, rot: 0, dir: 0 }
        el.style.width = `${cardW}px`
        const h = el.offsetHeight
        // Drop into the currently shortest column for a balanced pile.
        let c = 0
        for (let k = 1; k < cols; k++) if (colY[k] < colY[c]) c = k
        const jitterX = (seeded(i) - 0.5) * colGap * 0.5
        const x = c * colGap - (cardW - colGap) / 2 + jitterX
        const y = colY[c]
        colY[c] = y + h * 0.8 // 20% vertical overlap — dense pile, but each card still gets its scroll moment
        const rot = (seeded(i + 99) - 0.5) * 8 // ±4°
        const dir = x + cardW / 2 - centerX // which side it flies in from
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        el.style.zIndex = String(i)
        return { x, y, h, rot, dir }
      })

      stage.style.height = `${Math.max(...colY) + 30}px`
    }

    const update = () => {
      const stage = stageRef.current
      if (!stage || !layout.length) return
      const vh = window.innerHeight
      const stageTop = stage.getBoundingClientRect().top
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        const card = layout[i]
        const restY = stageTop + card.y + card.h / 2
        const p = Math.min(1, Math.max(0, (vh - restY) / (vh * 1.1)))
        const eased = 1 - Math.pow(1 - p, 3)
        const sx = card.dir * 0.9 * (1 - eased) // flood in from the sides
        const sy = 90 * (1 - eased)
        const scale = 0.55 + 0.45 * eased
        el.style.opacity = String(eased)
        el.style.transform = `translate3d(${sx}px, ${sy}px, 0) rotate(${card.rot * eased}deg) scale(${scale})`
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    const remeasure = () => {
      measure()
      update()
    }

    remeasure()
    const settle = setTimeout(remeasure, 300)
    const imgs = stageRef.current?.querySelectorAll('img') ?? []
    imgs.forEach((img) => img.addEventListener('load', remeasure))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', remeasure)
    return () => {
      clearTimeout(settle)
      imgs.forEach((img) => img.removeEventListener('load', remeasure))
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', remeasure)
      cancelAnimationFrame(raf)
    }
  }, [images.length])

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-4">
      <div className="mb-6 px-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Loved by players
        </h2>
      </div>

      <div ref={stageRef} className="relative w-full">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ opacity: 0 }}
          >
            <img
              src={src}
              alt="What players are saying about GameNative"
              className="w-full rounded-xl border border-white/10 bg-[#0d0a16] shadow-2xl shadow-black/60"
            />
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
        >
          See more in the Discord
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  )
}

/**
 * The YouTuber reviews. Each card slides in from an alternating side (left,
 * right, left, right) as it scrolls into view — on both mobile and desktop.
 */
function CreatorReviews() {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    let rests: number[] = [] // resting center Y of each card in document coords

    const measure = () => {
      rests = itemRefs.current.map((el) => {
        if (!el) return 0
        el.style.transform = 'none'
        const r = el.getBoundingClientRect()
        return r.top + window.scrollY + r.height / 2
      })
    }

    const update = () => {
      if (!rests.length) return
      const vh = window.innerHeight
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        const restViewportY = rests[i] - window.scrollY
        const p = Math.min(1, Math.max(0, (vh - restViewportY) / (vh * 0.5)))
        const eased = 1 - Math.pow(1 - p, 3)
        const dir = i % 2 === 0 ? -1 : 1 // alternate left / right
        const dx = dir * 160 * (1 - eased)
        el.style.transform = `translate3d(${dx}px, 0, 0)`
        el.style.opacity = String(eased)
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    const remeasure = () => {
      measure()
      update()
    }

    remeasure()
    const settle = setTimeout(remeasure, 300)
    const imgs = itemRefs.current.flatMap((el) =>
      el ? Array.from(el.querySelectorAll('img')) : [],
    )
    imgs.forEach((img) => img.addEventListener('load', remeasure))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', remeasure)
    return () => {
      clearTimeout(settle)
      imgs.forEach((img) => img.removeEventListener('load', remeasure))
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', remeasure)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="mx-auto max-w-5xl overflow-x-clip px-6 pb-24 pt-4">
      <div className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          As featured on YouTube
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Recommended by creators with{' '}
          <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
            3.4M+ subscribers
          </span>
        </p>
      </div>

      <div className="grid items-stretch gap-5 sm:grid-cols-2">
        {testimonials.map((t, i) => (
          <a
            key={t.name}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ opacity: 0 }}
            className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 will-change-transform transition-colors hover:border-white/25"
          >
            <div className="flex items-center gap-3">
              <img
                src={t.avatar}
                alt={`${t.name} on YouTube`}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
              />
              <div className="min-w-0 leading-tight">
                <div className="truncate font-semibold text-white">{t.name}</div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Youtube className="h-3.5 w-3.5 text-red-500/80" />
                  {t.subscribers}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-1 gap-3">
              <Quote className="h-5 w-5 shrink-0 text-purple-400/60" />
              <p className="text-[15px] leading-relaxed text-gray-200">{t.quote}</p>
            </div>

            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300/80 transition-colors group-hover:text-cyan-300">
              Watch the review
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function formatCount(n: number | null, fallback: string) {
  return n == null ? fallback : n.toLocaleString('en-US')
}

/** Eased RAF scroll so the demo's reveal animations have time to play. */
function smoothScrollTo(targetY: number, duration = 1400) {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, targetY)
    return
  }
  const startY = window.scrollY
  const dist = targetY - startY
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    window.scrollTo(0, startY + dist * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** Animates a number from 0 up to `target` over ~900ms whenever target changes from null → number. */
function useCountUp(target: number | null) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target == null) return
    const start = performance.now()
    const duration = 900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return target == null ? null : value
}

/** Types out `text` character by character over ~`duration` ms after a `delay`. */
function useTypewriter(text: string, delay: number, duration: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now + delay
      const t = Math.max(0, Math.min(1, (now - start) / duration))
      setCount(Math.floor(t * text.length))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, delay, duration])
  return { typed: text.slice(0, count), done: count >= text.length }
}

export default function GameNativePage() {
  const [stars, setStars] = useState<number | null>(null)
  const [members, setMembers] = useState<number | null>(null)
  const starsUp = useCountUp(stars)
  const membersUp = useCountUp(members)
  const blobsRef = useRef<HTMLDivElement>(null)
  const { typed: typedTagline, done: typedDone } = useTypewriter('Now on Android.', 1100, 750)

  useEffect(() => {
    fetch('https://api.github.com/repos/utkarshdalal/GameNative')
      .then((r) => r.json())
      .then((d) => typeof d?.stargazers_count === 'number' && setStars(d.stargazers_count))
      .catch(() => {})

    fetch('https://discord.com/api/v9/invites/2hKv4VfZfE?with_counts=true')
      .then((r) => r.json())
      .then(
        (d) =>
          typeof d?.approximate_member_count === 'number' && setMembers(d.approximate_member_count),
      )
      .catch(() => {})
  }, [])

  // Parallax the ambient glow blobs as the user scrolls.
  useEffect(() => {
    const el = blobsRef.current
    if (!el) return
    let raf = 0
    const update = () => {
      el.style.setProperty('--gn-scroll', `${window.scrollY}px`)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080510] text-white">
      {/* Ambient background — floods in after the black-on-load moment */}
      <div
        ref={blobsRef}
        className="gn-color-in pointer-events-none absolute inset-0 overflow-hidden"
        style={{ animationDelay: '650ms' }}
      >
        <div
          className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-purple-600/25 blur-[140px] will-change-transform"
          style={{ transform: 'translate3d(0, calc(var(--gn-scroll, 0px) * 0.18), 0)' }}
        />
        <div
          className="absolute -top-20 right-[-12rem] h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[140px] will-change-transform"
          style={{ transform: 'translate3d(0, calc(var(--gn-scroll, 0px) * 0.28), 0)' }}
        />
        <div
          className="absolute bottom-[-16rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-fuchsia-700/15 blur-[150px] will-change-transform"
          style={{
            transform: 'translate3d(-50%, calc(var(--gn-scroll, 0px) * -0.12), 0)',
          }}
        />
        <div
          className="gn-grid-power-on absolute inset-0 opacity-[0.18]"
          style={{
            animationDelay: '900ms',
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Nav */}
      <header
        className="gn-color-in relative z-20"
        style={{ animationDelay: '650ms' }}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/ic_launcher-playstore.png"
              alt="GameNative logo"
              className="h-9 w-9 rounded-lg shadow-lg shadow-purple-500/30"
            />
            <span className="text-lg font-semibold tracking-tight">GameNative</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
            <Link href="/compatibility" className="transition-colors hover:text-white">
              Compatibility
            </Link>
            <Link href="/drivers" className="transition-colors hover:text-white">
              Graphics Drivers
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              GitHub
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Discord
            </a>
            <a href={CONTACT_URL} className="transition-colors hover:text-white">
              Contact
            </a>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-cyan-500 font-semibold text-white shadow-lg shadow-purple-500/30 hover:opacity-90"
          >
            <a href={DOWNLOAD_URL}>
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </a>
          </Button>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero — fills the viewport so the demo below stays hidden until scroll */}
        <section className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-4xl flex-col items-center justify-center px-6 pb-28 pt-8 text-center md:pb-20">
          <h1 className="relative z-10 text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Your PC games.
            <br />
            <span className="relative inline-block align-baseline" aria-label="Now on Android.">
              {/* Plain reservation: takes layout space, never paints (no gradient, no clip). */}
              <span aria-hidden="true" style={{ visibility: 'hidden' }}>
                Now on Android.
              </span>
              {/* Visible typed text, overlaid so its width never affects line wrapping. */}
              <span
                aria-hidden="true"
                className="gn-gradient-anim absolute inset-0 whitespace-nowrap text-left bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
              >
                {typedTagline}
                {typedTagline.length > 0 && (
                  <span className="gn-caret h-[0.85em]" />
                )}
              </span>
            </span>
          </h1>

          <p
            className="gn-assemble relative z-10 mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl"
            style={{ animationDelay: '2400ms' }}
          >
            Install GameNative, sign in to Steam, Epic or GOG, and play the PC games you already own
            on your Android phone or handheld. Everything runs locally on the device, with cloud
            saves.
          </p>

          <div
            className="gn-assemble relative z-10 mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: '2800ms' }}
          >
            <Button
              asChild
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 px-8 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition-opacity hover:opacity-90 sm:w-auto"
            >
              <a href={DOWNLOAD_URL}>
                <Download className="mr-2 h-5 w-5" />
                Download for Android
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-white/15 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link href="/compatibility">
                <Wrench className="mr-2 h-5 w-5" />
                Check compatibility
              </Link>
            </Button>
          </div>

          <p
            className="gn-assemble relative z-10 mt-5 text-sm text-gray-500"
            style={{ animationDelay: '3200ms' }}
          >
            Open source · v1.0.0 · Android APK install
          </p>

          <div
            className="gn-assemble relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '3600ms' }}
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.1] hover:shadow-purple-500/20"
            >
              <Github className="h-4 w-4 text-gray-200" />
              <span className="text-sm font-medium text-gray-100">Star on GitHub</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 px-2.5 py-0.5 text-sm font-bold tabular-nums text-white shadow-sm">
                <Star className="h-3 w-3 fill-current" />
                {formatCount(starsUp, '7,800+')}
              </span>
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.1] hover:shadow-[#5865F2]/25"
            >
              <MessageCircle className="h-4 w-4 text-[#5865F2]" />
              <span className="text-sm font-medium text-gray-100">Join the Discord</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 px-2.5 py-0.5 text-sm font-bold tabular-nums text-white shadow-sm">
                <Users className="h-3 w-3" />
                {formatCount(membersUp, '34,000+')}
              </span>
            </a>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.1] hover:shadow-orange-500/20"
            >
              <Coffee className="h-4 w-4 text-orange-300" />
              <span className="text-sm font-medium text-gray-100">Support on Ko-fi</span>
              <span className="flex items-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-2.5 py-1 text-white shadow-sm">
                <Heart className="h-3 w-3 fill-current" />
              </span>
            </a>
          </div>

          {/* Scroll cue — teases the demo below */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('demo')
              if (!el) return
              const y = el.getBoundingClientRect().top + window.scrollY - 40
              smoothScrollTo(y, 1400)
            }}
            aria-label="Scroll to see the demo"
            className="gn-assemble group absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1.5 bg-transparent text-gray-500 transition-colors hover:text-white"
            style={{ animationDelay: '4050ms' }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">
              See it in action
            </span>
            <ChevronDown className="gn-bob h-5 w-5 transition-transform group-hover:translate-y-1" />
          </button>
        </section>

        {/* Demo video in a handheld mockup */}
        <section id="demo" className="mx-auto max-w-5xl px-6 pb-20 pt-12">
          <PhoneMockup>
            <DemoVideo />
          </PhoneMockup>
          <p className="mt-6 text-center text-sm text-gray-500">
            Real footage of GameNative captured on an AYN Odin 3
          </p>
        </section>

        {/* How it works — three steps, typography only */}
        <HowItWorks />

        {/* Dense wall of player love — right under the video */}
        <DenseWall images={loveImages} />

        {/* YouTuber reviews — cards sliding in from alternating sides */}
        <CreatorReviews />

        {/* Press coverage */}
        <section className="mx-auto max-w-5xl px-6 pb-28 pt-4">
          <h2 className="mb-8 text-sm font-semibold uppercase tracking-wider text-gray-500">
            As featured in
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {press.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition-colors hover:border-white/25"
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-7 w-auto self-start object-contain opacity-90"
                />
                <p className="mt-5 flex-1 text-lg font-medium leading-snug text-white">
                  “{p.quote}”
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300/80 transition-colors group-hover:text-cyan-300">
                  Read the article
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-28 pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 text-center shadow-2xl shadow-black/40 sm:p-12">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

            <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Bringing PC gaming to 4B Android devices
            </p>
            <h2 className="relative mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to play your library{' '}
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                anywhere?
              </span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
              GameNative is open source. Get the app, download your games and start playing.
            </p>

            <div className="relative mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 px-8 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition-opacity hover:opacity-90 sm:w-auto"
              >
                <a href={DOWNLOAD_URL}>
                  <Download className="mr-2 h-5 w-5" />
                  Download for Android
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-white/15 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join the Discord
                </a>
              </Button>
            </div>

            <p className="relative mt-5 text-sm text-gray-500">
              Open source · Android · APK install
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
            <div className="max-w-sm text-center md:text-left">
              <Link href="/" className="inline-flex items-center gap-3">
                <img
                  src="/ic_launcher-playstore.png"
                  alt="GameNative logo"
                  className="h-9 w-9 rounded-lg"
                />
                <span className="text-lg font-semibold tracking-tight">GameNative</span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                Play your Steam, Epic & GOG library on Android. Open source.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Product
                </span>
                <Link href="/compatibility" className="text-gray-300 transition-colors hover:text-white">
                  Compatibility
                </Link>
                <Link href="/drivers" className="text-gray-300 transition-colors hover:text-white">
                  Graphics Drivers
                </Link>
                <a href={DOWNLOAD_URL} className="text-gray-300 transition-colors hover:text-white">
                  Download
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Community
                </span>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" /> Discord
                </a>
                <a
                  href={X_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
                >
                  <Twitter className="h-4 w-4" /> X
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
                <a
                  href={CONTACT_URL}
                  className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" /> Contact
                </a>
                <a
                  href={KOFI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-300 transition-colors hover:text-orange-200"
                >
                  <Coffee className="h-4 w-4" /> Support on Ko-fi
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-gray-500 md:flex-row">
            <span>© {new Date().getFullYear()} GameNative</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-300"
            >
              Contribute on GitHub
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
