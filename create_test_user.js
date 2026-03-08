import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const email = 'commander@trigtype.com';
  const password = 'TriggerType2026!';

  console.log("Signing up user...");
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.log("Maybe user exists already:", data);
  } else {
    console.log("User created:", data.user?.id);
  }
}
run();
