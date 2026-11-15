import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDevice, getPagedDevices } from '@/lib/compat-snapshot'
import { entityMetadata } from '@/lib/will-it-run'
import { EntityPage } from '@/components/will-it-run/entity-page'

export const dynamicParams = false

export function generateStaticParams() {
  return getPagedDevices().map((d) => ({ slug: d.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const device = getDevice(params.slug)
  return device ? entityMetadata(device) : {}
}

export default function DevicePage({ params }: { params: { slug: string } }) {
  const device = getDevice(params.slug)
  if (!device) notFound()
  return <EntityPage entity={device} />
}
