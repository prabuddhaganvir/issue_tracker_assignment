'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@/components/ui/core';
import { useParams, useRouter } from 'next/navigation';

export default function IssueDetail() {
    const { id } = useParams();
    const router = useRouter();

    const [issue, setIssue] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit State
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    // Comment State
    const [newComment, setNewComment] = useState('');

    const fetchIssue = async () => {
        try {
            const res = await fetch(`/api/issues/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setIssue(data);
            setEditForm({
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId || '',
                version: data.version
            });
        } catch (e) {
            setError('Issue not found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchIssue();
    }, [id]);

    const handleUpdate = async () => {
        try {
            const res = await fetch(`/api/issues/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    assigneeId: editForm.assigneeId || null,
                    version: issue.version // Pass current version for OC
                }),
            });

            if (res.status === 409) {
                alert('Conflict! This issue has been modified by someone else. Reloading...');
                fetchIssue();
                return;
            }

            if (!res.ok) throw new Error('Update failed');

            const updated = await res.json();
            setIssue(updated);
            setEditMode(false);
            fetchIssue(); // Re-fetch to normalize state
        } catch (e) {
            alert('Failed to update');
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await fetch(`/api/issues/${id}/comments`, {
                method: 'POST',
                body: JSON.stringify({
                    content: newComment,
                    authorId: 'test-user-1' // Mock
                })
            });
            setNewComment('');
            fetchIssue();
        } catch (e) {
            alert('Failed to post comment');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!issue) return <div className="p-8">Issue not found</div>;

    return (
        <main className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Button variant="outline" onClick={() => router.push('/')}>&larr; Back</Button>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-start mb-4">
                    {editMode ? (
                        <div className="w-full space-y-4">
                            <Input
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                className="text-xl font-bold"
                            />
                            <textarea
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full h-32 border p-2 rounded"
                            />
                            <div className="flex gap-4">
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    className="border p-2 rounded"
                                >
                                    <option>OPEN</option>
                                    <option>IN_PROGRESS</option>
                                    <option>CLOSED</option>
                                </select>
                                <select
                                    value={editForm.priority}
                                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                                    className="border p-2 rounded"
                                >
                                    <option>LOW</option>
                                    <option>MEDIUM</option>
                                    <option>HIGH</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleUpdate}>Save Changes</Button>
                                <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="flex justify-between">
                                <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
                                <Button onClick={() => setEditMode(true)}>Edit</Button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <span className="bg-gray-100 px-2 py-1 rounded text-sm">Status: {issue.status}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded text-sm">Priority: {issue.priority}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded text-sm">Assignee: {issue.assignee?.username || 'None'}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded text-sm">Ver: {issue.version}</span>
                            </div>
                            <div className="mt-6 prose">
                                <p>{issue.description}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Labels Section could go here */}

            <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Comments</h3>
                <div className="space-y-4 mb-6">
                    {issue.comments?.map((c: any) => (
                        <div key={c.id} className="bg-white p-4 rounded shadow-sm">
                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                                <span>{c.author?.username || c.authorId}</span>
                                <span>{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p>{c.content}</p>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleComment} className="flex gap-2">
                    <Input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1"
                    />
                    <Button type="submit">Post</Button>
                </form>
            </div>
        </main>
    );
}
