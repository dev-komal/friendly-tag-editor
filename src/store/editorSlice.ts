
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Descendant } from 'slate';

export interface CustomText {
  text: string;
}

export interface ParagraphElement {
  type: 'paragraph';
  children: CustomText[];
}

// Define a custom type for our content
export type CustomElement = ParagraphElement;
export type CustomDescendant = CustomElement | CustomText;

export interface Tag {
  id: string;
  content: string;
  selection: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  color: string;
}

export interface EditorState {
  content: CustomDescendant[];
  tags: Tag[];
  fileName: string | null;
  lastSaved: string | null;
  isModified: boolean;
}

const initialContent: CustomDescendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Welcome to the Text Editor. Open a file or start typing...' }],
  },
];

const initialState: EditorState = {
  content: initialContent,
  tags: [],
  fileName: null,
  lastSaved: null,
  isModified: false,
};

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setContent: (state, action: PayloadAction<Descendant[]>) => {
      state.content = action.payload as CustomDescendant[];
      state.isModified = true;
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.tags.push(action.payload);
      state.isModified = true;
    },
    updateTag: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const { id, content } = action.payload;
      const tag = state.tags.find(tag => tag.id === id);
      if (tag) {
        tag.content = content;
        state.isModified = true;
      }
    },
    removeTag: (state, action: PayloadAction<string>) => {
      state.tags = state.tags.filter(tag => tag.id !== action.payload);
      state.isModified = true;
    },
    setFileName: (state, action: PayloadAction<string | null>) => {
      state.fileName = action.payload;
    },
    saveChanges: (state) => {
      state.lastSaved = new Date().toISOString();
      state.isModified = false;
    },
    resetEditor: (state) => {
      state.content = initialContent;
      state.tags = [];
      state.fileName = null;
      state.lastSaved = null;
      state.isModified = false;
    },
  },
});

export const {
  setContent,
  addTag,
  updateTag,
  removeTag,
  setFileName,
  saveChanges,
  resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
