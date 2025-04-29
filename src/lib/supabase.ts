import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or anon key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ensure the interviews table exists
export const ensureInterviewsTable = async () => {
  try {
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from("interviews")
      .select("*")
      .limit(1);

    if (checkError && checkError.code === "42P01") {
      // Table doesn't exist error code
      console.log("Interviews table does not exist. Creating table...");

      // Create the table using SQL
      const { error: createError } = await supabase.rpc(
        "create_interviews_table",
        {}
      );

      if (createError) {
        console.error("Error creating interviews table:", createError);

        // Alternative method - use REST API to create table if RPC fails
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            name: "interviews",
            schema: "public",
            columns: [
              { name: "id", type: "uuid", isPrimary: true, isIdentity: true },
              { name: "user_id", type: "uuid", isNullable: false },
              { name: "topic", type: "text", isNullable: false },
              { name: "difficulty", type: "text", isNullable: false },
              { name: "score", type: "decimal", isNullable: true },
              { name: "feedback", type: "text", isNullable: true },
              { name: "questions_answers", type: "jsonb", isNullable: false },
              {
                name: "created_at",
                type: "timestamp with time zone",
                defaultValue: "now()",
              },
            ],
          }),
        });

        if (!res.ok) {
          console.error(
            "Failed to create interviews table via REST API",
            await res.text()
          );
          return false;
        }
      }
      return true;
    } else if (checkError) {
      console.error("Error checking for interviews table:", checkError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error ensuring interviews table exists:", error);
    return false;
  }
};

// Authentication helper functions
export const signUp = async (
  email: string,
  password: string,
  fullName?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  return { data, error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
};
