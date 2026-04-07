import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProfiles = () => {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, full_name, role')
                .order('full_name');
            
            if (error) throw error;
            return data;
        },
    });
};
