import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const closedIssues = await prisma.issue.findMany({
            where: {
                status: 'CLOSED'
            },
            select: {
                createdAt: true,
                updatedAt: true
            }
        });

        if (closedIssues.length === 0) {
            return NextResponse.json({ averageResolutionTimeMs: 0, averageResolutionTimeMinutes: 0, count: 0 });
        }

        const totalTime = closedIssues.reduce((acc: number, issue: any) => {
            const resolutionTime = issue.updatedAt.getTime() - issue.createdAt.getTime();
            return acc + resolutionTime;
        }, 0);

        const average = totalTime / closedIssues.length;

        return NextResponse.json({
            averageResolutionTimeMs: average,
            averageResolutionTimeMinutes: average / 1000 / 60,
            count: closedIssues.length
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
