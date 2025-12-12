/**
 * Utility functions to convert between HTML content and Block format
 * Used for integrating block-editor with the Notes application
 */

import { Block } from '../../../pages/ui/components/block-editor/models/block.model';

/**
 * Converts HTML content to Block array
 * @param html - HTML string content
 * @returns Array of Block objects
 */
export function htmlToBlocks(html: string): Block[] {
  if (!html || html.trim() === '') {
    return [{ id: generateBlockId(), type: 'paragraph', content: '' }];
  }

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const blocks: Block[] = [];

  // Process each child node
  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: text
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // Extract text content
      const textContent = element.textContent?.trim() || '';

      switch (tagName) {
        case 'h1':
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'heading1', content: textContent });
          }
          break;
        case 'h2':
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'heading2', content: textContent });
          }
          break;
        case 'h3':
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'heading3', content: textContent });
          }
          break;
        case 'p':
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'paragraph', content: textContent });
          }
          break;
        case 'blockquote':
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'quote', content: textContent });
          }
          break;
        case 'pre':
        case 'code':
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'code', content: textContent });
          }
          break;
        case 'ul':
          // Process list items
          element.querySelectorAll('li').forEach(li => {
            if (li.textContent?.trim()) {
              blocks.push({
                id: generateBlockId(),
                type: 'bullet',
                content: li.textContent.trim()
              });
            }
          });
          break;
        case 'ol':
          // Process ordered list items
          element.querySelectorAll('li').forEach(li => {
            if (li.textContent?.trim()) {
              blocks.push({
                id: generateBlockId(),
                type: 'ordered-list',
                content: li.textContent.trim()
              });
            }
          });
          break;
        case 'hr':
          blocks.push({ id: generateBlockId(), type: 'divider', content: '' });
          break;
        default:
          // For other elements, extract text content as paragraph
          if (textContent) {
            blocks.push({ id: generateBlockId(), type: 'paragraph', content: textContent });
          }
          // Also process child nodes
          Array.from(element.childNodes).forEach(child => processNode(child));
          break;
      }
    }
  };

  // Process all child nodes
  Array.from(tempDiv.childNodes).forEach(child => processNode(child));

  // If no blocks were created, create at least one empty paragraph
  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: 'paragraph', content: '' });
  }

  return blocks;
}

/**
 * Converts Block array to HTML string
 * @param blocks - Array of Block objects
 * @returns HTML string
 */
export function blocksToHtml(blocks: Block[]): string {
  if (!blocks || blocks.length === 0) {
    return '';
  }

  const htmlParts: string[] = [];

  blocks.forEach(block => {
    let html = '';

    switch (block.type) {
      case 'heading1':
        html = `<h1>${escapeHtml(block.content)}</h1>`;
        break;
      case 'heading2':
        html = `<h2>${escapeHtml(block.content)}</h2>`;
        break;
      case 'heading3':
        html = `<h3>${escapeHtml(block.content)}</h3>`;
        break;
      case 'paragraph':
        html = `<p>${escapeHtml(block.content)}</p>`;
        break;
      case 'quote':
        html = `<blockquote>${escapeHtml(block.content)}</blockquote>`;
        break;
      case 'code':
        html = `<pre><code>${escapeHtml(block.content)}</code></pre>`;
        break;
      case 'bullet':
        html = `<ul><li>${escapeHtml(block.content)}</li></ul>`;
        break;
      case 'ordered-list':
        html = `<ol><li>${escapeHtml(block.content)}</li></ol>`;
        break;
      case 'divider':
        html = '<hr>';
        break;
      case 'checklist': {
        const checked = block.properties?.checked ? 'checked' : '';
        html = `<ul><li><input type="checkbox" ${checked}>${escapeHtml(block.content)}</li></ul>`;
        break;
      }
      case 'image':
        html = block.content ? `<img src="${escapeHtml(block.content)}" alt="">` : '';
        break;
      default:
        html = `<p>${escapeHtml(block.content)}</p>`;
        break;
    }

    if (html) {
      htmlParts.push(html);
    }
  });

  return htmlParts.join('\n');
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generates a unique block ID
 * Uses the same format as block-editor (uuid v4)
 */
function generateBlockId(): string {
  // Use a simple ID generator that matches the block-editor format
  // Block editor uses uuid v4, but we'll use a simpler approach for compatibility
  // Format: block_timestamp_random
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

