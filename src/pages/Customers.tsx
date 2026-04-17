import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '@/stores/customerStore';
import { Customer } from '@/db/database';
import CustomerFormModal from '@/components/forms/CustomerFormModal';
import { Plus, Search, Users, History, Edit2, Trash2, Ruler, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// ==========================================
// Constants
// ==========================================

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 300;

// ==========================================
// Component
// ==========================================

export default function Customers() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { customers, loading, searchQuery, loadCustomers, setSearchQuery, deleteCustomer } = useCustomerStore();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<number | string | null>(null);

    // Debounced search
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // ==========================================
    // Effects
    // ==========================================

    // Load customers on mount
    useEffect(() => {
        loadCustomers();
    }, []);

    // Sync localSearch from store (e.g. when cleared externally)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localSearch);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchQuery]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                handleAddNew();
            }
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('customer-search')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ==========================================
    // Handlers
    // ==========================================

    const handleAddNew = useCallback(() => {
        setEditingCustomer(undefined);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback((id: number | string) => {
        setDeleteId(id);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (deleteId) {
            await deleteCustomer(deleteId);
            toast.success(t('common.deleteSuccess'));
            setDeleteId(null);
        }
    }, [deleteId, deleteCustomer, t]);

    const clearSearch = useCallback(() => {
        setLocalSearch('');
        setSearchQuery('');
    }, [setSearchQuery]);

    // ==========================================
    // Derived State
    // ==========================================

    const displayedCustomers = useMemo(() => customers.slice(0, PAGE_SIZE), [customers]);
    const hasMoreCustomers = customers.length > PAGE_SIZE;
    const isEmptyState = customers.length === 0 && !searchQuery && !localSearch;
    const isNoResults = customers.length === 0 && (!!searchQuery || !!localSearch);

    // ==========================================
    // Render
    // ==========================================

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('customers.title')}{' '}
                    <span className="text-gray-500 text-lg font-medium">({customers.length})</span>
                </h1>
                <button onClick={handleAddNew} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('customers.addNew')}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <LoadingSkeleton />
            ) : isEmptyState ? (
                <EmptyState onAddNew={handleAddNew} t={t} />
            ) : (
                <>
                    {/* Search Bar */}
                    <SearchBar
                        value={localSearch}
                        onChange={setLocalSearch}
                        placeholder={t('customers.search')}
                    />

                    {/* Customer Table or No Results */}
                    {isNoResults ? (
                        <NoResults onClear={clearSearch} t={t} />
                    ) : (
                        <CustomerTable
                            customers={displayedCustomers}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            t={t}
                        />
                    )}

                    {/* Pagination hint */}
                    {hasMoreCustomers && (
                        <div className="text-center text-gray-500 text-sm mt-4 italic">
                            {t('customers.showingTopResults', { count: PAGE_SIZE, total: customers.length })}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {isModalOpen && (
                <CustomerFormModal
                    customer={editingCustomer}
                    onClose={() => setIsModalOpen(false)}
                    onSaveAndMeasure={(id) => navigate(`/customers/${id}`)}
                />
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title={t('common.delete')}
                message={t('common.confirmDelete')}
                isDestructive={true}
            />
        </PageTransition>
    );
}

// ==========================================
// Sub-components
// ==========================================

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="card flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ onAddNew, t }: { onAddNew: () => void; t: any }) {
    return (
        <div className="text-center py-12 card flex flex-col items-center">
            <div className="transform scale-150 mb-4 opacity-50">
                <Users className="w-24 h-24 text-gray-200" />
            </div>
            <p className="text-gray-500 text-lg">{t('customers.noCustomers')}</p>
            <button onClick={onAddNew} className="btn btn-primary mt-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t('customers.addNew')}
            </button>
        </div>
    );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 border-b-4 border-b-gray-300 bg-white shadow-sm">
                <div className="bg-gray-800 w-12 flex items-center justify-center shrink-0 border-b-4 border-b-gray-950">
                    <Search className="w-5 h-5 text-white" />
                </div>
                <input
                    id="customer-search"
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-4 py-3 bg-transparent outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-gray-900 placeholder:text-gray-400"
                />
            </div>
        </div>
    );
}

function NoResults({ onClear, t }: { onClear: () => void; t: any }) {
    return (
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-16 flex flex-col items-center justify-center">
            <p className="text-slate-400 text-lg mb-4 text-center">
                {t('common.noResults') || 'No customers found.'}
            </p>
            <button
                onClick={onClear}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
                <Search className="w-4 h-4" />
                Clear Search
            </button>
        </div>
    );
}

function CustomerTable({
    customers,
    onEdit,
    onDelete,
    t,
}: {
    customers: Customer[];
    onEdit: (c: Customer) => void;
    onDelete: (id: number | string) => void;
    t: any;
}) {
    return (
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-200">
                    <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase font-semibold border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">{t('customers.name')}</th>
                            <th className="px-6 py-4">{t('customers.phone')}</th>
                            <th className="px-6 py-4">{t('customers.address')}</th>
                            <th className="px-6 py-4 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {customers.map((customer) => (
                            <CustomerRow
                                key={customer.id}
                                customer={customer}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                t={t}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CustomerRow({
    customer,
    onEdit,
    onDelete,
    t,
}: {
    customer: Customer;
    onEdit: (c: Customer) => void;
    onDelete: (id: number | string) => void;
    t: any;
}) {
    return (
        <tr className="hover:bg-slate-750/50 transition-colors group">
            {/* ID */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-xs bg-slate-700 px-2 py-1 rounded inline-block text-blue-300">
                    #{customer.id}
                </div>
            </td>

            {/* Name */}
            <td className="px-6 py-4 whitespace-nowrap">
                <Link
                    to={`/customers/${customer.id}`}
                    className="font-bold text-base text-white hover:text-blue-300 transition-colors"
                >
                    {customer.name}
                </Link>
            </td>

            {/* Phone */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="p-1.5 bg-slate-700 rounded-full">
                        <Phone className="w-3 h-3" />
                    </span>
                    {customer.phone}
                </div>
            </td>

            {/* Address */}
            <td className="px-6 py-4">
                {customer.address ? (
                    <div className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="p-1.5 bg-slate-700 rounded-full mt-0.5 shrink-0">
                            <MapPin className="w-3 h-3" />
                        </span>
                        <span className="line-clamp-1 max-w-[200px]" title={customer.address}>
                            {customer.address}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-500 italic">
                        <span className="p-1.5 bg-slate-700 rounded-full shrink-0">
                            <MapPin className="w-3 h-3" />
                        </span>
                        {t('customers.address')}...
                    </div>
                )}
            </td>

            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        to={`/customers/${customer.id}?tab=measurements`}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
                        title={t('measurements.title')}
                    >
                        <Ruler className="w-4 h-4" />
                    </Link>
                    <Link
                        to={`/customers/${customer.id}?tab=orders`}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title={t('customers.viewHistory')}
                    >
                        <History className="w-4 h-4" />
                    </Link>
                    <div className="w-px h-6 bg-slate-700 mx-1" />
                    <button
                        onClick={() => onEdit(customer)}
                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded transition-colors"
                        title={t('common.edit')}
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(customer.id!)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-700 rounded transition-colors"
                        title={t('common.delete')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
