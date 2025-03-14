
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createEditor, Descendant, Editor, Range, Transforms, Path, Point, Element } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { v4 as uuidv4 } from 'uuid';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { setContent, addTag, saveChanges, Tag, CustomDescendant } from '@/store/editorSlice';
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
  }, [editor, content]);

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
    
    // Update selection when content changes
    const editorSelection = editor.selection;
    if (editorSelection) {
      setSelection(editorSelection);
    }
  }, [dispatch, editor]);

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

  // Custom function to check if a point is within a range
  const isPointInRange = (range: Range, point: Point): boolean => {
    const [startPoint, endPoint] = Range.edges(range);
    return (
      (Path.compare(point.path, startPoint.path) >= 0 &&
        Path.compare(point.path, endPoint.path) <= 0) &&
      (Path.compare(point.path, startPoint.path) > 0 ||
        point.offset >= startPoint.offset) &&
      (Path.compare(point.path, endPoint.path) < 0 ||
        point.offset <= endPoint.offset)
    );
  };

  // Render element function to handle different block types
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    
    switch (element.type) {
      case 'heading':
        const level = element.level || 1;
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        return <HeadingTag {...attributes} className={`text-${level === 1 ? '2xl' : 'xl'} font-bold mb-2`}>{children}</HeadingTag>;
      
      case 'list-item':
        return <li {...attributes} className="ml-5">{children}</li>;
      
      default:
        return <p {...attributes} className="mb-2">{children}</p>;
    }
  }, []);

  // Render leaf function to highlight tagged text and handle text formatting
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    
    let className = '';
    let style: React.CSSProperties = {};
    
    // Find all tags that apply to this text node
    const matchingTags = tags.filter(tag => {
      // Check if this text node is within a tagged range
      try {
        const tagRange = {
          anchor: { path: tag.selection.anchor.path, offset: tag.selection.anchor.offset },
          focus: { path: tag.selection.focus.path, offset: tag.selection.focus.offset }
        };
        
        const leafPoint = { path: props.path, offset: props.leaf.offset || 0 };
        return isPointInRange(tagRange, leafPoint);
      } catch (error) {
        return false;
      }
    });
    
    if (matchingTags.length > 0) {
      // Use the first matching tag's color
      style.backgroundColor = matchingTags[0].color;
      className += ' bg-opacity-30 relative group';
      if (matchingTags.length > 0) className += ' cursor-pointer';
    }
    
    // Apply text formatting
    let formattedText = <span data-tag-id={matchingTags.map(t => t.id).join(',')}>{children}</span>;
    
    if (leaf.bold) {
      formattedText = <strong>{formattedText}</strong>;
    }
    
    if (leaf.italic) {
      formattedText = <em>{formattedText}</em>;
    }
    
    if (leaf.underline) {
      formattedText = <u>{formattedText}</u>;
    }
    
    if (leaf.code) {
      formattedText = <code className="bg-gray-100 px-1 rounded">{formattedText}</code>;
    }
    
    return (
      <span {...attributes} className={className} style={style}>
        {formattedText}
        {matchingTags.length > 0 && (
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg hidden group-hover:block z-10 min-w-[200px] text-sm">
            {matchingTags.map(tag => (
              <div key={tag.id} className="mb-1">
                {tag.content}
              </div>
            ))}
          </span>
        )}
      </span>
    );
  }, [tags]);

  // Update selection when Slate selection changes
  const onSelectionChangeHandler = useCallback(() => {
    setSelection(editor.selection);
  }, [editor]);

  // Add effect to monitor editor selection changes
  useEffect(() => {
    // This is a hack to track selection changes due to slate-react API limitations
    const originalOnChange = editor.onChange;
    editor.onChange = () => {
      originalOnChange();
      onSelectionChangeHandler();
    };

    return () => {
      editor.onChange = originalOnChange;
    };
  }, [editor, onSelectionChangeHandler]);

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
            initialValue={content}
            onChange={handleChange}
          >
            <Editable
              className="min-h-[300px] focus:outline-none prose prose-sm max-w-none"
              renderElement={renderElement}
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
