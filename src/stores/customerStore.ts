import { create } from 'zustand';
import { db, Customer } from '@/db/database';

// ==========================================
// Types
// ==========================================

interface CustomerState {
    customers: Customer[];
    loading: boolean;
    searchQuery: string;
    selectedCustomer: Customer | null;

    loadCustomers: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    addCustomer: (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => Promise<number | string>;
    updateCustomer: (id: number | string, data: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: number | string) => Promise<void>;
    selectCustomer: (customer: Customer | null) => void;
}

// ==========================================
// Helpers
// ==========================================

/**
 * Case-insensitive substring match.
 * Safely handles null/undefined values.
 */
function matchesQuery(value: string | number | undefined | null, query: string): boolean {
    if (value == null) return false;
    const strVal = String(value).toLowerCase();
    // Remove any '#' prefix from the query to gracefully handle searches like "#M302"
    const cleanQuery = query.replace(/^#/, '').trim();
    return strVal.includes(cleanQuery) || `#${strVal}`.includes(query);
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: [],
    loading: false,
    searchQuery: '',
    selectedCustomer: null,

    loadCustomers: async () => {
        const currentCustomers = get().customers;
        // Only show skeleton loader on initial load, not on subsequent searches
        if (currentCustomers.length === 0) {
            set({ loading: true });
        }

        try {
            const { searchQuery } = get();
            let customers: Customer[];

            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();

                customers = await db.customers
                    .filter((c) =>
                        matchesQuery(c.id, query) ||
                        matchesQuery(c.name, query) ||
                        matchesQuery(c.phone, query) ||
                        matchesQuery(c.address, query)
                    )
                    .toArray();
            } else {
                customers = await db.customers
                    .orderBy('createdAt')
                    .reverse()
                    .toArray();
            }

            set({ customers, loading: false });
        } catch (error) {
            console.error('[CustomerStore] Error loading customers:', error);
            set({ loading: false });
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().loadCustomers();
    },

    addCustomer: async (customerData) => {
        const now = new Date();
        const id = await db.customers.add({
            ...customerData,
            createdAt: now,
            updatedAt: now,
        });
        await get().loadCustomers();
        return id;
    },

    updateCustomer: async (id, data) => {
        await db.customers.update(id, {
            ...data,
            updatedAt: new Date(),
        });
        await get().loadCustomers();
    },

    deleteCustomer: async (id) => {
        // Delete related orders and their measurements in a transaction
        await db.transaction('rw', [db.customers, db.orders, db.measurements, db.customerMeasurements], async () => {
            const orders = await db.orders.where('customerId').equals(id).toArray();
            const orderIds = orders.map(o => o.id!).filter(Boolean);

            if (orderIds.length > 0) {
                await db.measurements.where('orderId').anyOf(orderIds).delete();
            }
            await db.orders.where('customerId').equals(id).delete();
            await db.customerMeasurements.where('customerId').equals(id).delete();
            await db.customers.delete(id);
        });

        await get().loadCustomers();
    },

    selectCustomer: (customer) => {
        set({ selectedCustomer: customer });
    },
}));
