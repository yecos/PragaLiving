import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username },
    })

    if (!admin || admin.password !== password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
