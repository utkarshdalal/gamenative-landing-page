import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - GameNative',
  description:
    'How GameNative collects, uses, and protects your data across Android and Meta Horizon (Quest), including subscription verification and data deletion requests.',
}

const CONTACT_EMAIL = 'support@gamenative.app'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-gray-300 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm">Last updated: June 26, 2026</p>
        </div>

        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <p className="text-gray-300 leading-relaxed mb-8">
              GameNative is an application that lets you access and play your owned PC games on
              supported devices. This policy explains what data we access, how we use it, and how
              you can request its deletion.
            </p>

            <Section title="Data we store locally">
              <p>
                Sensitive data — including your login credentials and session information for the
                game stores you sign into (such as Steam, Epic Games, GOG, and Amazon) — is stored
                locally on your device. We do not collect, transmit, or store this personal
                information on our own servers.
              </p>
            </Section>

            <Section title="Game store integrations">
              <p>
                GameNative connects to the PC game stores you choose to sign into — Steam, Epic
                Games, GOG, and Amazon. Your device communicates directly with that store&apos;s
                servers to authenticate your account and access your game library. Any data those
                stores collect or process is governed by their own privacy policies and terms of
                service.
              </p>
            </Section>

            <Section title="Anonymous usage metadata">
              <p>
                We collect limited, non-personal technical metadata to improve compatibility and
                performance. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Game launch and close events</li>
                <li>Selected configuration settings</li>
                <li>Hardware category information such as GPU family or driver type</li>
                <li>Performance indicators such as FPS ranges or crash flags</li>
              </ul>
              <p>This data does not include your name, email, Steam credentials, IP address, or any
                direct identifiers, cannot be used to identify you personally, and is used only to
                improve compatibility, recommend working settings, and prioritize fixes. We do not
                build user profiles, track browsing activity, or sell data to third parties.
              </p>
            </Section>

            <Section title="Meta Horizon (Quest) subscriptions">
              <p>
                The version of GameNative distributed through the{' '}
                <span className="text-white">Meta Horizon Store</span> offers a paid subscription.
                The free, open-source build distributed via GitHub does not include a subscription
                and does not access any of the data described in this section.
              </p>
              <p>To verify an active subscription on the Meta Horizon Store version, we access:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>your <span className="text-white">Meta account ID</span>, and</li>
                <li>your <span className="text-white">subscription / entitlement status</span> for this app.</li>
              </ul>
              <p>
                This information is used <span className="text-white">solely</span> to confirm you
                have an active subscription and unlock the app. We do not store it on our own
                servers, and we do not share or sell it. It is processed on your device and through
                Meta&apos;s In-App Purchases platform; Meta&apos;s handling of this data is governed
                by Meta&apos;s privacy policy.
              </p>
            </Section>

            <Section title="Third-party services">
              <ul className="list-disc pl-6 space-y-1">
                <li><span className="text-white">Steam, Epic Games, GOG, and Amazon</span> — account authentication and game library access for the stores you sign into.</li>
                <li><span className="text-white">Meta Horizon</span> — subscription verification on the Meta Horizon Store version (Quest).</li>
              </ul>
              <p>
                We have no control over how these platforms independently collect or use your
                information. Please refer to their respective privacy policies.
              </p>
            </Section>

            <Section title="Data security">
              <p>
                Your login credentials and session data are stored securely on your device using
                Android&apos;s standard security protocols, and are used only to facilitate
                communication between your device and Steam&apos;s servers.
              </p>
            </Section>

            <Section title="Your rights and data deletion">
              <p>You can clear all locally stored data at any time by:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Logging out of the app</li>
                <li>Clearing app data through your device settings</li>
                <li>Uninstalling the application</li>
              </ul>
              <p>
                We do not retain your personal information on our own servers. If you believe we
                hold any data associated with you — for example, support correspondence — you can
                request its deletion by emailing{' '}
                <a className="text-cyan-400 hover:text-cyan-300" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                , and we will action verified requests.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We may update this privacy policy from time to time. Changes are effective
                immediately upon posting the updated policy on this page.
              </p>
            </Section>

            <Section title="Age requirements">
              <p>
                Users must be at least 13 years old to use GameNative, in accordance with
                Steam&apos;s own age requirements.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For questions about this policy or our privacy practices, contact us at{' '}
                <a className="text-cyan-400 hover:text-cyan-300" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <Button
                asChild
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent mt-2"
              >
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email us
                </a>
              </Button>
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
