import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkerStore } from '@/stores/workerStore';
import { Worker, WorkerRole } from '@/db/database';
import WorkerFormModal from '@/components/forms/WorkerFormModal';
import { Plus, Search, HardHat, Edit2, Trash2, Scissors, CheckCircle2, Wrench, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';

// Role configurations with solid colors
const roleConfig: Record<WorkerRole, { icon: React.ReactNode; bgColor: string; label: string }> = {
    cutter: {
        icon: <Scissors className="w-5 h-5 text-white" strokeWidth={2.5} />,
        bgColor: 'bg-blue-500',
        label: 'Cutter'
    },
    checker: {
        icon: <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />,
        bgColor: 'bg-emerald-500',
        label: 'Checker'
    },
    karigar: {
        icon: <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />,
        bgColor: 'bg-orange-500',
        label: 'Karigar'
    },
};

export default function Workers() {
    const { t } = useTranslation();
    const { workers, loading, roleFilter, searchQuery, loadWorkers, setRoleFilter, setSearchQuery, deleteWorker } = useWorkerStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | undefined>(undefined);

    useEffect(() => {
        loadWorkers();
    }, []);

    const [localSearch, setLocalSearch] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchQuery]);

    const handleAddNew = () => {
        setEditingWorker(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        toast((t_toast) => (
            <div className="flex items-center gap-3">
                <span>{t('common.confirmDelete')}</span>
                <button
                    onClick={async () => {
                        toast.dismiss(t_toast.id);
                        await deleteWorker(id);
                        toast.success(t('common.deleteSuccess'));
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                >
                    {t('common.delete')}
                </button>
                <button
                    onClick={() => toast.dismiss(t_toast.id)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                    {t('common.cancel')}
                </button>
            </div>
        ), { duration: 10000 });
    };

    // Filter workers
    const filteredWorkers = workers.filter(worker => {
        const matchesRole = roleFilter === 'all' || worker.role === roleFilter;
        const matchesSearch = !searchQuery ||
            worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });
    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('workers.title')}</h1>
                <button onClick={handleAddNew} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('workers.addNew')}
                </button>
            </div>

            {/* Role Filter Tabs - With 3D Effect */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'all'
                        ? 'bg-gray-800 text-white border-gray-950'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                >
                    <HardHat className="w-4 h-4" />
                    {t('common.all')}
                </button>
                <button
                    onClick={() => setRoleFilter('cutter')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'cutter'
                        ? 'bg-blue-500 text-white border-blue-700'
                        : 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200'
                        }`}
                >
                    <Scissors className="w-4 h-4" strokeWidth={2.5} />
                    {t('workers.roles.cutter')}
                </button>
                <button
                    onClick={() => setRoleFilter('checker')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'checker'
                        ? 'bg-emerald-500 text-white border-emerald-700'
                        : 'bg-emerald-100 text-emerald-600 border-emerald-300 hover:bg-emerald-200'
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                    {t('workers.roles.checker')}
                </button>
                <button
                    onClick={() => setRoleFilter('karigar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:mt-1 ${roleFilter === 'karigar'
                        ? 'bg-orange-500 text-white border-orange-700'
                        : 'bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200'
                        }`}
                >
                    <Wrench className="w-4 h-4" strokeWidth={2.5} />
                    {t('workers.roles.karigar')}
                </button>
            </div>

            {/* Search - Card Style with 3D Effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex rounded-xl overflow-hidden border border-gray-200 border-b-4 border-b-gray-300 bg-white shadow-sm">
                    <div className="bg-gray-800 w-12 flex items-center justify-center shrink-0 border-b-4 border-b-gray-950">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                    <input
                        id="worker-search"
                        type="text"
                        placeholder={t('workers.search')}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="flex-1 px-4 py-3 bg-transparent outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-gray-900 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Worker List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card flex items-center gap-4">
                            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-12 card flex flex-col items-center">
                    <div className="transform scale-150 mb-4 opacity-50"><HardHat className="w-24 h-24 text-gray-200" /></div>
                    <p className="text-gray-500 text-lg">{t('workers.noWorkers')}</p>
                    <button onClick={handleAddNew} className="btn btn-primary mt-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        {t('workers.addNew')}
                    </button>
                </div>
            ) : (
                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-200">
                            <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase font-semibold border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">{t('workers.role')}</th>
                                    <th className="px-6 py-4">{t('customers.name')}</th>
                                    <th className="px-6 py-4">{t('customers.phone')}</th>
                                    <th className="px-6 py-4 text-center">{t('common.status')}</th>
                                    <th className="px-6 py-4 text-center">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredWorkers.map((worker) => {
                                    const config = roleConfig[worker.role];
                                    return (
                                        <tr key={worker.id} className="hover:bg-slate-750/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`${config.bgColor} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
                                                        {config.icon}
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded text-white ${config.bgColor}`}>
                                                        {t(`workers.roles.${worker.role}`)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-base text-white">
                                                    {worker.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {worker.phone ? (
                                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                                        <span className="p-1.5 bg-slate-700 rounded-full">
                                                            <Phone className="w-3 h-3" />
                                                        </span>
                                                        {worker.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {worker.isActive ? (
                                                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">
                                                        {t('workers.inactive')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(worker)}
                                                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded transition-colors"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                                                    <button
                                                        onClick={() => handleDelete(worker.id!)}
                                                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-700 rounded transition-colors"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <WorkerFormModal
                    worker={editingWorker}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </PageTransition>
    );
}
