const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hewfqrwisfweufkhnfsv.supabase.co';
const supabaseKey = 'sb_publishable_SpBxLBxhhhDgpH8K406DAg_uSuUaset';

async function setupTestSession() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Attempting to sign up test user...');

    // Try to sign up a test user with magic link
    const { data, error } = await supabase.auth.signUp({
      email: 'maya+test@example.com',
      password: 'TestPassword123!', // Password-based signup (if enabled)
    });

    if (error) {
      console.log('Sign up error (this is expected if magic link is required):', error.message);
      console.log('Attempting magic link flow instead...');

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: 'maya+test@example.com',
      });

      if (otpError) {
        console.log('OTP error:', otpError.message);
      } else {
        console.log('Magic link sent! Check email or console for details.');
      }
    } else {
      console.log('Sign up successful!');
      console.log('User:', data.user?.id);
      console.log('Session:', data.session?.access_token?.substring(0, 20) + '...');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setupTestSession();
