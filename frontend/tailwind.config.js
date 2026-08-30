/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // OpenNLP brand colors from opennlp-site
        brand: {
          purple: '#832778',
          red:    '#BE2043',
          orange: '#E56b28',
          yellow: '#F59523',
        },
        // NLP annotation colors
        entity: {
          person:       { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
          location:     { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
          organization: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
          date:         { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
          misc:         { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
          entity:       { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
        }
      }
    }
  },
  plugins: []
}
