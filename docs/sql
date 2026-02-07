-- =====================================================
-- FLOCK CARE CENTRAL - SUPABASE SCHEMA (SAFE VERSION)
-- Sistema de Gestão de Igrejas
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Selecione TODO este arquivo (Ctrl + A)
-- 2. Copie (Ctrl + C)
-- 3. Vá para: https://supabase.com/dashboard
-- 4. Abra seu projeto
-- 5. Clique em "SQL Editor" > "New query"
-- 6. Cole este código (Ctrl + V)
-- 7. Clique em "Run" ou pressione Ctrl + Enter
-- 8. Aguarde 1-2 minutos
-- 9. Você deve ver: "Success. No rows returned"
-- 
-- ESTA VERSÃO É SEGURA PARA RE-EXECUTAR!
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'secretario', 'tesoureiro', 'membro')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    marital_status TEXT CHECK (marital_status IN ('solteiro', 'casado', 'divorciado', 'viuvo')),
    gender TEXT CHECK (gender IN ('masculino', 'feminino')),
    baptized BOOLEAN DEFAULT FALSE,
    baptism_date DATE,
    member_since DATE,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'visitante')),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MINISTRIES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.members(id),
    color TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Members (many-to-many)
CREATE TABLE IF NOT EXISTS public.ministry_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ministry_id, member_id)
);

-- =====================================================
-- CELLS (Grupos Pequenos)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.members(id),
    host_id UUID REFERENCES public.members(id),
    meeting_day TEXT,
    meeting_time TIME,
    address TEXT,
    city TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cell Members (many-to-many)
CREATE TABLE IF NOT EXISTS public.cell_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cell_id, member_id)
);

-- Cell Reports
CREATE TABLE IF NOT EXISTS public.cell_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    attendance INTEGER,
    visitors INTEGER,
    conversions INTEGER,
    offerings DECIMAL(10, 2),
    testimonies TEXT,
    prayer_requests TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('culto', 'evento', 'reuniao', 'especial')),
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    responsible_id UUID REFERENCES public.members(id),
    status TEXT DEFAULT 'planejado' CHECK (status IN ('planejado', 'confirmado', 'realizado', 'cancelado')),
    estimated_attendees INTEGER,
    actual_attendees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Checklists
CREATE TABLE IF NOT EXISTS public.event_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    responsible_id UUID REFERENCES public.members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Scale (Escalas de Serviço)
CREATE TABLE IF NOT EXISTS public.service_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    category TEXT NOT NULL,
    subcategory TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    payment_method TEXT,
    member_id UUID REFERENCES public.members(id),
    event_id UUID REFERENCES public.events(id),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Categories
CREATE TABLE IF NOT EXISTS public.financial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    color TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DISCIPLESHIP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.discipleships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disciple_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discipleship Meetings
CREATE TABLE IF NOT EXISTS public.discipleship_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipleship_id UUID REFERENCES public.discipleships(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    topic TEXT,
    notes TEXT,
    attendance BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    present BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- =====================================================
-- UPLOADS & DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    category TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSTITUTIONAL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.church_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    cnpj TEXT,
    pastor_name TEXT,
    founded_date DATE,
    mission TEXT,
    vision TEXT,
    values TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (SAFE)
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Members policies
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
DROP POLICY IF EXISTS "Admins and secretarios can insert members" ON public.members;
DROP POLICY IF EXISTS "Admins and secretarios can update members" ON public.members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.members;

-- General read policies
DROP POLICY IF EXISTS "Authenticated users can view ministries" ON public.ministries;
DROP POLICY IF EXISTS "Authenticated users can view cells" ON public.cells;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

-- Financial policies
DROP POLICY IF EXISTS "Admins and tesoureiros can view financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admins and tesoureiros can manage financial transactions" ON public.financial_transactions;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- =====================================================
-- CREATE NEW POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Members policies (readable by authenticated users)
CREATE POLICY "Authenticated users can view members" ON public.members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and secretarios can insert members" ON public.members
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'secretario')
        )
    );

CREATE POLICY "Admins and secretarios can update members" ON public.members
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'secretario')
        )
    );

CREATE POLICY "Admins can delete members" ON public.members
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- General read policy for authenticated users
CREATE POLICY "Authenticated users can view ministries" ON public.ministries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view cells" ON public.cells
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view events" ON public.events
    FOR SELECT TO authenticated USING (true);

-- Financial policies (restricted to admin and tesoureiro)
CREATE POLICY "Admins and tesoureiros can view financial transactions" ON public.financial_transactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'tesoureiro')
        )
    );

CREATE POLICY "Admins and tesoureiros can manage financial transactions" ON public.financial_transactions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'tesoureiro')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
DROP TRIGGER IF EXISTS update_ministries_updated_at ON public.ministries;
DROP TRIGGER IF EXISTS update_cells_updated_at ON public.cells;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
DROP TRIGGER IF EXISTS update_discipleships_updated_at ON public.discipleships;
DROP TRIGGER IF EXISTS update_church_info_updated_at ON public.church_info;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON public.ministries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON public.cells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discipleships_updated_at BEFORE UPDATE ON public.discipleships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_info_updated_at BEFORE UPDATE ON public.church_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'membro')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_birth_date ON public.members(birth_date);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry_id ON public.ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_member_id ON public.ministry_members(member_id);

CREATE INDEX IF NOT EXISTS idx_cell_members_cell_id ON public.cell_members(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_members_member_id ON public.cell_members(member_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default financial categories
INSERT INTO public.financial_categories (name, type, color, icon) VALUES
    ('Dízimos', 'entrada', '#10B981', 'DollarSign'),
    ('Ofertas', 'entrada', '#3B82F6', 'Gift'),
    ('Doações', 'entrada', '#8B5CF6', 'Heart'),
    ('Salários', 'saida', '#EF4444', 'Users'),
    ('Infraestrutura', 'saida', '#F59E0B', 'Home'),
    ('Missões', 'saida', '#06B6D4', 'Globe'),
    ('Eventos', 'saida', '#EC4899', 'Calendar'),
    ('Materiais', 'saida', '#6366F1', 'Package')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View for member statistics
CREATE OR REPLACE VIEW public.member_statistics AS
SELECT
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE status = 'ativo') as active_members,
    COUNT(*) FILTER (WHERE baptized = true) as baptized_members,
    COUNT(*) FILTER (WHERE gender = 'masculino') as male_members,
    COUNT(*) FILTER (WHERE gender = 'feminino') as female_members,
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(birth_date)) < 18) as children,
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 18 AND 35) as youth,
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(birth_date)) > 35) as adults
FROM public.members;

-- View for financial summary
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END) as balance
FROM public.financial_transactions
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- =====================================================
-- SCHEMA COMPLETE ✅
-- =====================================================
