'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
    description: string | null;
    htmlTemplate: string | null;
    isDefault: boolean;
    createdAt: string;
    _count: { courses: number };
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background: #fff; margin: 0; padding: 0; overflow: hidden; }
    .cert-container { 
      width: 800px; 
      height: 600px; 
      padding: 40px; 
      border: 15px solid #4f46e5; 
      background: #fdfdfd; 
      position: relative; 
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      color: rgba(79, 70, 229, 0.05);
      z-index: 0;
      white-space: nowrap;
      pointer-events: none;
    }
    .content { position: relative; z-index: 1; }
    .org-name { font-size: 20px; font-weight: 600; color: #4f46e5; margin-bottom: 30px; }
    h1 { font-size: 48px; color: #111; margin: 0 0 10px; font-family: 'Serif'; }
    .subtitle { font-size: 18px; color: #666; margin-bottom: 40px; }
    .student-label { font-size: 16px; color: #888; text-transform: uppercase; letter-spacing: 2px; }
    .student-name { font-size: 36px; font-weight: bold; color: #111; margin: 10px 0 30px; border-bottom: 2px solid #ddd; display: inline-block; padding: 0 40px; }
    .course-text { font-size: 18px; color: #444; }
    .course-name { font-size: 24px; font-weight: 600; color: #4f46e5; margin: 10px 0 40px; }
    .footer { width: 100%; display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px; font-size: 14px; color: #888; }
    .signature { border-top: 1px solid #aaa; padding-top: 5px; width: 150px; }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="watermark">{{organizationName}}</div>
    <div class="content">
      <div class="org-name">{{organizationName}}</div>
      <h1>CERTIFICATE</h1>
      <div class="subtitle">OF COMPLETION</div>
      <div class="student-label">This is to certify that</div>
      <div class="student-name">{{studentName}}</div>
      <div class="course-text">has successfully completed the course</div>
      <div class="course-name">{{courseName}}</div>
      <div class="score">Final Score: {{score}}%</div>
      <div class="footer">
        <div class="date-box">Date: {{date}}</div>
        <div class="cert-id">ID: {{certId}}</div>
        <div class="signature">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;

const BLANK_ORG_FORM = { name: '', description: '', htmlTemplate: DEFAULT_TEMPLATE, isDefault: false };

export default function OrganizationsPage() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [form, setForm] = useState(BLANK_ORG_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTemplateHelp, setShowTemplateHelp] = useState(false);
    const previewRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userData || !token) { router.push('/login'); return; }
        const user = JSON.parse(userData);
        if (user.role !== 'admin') { router.push('/dashboard'); return; }
        fetchOrganizations();
    }, [router]);

    useEffect(() => {
        if (view === 'editor' && previewRef.current) {
            updatePreview();
        }
    }, [form.htmlTemplate, form.name, view]);

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/organizations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrganizations(data.organizations || []);
        } catch {
            setError('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const updatePreview = () => {
        if (!previewRef.current) return;
        const doc = previewRef.current.contentDocument;
        if (!doc) return;

        let html = form.htmlTemplate || '<div style="padding: 20px; font-family: sans-serif;">Build your template to see a preview here...</div>';

        // Replace placeholders with dummy data
        const dummyData: Record<string, string> = {
            '{{studentName}}': 'John Doe',
            '{{courseName}}': 'Advanced Web Development',
            '{{organizationName}}': form.name || 'Your Organization',
            '{{score}}': '95',
            '{{date}}': new Date().toLocaleDateString(),
            '{{certId}}': 'CERT-12345-ABC'
        };

        Object.keys(dummyData).forEach(key => {
            html = html.replace(new RegExp(key, 'g'), dummyData[key]);
        });

        doc.open();
        doc.write(html);
        // Force overflow hidden on body
        if (doc.body) doc.body.style.overflow = 'hidden';
        doc.close();
    };

    const openAdd = () => {
        setEditOrg(null);
        setForm(BLANK_ORG_FORM);
        setError(null);
        setView('editor');
    };

    const openEdit = (org: Organization) => {
        setEditOrg(org);
        setForm({
            name: org.name,
            description: org.description || '',
            htmlTemplate: org.htmlTemplate || '',
            isDefault: org.isDefault
        });
        setError(null);
        setView('editor');
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) { setError('Name is required'); return; }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = editOrg ? `/api/admin/organizations/${editOrg.id}` : '/api/admin/organizations';
            const method = editOrg ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setView('list');
            fetchOrganizations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (org: Organization) => {
        if (!confirm(`Delete "${org.name}"? Courses linked to this organization will have no organization.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/organizations/${org.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchOrganizations();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    if (view === 'editor') {
        return (
            <div className="min-h-screen bg-gray-50 pb-12">
                <div className="max-w-[1600px] mx-auto pt-6 px-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setView('list')}
                                className="bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{editOrg ? `Edit: ${editOrg.name}` : 'New Organization'}</h1>
                                <p className="text-gray-500 text-sm">Design your custom certificate template</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {error && <span className="text-red-600 text-sm font-medium mr-4">{error}</span>}
                            <button
                                onClick={() => setView('list')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !form.name.trim()}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:bg-gray-400"
                            >
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {editOrg ? 'Save Changes' : 'Create Organization'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
                        {/* Editor Side */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. AFC Academy"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                        placeholder="Internal reference description"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-semibold text-gray-700">HTML Template</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowTemplateHelp(!showTemplateHelp)}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                                {showTemplateHelp ? 'Hide Help' : 'Show Help'}
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Replace current template with example?')) setForm({ ...form, htmlTemplate: DEFAULT_TEMPLATE }) }}
                                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                                            >
                                                Load Example
                                            </button>
                                        </div>
                                    </div>

                                    {showTemplateHelp && (
                                        <div className="mb-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 grid grid-cols-2 gap-2 text-[11px]">
                                            <code className="text-indigo-700">{'{{studentName}}'}</code>
                                            <code className="text-indigo-700">{'{{courseName}}'}</code>
                                            <code className="text-indigo-700">{'{{organizationName}}'}</code>
                                            <code className="text-indigo-700">{'{{score}}'}</code>
                                            <code className="text-indigo-700">{'{{date}}'}</code>
                                            <code className="text-indigo-700">{'{{certId}}'}</code>
                                        </div>
                                    )}

                                    <textarea
                                        value={form.htmlTemplate}
                                        onChange={e => setForm({ ...form, htmlTemplate: e.target.value })}
                                        className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-xs bg-gray-50 min-h-[400px]"
                                        placeholder="Enter HTML/CSS here..."
                                    />
                                </div>

                                {/* Removed Set as default checkbox as requested */}
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Live Preview</span>
                                <span className="text-xs text-gray-400">Resolution: 800x600 (A4 Ratio)</span>
                            </div>
                            <div className="flex-1 bg-gray-100 p-4 md:p-8 flex items-center justify-center overflow-hidden">
                                <div className="relative bg-white shadow-2xl transition-all duration-300"
                                    style={{
                                        width: '800px',
                                        height: '600px',
                                        transform: 'scale(var(--preview-scale, 1))',
                                        transformOrigin: 'center center',
                                        flexShrink: 0
                                    }}
                                    ref={(el) => {
                                        if (el) {
                                            const parent = el.parentElement;
                                            if (parent) {
                                                const scale = Math.min(
                                                    (parent.clientWidth - 40) / 800,
                                                    (parent.clientHeight - 40) / 600,
                                                    1
                                                );
                                                el.style.setProperty('--preview-scale', scale.toString());
                                            }
                                        }
                                    }}
                                >
                                    <iframe
                                        ref={previewRef}
                                        className="w-full h-full border-none pointer-events-none overflow-hidden"
                                        title="Template Preview"
                                        style={{ overflow: 'hidden' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <button
                                    onClick={() => router.push('/dashboard/admin')}
                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors text-sm font-medium mb-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Dashboard
                                </button>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Organizations</h1>
                                <p className="text-gray-500 mt-1">Manage partner organizations and their certificate branding</p>
                            </div>
                            <button
                                onClick={openAdd}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create New Organization
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading organizations...</p>
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 shadow-sm">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-10 0H3m2 0h4M9 7h6M9 11h6M9 15h4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No organizations found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">Get started by creating an organization to customize your certificates.</p>
                        <button onClick={openAdd} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                            Add First Organization
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {organizations.map(org => (
                            <div key={org.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 transition-all duration-300 overflow-hidden flex flex-col">
                                <div className={`h-1.5 w-full ${org.isDefault ? 'bg-indigo-600' : 'bg-transparent transition-colors group-hover:bg-gray-100'}`} />
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                            <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-10 0H3m2 0h4M9 7h6M9 11h6M9 15h4" />
                                            </svg>
                                        </div>
                                        {org.isDefault && (
                                            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded-full uppercase tracking-tighter">Default</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{org.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-6">{org.description || 'No description provided.'}</p>

                                    <div className="flex items-center gap-4 py-4 border-y border-gray-50 mb-6">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Courses</p>
                                            <p className="text-lg font-bold text-gray-700">{org._count.courses}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Branding</p>
                                            <p className={`text-sm font-bold ${org.htmlTemplate ? 'text-green-600' : 'text-gray-400'}`}>
                                                {org.htmlTemplate ? 'Customized' : 'None'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEdit(org)}
                                            className="flex-1 bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-700 font-bold py-2.5 rounded-xl transition-all text-sm"
                                        >
                                            Edit Template
                                        </button>
                                        {!org.isDefault && (
                                            <button
                                                onClick={() => handleDelete(org)}
                                                className="bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 p-2.5 rounded-xl transition-all"
                                                title="Delete Organization"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
