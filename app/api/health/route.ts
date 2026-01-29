import { NextResponse } from 'next/server';
import prisma from '@/lib/config/database';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
    });
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Server is running but database is not connected',
        database: 'disconnected',
      },
      { status: 503 }
    );
  }
}
