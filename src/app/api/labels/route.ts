import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLabelSchema = z.object({
    name: z.string().min(1),
    color: z.string().min(1), // e.g. hex code or name
});

export async function GET() {
    try {
        const labels = await prisma.label.findMany();
        return NextResponse.json(labels);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createLabelSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { name, color } = validation.data;

        const label = await prisma.label.create({
            data: { name, color }
        });

        return NextResponse.json(label, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
    }
}
