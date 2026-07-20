'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NewsArticle } from '@/lib/news-scoring'

interface Props {
  countryCode: string
}

export default function NewsPanel({ countryCode }: Props) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [noRecent, setNoRecent] = useState(false)
  const [fetchedAt, setFetchedAt] = useState('')

  useEffect(() => {
    setLoading(true)
    setArticles([])
    setError(false)
    setNoRecent(false)

    fetch(`/api/news/${encodeURIComponent(countryCode)}`)
      .then(r => r.json())
      .then(d => {
        if (d.unavailable || !d.articles?.length) {
          setNoRecent(d.noRecent === true)
          setError(true)
          return
        }
        setArticles(d.articles)
        setFetchedAt(d.fetchedAt ?? '')
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [countryCode])

  return (
    <div className="card card--flat overflow-hidden" aria-live="polite" aria-busy={loading}>
      <div className="px-3.5 pt-3.5 pb-3 border-b border-white/[0.04]">
        <div className="section-head">
          <span className="font-data text-[10px] text-[#45E0C0]/60 leading-none">▍</span>
          <p className="microlabel">Economic News · Feed</p>
          {fetchedAt && (
            <span className="font-data text-[8px] text-white/48">
              {new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {loading && (
            <div className="w-2.5 h-2.5 border border-[#45E0C0]/30 border-t-[#45E0C0]/80 rounded-full animate-spin flex-shrink-0" />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div key="skeleton" className="p-3 space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-white/[0.04] rounded animate-pulse" style={{ width: `${75 + i * 8}%` }} />
                <div className="h-2.5 bg-white/[0.03] rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-5 text-[12px] text-white/50 text-center"
          >
            {noRecent
              ? 'No recent economic developments available.'
              : 'Latest economic news currently unavailable.'}
          </motion.p>
        ) : (
          <motion.div
            key="articles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="divide-y divide-white/[0.05]"
          >
            {articles.map((a, i) => (
              <motion.a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.18 }}
                className="block px-3.5 py-3 hover:bg-white/[0.025] transition-colors group"
              >
                <p className="text-[12px] text-white/72 leading-snug group-hover:text-white/90 transition-colors line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-data text-[9px] uppercase tracking-[0.08em] text-[#45E0C0]/60">{a.source}</span>
                  <span className="font-data text-[9px] text-white/48">·</span>
                  <span className="font-data text-[9px] text-white/52">{a.ageLabel}</span>
                </div>
                {a.summary && <p className="text-[10px] text-white/52 mt-1 line-clamp-1">{a.summary}</p>}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
