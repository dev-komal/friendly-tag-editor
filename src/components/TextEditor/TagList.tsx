
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { removeTag, updateTag } from '@/store/editorSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const TagList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tags } = useAppSelector((state) => state.editor);

  const handleTagUpdate = (id: string, content: string) => {
    dispatch(updateTag({ id, content }));
  };

  const handleTagDelete = (id: string) => {
    dispatch(removeTag(id));
  };

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg mb-4">Tags & Comments</h3>
      {tags.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Select text and add tags or comments to see them here.
        </p>
      ) : (
        <ul className="space-y-3">
          {tags.map((tag) => (
            <li key={tag.id} className="border rounded-md p-3">
              <div className="flex items-start gap-2">
                <div 
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0" 
                  style={{ backgroundColor: tag.color }}
                />
                <div className="flex-1">
                  <Input
                    value={tag.content}
                    onChange={(e) => handleTagUpdate(tag.id, e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>ID: {tag.id.substring(0, 8)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => handleTagDelete(tag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagList;
