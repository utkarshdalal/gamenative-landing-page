import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGpu, getPagedGpus } from '@/lib/compat-snapshot'
import { entityMetadata } from '@/lib/will-it-run'
import { EntityPage } from '@/components/will-it-run/entity-page'

export const dynamicParams = false

export function generateStaticParams() {
  return getPagedGpus().map((g) => ({ slug: g.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const gpu = getGpu(params.slug)
  return gpu ? entityMetadata(gpu) : {}
}

export default function GpuPage({ params }: { params: { slug: string } }) {
  const gpu = getGpu(params.slug)
  if (!gpu) notFound()
  return <EntityPage entity={gpu} />
}
