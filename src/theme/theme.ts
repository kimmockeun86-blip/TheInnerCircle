import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
    // Backgrounds - Cosmic Theme
    background: '#0A0A14', // Deep space black with hint of blue
    backgroundGradient: ['#1A0A2E', '#0F1729', '#050510'], // Deep purple to midnight blue

    // Primary Accents - Cosmic Purple/Blue
    primary: '#8B5CF6', // Vibrant purple
    primaryDim: 'rgba(139, 92, 246, 0.6)',
    primaryFaint: 'rgba(139, 92, 246, 0.15)',

    // Secondary Accents - Aurora
    secondary: '#06B6D4', // Cyan
    aurora: '#A855F7', // Bright purple
    starGlow: '#E0E7FF', // Soft white-blue for stars

    // Legacy support (gold -> purple)
    gold: '#A78BFA', // Light purple (replaces gold)
    goldDim: 'rgba(167, 139, 250, 0.6)',
    goldFaint: 'rgba(167, 139, 250, 0.15)',

    // Text
    textMain: '#F8FAFC',
    textDim: 'rgba(248, 250, 252, 0.7)',
    textDark: '#0A0A14',

    // Status
    error: '#F43F5E', // Rose red
    success: '#10B981', // Emerald green

    // Glassmorphism - Cosmic style
    glass: 'rgba(139, 92, 246, 0.08)', // Purple tinted glass
    glassBorder: 'rgba(139, 92, 246, 0.25)', // Purple border
    glassOverlay: 'rgba(10, 10, 20, 0.8)',
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
