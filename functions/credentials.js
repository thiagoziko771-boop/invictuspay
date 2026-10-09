/**
 * Arquivo de credenciais
 * Lê as credenciais das variáveis de ambiente do Netlify
 * Se não encontrar, usa os valores padrão abaixo
 */

module.exports = {
  PINGUPAG_API_KEY: process.env.PINGUPAG_API_KEY || "pingupag_sk_5a4a884661598e034154315cc12ce8e55ebfd026625c057dcf673b7ca7512384",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ldyhodwdhavrgyooukpi.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeWhvZHdkaGF2cmd5b291a3BpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQxMDUyNCwiZXhwIjoyMTAxOTg2NTI0fQ.JvEtOi46gaL5fAFk8XnUUeEyPTibpC79NwPGMF8SvdY",
  UTMIFY_TOKEN: process.env.UTMIFY_TOKEN || "lzASZob4ldSJJc3jT1LILy9alPxWJgpnPhCh"
};
