import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateLabelsSchema = z.object({
    labelIds: z.array(z.string()),
});

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id: issueId } = params;
        const body = await request.json();
        const validation = updateLabelsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { labelIds } = validation.data;

        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.issueLabel.deleteMany({
                where: { issueId }
            });

            if (labelIds.length > 0) {
                await tx.issueLabel.createMany({
                    data: labelIds.map(labelId => ({
                        issueId,
                        labelId
                    }))
                });
            }
        });

        const updated = await prisma.issue.findUnique({
            where: { id: issueId },
            include: { labels: { include: { label: true } } }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update labels' }, { status: 500 });
    }
}
