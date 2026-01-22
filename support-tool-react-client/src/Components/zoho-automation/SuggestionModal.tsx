import React, { useState, useEffect } from 'react';
import './styles.css';

interface SuggestionModalProps {
    isOpen: boolean;
    initialData?: { id?: string; title: string; summary: string };
    onSave: (data: { title: string; summary: string }) => void;
    onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, initialData, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialData?.title || '');
            setSummary(initialData?.summary || '');
            setError(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim() || !summary.trim()) {
            setError('Title and Summary are required');
            return;
        }
        onSave({ title, summary });
        onClose();
    };

    return (
        <div className="suggestion-modal-overlay">
            <div className="suggestion-modal">
                <div className="suggestion-modal-header">
                    <h3>{initialData ? 'Edit Suggestion' : 'Add New Suggestion'}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="suggestion-modal-body">
                    <div className="field-group">
                        <label>Title</label>
                        <input
                            type="text"
                            className="suggestion-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Suggestion Title"
                        />
                    </div>
                    <div className="field-group">
                        <label>Summary</label>
                        <textarea
                            className="suggestion-textarea"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Suggestion Summary"
                            rows={5}
                        />
                    </div>
                    {error && <div className="suggestion-error">{error}</div>}
                </div>
                <div className="suggestion-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default SuggestionModal;
