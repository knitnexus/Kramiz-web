/**
 * invoices.ts
 * Feature: Invoices — Phase 3
 *
 * Full CRUD for Invoices.
 * An Invoice is a billing document raised by the seller against a buyer.
 *
 * GST logic (applied in UI + stored calculated):
 *   CGST_SGST  → intra-state: CGST = rate/2, SGST = rate/2
 *   IGST       → inter-state: IGST = full rate
 *   null       → no GST (composition / non-taxable)
 *
 * Rates: 3% | 5% | 12% | 18%
 *
 * Status lifecycle:
 *   DRAFT → SENT
 *   (No payment tracking in V1)
 *
 * Who can call:
 *   CREATE_INVOICE  → ADMIN, MERCHANDISER, MANAGER
 *   EDIT_INVOICE    → ADMIN, MERCHANDISER, MANAGER
 *   DELETE_INVOICE  → ADMIN, MERCHANDISER, MANAGER
 *
 * Spread into the `api` object in supabaseAPI.ts.
 */

import { supabase, supabaseAdmin } from '../supabaseClient';
import { User, Invoice, InvoiceItem, GSTType, GSTRate, hasPermission } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const todayStamp = (): string => {
    const d  = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
};

const generateInvoiceNumber = async (companyId: string): Promise<string> => {
    const prefix = `INV-${todayStamp()}`;
    const { count } = await supabaseAdmin
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('seller_company_id', companyId)
        .like('invoice_number', `${prefix}%`);
    const seq = String((count || 0) + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
};

/** Calculate subtotal, gst_amount, and total_amount from items + GST config. */
const calculateTotals = (
    items:    InvoiceItem[],
    gstRate?: GSTRate
): { subtotal: number; gst_amount: number; total_amount: number } => {
    const subtotal   = items.reduce((sum, it) => sum + it.amount, 0);
    const gst_amount = gstRate ? parseFloat(((subtotal * gstRate) / 100).toFixed(2)) : 0;
    return { subtotal, gst_amount, total_amount: parseFloat((subtotal + gst_amount).toFixed(2)) };
};

// ── Shared select fragment ────────────────────────────────────────────────────

const INVOICE_SELECT = `
    *,
    seller_company:companies!seller_company_id(id, name, gst_number, address, state, pincode, kramiz_id),
    buyer_company:companies!buyer_company_id(id, name, gst_number, address, state, pincode, kramiz_id),
    buyer_contact:contacts!buyer_contact_id(id, name, gst_number, address, state, pincode, phone)
`;

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════════

export const createInvoice = async (
    currentUser: User,
    params: {
        buyer_company_id?:  string;
        buyer_contact_id?:  string;
        order_id?:          string;
        channel_id?:        string;
        linked_dc_ids?:     string[];
        items:              InvoiceItem[];
        gst_type?:          GSTType;
        gst_rate?:          GSTRate;
        due_date?:          string;
        notes?:             string;
    }
): Promise<Invoice> => {
    if (!hasPermission(currentUser.role, 'CREATE_INVOICE')) {
        throw new Error('You do not have permission to create invoices');
    }
    if (!params.buyer_company_id && !params.buyer_contact_id) {
        throw new Error('A buyer (partner or contact) is required');
    }
    if (!params.items?.length) {
        throw new Error('At least one line item is required');
    }

    const invoice_number              = await generateInvoiceNumber(currentUser.company_id);
    const { subtotal, gst_amount, total_amount } = calculateTotals(params.items, params.gst_rate);

    const { data, error } = await supabase
        .from('invoices')
        .insert({
            invoice_number,
            seller_company_id: currentUser.company_id,
            created_by:        currentUser.id,
            linked_dc_ids:     params.linked_dc_ids ?? [],
            subtotal,
            gst_amount:        params.gst_rate ? gst_amount : null,
            total_amount,
            status:            'DRAFT',
            ...params,
        })
        .select(INVOICE_SELECT)
        .single();

    if (error) throw new Error(error.message);
    return data as Invoice;
};

// ═══════════════════════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════════════════════

/** All invoices where the current company is the SELLER (you billed someone). */
export const getInvoicesSent = async (currentUser: User): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('seller_company_id', currentUser.company_id)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Invoice[];
};

/** All invoices where the current company is the BUYER (someone billed you). */
export const getInvoicesReceived = async (currentUser: User): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('buyer_company_id', currentUser.company_id)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Invoice[];
};

/** Single invoice by ID. Returns null if not found. */
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
    const { data, error } = await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', invoiceId)
        .single();

    if (error) return null;
    return data as Invoice;
};

/** All invoices linked to a specific Purchase Order. */
export const getInvoicesForOrder = async (orderId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Invoice[];
};

/** All invoices linked to a specific chat channel. */
export const getInvoicesForChannel = async (channelId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Invoice[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update an invoice. Only the seller company can update.
 * Recalculates totals if items or GST rate change.
 */
export const updateInvoice = async (
    currentUser: User,
    invoiceId: string,
    updates: Partial<{
        buyer_company_id: string;
        buyer_contact_id: string;
        order_id:         string;
        linked_dc_ids:    string[];
        items:            InvoiceItem[];
        gst_type:         GSTType;
        gst_rate:         GSTRate;
        due_date:         string;
        notes:            string;
        status:           'DRAFT' | 'SENT';
    }>
): Promise<Invoice> => {
    if (!hasPermission(currentUser.role, 'EDIT_INVOICE')) {
        throw new Error('You do not have permission to edit invoices');
    }

    // Recalculate totals if items or gst_rate changed
    let calculatedFields: Partial<{ subtotal: number; gst_amount: number | null; total_amount: number }> = {};
    if (updates.items) {
        const { subtotal, gst_amount, total_amount } = calculateTotals(updates.items, updates.gst_rate);
        calculatedFields = {
            subtotal,
            gst_amount: updates.gst_rate ? gst_amount : null,
            total_amount,
        };
    }

    const { data, error } = await supabase
        .from('invoices')
        .update({ ...updates, ...calculatedFields, updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('seller_company_id', currentUser.company_id)
        .select(INVOICE_SELECT)
        .single();

    if (error) throw new Error(error.message);
    return data as Invoice;
};

/**
 * Mark an invoice as SENT.
 * Shortcut for updateInvoice(..., { status: 'SENT' }).
 */
export const markInvoiceSent = async (
    currentUser: User,
    invoiceId: string
): Promise<void> => {
    const { error } = await supabase
        .from('invoices')
        .update({ status: 'SENT', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('seller_company_id', currentUser.company_id);

    if (error) throw new Error(error.message);
};

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════════════

/** Delete an invoice. Only the seller company can delete. */
export const deleteInvoice = async (
    currentUser: User,
    invoiceId: string
): Promise<void> => {
    if (!hasPermission(currentUser.role, 'DELETE_INVOICE')) {
        throw new Error('You do not have permission to delete invoices');
    }

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('seller_company_id', currentUser.company_id);

    if (error) throw new Error(error.message);
};
