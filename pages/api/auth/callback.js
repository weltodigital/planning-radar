import { createBrowserClient } from '../../../lib/supabase/pages-client'

export default async function handler(req, res) {
  const { code } = req.query

  if (code) {
    const supabase = createBrowserClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth error:', error)
        return res.redirect('/login?error=auth_error')
      }

      // Successful auth - redirect to dashboard
      return res.redirect('/dashboard')
    } catch (error) {
      console.error('Callback error:', error)
      return res.redirect('/login?error=callback_error')
    }
  }

  // No code provided
  return res.redirect('/login?error=no_code')
}