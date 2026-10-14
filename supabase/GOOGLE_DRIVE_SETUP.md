# Google Drive por igreja

Cada igreja conecta uma conta Google institucional. O app cria nessa conta a pasta
`Gestão Igreja - Tesouraria`; os arquivos permanecem privados no Drive da igreja.
O banco guarda apenas o identificador do arquivo, o nome e a referência da igreja.
Tokens de renovação são criptografados no servidor e não ficam no navegador.

## Configuração inicial

1. No Google Cloud Console, crie um projeto, habilite **Google Drive API** e configure
   a tela de consentimento OAuth com os escopos `openid`, `email` e
   `https://www.googleapis.com/auth/drive.file`.
2. Crie um OAuth Client ID do tipo **Web application**. Cadastre como URI de redirecionamento:
   `https://<PROJECT_REF>.supabase.co/functions/v1/church-google-drive?callback=1`
3. Gere uma chave aleatória de 32 bytes e codifique-a em Base64. Exemplo local:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
4. Configure os segredos da Edge Function no projeto Supabase. Não os coloque em `.env`,
   no frontend ou no repositório:

   ```text
   GOOGLE_CLIENT_ID=<OAuth Client ID>
   GOOGLE_CLIENT_SECRET=<OAuth Client Secret>
   GOOGLE_REDIRECT_URI=https://<PROJECT_REF>.supabase.co/functions/v1/church-google-drive?callback=1
   GOOGLE_TOKEN_ENCRYPTION_KEY=<chave Base64 de 32 bytes>
   APP_URL=https://<dominio-publicado-do-app>
   ```

   `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são segredos
   disponibilizados normalmente às Supabase Edge Functions.
5. Aplique o conteúdo de `supabase/migrations/202610140001_church_google_drive.sql`
   no **SQL Editor** do projeto Supabase antes de publicar o frontend.
6. Configure os segredos com o Supabase CLI e publique a função:

   ```sh
   supabase secrets set GOOGLE_CLIENT_ID=<OAuth-Client-ID> GOOGLE_CLIENT_SECRET=<OAuth-Client-Secret> GOOGLE_REDIRECT_URI=https://<PROJECT_REF>.supabase.co/functions/v1/church-google-drive?callback=1 GOOGLE_TOKEN_ENCRYPTION_KEY=<Base64-32-bytes> APP_URL=https://<dominio-publicado-do-app>
   supabase functions deploy church-google-drive
   ```

7. Entre no app com um perfil administrador, pastor, secretário ou tesoureiro, abra **Gestão
   Financeira > Comprovantes** e conecte o Drive institucional da igreja.

## Comportamento e compatibilidade

- A autorização pertence à igreja e é iniciada por um perfil administrativo dela.
- O servidor valida a sessão, o papel e a igreja antes de acessar cada arquivo.
- Upload aceita PDF, JPG, PNG e WebP de até 5 MB.
- Os novos recibos guardam no banco apenas `gdrive:<file-id>` e o nome do arquivo.
- Comprovantes antigos em Data URL continuam legíveis no navegador onde foram salvos.
  Depois de conectar, a aba Comprovantes permite migrar manualmente os arquivos antigos
  daquele navegador. Registros que existam só no navegador não podem ser sincronizados.
- Se a conexão for revogada no Google, reconecte a mesma conta para recuperar o acesso.
  A igreja deve continuar usando a conta originalmente vinculada; trocar de conta pode
  tornar inacessíveis os arquivos já registrados.
- O app preserva comprovantes legados de navegador até que sejam migrados manualmente.
- O espaço utilizado depende da conta Google conectada.

Para disponibilizar a integração publicamente, conclua a verificação OAuth do Google
quando exigida pelo modo de publicação e pelos escopos aprovados.
