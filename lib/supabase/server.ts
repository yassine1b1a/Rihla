import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

export function createClient() {
  
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // ✅ CORRECTION: Type explicite pour le paramètre toSet
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          try { 
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            ); 
          } catch (error) {
            // Ignorer les erreurs de cookies (utile en développement)
            console.debug("Cookie error:", error);
          }
        },
      },
    }
  );
}