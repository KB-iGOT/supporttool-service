import React, { useState, useRef, useEffect } from 'react';
import zohoService from '../../services/zoho.service';
import './styles.css';

interface ReplyEditorProps {
    ticketId: string;
    contactEmail: string;
    fromEmail?: string;
    initialContent?: string;
    inReplyToThreadId?: string;
    onReplySent: () => void;
    onCancel: () => void;
}

const ReplyEditor: React.FC<ReplyEditorProps> = ({ ticketId, contactEmail, fromEmail, initialContent, inReplyToThreadId, onReplySent, onCancel }) => {
    const [to, setTo] = useState(contactEmail);
    const [cc, setCc] = useState('');
    const [content, setContent] = useState(initialContent || '');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (initialContent) {
            setContent(initialContent);
        }
    }, [initialContent]);
    const [sendError, setSendError] = useState<string | null>(null);

    // Status update logic
    const [showStatusOptions, setShowStatusOptions] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [statusSearch, setStatusSearch] = useState('');

    const statusOptions = [
        'Open', 'IN PROGRESS', 'On Hold', 'Escalated', 'Closed',
        'Pending @ User', 'Pending for Approval', 'Pending @ Content Team'
    ];

    const filteredStatuses = statusOptions.filter(s =>
        s.toLowerCase().includes(statusSearch.toLowerCase())
    );

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowStatusOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSend = async (updateStatus: boolean = false) => {
        if (!content.trim()) {
            setSendError('Please enter reply content');
            return;
        }

        if (updateStatus && !selectedStatus) {
            setSendError('Please select a status');
            return;
        }

        setIsSending(true);
        setSendError(null);

        try {
            // Construct payload
            const payload: any = {
                channel: 'EMAIL',
                to: to,
                cc: cc,
                // fromEmailAddress is handled by backend or default
                fromEmailAddress: fromEmail || 'mission.karmayogi@gov.in', // Use assignee email if available
                contentType: 'html',
                content: `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px;">${content.replace(/\n/g, '<br>')}</div>`,
                isForward: false,
                inReplyToThreadId: inReplyToThreadId
            };

            if (updateStatus && selectedStatus) {
                payload.ticketStatus = selectedStatus;
            }

            await zohoService.sendReply(ticketId, payload);
            onReplySent();
        } catch (error: any) {
            console.error('Failed to send reply:', error);
            setSendError(error.message || 'Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="reply-editor">
            <div className="reply-header">
                <h3>Reply to Ticket</h3>
                <button className="close-btn" onClick={onCancel}>×</button>
            </div>

            <div className="reply-fields">
                <div className="field-row">
                    <label>To:</label>
                    <input
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="reply-input"
                    />
                </div>
                <div className="field-row">
                    <label>Cc:</label>
                    <input
                        type="text"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        placeholder="Add CC..."
                        className="reply-input"
                    />
                </div>
            </div>

            <div className="reply-body">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your reply here..."
                    className="reply-textarea"
                    rows={10}
                />
            </div>

            {sendError && <div className="reply-error">{sendError}</div>}

            <div className="reply-footer">
                <button className="btn-cancel" onClick={onCancel} disabled={isSending}>
                    Discard
                </button>

                <div className="send-action-group" ref={dropdownRef}>
                    <button
                        className="btn-send-primary"
                        onClick={() => handleSend(false)}
                        disabled={isSending}
                    >
                        {isSending ? 'Sending...' : 'Send'}
                    </button>

                    <button
                        className="btn-send-dropdown-trigger"
                        onClick={() => setShowStatusOptions(!showStatusOptions)}
                        disabled={isSending}
                    >
                        ▼
                    </button>

                    {showStatusOptions && (
                        <div className="send-dropdown-menu">
                            <div className="dropdown-search">
                                <input
                                    type="text"
                                    placeholder="Search Status"
                                    value={statusSearch}
                                    onChange={(e) => setStatusSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="dropdown-label">SEND & UPDATE STATUS</div>
                            <ul className="dropdown-list">
                                {filteredStatuses.map(status => (
                                    <li
                                        key={status}
                                        onClick={() => {
                                            setSelectedStatus(status);
                                            // Ideally we might want to select then click send, or send immediately.
                                            // The UI shows "Send & Update Status", suggesting we pick one.
                                            // Let's set it and trigger send for better UX, or just set it.
                                            // For now, let's select it and trigger send immediately
                                            // Wait, user might want to confirm. But usually dropdown items are actions.
                                            // I'll make it select, and then we call handleSend(true) with that status.
                                            // But state update is async. I'll pass it directly.
                                            setSelectedStatus(status); // for UI feedback if needed
                                            // Trigger send with this status
                                            // We need to bypass the state update lag
                                            // I'll refactor handleSend slightly or just call update logic here.

                                            // Call internal logic
                                            setIsSending(true);
                                            setSendError(null);
                                            const payload: any = {
                                                channel: 'EMAIL',
                                                to: to,
                                                cc: cc,
                                                fromEmailAddress: 'mission.karmayogi@gov.in',
                                                contentType: 'html',
                                                content: `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px;">${content.replace(/\n/g, '<br>')}</div>`,
                                                isForward: false,
                                                inReplyToThreadId: inReplyToThreadId,
                                                ticketStatus: status
                                            };
                                            zohoService.sendReply(ticketId, payload)
                                                .then(() => onReplySent())
                                                .catch((err) => {
                                                    console.error(err);
                                                    setSendError(err.message);
                                                    setIsSending(false);
                                                });
                                            setShowStatusOptions(false);
                                        }}
                                        className="dropdown-item"
                                    >
                                        <span className={`status-dot ${status.toLowerCase().replace(/\s+/g, '-')}`}></span>
                                        {status}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReplyEditor;
