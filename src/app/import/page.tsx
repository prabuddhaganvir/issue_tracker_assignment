'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/core';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/issues/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setReport(data);
        } catch (e) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Import Issues from CSV</h1>

            <div className="bg-white p-6 rounded shadow mb-6">
                <p className="mb-4 text-sm text-gray-600">
                    CSV Format: <code>title, description, priority, status, authorId, assigneeId</code>
                </p>
                <form onSubmit={handleUpload} className="space-y-4">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Button type="submit" disabled={!file || uploading}>
                        {uploading ? 'Importing...' : 'Upload CSV'}
                    </Button>
                </form>
            </div>

            {report && (
                <div className="bg-gray-50 p-6 rounded">
                    <h2 className="text-xl font-bold mb-4">Import Report</h2>
                    <div className="flex gap-4 mb-4">
                        <div className="bg-blue-100 p-3 rounded">Total: {report.total}</div>
                        <div className="bg-green-100 p-3 rounded">Success: {report.success}</div>
                        <div className="bg-red-100 p-3 rounded">Failed: {report.failures.length}</div>
                    </div>

                    {report.failures.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Failures:</h3>
                            <ul className="space-y-2">
                                {report.failures.map((f: any, i: number) => (
                                    <li key={i} className="text-sm bg-white p-2 border rounded">
                                        Row {f.row}: {JSON.stringify(f.error)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
