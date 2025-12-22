export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  statusBarStyle: 'light-content' | 'dark-content';
  colors: {
    background: string;
    text: string;
    secondary: string;
    accent: string;
    highlight: string;
    border: string;
    card: string;
    muted: string;
  };
}

export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  isDark: false,
  statusBarStyle: 'dark-content',
  colors: {
    background: '#FAFAFA',
    text: '#111111',
    secondary: '#616161',
    accent: '#3A84F7',
    highlight: '#FFF59D',
    border: '#E0E0E0',
    card: '#FFFFFF',
    muted: '#9E9E9E',
  },
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  isDark: true,
  statusBarStyle: 'light-content',
  colors: {
    background: '#0E0F12',
    text: '#ECECEC',
    secondary: '#9AA0A6',
    accent: '#6BA8FF',
    highlight: '#FFD54F',
    border: '#2C2C2E',
    card: '#1C1C1E',
    muted: '#5F6368',
  },
};

export const solarTheme: Theme = {
  id: 'solar',
  name: 'Solar',
  isDark: false,
  statusBarStyle: 'dark-content',
  colors: {
    background: '#FEF6E4',
    text: '#3A3A2E',
    secondary: '#7A7156',
    accent: '#FF8A3D',
    highlight: '#FFE0A3',
    border: '#E5D6B0',
    card: '#FFF3D9',
    muted: '#B7A78A',
  },
};

export const monoTheme: Theme = {
  id: 'mono',
  name: 'Mono',
  isDark: false,
  statusBarStyle: 'dark-content',
  colors: {
    background: '#bcbcbcff',
    text: '#1F1F1F',
    secondary: '#5C5C5C',
    accent: '#6B6B6B',
    highlight: '#D0D0D0',
    border: '#B8B8B8',
    card: '#F0F0F0',
    muted: '#888888',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  solar: solarTheme,
  mono: monoTheme,
};

export const generateReaderCSS = (
  theme: Theme,
  fontSize: number,
  lineHeight: number,
  margins: number,
): string => {
  return `
    body.pn-reader {
      background-color: ${theme.colors.background} !important;
      color: ${theme.colors.text} !important;
      font-size: ${fontSize}px !important;
      line-height: ${lineHeight} !important;
      padding: ${margins}px !important;
    }

    body.pn-reader p,
    body.pn-reader div,
    body.pn-reader span,
    body.pn-reader li,
    body.pn-reader td,
    body.pn-reader th,
    body.pn-reader blockquote,
    body.pn-reader article,
    body.pn-reader section {
      font-size: inherit !important;
      line-height: inherit !important;
    }

    body.pn-reader a {
      color: ${theme.colors.accent};
    }

    body.pn-reader mark,
    body.pn-reader .highlight {
      background-color: ${theme.colors.highlight};
    }

    body.pn-reader h1,
    body.pn-reader h2,
    body.pn-reader h3,
    body.pn-reader h4,
    body.pn-reader h5,
    body.pn-reader h6 {
      color: ${theme.colors.text};
    }

    body.pn-reader blockquote {
      border-left-color: ${theme.colors.border};
      color: ${theme.colors.secondary};
    }

    body.pn-reader pre,
    body.pn-reader code {
      background-color: ${theme.colors.card};
      border: 1px solid ${theme.colors.border};
    }
  `;
};
