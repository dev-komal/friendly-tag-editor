
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createEditor, Descendant, Editor, Range, Transforms } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { v4 as uuidv4 } from 'uuid';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { setContent, addTag, saveChanges, Tag } from '@/store/editorSlice';
import EditorToolbar from './EditorToolbar';
import TagList from './TagList';
import { cn } from '@/lib/utils';

const TextEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { content, tags, lastSaved, isModified } = useAppSelector((state) => state.editor);
  
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [selection, setSelection] = useState<Range | null>(null);
  
  // Initialize the editor with content from Redux store
  useEffect(() => {
    try {
      // Only reset the editor content if it's different from the current editor value
      const currentValue = editor.children;
      const storeValue = content;
      
      if (JSON.stringify(currentValue) !== JSON.stringify(storeValue)) {
        editor.children = storeValue;
        editor.onChange();
      }
    } catch (error) {
      console.error('Error initializing editor:', error);
    }
  }, [editor]);

  // Auto-save functionality
  useEffect(() => {
    if (!isModified) return;
    
    const autoSaveTimer = setTimeout(() => {
      dispatch(saveChanges());
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer);
  }, [content, isModified, dispatch]);

  const handleChange = useCallback((newValue: Descendant[]) => {
    dispatch(setContent(newValue));
  }, [dispatch]);

  const handleSelectionChange = useCallback((newSelection: Range | null) => {
    setSelection(newSelection);
  }, []);

  const addTagToSelection = useCallback((tagContent: string, color: string = '#FFE58F') => {
    if (selection && !Range.isCollapsed(selection)) {
      const tag: Tag = {
        id: uuidv4(),
        content: tagContent,
        selection: selection,
        color
      };
      dispatch(addTag(tag));
    }
  }, [selection, dispatch]);

  // Render leaf function to highlight tagged text
  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props;
    
    // Find all tags that apply to this text node
    const matchingTags = tags.filter(tag => {
      // Check if this text node is within a tagged range
      try {
        const tagRange = {
          anchor: { path: tag.selection.anchor.path, offset: tag.selection.anchor.offset },
          focus: { path: tag.selection.focus.path, offset: tag.selection.focus.offset }
        };
        
        return Editor.rangeIncludes(editor, tagRange, props.leaf.offset);
      } catch (error) {
        return false;
      }
    });
    
    if (matchingTags.length > 0) {
      // Use the first matching tag's color (we could also blend colors or show multiple tags)
      const tagColor = matchingTags[0].color;
      
      return (
        <span
          {...attributes}
          className={cn(
            "bg-opacity-30 relative group",
            { "cursor-pointer": matchingTags.length > 0 }
          )}
          style={{ backgroundColor: tagColor }}
          data-tag-id={matchingTags.map(t => t.id).join(',')}
        >
          {children}
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg hidden group-hover:block z-10 min-w-[200px] text-sm">
            {matchingTags.map(tag => (
              <div key={tag.id} className="mb-1">
                {tag.content}
              </div>
            ))}
          </span>
        </span>
      );
    }
    
    return <span {...attributes}>{children}</span>;
  }, [editor, tags]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
      <div className="flex-1 flex flex-col h-full">
        <EditorToolbar 
          addTag={addTagToSelection}
          selection={selection}
        />
        <div className="flex-1 border rounded-md p-4 bg-white shadow-sm overflow-auto">
          <Slate
            editor={editor}
            value={content}
            onChange={handleChange}
            onSelectionChange={handleSelectionChange}
          >
            <Editable
              className="min-h-[300px] focus:outline-none prose prose-sm max-w-none"
              renderLeaf={renderLeaf}
              placeholder="Start typing or load a file..."
            />
          </Slate>
        </div>
        <div className="text-xs text-gray-500 mt-2 flex justify-between">
          <span>
            {lastSaved ? `Last saved: ${new Date(lastSaved).toLocaleTimeString()}` : 'Not saved yet'}
          </span>
          <span>
            {isModified ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
      </div>
      <div className="w-full lg:w-80 border rounded-md bg-white shadow-sm">
        <TagList />
      </div>
    </div>
  );
};

export default TextEditor;
