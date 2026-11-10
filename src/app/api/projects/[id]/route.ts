import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const project = await db.project.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project })
  } catch (e) {
    console.error('Get project error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await db.project.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Delete project error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const project = await db.project.update({
      where: { id },
      data: body
    })
    return NextResponse.json({ project })
  } catch (e) {
    console.error('Patch project error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
