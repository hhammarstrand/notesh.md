import { useState, useCallback } from 'react';
import './TagInput.css';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function TagInput({ tags, onAdd, onRemove }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onAdd(inputValue.trim());
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }, [inputValue, tags, onAdd, onRemove]);

  return (
    <div className="tag-input-container">
      <div className="tags-list">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            #{tag}
            <button 
              className="tag-remove" 
              onClick={() => onRemove(tag)}
              title="Remove tag"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="tag-input"
        placeholder={tags.length === 0 ? "Add tags..." : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
