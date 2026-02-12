"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegistrationStore } from '@/store/useRegistrationStore';
import { Loader2, Users, Check, ChevronRight } from 'lucide-react';
import { SuccessAnimation } from '@/components/SuccessAnimation';

interface Department {
    id: string;
    name: string;
    subDepartments: string[];
}

function JoinDepartmentContent() {
    const router = useRouter();
    const { data, updateData } = useRegistrationStore();
    const searchParams = useSearchParams();
    
    // Get uniqueId from URL if available (e.g. redirected from payment) 
    // or from store (e.g. redirected from registration)
    const uniqueId = searchParams.get('id') || data.uniqueId;

    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [view, setView] = useState<'selection' | 'dept-form' | 'success'>('selection');
    
    // Form State
    const [status, setStatus] = useState<'New' | 'Member' | 'Just Member' | ''>('');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSubDept, setSelectedSubDept] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDepts = async () => {
             const res = await fetch('/api/admin/departments');
             const d = await res.json();
             if (d.success) setDepartments(d.departments);
             setLoading(false);
        };
        fetchDepts();
    }, []);

    const handleChoice = (choice: 'New' | 'Member' | 'Just Member') => {
        setStatus(choice);
        if (choice === 'Just Member') {
            submitChoice(choice, '', '');
        } else {
            setView('dept-form');
        }
    };

    const submitChoice = async (userStatus: string, dept: string, subDept: string) => {
        setSubmitting(true);
        if(!uniqueId) {
            alert("User ID missing. Please register first.");
            router.push('/');
            return;
        }

        try {
            const res = await fetch('/api/join-department', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uniqueId,
                    status: userStatus,
                    department: dept,
                    subDepartment: subDept
                }),
            });
            const result = await res.json();
            if (result.success) {
                setView('success');
            } else {
                alert("Failed to update: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error submitting.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (view === 'success') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <SuccessAnimation name={data.fullName || "Friend"} uniqueId={uniqueId || ""} />
                <button 
                    onClick={() => router.push('/')}
                    className="mt-8 bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    if (view === 'dept-form') {
         const currentDept = departments.find(d => d.name === selectedDept);

         return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        {status === 'New' ? "Join a Workforce" : "Your Department"}
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-300 block mb-2">Select Department</label>
                            <select 
                                value={selectedDept}
                                onChange={(e) => { setSelectedDept(e.target.value); setSelectedSubDept(''); }}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                            >
                                <option value="">-- Choose Department --</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {currentDept && currentDept.subDepartments.length > 0 && (
                             <div>
                                <label className="text-sm font-medium text-gray-300 block mb-2">Select Sub-Department</label>
                                <select 
                                    value={selectedSubDept}
                                    onChange={(e) => setSelectedSubDept(e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                                >
                                    <option value="">-- Choose Unit --</option>
                                    {currentDept.subDepartments.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            onClick={() => submitChoice(status, selectedDept, selectedSubDept)}
                            disabled={!selectedDept || submitting}
                            className="w-full btn-primary py-3 font-bold mt-4 flex justify-center items-center disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : "Confirm Selection"}
                        </button>
                    </div>
                </div>
            </div>
         );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-xl w-full text-center space-y-8">
                <div>
                     <h1 className="text-3xl font-bold text-white mb-2">Become a Worker?</h1>
                     <p className="text-gray-400">Would you like to serve in a department during GAC 2026?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => handleChoice('New')}
                        className="p-6 bg-card border border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <PlusIcon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white mb-2">Join New</h3>
                        <p className="text-xs text-gray-500">I want to join a workforce</p>
                    </button>
                    
                    <button
                        onClick={() => handleChoice('Member')}
                        className="p-6 bg-card border border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all group"
                    >
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white mb-2">Already Member</h3>
                        <p className="text-xs text-gray-500">I already belong to a department</p>
                    </button>

                    <button
                        onClick={() => handleChoice('Just Member')}
                        className="p-6 bg-card border border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all group"
                    >
                         <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:bg-gray-500 group-hover:text-white transition-colors">
                            <Check className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white mb-2">Just Attend</h3>
                        <p className="text-xs text-gray-500">I just want to attend as a member</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Icon helper
function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    )
}

export default function JoinDepartmentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <JoinDepartmentContent />
        </Suspense>
    );
}
