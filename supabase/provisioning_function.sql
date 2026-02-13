-- Função para Criar Igreja e Vincular Administrador Atomicamente
CREATE OR REPLACE FUNCTION create_church_with_admin(
    church_name TEXT,
    church_slug TEXT,
    admin_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_church_id UUID;
    result JSONB;
BEGIN
    -- 1. Inserir a Igreja
    INSERT INTO public.churches (name, slug)
    VALUES (church_name, church_slug)
    RETURNING id INTO new_church_id;

    -- 2. Tentar vincular o usuário se ele já existir no AUTH.USERS
    -- Se não existir, o SuperAdmin pode convidá-lo depois via UI,
    -- mas aqui já preparamos o Profile se o email for encontrado.
    
    UPDATE public.profiles
    SET 
        church_id = new_church_id,
        role = 'admin'
    WHERE email = admin_email;

    -- 3. Retornar os dados da igreja criada
    SELECT json_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'created_at', created_at
    ) INTO result
    FROM public.churches
    WHERE id = new_church_id;

    RETURN result;
END;
$$;
