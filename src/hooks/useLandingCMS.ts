import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingHero {
  title: string;
  subtitle: string;
  image_url: string; // Legacy field
  images?: string[]; // New multiple images field
  cta_text: string;
  secondary_cta_text: string;
}

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingAbout {
  badge: string;
  title: string;
  description: string;
  items: Array<{ icon: string; text: string }>;
}

export function useLandingCMS() {
  return useQuery({
    queryKey: ['landing_cms'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('landing_cms')
          .select('*');
        
        if (error) {
          console.warn("Landing CMS table not found or error:", error.message);
          return {}; // Return empty to use fallbacks in components
        }
        
        // Transform list to keyed object for easier access
        const content: Record<string, any> = {};
        data?.forEach(item => {
          content[item.section_id] = item.content;
        });
        
        return content;
      } catch (e) {
        console.error("Critical error fetching CMS:", e);
        return {};
      }
    },
    staleTime: 1000 * 10, // 10 seconds cache for immediate feedback
  });
}
