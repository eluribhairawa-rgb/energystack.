# Supabase Setup Instructions

Please follow these steps in your Supabase Dashboard to enable the required features.

## 1. Database Setup (SQL Editor)

Run the following SQL in your Supabase Dashboard **SQL Editor** to create the `profiles` table and set up security.

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url: text,
  language: text default 'English',
  content_preferences: text[] default '{"Market", "Technology"}',
  has_password boolean default false,

  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Users can only see their own profile." on profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

```

## 2. Security Functions (RPC)

Run the following SQL to enable efficient user lookup for the invitation system.

```sql
-- Efficient function to lookup a user ID by email
-- Can only be executed by the service_role (Secret Key)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
BEGIN
  -- Security check: only allow service_role
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Access Denied: Service Role required';
  END IF;

  SELECT id INTO found_id FROM auth.users WHERE email = email_input LIMIT 1;
  RETURN found_id;
END;
$$;
```

## 3. Authentication Settings

Go to **Authentication -> Providers -> Email** in your Supabase Dashboard.

1.  **Enable Email Provider**: Ensure it is enabled.
2.  **Confirm Email**: Enable "Confirm email".
3.  **Secure Code (OTP)**:
    *   Go to **Authentication -> Email Templates**.
    *   Select **Confirm Signup**.
    *   Change the `{{ .ConfirmationURL }}` to just `{{ .Token }}` in the body.
    *   **Recommended Body**:
        ```text
        <h2>Confirm your signup</h2>
        <p>Your confirmation code is: <strong>{{ .Token }}</strong></p>
        ```
    *   Do the same for **Reset Password** template. Change the `{{ .ConfirmationURL }}` to just `{{ .Token }}`. 

## 3. Storage (for Avatars)

Go to **Storage** in the sidebar.

1.  Create a new bucket named `avatars`.
2.  Set it to **Public**.
3.  Add a policy to allow authenticated users to upload:
    *   Allowed operations: `INSERT`, `UPDATE`, `SELECT`.
```
