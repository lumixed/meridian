'use client'

import { motion } from 'framer-motion'
import CountryView from './CountryView'
import { flagEmoji } from '@/lib/country-meta'
import type { SelectedEntity } from '@/types/globe'

interface Props {
  entity: SelectedEntity
  onClose: () => void
}

export default function SidebarPanel({ entity, onClose }: Props) {
  const flag = entity.countryCode ? flagEmoji(entity.countryCode) : null
  const countryCode = entity.countryCode && entity.countryCode !== '-99'
    ? entity.countryCode
    : entity.id

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute top-0 bottom-0 right-0 w-[400px] max-w-[88vw] z-20 flex flex-col"
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
              <p className="microlabel mb-1.5">Economic Overview</p>
              <h2 className="font-display text-[19px] font-semibold text-white leading-tight truncate">{entity.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="w-7 h-7 rounded border border-white/10 flex items-center justify-center font-data text-[11px] text-white/30 hover:text-[#45E0C0] hover:border-[#45E0C0]/40 hover:bg-[rgba(69,224,192,0.06)] transition-colors leading-none flex-shrink-0"
          >
            ✕
          </button>
        </motion.div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <CountryView countryCode={countryCode} countryName={entity.name} />
        </div>
      </div>
    </motion.div>
  )
}
