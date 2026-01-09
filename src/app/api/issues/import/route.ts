import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import { z } from 'zod';

const csvRowSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional().default('OPEN'),
    authorId: z.string().min(1),
    assigneeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const text = await file.text();
        const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true });

        if (errors.length > 0) {
            return NextResponse.json({ error: 'CSV Parsing errors', details: errors }, { status: 400 });
        }

        const report = {
            total: data.length,
            success: 0,
            failures: [] as any[]
        };

        // Process rows
        // We could do this in a large transaction, OR one by one to allow partial success.
        // "Validate each row and return a summary report" suggests partial success might be allowed,
        // or at least we need to report on failures.
        // I'll do it one by one and collect errors.

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const validation = csvRowSchema.safeParse(row);

            if (!validation.success) {
                report.failures.push({ row: i + 1, error: validation.error.issues, data: row });
                continue;
            }

            try {
                await prisma.issue.create({
                    data: {
                        title: validation.data.title,
                        description: validation.data.description,
                        priority: validation.data.priority,
                        status: validation.data.status,

                        assignee: validation.data.assigneeId ? { connect: { id: validation.data.assigneeId } } : undefined,
                        // Check user existence? For bulk import, maybe we assume auth valid or auto-create.
                        // Let's do a quick upsert on author to ensure FK validity.
                        author: {
                            connectOrCreate: {
                                where: { id: validation.data.authorId },
                                create: {
                                    id: validation.data.authorId,
                                    username: 'user_' + validation.data.authorId,
                                    email: validation.data.authorId + '@imported.com'
                                }
                            }
                        }
                    }
                });
                report.success++;
            } catch (e: any) {
                report.failures.push({ row: i + 1, error: e.message, data: row });
            }
        }

        return NextResponse.json(report);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
    }
}
