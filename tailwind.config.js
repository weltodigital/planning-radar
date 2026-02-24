/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E', // deep teal
          light: '#14B8A6',
          dark: '#0D5851',
        },
        secondary: {
          DEFAULT: '#1E293B', // slate
          light: '#475569',
        },
        accent: {
          DEFAULT: '#F59E0B', // amber
          light: '#FCD34D',
          dark: '#D97706',
        },
        background: '#F8FAFC',
        card: '#FFFFFF',
        success: '#22C55E', // green - approved
        danger: '#EF4444',  // red - refused
        warning: '#F59E0B', // amber - pending
        muted: '#9CA3AF',   // grey - withdrawn
      },
      borderRadius: {
        lg: '8px',
      },
    },
  },
  plugins: [],
}