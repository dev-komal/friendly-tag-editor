
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
import { toast } from "sonner";

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
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        // Parse content based on file type
        let paragraphs;
        
        if (fileExtension === 'json') {
          // Try to parse JSON and extract text content with formatting
          try {
            const jsonContent = JSON.parse(content);
            // Check if it's already in our format
            if (Array.isArray(jsonContent) && jsonContent.length > 0 && jsonContent[0].type) {
              paragraphs = jsonContent;
            } else {
              // Convert generic JSON to paragraphs
              paragraphs = [{
                type: 'paragraph' as const,
                children: [{ text: JSON.stringify(jsonContent, null, 2) }]
              }];
            }
          } catch {
            // If JSON parsing fails, treat as plain text
            paragraphs = content.split('\n').map(paragraph => ({
              type: 'paragraph' as const,
              children: [{ text: paragraph || ' ' }]
            }));
          }
        } else if (fileExtension === 'html') {
          // Basic HTML parsing - this can be enhanced for better HTML support
          // Remove common HTML tags while preserving line breaks
          const plainText = content
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n')
            .replace(/<[^>]*>/g, '');
          
          // Convert to paragraphs while preserving formatting hints
          paragraphs = plainText.split('\n').map(paragraph => {
            // Check for basic formatting patterns
            const formattedChildren = [];
            let currentText = '';
            let isBold = false;
            let isItalic = false;
            
            // This is a simplified approach - a full implementation would parse HTML properly
            for (let i = 0; i < paragraph.length; i++) {
              if (paragraph.substr(i, 2) === '**' && !isItalic) {
                formattedChildren.push({ text: currentText, bold: isBold });
                currentText = '';
                isBold = !isBold;
                i++;
              } else if (paragraph.substr(i, 1) === '_' && !isBold) {
                formattedChildren.push({ text: currentText, italic: isItalic });
                currentText = '';
                isItalic = !isItalic;
              } else {
                currentText += paragraph[i];
              }
            }
            
            // Add the remaining text
            if (currentText) {
              formattedChildren.push({ 
                text: currentText, 
                ...(isBold ? { bold: true } : {}),
                ...(isItalic ? { italic: true } : {})
              });
            }
            
            return {
              type: 'paragraph' as const,
              children: formattedChildren.length > 0 ? formattedChildren : [{ text: paragraph || ' ' }]
            };
          });
        } else {
          // Plain text - split by newlines but preserve formatting markers
          paragraphs = content.split('\n').map(paragraph => {
            // Basic formatting detection for plain text
            if (paragraph.startsWith('# ')) {
              // Heading
              return {
                type: 'heading' as const,
                level: 1,
                children: [{ text: paragraph.substring(2) || ' ' }]
              };
            } else if (paragraph.startsWith('## ')) {
              return {
                type: 'heading' as const,
                level: 2,
                children: [{ text: paragraph.substring(3) || ' ' }]
              };
            } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
              // List item
              return {
                type: 'list-item' as const,
                children: [{ text: paragraph.substring(2) || ' ' }]
              };
            } else {
              // Regular paragraph with potential inline formatting
              let formattedParagraph = {
                type: 'paragraph' as const,
                children: [{ text: paragraph || ' ' }]
              };
              
              // If there are markdown-style formatting indicators, we could parse them here
              // This is a simplified approach - a full implementation would use a proper markdown parser
              
              return formattedParagraph;
            }
          });
        }
        
        // Dispatch the content to Redux store
        dispatch(setContent(paragraphs));
        dispatch(setFileName(file.name));
        
        // Notify the user
        toast.success(`File "${file.name}" loaded successfully`);
      } catch (error) {
        console.error('Error loading file:', error);
        toast.error('Error loading file. Please try again.');
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
