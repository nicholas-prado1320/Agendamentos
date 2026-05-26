import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const PeonyTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fff1f2',
      100: '#ffe3e5',
      200: '#ffc9ce',
      300: '#fda4ad',
      400: '#f97989',
      500: '#ef8588',
      600: '#ed747b',
      700: '#d94f61',
      800: '#b83f50',
      900: '#993847',
      950: '#561b25'
    },

    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fffaf7',
          100: '#fff8f5',
          200: '#fff1ee',
          300: '#ffe3e3',
          400: '#eeb09b',
          500: '#bf7150',
          600: '#91695c',
          700: '#735345',
          800: '#573425',
          900: '#33211a',
          950: '#1f120d'
        },

        primary: {
          color: '#ef8588',
          inverseColor: '#ffffff',
          hoverColor: '#ed747b',
          activeColor: '#d94f61'
        },

        highlight: {
          background: '#fff0f0',
          focusBackground: '#ffe3e3',
          color: '#573425',
          focusColor: '#33211a'
        },

        formField: {
          background: 'rgba(255, 255, 255, 0.8)',
          disabledBackground: '#fff1ee',
          filledBackground: 'rgba(255, 255, 255, 0.8)',
          filledHoverBackground: '#ffffff',
          filledFocusBackground: '#ffffff',
          borderColor: 'rgba(196, 126, 93, 0.14)',
          hoverBorderColor: '#ef8588',
          focusBorderColor: '#ef8588',
          invalidBorderColor: '#ef4444',
          color: '#573425',
          disabledColor: '#91695c',
          placeholderColor: '#b59b90',
          invalidPlaceholderColor: '#ef4444',
          floatLabelColor: '#735345',
          floatLabelFocusColor: '#ef8588',
          floatLabelActiveColor: '#bf7150',
          iconColor: '#bf7150',
          shadow: 'none'
        },

        text: {
          color: '#573425',
          hoverColor: '#33211a',
          mutedColor: '#735345',
          hoverMutedColor: '#573425'
        },

        content: {
          background: '#ffffff',
          hoverBackground: '#fff8f5',
          borderColor: 'rgba(196, 126, 93, 0.14)',
          color: '#573425',
          hoverColor: '#33211a'
        },

        overlay: {
          select: {
            background: '#ffffff',
            borderColor: 'rgba(196, 126, 93, 0.14)',
            color: '#573425'
          },
          popover: {
            background: '#ffffff',
            borderColor: 'rgba(196, 126, 93, 0.14)',
            color: '#573425'
          },
          modal: {
            background: '#ffffff',
            borderColor: 'rgba(196, 126, 93, 0.14)',
            color: '#573425'
          }
        }
      }
    }
  }
});