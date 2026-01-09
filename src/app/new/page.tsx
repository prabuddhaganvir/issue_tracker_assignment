'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui/core';
import { useRouter } from 'next/navigation';

export default function NewIssue() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'OPEN',
        authorId: 'test-user-1', // Mock default
        assigneeId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...form,
            assigneeId: form.assigneeId || undefined
        };

        try {
            const res = await fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(JSON.stringify(err));
            }

            router.push('/');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Issue</h1>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <Input
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full h-32 rounded-md border border-gray-300 p-2"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                            className="w-full h-10 rounded-md border border-gray-300 px-3"
                            value={form.priority}
                            onChange={e => setForm({ ...form, priority: e.target.value })}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            className="w-full h-10 rounded-md border border-gray-300 px-3"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Author ID (Mock)</label>
                    <Input
                        value={form.authorId}
                        onChange={e => setForm({ ...form, authorId: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Assignee ID (Optional)</label>
                    <Input
                        value={form.assigneeId}
                        onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                        placeholder="UUID"
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Issue'}
                    </Button>
                </div>
            </form>
        </main>
    );
}
