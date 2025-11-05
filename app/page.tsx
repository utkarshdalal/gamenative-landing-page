"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, MessageCircle, Coffee, ChevronDown, Wrench, Car, Github } from "lucide-react"
import Link from "next/link"

export default function GameNativePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 animate-pulse" />
      </div>

      <div className="container max-w-3xl mx-auto px-4 relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center items-center text-center">
          <img className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl mb-8 shadow-2xl shadow-purple-500/40" src="/ic_launcher-playstore.png" alt="GameNative Logo"/>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            GameNative
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Free, open-source PC gaming via Steam, on Android.
          </h2>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl leading-relaxed">
            Play your favorite PC games directly on your Android device. Just log in to Steam, install your game, and start playing, with full cloud save support.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 text-lg shadow-lg shadow-purple-500/40"
            >
              <a href="https://downloads.gamenative.app/releases/0.5.1/gamenative-v0.5.1.apk">
                <Download className="w-5 h-5 mr-2" />
                Download Now
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-semibold py-4 text-lg bg-transparent"
            >
              <Link href="/compatibility">
                <Wrench className="w-5 h-5 mr-2" />
                Compatibility
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-semibold py-4 text-lg bg-transparent"
            >
              <Link href="/drivers">
                <Car className="w-5 h-5 mr-2" />
                Graphics Drivers
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-semibold py-4 text-lg bg-transparent"
            >
              <a href="https://discord.gg/2hKv4VfZfE" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Join the Discord
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-semibold py-4 text-lg bg-transparent"
            >
              <a href="https://github.com/utkarshdalal/GameNative" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold py-4 text-lg bg-transparent"
            >
              <a href="https://ko-fi.com/gamenative" target="_blank" rel="noopener noreferrer">
                <Coffee className="w-5 h-5 mr-2" />
                Support on Ko-fi
              </a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
