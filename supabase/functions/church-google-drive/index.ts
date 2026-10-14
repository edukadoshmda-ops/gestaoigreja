import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!
const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI")!
const GOOGLE_TOKEN_ENCRYPTION_KEY = Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY")!
const APP_URL = Deno.env.get("APP_URL")!

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  })

const base64 = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0))

function getEncryptionKey() {
  const bytes = fromBase64(GOOGLE_TOKEN_ENCRYPTION_KEY)
  if (bytes.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.")
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"])
}

async function encryptToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await getEncryptionKey(),
    new TextEncoder().encode(token),
  )
  return `${base64(iv)}.${base64(new Uint8Array(encrypted))}`
}

async function decryptToken(value: string) {
  const [encodedIv, encodedToken] = value.split(".")
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(encodedIv) },
    await getEncryptionKey(),
    fromBase64(encodedToken),
  )
  return new TextDecoder().decode(decrypted)
}

function getClients(authorization?: string) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const user = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization || "" } },
  })
  return { admin, user }
}

async function requireChurchUser(req: Request, churchId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(churchId)) throw new Error("Identificador da igreja inválido.")
  const authorization = req.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) throw new Error("Faça login para continuar.")

  const { admin, user } = getClients(authorization)
  const { data: { user: authUser }, error: authError } = await user.auth.getUser(authorization.slice("Bearer ".length))
  if (authError || !authUser) throw new Error("Sessão inválida. Entre novamente.")

  const { data: profile, error } = await admin
    .from("profiles")
    .select("church_id, role")
    .eq("id", authUser.id)
    .single()
  if (error || !profile) throw new Error("Perfil da conta não encontrado.")

  const allowedRoles = ["admin", "pastor", "secretario", "tesoureiro", "superadmin"]
  if (!allowedRoles.includes(profile.role)) throw new Error("Seu perfil não pode gerenciar comprovantes financeiros.")
  if (profile.role !== "superadmin" && profile.church_id !== churchId) {
    throw new Error("Acesso negado: esta igreja não pertence à sua conta.")
  }
  return { admin, userId: authUser.id }
}

async function getConnection(admin: ReturnType<typeof createClient>, churchId: string) {
  const { data, error } = await admin
    .from("church_google_drive_connections")
    .select("google_email, drive_folder_id, encrypted_refresh_token")
    .eq("church_id", churchId)
    .maybeSingle()
  if (error) throw new Error("Não foi possível consultar a conexão do Google Drive.")
  return data
}

async function getAccessToken(connection: NonNullable<Awaited<ReturnType<typeof getConnection>>>) {
  const refreshToken = await decryptToken(connection.encrypted_refresh_token)
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  const result = await response.json()
  if (!response.ok || !result.access_token) {
    throw new Error("O Google Drive recusou a autorização. Reconecte a conta Google da igreja.")
  }
  return result.access_token as string
}

async function createDriveFolder(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Gestão Igreja - Tesouraria",
      mimeType: "application/vnd.google-apps.folder",
    }),
  })
  const result = await response.json()
  if (!response.ok || !result.id) throw new Error("O Google Drive não conseguiu criar a pasta da tesouraria.")
  return result.id as string
}

