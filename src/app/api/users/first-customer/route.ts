import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const customer = await prisma.user.findFirst({
            where: { role: 'CUSTOMER' }
        });

        if (!customer) {
            return NextResponse.json({ error: 'No customers found. Please seed the database.' }, { status: 404 });
        }

        return NextResponse.json({ customer });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database connection failed. Please run: npx prisma db push && npx tsx prisma/seed.ts' }, { status: 500 });
    }
}
