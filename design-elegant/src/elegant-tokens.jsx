// Elegant / wedding-invitation design tokens
// Cream base, deep emerald, antique gold. Serif type.
const E = {
  // Palette
  cream:    '#f5efe4',  // page bg
  cream2:   '#ede4d2',  // softer cream
  paper:    '#fbf7ee',  // card surface (slightly brighter than page)
  paperEdge:'#e7dcc4',  // hairline border
  ink:      '#1f2a24',  // primary text (almost-black with green undertone)
  ink2:     '#3a463d',
  muted:    '#7a7062',  // secondary text
  rule:     '#c9b48a',  // hairline gold rule
  gold:     '#a6864d',  // antique gold
  goldDeep: '#8a6a35',  // darker gold for type accents
  goldSoft: '#d9c08a',  // tints
  emerald:  '#2f4a3a',  // deep green for court labels
  emeraldDeep:'#1d3327',
  burgundy: '#8a2a2a',  // loss / L
  win:      '#3a6d4b',  // W accent
  medal1:   '#d4af37',  // gold medal
  medal2:   '#bfbfbf',  // silver
  medal3:   '#b87333',  // bronze
  // Levels — palette stays elegant
  levels: {
    'A+':       { bg: '#1d3327', fg: '#f5efe4', label: 'A+' },
    'A':        { bg: '#1d3327', fg: '#f5efe4', label: 'A'  },
    'B+':       { bg: '#2f4a3a', fg: '#f5efe4', label: 'B+' },
    'B':        { bg: '#2f4a3a', fg: '#f5efe4', label: 'B'  },
    'C+':       { bg: '#a6864d', fg: '#1f2a24', label: 'C+' },
    'C-strong': { bg: '#a6864d', fg: '#1f2a24', label: 'C+' },
    'C':        { bg: '#d9c08a', fg: '#1f2a24', label: 'C'  },
    'C-':       { bg: '#ede4d2', fg: '#1f2a24', label: 'C-' },
    'D':        { bg: '#ede4d2', fg: '#7a7062', label: 'D'  },
  },
  // Typography
  fontDisplay: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
  fontSerif:   '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  fontUI:      '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  // Radius / spacing
  radius:   14,
  radiusLg: 18,
};

window.E = E;
