import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import manifest from "@/data/manifest.json"

export default function DriversPage() {
  const drivers = Object.entries(manifest).map(([name, filename]) => ({
    name,
    filename,
    downloadUrl: `https://downloads.gamenative.app/drivers/${filename}`,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-cyan-400 hover:text-cyan-300 mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Driver Downloads
          </h1>
          <p className="text-gray-300 text-lg">
            Download the latest ARM64 graphics drivers for Winlator Bionic or other ARM64-based emulators.
          </p>
        </div>

        <div className="grid gap-4">
          {drivers.map((driver) => (
            <Card key={driver.name} className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white break-all">{driver.name}</h3>
                  </div>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <a href={driver.downloadUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-gray-900/30 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
              <p className="text-gray-300 mb-4">Join our Discord community for support and installation guides.</p>
              <Button
                asChild
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
              >
                <a href="https://discord.gg/2hKv4VfZfE" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Discord
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
