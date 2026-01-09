import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
    issueIds: z.array(z.string()).min(1),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = bulkUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { issueIds, status } = validation.data;

        // Transactional update
        const result = await prisma.$transaction(async (tx: any) => {
            // Optional: Validation logic.
            // E.g. check if all issues exist.
            const count = await tx.issue.count({
                where: { id: { in: issueIds } }
            });

            if (count !== issueIds.length) {
                throw new Error(`One or more issues not found. Found ${count}/${issueIds.length}`);
            }

            // Update all
            const updateBatch = await tx.issue.updateMany({
                where: { id: { in: issueIds } },
                data: {
                    status,
                    version: { increment: 1 } // Bump version for all
                }
            });

            return updateBatch;
        });

        return NextResponse.json({ message: 'Bulk update successful', count: result.count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to bulk update' }, { status: 400 });
    }
}
