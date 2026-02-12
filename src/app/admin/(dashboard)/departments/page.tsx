"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';

interface Department {
    id: string;
    name: string;
    subDepartments: string[];
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // New Department State
    const [newDeptName, setNewDeptName] = useState('');
    const [newSubDepts, setNewSubDepts] = useState(''); // Comma separated for simplicity first
    const [isAdding, setIsAdding] = useState(false);

    const fetchDepartments = async () => {
        try {
            const res = await fetch('/api/admin/departments');
            const data = await res.json();
            if (data.success) {
                setDepartments(data.departments);
            }
        } catch (err) {
            console.error("Failed to fetch departments", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        setIsAdding(true);
        try {
            const subDeptsArray = newSubDepts.split(',').map(s => s.trim()).filter(Boolean);
            
            const res = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDeptName, subDepartments: subDeptsArray }),
            });

            const result = await res.json();
            if (result.success) {
                setNewDeptName('');
                setNewSubDepts('');
                fetchDepartments();
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Department Management</h1>

            {/* Add New Department Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Department</h2>
                <form onSubmit={handleAddDepartment} className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Department Name</label>
                        <input
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="e.g. Media"
                        />
                    </div>
                    <div className="flex-[2] w-full">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Sub-Departments (comma separated)</label>
                        <input
                            value={newSubDepts}
                            onChange={(e) => setNewSubDepts(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="e.g. Camera, Sound, Projection"
                        />
                    </div>
                    <div className="mt-6">
                        <button 
                            type="submit" 
                            disabled={isAdding}
                            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isAdding ? <Loader2 className="animate-spin" /> : <span className="flex items-center"><Plus className="w-4 h-4 mr-1"/> Add</span>}
                        </button>
                    </div>
                </form>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>

            {/* Departments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <div key={dept.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">{dept.name}</h3>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                {dept.subDepartments.length} Units
                            </span>
                        </div>
                        <div className="p-4">
                            {dept.subDepartments.length > 0 ? (
                                <ul className="space-y-2">
                                    {dept.subDepartments.map((sub, idx) => (
                                        <li key={idx} className="flex items-center text-sm text-gray-600">
                                            <ChevronRight className="w-3 h-3 mr-2 text-gray-400" />
                                            {sub}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No sub-departments</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    No departments found. Add one above.
                </div>
            )}
        </div>
    );
}
