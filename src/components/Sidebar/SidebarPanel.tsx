'use client'

import { motion } from 'framer-motion'
import CityView from './CityView'
import ComparePanel from './ComparePanel'
import CountryView from './CountryView'
import { flagEmoji } from '@/lib/country-meta'
import type { SelectedEntity } from '@/types/globe'

interface Props {
  entity: SelectedEntity
  compareEntity?: SelectedEntity | null
  onClose: () => void
  onCloseCompare?: () => void
  onStartCompare?: () => void
  showNews?: boolean
  timelineYear?: number
}

function resolveCode(entity: SelectedEntity | null | undefined) {
  if (!entity) return ''
  return entity.countryCode && entity.countryCode !== '-99' ? entity.countryCode : entity.id
}

export default function SidebarPanel({
  entity, compareEntity, onClose, onCloseCompare, onStartCompare, showNews = false, timelineYear,
}: Props) {
  const isCity = entity.type === 'city'
  const flag = !isCity && entity.countryCode ? flagEmoji(entity.countryCode) : null
  const hasCompare = Boolean(compareEntity && compareEntity.countryCode && entity.countryCode)

  const panelWidth = hasCompare
    ? 'sm:w-[680px] sm:max-w-[92vw]'
    : 'sm:w-[400px] sm:max-w-[88vw]'

  const codeA = resolveCode(entity)
  const codeB = resolveCode(compareEntity)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={`absolute top-12 bottom-8 left-0 right-0 w-auto max-w-none z-30 sm:left-auto sm:z-20 flex flex-col ${panelWidth}`}
    >
      <div
        className="h-full glass flex flex-col border-l border-white/[0.08] overflow-hidden"
        style={{ boxShadow: 'inset 1px 0 0 rgba(69,224,192,0.10)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.2 }}
          className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0"
        >
          <div className="flex items-start gap-3 min-w-0">
            {flag && <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{flag}</span>}
            <div className="min-w-0">
              <p className="microlabel mb-1.5">
                {isCity ? entity.country : hasCompare ? 'Country Comparison' : 'Economic Overview'}
                {timelineYear && !hasCompare && <span className="ml-2 text-[#45E0C0]/40">· {timelineYear}</span>}
              </p>
              <h2 className="font-display text-[19px] font-semibold text-white leading-tight truncate">
                {hasCompare ? `${entity.name} vs ${compareEntity!.name}` : entity.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {hasCompare && onCloseCompare && (
              <button
                onClick={onCloseCompare}
                className="font-data text-[9px] uppercase tracking-[0.14em] px-2.5 py-1.5 rounded border border-white/10 text-white/35 hover:text-[#45E0C0]/70 hover:border-[#45E0C0]/25 transition-colors"
              >
                Exit Compare
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="w-7 h-7 rounded border border-white/10 flex items-center justify-center font-data text-[11px] text-white/30 hover:text-[#45E0C0] hover:border-[#45E0C0]/40 hover:bg-[rgba(69,224,192,0.06)] transition-colors leading-none"
            >
              ✕
            </button>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {hasCompare ? (
            <ComparePanel codeA={codeA} nameA={entity.name} codeB={codeB} nameB={compareEntity!.name} />
          ) : isCity ? (
            <CityView cityId={entity.id} />
          ) : (
            <CountryView
              countryCode={codeA}
              countryName={entity.name}
              showNews={showNews}
              timelineYear={timelineYear}
              onCompare={onStartCompare}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
