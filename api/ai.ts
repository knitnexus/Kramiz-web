
import { supabase } from '../supabaseClient';
import { User } from '../types';

export type AIScanType = 'DC' | 'IC' | 'INVOICE' | 'VISITING_CARD' | 'CHAT_SUMMARY';

export interface ScanResult {
    success: boolean;
    data?: any;
    error?: string;
}

export const aiApi = {
    /**
     * Processes an image (DC, IC, Invoice, or Visiting Card) using Gemini 2.5 Flash
     */
    scanDocument: async (
        currentUser: User, 
        imageFile: File, 
        type: AIScanType,
        context?: { orderId?: string; styleNo?: string; companyName?: string }
    ): Promise<ScanResult> => {
        try {
            // 1. Upload the file to a temporary AI bucket or just send as base64
            // Sending as base64 is often easier for edge functions
            const base64 = await fileToBase64(imageFile);

            // 2. Call the Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('process-ai', {
                body: {
                    action: 'SCAN_DOCUMENT',
                    type,
                    image: base64,
                    context: {
                        ...context,
                        userName: currentUser.name,
                        companyId: currentUser.company_id
                    }
                }
            });

            if (error) throw error;
            
            if (data && data.success === false) {
                return { success: false, error: data.message || data.error || 'AI processing failed' };
            }

            // Standardize: backend returns { success: true, data: ... }
            return { success: true, data: data.data };

        } catch (err: any) {
            console.error('AI Scan Error Detail:', err);
            // If it's a Supabase error, it might have a context or message
            const errorMsg = err.context?.message || err.message || 'Failed to scan document';
            return { success: false, error: errorMsg };
        }
    },

    /**
     * Summarizes a chat channel
     */
    summarizeChat: async (
        currentUser: User,
        channelId: string,
        messages?: any[]
    ): Promise<any> => {
        try {
            const { data, error } = await supabase.functions.invoke('process-ai', {
                body: {
                    action: 'SUMMARIZE_CHAT',
                    type: 'CHAT_SUMMARY',
                    context: {
                        channelId,
                        userName: currentUser.name,
                        companyId: currentUser.company_id
                    },
                    messages: messages ? messages.slice(-50) : []
                }
            });

            if (error) throw error;
            
            if (data && data.success === false) {
                return { success: false, error: data.message || data.error || 'Summary failed' };
            }

            return data;

        } catch (err: any) {
            console.error('AI Summary Error Detail:', err);
            const errorMsg = err.context?.message || err.message || 'Failed to summarize';
            return { success: false, error: errorMsg };
        }
    }
};

// Helper to convert file to base64 for processing
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data:image/...;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};
