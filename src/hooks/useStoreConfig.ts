import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStoreConfig() {
  return useQuery({
    queryKey: ['store_config_global'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('store_configs')
        .select('*')
        .is('branch_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data || { 
          store_name: 'WUDkopi',
          store_address: '',
          store_phone: '',
          open_time: '08:00',
          close_time: '22:00',
          footer_message: 'Terima kasih atas kunjungan Anda!',
          auto_print: false,
          enable_qris: true,
          enable_transfer: true,
          show_table_number: true,
          show_customer_name: true,
          paper_size: '58mm'
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
