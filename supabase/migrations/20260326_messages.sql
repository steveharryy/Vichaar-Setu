-- Migration: Create messages table for encrypted chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_request_id UUID NOT NULL REFERENCES public.contact_requests(id) ON DELETE CASCADE,
    sender_clerk_id TEXT NOT NULL,
    content TEXT NOT NULL,  -- stores AES-GCM encrypted Base64 ciphertext
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Permissive policies (auth handled at application layer via Clerk)
CREATE POLICY "Allow select messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete messages" ON public.messages FOR DELETE USING (true);

-- Index for fast thread loading
CREATE INDEX IF NOT EXISTS idx_messages_contact_request_id ON public.messages(contact_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
