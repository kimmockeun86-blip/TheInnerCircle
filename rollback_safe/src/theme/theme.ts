import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
    // Backgrounds
    background: '#050510', // Deepest Navy/Black
    backgroundGradient: ['#050510', '#0A0A1A', '#151525'],

    // Accents
    gold: '#FFD700',
    goldDim: 'rgba(255, 215, 0, 0.6)',
    goldFaint: 'rgba(255, 215, 0, 0.15)',

    // Text
    textMain: '#FFFFFF',
    textDim: 'rgba(255, 255, 255, 0.7)',
    textDark: '#050510',

    // Status
    error: '#FF453A',
    success: '#32D74B',

    // Glassmorphism
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 215, 0, 0.3)',
    glassOverlay: 'rgba(0, 0, 0, 0.7)',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const LAYOUT = {
    window: {
        width,
        height,
    },
    isSmallDevice: width < 375,
    safeAreaTop: Platform.OS === 'ios' ? 44 : 24,
    borderRadius: {
        s: 10,
        m: 20,
        l: 30,
        xl: 40,
    }
};

export const FONTS = {
    // Use system fonts for now, but style them elegantly
    serif: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
    sans: Platform.select({ ios: 'System', android: 'sans-serif' }),
    // Add aliases for direct usage
    get title() { return this.serif; },
    get body() { return this.sans; },

    size: {
        h1: 32,
        h2: 24,
        h3: 20,
        body: 16,
        caption: 14,
        small: 12,
    },

    weight: {
        light: '300',
        regular: '400',
        medium: '500',
        bold: '700',
    }
};
