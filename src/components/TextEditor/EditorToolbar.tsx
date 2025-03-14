
import React, { useState } from 'react';
import { Range } from 'slate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { resetEditor, setContent, setFileName } from '@/store/editorSlice';
import { 
  File, 
  Tag, 
  Save, 
  Clock
} from 'lucide-react';

interface EditorToolbarProps {
  addTag: (content: string, color: string) => void;
  selection: Range | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ addTag, selection }) => {
  const dispatch = useAppDispatch();
  const [tagContent, setTagContent] = useState('');
  const [tagColor, setTagColor] = useState('#FFE58F');
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const handleAddTag = () => {
    if (tagContent.trim()) {
      addTag(tagContent, tagColor);
      setTagContent('');
      setIsTagDialogOpen(false);
    }
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        // For simplicity, we'll create a basic paragraph structure
        // In a real app, you might need more sophisticated parsing
        const paragraphs = content.split('\n').map(paragraph => ({
          type: 'paragraph',
          children: [{ text: paragraph }]
        }));
        
        dispatch(setContent(paragraphs));
        dispatch(setFileName(file.name));
      } catch (error) {
        console.error('Error loading file:', error);
      }
    };
    
    reader.readAsText(file);
    // Reset the input value to allow loading the same file again
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md mb-2">
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <File className="h-4 w-4" />
        <span>Open</span>
      </Button>
      <input
        id="file-input"
        type="file"
        accept=".txt,.json,.html"
        className="hidden"
        onChange={handleFileLoad}
      />
      
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            disabled={!selection || Range.isCollapsed(selection)}
          >
            <Tag className="h-4 w-4" />
            <span>Add Tag</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Tag or Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Input
                value={tagContent}
                onChange={(e) => setTagContent(e.target.value)}
                placeholder="Enter your comment here..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Highlight Color</label>
              <div className="flex gap-2">
                {['#FFE58F', '#BAE7FF', '#D9F7BE', '#FFD6E7'].map((color) => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                      tagColor === color ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTagColor(color)}
                  />
                ))}
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 ml-auto"
        onClick={() => dispatch(resetEditor())}
      >
        <Clock className="h-4 w-4" />
        <span>New</span>
      </Button>
    </div>
  );
};

export default EditorToolbar;
