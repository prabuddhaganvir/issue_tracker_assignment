import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty'),
    authorId: z.string().min(1, 'Author ID is required'),
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id: issueId } = params;
        const body = await request.json();
        const validation = createCommentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { content, authorId } = validation.data;

        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        let author = await prisma.user.findUnique({ where: { id: authorId } });
        if (!author) {
            author = await prisma.user.create({
                data: { id: authorId, username: 'user_' + authorId, email: authorId + '@example.com' }
            }).catch(() => null);
        }

        if (!author) {
            return NextResponse.json({ error: 'Author check failed' }, { status: 500 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                issueId,
                authorId,
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}
