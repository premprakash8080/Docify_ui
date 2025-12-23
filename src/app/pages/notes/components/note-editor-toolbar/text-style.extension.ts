import { Mark } from '@tiptap/core';

export const TextStyle = Mark.create({
  name: 'textStyle',
  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, ''),
        renderHTML: attributes => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: ${attributes.fontFamily}`,
          };
        },
      },
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: element => {
          const style = (element as HTMLElement).getAttribute('style');
          if (!style || (!style.includes('font-family') && !style.includes('font-size'))) {
            return false;
          }
          const fontFamily = (element as HTMLElement).style.fontFamily?.replace(/['"]+/g, '') || null;
          const fontSize = (element as HTMLElement).style.fontSize || null;
          return { fontFamily, fontSize };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setMark: (typeOrName: string, attributes?: any) => ({ chain }) => {
        return chain().setMark(typeOrName, attributes).run();
      },
      unsetMark: (typeOrName: string) => ({ chain }) => {
        return chain().unsetMark(typeOrName).run();
      },
    };
  },
});

