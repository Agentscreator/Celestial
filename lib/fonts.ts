// Google Fonts integration for dynamic font loading
import { Inter, Roboto, Poppins, Montserrat, Open_Sans, Ubuntu, Raleway, Lora, Nunito, Oswald, Roboto_Condensed, Playfair_Display, Crimson_Text, Orbitron } from 'next/font/google'

// Define font configurations at module scope
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const openSans = Open_Sans({ 
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

const ubuntu = Ubuntu({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-ubuntu',
  display: 'swap',
})

const raleway = Raleway({ 
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

const lora = Lora({ 
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const oswald = Oswald({ 
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

const robotoCondensed = Roboto_Condensed({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-condensed',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
})

const crimsonText = Crimson_Text({ 
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-crimson-text',
  display: 'swap',
})


const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

// Export fonts object
export const fonts = {
  inter,
  roboto,
  poppins,
  montserrat,
  openSans,
  ubuntu,
  raleway,
  lora,
  nunito,
  oswald,
  robotoCondensed,
  playfairDisplay,
  crimsonText,
  orbitron,
}

// Font family mapping to CSS
export const fontFamilyMap: Record<string, string> = {
  'Inter': inter.variable,
  'Roboto': roboto.variable,
  'Poppins': poppins.variable,
  'Montserrat': montserrat.variable,
  'Open Sans': openSans.variable,
  'Ubuntu': ubuntu.variable,
  'Raleway': raleway.variable,
  'Lora': lora.variable,
  'Nunito': nunito.variable,
  'Oswald': oswald.variable,
  'Roboto Condensed': robotoCondensed.variable,
  'Playfair Display': playfairDisplay.variable,
  'Crimson Text': crimsonText.variable,
  'Orbitron': orbitron.variable,
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