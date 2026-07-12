import { NextResponse } from 'next/server'
import { getCityById } from '@/lib/cities'

export async function GET(_req: Request, { params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params
  const city = getCityById(decodeURIComponent(cityId))
  if (!city) return NextResponse.json({ success: false }, { status: 404 })
  return NextResponse.json({ success: true, city })
}
