import type { MetadataRoute } from 'next'
import {
  entityPath,
  gamePath,
  getGamePages,
  getPairParams,
  getPagedDevices,
  getPagedGpus,
  getSnapshot,
  pairPath,
} from '@/lib/compat-snapshot'
import { HUB_PATH, SITE_URL } from '@/lib/will-it-run'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const snapshotDate = new Date(getSnapshot().meta.generatedAt)
  const url = (p: string) => `${SITE_URL}${p}`
  return [
    { url: url('/') },
    { url: url('/compatibility/') },
    { url: url('/drivers/') },
    { url: url('/privacy/') },
    { url: url(HUB_PATH), lastModified: snapshotDate },
    ...[...getPagedDevices(), ...getPagedGpus()].map((e) => ({
      url: url(entityPath(e)),
      lastModified: snapshotDate,
    })),
    ...getPairParams().map((p) => ({
      url: url(pairPath(p.slug, p.device)),
      lastModified: snapshotDate,
    })),
    ...getGamePages().map((g) => ({ url: url(gamePath(g.slug)), lastModified: snapshotDate })),
  ]
}
