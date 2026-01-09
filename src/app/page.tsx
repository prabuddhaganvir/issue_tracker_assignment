'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@/components/ui/core';
import Link from 'next/link';

interface Issue {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: { username: string } | null;
    createdAt: string;
}

export default function IssueList() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchIssues = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);

        try {
            const res = await fetch(`/api/issues?${params.toString()}`);
            const data = await res.json();
            setIssues(data.data || []); // Handle paginated response structure
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, [statusFilter]);

    return (
        <main className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Issue Tracker</h1>
                <div className="space-x-4">
                    <Link href="/reports">
                        <Button className='bg-zinc-600 hover:bg-zinc-700'>Reports</Button>
                    </Link>
                    <Link href="/import">
                        <Button className='bg-green-600 hover:bg-green-700'>Import CSV</Button>
                    </Link>
                    <Link href="/new">
                        <Button>New Issue</Button>
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <select
                    className="h-10 rounded-md border border-gray-300 px-3"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CLOSED">Closed</option>
                </select>
                <Button onClick={fetchIssues} variant="secondary">Refresh</Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {issues.map((issue) => (
                                <tr key={issue.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <Link href={`/issues/${issue.id}`} className="text-blue-600 hover:underline font-medium">
                                            {issue.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${issue.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                                issue.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {issue.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{issue.priority}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{issue.assignee?.username || 'Unassigned'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(issue.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {issues.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No issues found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
