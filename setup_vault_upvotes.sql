-- Create table for tracking upvotes on Velvet Vault questions
CREATE TABLE IF NOT EXISTS vault_question_upvotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE vault_question_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view upvotes" ON vault_question_upvotes
    FOR SELECT USING (true);

CREATE POLICY "Users can upvote" ON vault_question_upvotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove upvote" ON vault_question_upvotes
    FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create a view or function to get upvote counts if performance is needed, 
-- but for now we can select count(id) from client or join.
