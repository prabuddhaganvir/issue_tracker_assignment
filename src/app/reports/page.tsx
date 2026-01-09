'use client';

import { useEffect, useState } from 'react';

export default function ReportsPage() {
    const [assignees, setAssignees] = useState<any[]>([]);
    const [latency, setLatency] = useState<any>(null);

    useEffect(() => {
        // Fetch top assignees
        fetch('/api/reports/top-assignees').then(res => res.json()).then(setAssignees);

        // Fetch latency
        fetch('/api/reports/latency').then(res => res.json()).then(setLatency);
    }, []);

    return (
        <main className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Reports</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Top Assignees */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Top Assignees (Open Issues)</h2>
                    <ul className="space-y-3">
                        {assignees.map((a: any) => (
                            <li key={a.assigneeId} className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">{a.username}</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                    {a.count} issues
                                </span>
                            </li>
                        ))}
                        {assignees.length === 0 && <p className="text-gray-500">No data available.</p>}
                    </ul>
                </div>

                {/* Latency */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Resolution Latency</h2>
                    <div className="text-center py-8">
                        {latency ? (
                            <>
                                <div className="text-4xl font-bold text-green-600 mb-2">
                                    {latency.averageResolutionTimeMinutes.toFixed(1)} min
                                </div>
                                <p className="text-gray-500">Average time to close an issue</p>
                                <p className="text-xs text-gray-400 mt-2">Based on {latency.count} closed issues</p>
                            </>
                        ) : (
                            <p>Loading...</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
