import { Extension } from '@tiptap/core';
import { TextStyle } from '@tiptap/extension-text-style';

export interface FontFamilyOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
  }
}

export const FontFamily = Extension.create<FontFamilyOptions>({
  name: 'fontFamily',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontFamily) {
                return {};
              }
              // Quote font names that contain spaces or are not generic families
              const fontFamily = attributes.fontFamily;
              const genericFamilies = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];
              const needsQuotes = !genericFamilies.includes(fontFamily.toLowerCase()) &&
                (fontFamily.includes(' ') || fontFamily.includes('-'));
              const quotedFont = needsQuotes ? `"${fontFamily}"` : fontFamily;
              return {
                style: `font-family: ${quotedFont}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily })
          .run();
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain()
          .unsetMark('textStyle')
          .run();
      },
    };
  },
});

