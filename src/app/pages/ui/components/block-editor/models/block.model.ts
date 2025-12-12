export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'ordered-list' | 'checklist' | 'quote' | 'code' | 'divider' | 'image';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
    properties?: any; // For checklist checked state, etc.
}

export interface BlockEditorData {
    blocks: Block[];
}