async function getOwnedDriveFile(accessToken: string, folderId: string, fileId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) throw new Error("Identificador do comprovante inválido.")
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,parents`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  const result = await response.json()
  if (!response.ok) throw new Error("Não foi possível encontrar o comprovante no Google Drive.")
  if (!Array.isArray(result.parents) || !result.parents.includes(folderId)) {
    throw new Error("Acesso negado: o comprovante não pertence à pasta desta igreja.")
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers })

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY ||
      !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI ||
      !GOOGLE_TOKEN_ENCRYPTION_KEY || !APP_URL) {
    return json({ error: "A integração Google Drive ainda não foi configurada no servidor." }, 503)
  }

  const url = new URL(req.url)
  const { admin } = getClients()

  if (req.method === "GET" && url.searchParams.has("callback")) {
    const state = url.searchParams.get("state") || ""
    const returnBase = new URL(APP_URL)
    try {
      const { data: challenge, error } = await admin
        .from("church_google_drive_oauth_states")
        .delete()
        .eq("state", state)
        .select("church_id, user_id, return_path, expires_at")
        .single()
      if (error || !challenge || new Date(challenge.expires_at).getTime() < Date.now()) {
        throw new Error("A conexão expirou. Volte ao app e tente novamente.")
      }

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("church_id, role")
        .eq("id", challenge.user_id)
        .single()
      if (profileError || !profile || !["admin", "pastor", "secretario", "tesoureiro", "superadmin"].includes(profile.role) ||
          (profile.role !== "superadmin" && profile.church_id !== challenge.church_id)) {
        throw new Error("O perfil não tem mais permissão para conectar o Drive desta igreja.")
      }

      const googleError = url.searchParams.get("error")
      if (googleError) throw new Error(googleError === "access_denied" ? "A autorização foi cancelada." : "O Google recusou a autorização.")

      const code = url.searchParams.get("code")
      if (!code) throw new Error("O Google não retornou o código de autorização.")
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      })
      const tokenResult = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenResult.access_token) {
        throw new Error("Não foi possível concluir a autorização do Google.")
      }

      const previous = await getConnection(admin, challenge.church_id)
      const refreshToken = tokenResult.refresh_token || (
        previous ? await decryptToken(previous.encrypted_refresh_token) : null
      )
      if (!refreshToken) throw new Error("O Google não forneceu autorização permanente. Remova o acesso antigo do app na Conta Google e tente novamente.")

      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenResult.access_token}` },
      })
      const userInfo = await userInfoResponse.json()
      if (!userInfoResponse.ok || !userInfo.email) throw new Error("Não foi possível confirmar a conta Google.")
      if (previous && previous.google_email.toLowerCase() !== String(userInfo.email).toLowerCase()) {
        throw new Error("Esta igreja já conectou outra conta Google. Reconecte a conta já vinculada para manter acesso aos comprovantes antigos.")
      }

      const folderId = previous?.drive_folder_id || await createDriveFolder(tokenResult.access_token)
      const { error: saveError } = await admin.from("church_google_drive_connections").upsert({
        church_id: challenge.church_id,
        google_email: userInfo.email,
        drive_folder_id: folderId,
        encrypted_refresh_token: await encryptToken(refreshToken),
        connected_by: challenge.user_id,
        updated_at: new Date().toISOString(),
      })
      if (saveError) throw new Error("Não foi possível salvar a conexão segura do Google Drive.")

      const target = new URL(challenge.return_path, returnBase)
      if (target.origin !== returnBase.origin) throw new Error("Endereço de retorno inválido.")
      target.searchParams.set("googleDrive", "connected")
      return Response.redirect(target.toString(), 302)
    } catch (error) {
      const target = new URL("/", returnBase)
      target.searchParams.set("googleDrive", "error")
      target.searchParams.set("message", error instanceof Error ? error.message : "Falha na conexão Google.")
      return Response.redirect(target.toString(), 302)
    }
  }

  try {
    if (req.method !== "POST") return json({ error: "Método não permitido." }, 405)
    const contentType = req.headers.get("Content-Type") || ""
    let body: Record<string, unknown>
    let form: FormData | null = null
    if (contentType.includes("multipart/form-data")) {
      form = await req.formData()
      body = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"))
    } else {
      body = await req.json()
    }

    const action = String(body.action || "")
    const churchId = String(body.churchId || "")
    const { admin: service, userId } = await requireChurchUser(req, churchId)

    if (action === "start") {
      const state = crypto.randomUUID() + crypto.randomUUID()
      const returnPath = typeof body.returnPath === "string" && body.returnPath.startsWith("/")
        ? body.returnPath
        : "/"
      const { error } = await service.from("church_google_drive_oauth_states").insert({
        state,
        church_id: churchId,
        user_id: userId,
        return_path: returnPath,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      if (error) throw new Error("Não foi possível iniciar a conexão Google.")

      const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      authorizationUrl.search = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "openid email https://www.googleapis.com/auth/drive.file",
        access_type: "offline",
        prompt: "consent",
        state,
      }).toString()
      return json({ authorizationUrl: authorizationUrl.toString() })
    }

    if (action === "status") {
      const connection = await getConnection(service, churchId)
      return json({ connected: !!connection, email: connection?.google_email || null })
    }

    if (action === "upload") {
      const file = form?.get("file")
      if (!(file instanceof File)) return json({ error: "Selecione um arquivo válido." }, 400)
      if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return json({ error: "Formato não aceito. Use PDF, JPG, PNG ou WebP." }, 400)
      }
      if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
        return json({ error: "O arquivo deve ter até 5 MB." }, 400)
      }
      const connection = await getConnection(service, churchId)
      if (!connection) return json({ error: "Conecte primeiro o Google Drive desta igreja." }, 409)
      const accessToken = await getAccessToken(connection)
      const boundary = `church-drive-${crypto.randomUUID()}`
      const metadata = JSON.stringify({
        name: file.name,
        mimeType: file.type,
        parents: [connection.drive_folder_id],
      })
      const fileBytes = new Uint8Array(await file.arrayBuffer())
      const encoder = new TextEncoder()
      const parts = [
        encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
        encoder.encode(`--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`),
        fileBytes,
        encoder.encode(`\r\n--${boundary}--`),
      ]
      const bodyBytes = new Uint8Array(parts.reduce((length, part) => length + part.length, 0))
      let offset = 0
      for (const part of parts) {
        bodyBytes.set(part, offset)
        offset += part.length
      }
      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: bodyBytes,
      })
      const result = await response.json()
      if (!response.ok || !result.id) throw new Error("O Google Drive não conseguiu armazenar o comprovante.")
      return json({ fileId: result.id })
    }

    if (action === "download" || action === "delete-file") {
      const connection = await getConnection(service, churchId)
      if (!connection) return json({ error: "O Google Drive desta igreja não está conectado." }, 409)
      const fileId = String(body.fileId || "")
      const accessToken = await getAccessToken(connection)
      await getOwnedDriveFile(accessToken, connection.drive_folder_id, fileId)

      if (action === "delete-file") {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok && response.status !== 404) throw new Error("Não foi possível remover o comprovante do Google Drive.")
        return json({ deleted: true })
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error("Não foi possível baixar o comprovante do Google Drive.")
      return new Response(response.body, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
          "Cache-Control": "private, no-store",
        },
      })
    }

    if (action === "disconnect") {
      const connection = await getConnection(service, churchId)
      if (!connection) return json({ disconnected: true })
      const refreshToken = await decryptToken(connection.encrypted_refresh_token)
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken }),
      })
      const { error } = await service.from("church_google_drive_connections").delete().eq("church_id", churchId)
      if (error) throw new Error("Não foi possível remover a conexão do Google Drive.")
      return json({ disconnected: true })
    }

    return json({ error: "Ação não reconhecida." }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado na integração Google Drive."
    const status = message.includes("Acesso negado") || message.includes("não pode gerenciar") ? 403 : 400
    return json({ error: message }, status)
  }
})
