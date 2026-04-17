import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, Customer, Order, CustomerMeasurement } from '@/db/database';
import toast from 'react-hot-toast';
import { formatDate, formatDaysRemaining } from '@/utils/formatters';
import { orderStatusOptions } from '@/db/templates';
import CustomerMeasurementForm from '@/components/forms/CustomerMeasurementForm';
import { generateMeasurementSlipHTML } from '@/utils/printHelpers';
import { usePrinter } from '@/hooks/usePrinter';

import { ArrowLeft, Phone, MapPin } from 'lucide-react';

export default function CustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const initialTab = searchParams.get('tab') === 'orders' ? 'orders' : 'measurements';
    const [activeTab, setActiveTab] = useState<'orders' | 'measurements'>(initialTab);


    useEffect(() => {
        async function loadData() {
            if (!id) return;

            setLoading(true);
            const customerId = /^\d+$/.test(id) ? parseInt(id) : id;
            const customerData = await db.customers.get(customerId);
            const orderData = await db.orders
                .where('customerId')
                .equals(customerId)
                .reverse()
                .sortBy('createdAt');

            setCustomer(customerData || null);
            setOrders(orderData);
            setLoading(false);
        }

        loadData();
    }, [id]);

    const { printSlip } = usePrinter();
    const previewHtmlRef = useRef<string | null>(null);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data === 'save-pdf-request') {
                if (!customer || !previewHtmlRef.current) return;

                // Show loading toast
                const loadingId = toast.loading(
                    isUrdu ? 'محفوظ کیا جا رہا ہے...' : 'Saving PDF...',
                    { position: 'bottom-center' }
                );

                if (window.electronAPI && window.electronAPI.savePDF) {
                    try {
                        const result = await window.electronAPI.savePDF(previewHtmlRef.current);
                        if (result.success) {
                            toast.success(isUrdu ? 'محفوظ کرلیا گیا' : 'PDF Saved Successfully', { id: loadingId });
                        } else if (result.error && result.error !== 'Cancelled') {
                            toast.error(isUrdu ? 'محفوظ کرنے میں ناکامی' : 'Save Failed: ' + result.error, { id: loadingId });
                        } else {
                            toast.dismiss(loadingId); // Cancelled
                        }
                    } catch (error) {
                        toast.error('Error saving PDF', { id: loadingId });
                    }
                } else {
                    toast.error('PDF Save API not available');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [customer]);

    const handlePrint = async (measurement: CustomerMeasurement, layout: any[]) => {
        if (!customer) return;

        try {
            const settings = await db.settings.get(1);
            // No specific order context here, so no worker names or order dates
            const html = generateMeasurementSlipHTML(customer, measurement, layout, settings);
            await printSlip(html, { silentOnly: true });
        } catch (error) {
            console.error('Print Error:', error);
        }
    };

    const handlePreview = async (measurement: CustomerMeasurement, layout: any[]) => {
        console.log('handlePreview called in CustomerDetail');
        if (!customer) return;

        try {
            const settings = await db.settings.get(1);
            const html = generateMeasurementSlipHTML(customer, measurement, layout, settings);
            previewHtmlRef.current = html;

            // Open in new window (Matching OrderDetail)
            const win = window.open('', '_blank');
            if (win) {
                win.document.open();
                win.document.write(html);
                win.document.close();
                win.focus();
            } else {
                console.warn('Popup blocked or failed to open');
            }
        } catch (error: any) {
            console.error('Preview Error:', error);
            toast.error('Failed to generate preview: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">{t('common.loading')}</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">{t('common.noResults')}</p>
                <Link to="/customers" className="btn bg-gray-200 text-gray-700 border-b-4 border-gray-400 hover:bg-gray-300 active:border-b-0 active:mt-1 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    {t('customers.title')}
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Link */}
            <Link to="/customers" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg border-b-4 border-gray-400 hover:bg-gray-300 active:border-b-0 active:mt-1 transition-all text-sm font-medium">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('customers.title')}
            </Link>

            {/* Customer Info Card - Dense Table Theme */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-200 text-sm">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
                            <tr>
                                <th className="px-5 py-3 w-20">ID</th>
                                <th className="px-5 py-3">{t('customers.name')}</th>
                                <th className="px-5 py-3">{t('customers.phone')}</th>
                                <th className="px-5 py-3">{t('customers.address')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            <tr className="hover:bg-slate-750/50 transition-colors">
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="text-xs font-medium bg-slate-700 px-2 py-1 rounded inline-block text-blue-300">
                                        #{customer.id}
                                    </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap font-bold text-base text-white">
                                    {customer.name}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-slate-300 gap-2">
                                        <span className="p-1.5 bg-slate-700 rounded-full shrink-0">
                                            <Phone className="w-3 h-3" />
                                        </span>
                                        <span>{customer.phone}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    {customer.address ? (
                                        <div className="flex items-center text-slate-300 gap-2">
                                            <span className="p-1.5 bg-slate-700 rounded-full shrink-0">
                                                <MapPin className="w-3 h-3" />
                                            </span>
                                            <span>{customer.address}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 italic">-</span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('measurements')}
                    className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors ${activeTab === 'measurements'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {t('measurements.title')}
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors ${activeTab === 'orders'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {t('customers.viewHistory')} ({orders.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'measurements' && (
                <div className="card">
                    <CustomerMeasurementForm
                        customerId={customer.id!}
                        customerName={customer.name}
                        onPrint={handlePrint}
                        onPreview={handlePreview}
                    />
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{t('customers.viewHistory')}</h2>
                        <Link
                            to={`/orders/create?customerId=${customer.id}`}
                            className="btn btn-primary text-sm"
                        >
                            + {t('orders.addNew')}
                        </Link>
                    </div>

                    {orders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">{t('orders.noOrders')}</p>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => {
                                const statusOption = orderStatusOptions.find((s) => s.value === order.status);
                                const daysInfo = formatDaysRemaining(order.dueDate, isUrdu, order.status);
                                return (
                                    <Link
                                        key={order.id}
                                        to={`/orders/${order.id}`}
                                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">Order #{order.id}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusOption?.color}`}>
                                                        {t(statusOption?.label || '')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {isUrdu ? 'تاریخ' : 'Created'}: {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                            <div className="text-end">
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {formatDate(order.dueDate)}
                                                </p>
                                                {daysInfo.text && (
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${daysInfo.color}`}>
                                                        {daysInfo.text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
}
