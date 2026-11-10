import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ projects })
  } catch (e) {
    console.error('List projects error:', e)
    return NextResponse.json({ error: 'Failed to list projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, topic, style, duration, voice } = body
    if (!topic) {
      return NextResponse.json({ error: 'Topic required' }, { status: 400 })
    }
    const project = await db.project.create({
      data: {
        title: title || topic.slice(0, 60),
        topic,
        style: style || 'cinematic',
        duration: duration || '30s',
        voice: voice || 'male',
        status: 'draft'
      }
    })
    return NextResponse.json({ project })
  } catch (e) {
    console.error('Create project error:', e)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
