import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createIssueSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
    authorId: z.string().min(1, 'Author ID is required'), // In real app, get from session
    assigneeId: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const stop = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    try {
        const [issues, total] = await Promise.all([
            prisma.issue.findMany({
                where,
                skip: stop,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: true,
                    assignee: true,
                    labels: {
                        include: {
                            label: true
                        }
                    }
                }
            }),
            prisma.issue.count({ where }),
        ]);

        return NextResponse.json({
            data: issues,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createIssueSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { title, description, priority, status, authorId, assigneeId } = validation.data;

        // Check if author exists (mock auth check)
        const author = await prisma.user.findUnique({ where: { id: authorId } });
        if (!author) {
            // Auto-create user for simplicity if not exists (mock auth)
            await prisma.user.create({
                data: { id: authorId, username: 'user_' + authorId, email: authorId + '@example.com' }
            }).catch(() => { }); // Ignore if race condition
        }

        const issue = await prisma.issue.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                status: status || 'OPEN',
                authorId,
                assigneeId,
            },
        });

        return NextResponse.json(issue, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
    }
}
