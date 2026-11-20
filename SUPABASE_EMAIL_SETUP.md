# Email Subscription System Setup

Run the following SQL commands in your Supabase **SQL Editor**.

## 1. Modify Profiles Table
Add fields to track subscription status and rate limiting.

```sql
ALTER TABLE public.profiles 
ADD COLUMN marketing_opt_in boolean DEFAULT false,
ADD COLUMN last_email_sent_at timestamptz;

-- Create an index for efficient daily batch processing
CREATE INDEX idx_profiles_email_subscription 
ON public.profiles (marketing_opt_in, last_email_sent_at);
```

## 2. Create Unsubscribe Tokens Table
This table stores temporary tokens mapped to users. Using a separate table allows us to manage tokens independently of user profile data.

```sql
CREATE TABLE public.unsubscribe_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- Enable RLS (though we will use a SECURITY DEFINER function to access it)
ALTER TABLE public.unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
```

## 3. Create Secure Unsubscribe Function
This function allows the public web page to unsubscribe a user if they possess a valid token. It runs with `SECURITY DEFINER` privileges to bypass RLS for this specific operation.

```sql
CREATE OR REPLACE FUNCTION public.confirm_unsubscribe(token_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- 1. Find the user associated with this token
  SELECT user_id INTO target_user_id
  FROM public.unsubscribe_tokens
  WHERE token = token_input;

  -- 2. If no user found, return false (Invalid/Expired token)
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 3. Opt-out the user
  UPDATE public.profiles
  SET marketing_opt_in = false
  WHERE id = target_user_id;

  -- 4. Delete the token (Single-use)
  DELETE FROM public.unsubscribe_tokens
  WHERE token = token_input;

  RETURN true;
END;
$$;
```
