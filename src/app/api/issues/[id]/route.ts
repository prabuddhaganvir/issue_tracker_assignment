import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateIssueSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assigneeId: z.string().nullable().optional(),
    version: z.number(), // Required for OC
});

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;
        const issue = await prisma.issue.findUnique({
            where: { id },
            include: {
                comments: { include: { author: true } },
                labels: { include: { label: true } },
                author: true,
                assignee: true,
            },
        });

        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        return NextResponse.json(issue);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const validation = updateIssueSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { title, description, status, priority, assigneeId, version } = validation.data;

        const result = await prisma.issue.updateMany({
            where: {
                id,
                version: version
            },
            data: {
                title,
                description,
                status,
                priority,
                assigneeId,
                version: { increment: 1 }
            }
        });

        if (result.count === 0) {
            const exists = await prisma.issue.findUnique({ where: { id } });
            if (!exists) {
                return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Conflict: Issue has been modified by someone else' }, { status: 409 });
        }

        const updatedIssue = await prisma.issue.findUnique({ where: { id } });
        return NextResponse.json(updatedIssue);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
    }
}
