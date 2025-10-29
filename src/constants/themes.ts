export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    secondary: string;
    accent: string;
    highlight: string;
    border: string;
    card: string;
  };
}

export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    background: '#FAFAFA',
    text: '#111111',
    secondary: '#616161',
    accent: '#3A84F7',
    highlight: '#FFF59D',
    border: '#E0E0E0',
    card: '#FFFFFF',
  },
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    background: '#0E0F12',
    text: '#ECECEC',
    secondary: '#9AA0A6',
    accent: '#6BA8FF',
    highlight: '#FFD54F',
    border: '#2C2C2E',
    card: '#1C1C1E',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export const generateReaderCSS = (
  theme: Theme,
  fontSize: number,
  lineHeight: number,
  margins: number,
): string => {
  return `
    body {
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      padding: ${margins}px;
    }
    
    a {
      color: ${theme.colors.accent};
    }
    
    mark, .highlight {
      background-color: ${theme.colors.highlight};
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: ${theme.colors.text};
    }
    
    blockquote {
      border-left-color: ${theme.colors.border};
      color: ${theme.colors.secondary};
    }
    
    pre, code {
      background-color: ${theme.colors.card};
      border: 1px solid ${theme.colors.border};
    }
  `;
};
