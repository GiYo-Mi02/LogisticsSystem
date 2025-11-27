import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const driver = await prisma.user.findFirst({
            where: { role: 'DRIVER' },
            include: { currentVehicle: true }
        });

        if (!driver) {
            return NextResponse.json({ error: 'No drivers found. Please seed the database.' }, { status: 404 });
        }

        return NextResponse.json({ driver });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database connection failed. Please run: npx prisma db push && npx tsx prisma/seed.ts' }, { status: 500 });
    }
}
