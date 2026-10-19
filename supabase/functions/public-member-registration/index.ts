import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

function cleanDate(d: unknown): string | null {
  if (!d || typeof d !== "string") return null;
  const trimmed = d.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return `${year}-${month}-${day}`;
  }
  return null;
}

function cleanMaritalStatus(status: unknown): "solteiro" | "casado" | "divorciado" | "viuvo" {
  if (!status || typeof status !== "string") return "solteiro";
  const s = status.toLowerCase().trim();
  if (["solteiro", "casado", "divorciado", "viuvo"].includes(s)) {
    return s as "solteiro" | "casado" | "divorciado" | "viuvo";
  }
  if (s === "uniao_estavel" || s === "união estável") {
    return "casado";
  }
  return "solteiro";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const json = (obj: object, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Configuração do servidor ausente" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  async function findChurch(slugOrId: string) {
    const clean = decodeURIComponent(slugOrId).trim();
    if (!clean) return null;

    const { data: bySlug } = await supabase
      .from("churches")
      .select("id, name, slug, logo_url, president_name, address")
      .eq("slug", clean)
      .maybeSingle();

    if (bySlug) return bySlug;

    const { data: byId } = await supabase
      .from("churches")
      .select("id, name, slug, logo_url, president_name, address")
      .eq("id", clean)
      .maybeSingle();

    return byId || null;
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const churchParam = url.searchParams.get("church") || "";
      const church = await findChurch(churchParam);
      if (!church) {
        return json({ error: "Igreja não encontrada" }, 404);
      }
      return json({ ok: true, church });
    }

    if (req.method !== "POST") {
      return json({ error: "Método não permitido" }, 405);
    }

    const body = await req.json();
    const churchKey = String(body.churchId || body.churchSlug || "").trim();
    if (!churchKey) {
      return json({ error: "Identificador da igreja é obrigatório" }, 400);
    }

    const church = await findChurch(churchKey);
    if (!church) {
      return json({ error: "Igreja não encontrada" }, 404);
    }

    const memberData = body.member || {};
    const name = String(memberData.name || "").trim();
    if (!name) {
      return json({ error: "O nome completo é obrigatório" }, 400);
    }

    let photoUrl: string | null = memberData.photo_url || null;

    // Se a foto vier em Base64 (Data URL), salva no Storage com Service Role para gerar URL limpa
    if (photoUrl && photoUrl.startsWith("data:image/")) {
      try {
        const matches = photoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
          const filePath = `members/${church.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("church-documents")
            .upload(filePath, bytes, {
              contentType,
              cacheControl: "31536000",
            });
          if (!upErr) {
            const { data: pub } = supabase.storage.from("church-documents").getPublicUrl(filePath);
            if (pub?.publicUrl) {
              photoUrl = pub.publicUrl;
            }
          }
        }
      } catch (e) {
        console.warn("Falha ao converter Data URL para storage, mantendo original:", e);
      }
    }

    const insertPayload = {
      church_id: church.id,
      name,
      email: memberData.email ? String(memberData.email).trim() : null,
      phone: memberData.phone ? String(memberData.phone).trim() : null,
      birth_date: cleanDate(memberData.birth_date),
      marital_status: cleanMaritalStatus(memberData.marital_status),
      address: memberData.address ? String(memberData.address).trim() : null,
      photo_url: photoUrl,
      notes: memberData.notes ? String(memberData.notes) : null,
      status: memberData.status === "visitante" ? "visitante" : "ativo",
    };

    const { data: created, error: insertError } = await supabase
      .from("members")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      return json({ error: insertError.message }, 400);
    }

    return json({ ok: true, member: created, church });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno ao registrar membro";
    return json({ error: msg }, 500);
  }
});
