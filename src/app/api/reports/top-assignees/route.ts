import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Group by assigneeId
        const result = await prisma.issue.groupBy({
            by: ['assigneeId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 3 // TOP 3?
        });

        // Enrich with user details
        // We filter null assigneeId
        const validResults = result.filter((r: any) => r.assigneeId !== null);

        // Fetch users
        const users = await prisma.user.findMany({
            where: {
                id: { in: validResults.map((r: any) => r.assigneeId as string) }
            }
        });

        const report = validResults.map((r: any) => {
            const user = users.find((u: any) => u.id === r.assigneeId);
            return {
                assigneeId: r.assigneeId,
                username: user?.username || 'Unknown',
                count: r._count.id
            };
        });

        return NextResponse.json(report);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
