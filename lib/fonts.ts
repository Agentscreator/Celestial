// Google Fonts integration for dynamic font loading
import { Inter, Roboto, Poppins, Montserrat, Open_Sans, Ubuntu, Raleway, Lora, Nunito, Oswald, Roboto_Condensed, Playfair_Display, Crimson_Text, Source_Sans_Pro, Orbitron } from 'next/font/google'

// Define font configurations
export const fonts = {
  inter: Inter({ 
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
  }),
  roboto: Roboto({ 
    subsets: ['latin'],
    weight: ['300', '400', '500', '700'],
    variable: '--font-roboto',
    display: 'swap',
  }),
  poppins: Poppins({ 
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-poppins',
    display: 'swap',
  }),
  montserrat: Montserrat({ 
    subsets: ['latin'],
    variable: '--font-montserrat',
    display: 'swap',
  }),
  'open-sans': Open_Sans({ 
    subsets: ['latin'],
    variable: '--font-open-sans',
    display: 'swap',
  }),
  ubuntu: Ubuntu({ 
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    variable: '--font-ubuntu',
    display: 'swap',
  }),
  raleway: Raleway({ 
    subsets: ['latin'],
    variable: '--font-raleway',
    display: 'swap',
  }),
  lora: Lora({ 
    subsets: ['latin'],
    variable: '--font-lora',
    display: 'swap',
  }),
  nunito: Nunito({ 
    subsets: ['latin'],
    variable: '--font-nunito',
    display: 'swap',
  }),
  oswald: Oswald({ 
    subsets: ['latin'],
    variable: '--font-oswald',
    display: 'swap',
  }),
  'roboto-condensed': Roboto_Condensed({ 
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-roboto-condensed',
    display: 'swap',
  }),
  'playfair-display': Playfair_Display({ 
    subsets: ['latin'],
    variable: '--font-playfair-display',
    display: 'swap',
  }),
  'crimson-text': Crimson_Text({ 
    subsets: ['latin'],
    weight: ['400', '600'],
    variable: '--font-crimson-text',
    display: 'swap',
  }),
  'source-sans-pro': Source_Sans_Pro({ 
    subsets: ['latin'],
    weight: ['400', '600'],
    variable: '--font-source-sans-pro',
    display: 'swap',
  }),
  orbitron: Orbitron({ 
    subsets: ['latin'],
    variable: '--font-orbitron',
    display: 'swap',
  }),
}

// Font family mapping to CSS
export const fontFamilyMap: Record<string, string> = {
  'Inter': 'var(--font-inter)',
  'Roboto': 'var(--font-roboto)',
  'Poppins': 'var(--font-poppins)',
  'Montserrat': 'var(--font-montserrat)',
  'Open Sans': 'var(--font-open-sans)',
  'Ubuntu': 'var(--font-ubuntu)',
  'Raleway': 'var(--font-raleway)',
  'Lora': 'var(--font-lora)',
  'Nunito': 'var(--font-nunito)',
  'Oswald': 'var(--font-oswald)',
  'Roboto Condensed': 'var(--font-roboto-condensed)',
  'Playfair Display': 'var(--font-playfair-display)',
  'Crimson Text': 'var(--font-crimson-text)',
  'Source Sans Pro': 'var(--font-source-sans-pro)',
  'Orbitron': 'var(--font-orbitron)',
}

// Function to get all font variable strings for className
export const getFontVariables = () => {
  return Object.values(fonts).map(font => font.variable).join(' ')
}

// Utility to load fonts dynamically via Google Fonts API
export const loadGoogleFont = (fontFamily: string, weights: string[] = ['400']) => {
  const fontName = fontFamily.replace(/\s+/g, '+')
  const weightString = weights.join(',')
  const url = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weightString}&display=swap`
  
  // Check if font is already loaded
  if (document.querySelector(`link[href="${url}"]`)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to load font: ${fontFamily}`))
    
    document.head.appendChild(link)
  })
}

// Get CSS font family value, with fallback loading
export const getFontFamily = async (fontFamily: string): Promise<string> => {
  // Check if it's a mapped font
  if (fontFamilyMap[fontFamily]) {
    return fontFamilyMap[fontFamily]
  }
  
  // For unmapped fonts, load dynamically and return generic CSS
  try {
    await loadGoogleFont(fontFamily)
    return `"${fontFamily}", system-ui, -apple-system, sans-serif`
  } catch (error) {
    console.warn(`Failed to load font ${fontFamily}, using fallback`)
    return 'system-ui, -apple-system, sans-serif'
  }
}