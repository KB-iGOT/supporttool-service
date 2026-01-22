import React, { useState } from 'react';
import { TicketDetails, ThreadMessage, HistoryEvent } from '../../services/zoho.service';
import ReplyEditor from './ReplyEditor';
import HistoryView from './HistoryView';
import UserDetailsView from './UserDetailsView';
import CertificatesView from './CertificatesView';
import { ContentsView } from './ContentsView';
import { DesignationsView } from './DesignationsView';

interface ConversationViewProps {
    ticketDetails: TicketDetails;
    threads: ThreadMessage[];
    history?: HistoryEvent[];
    initialReplyContent?: string;
    forceOpenReplyEditor?: boolean;
    onReplyEditorClosed?: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({
    ticketDetails,
    threads,
    history,
    initialReplyContent,
    forceOpenReplyEditor,
    onReplyEditorClosed
}) => {
    const [activeTab, setActiveTab] = useState('conversation');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserInfo, setSelectedUserInfo] = useState<{ name: string; email: string } | null>(null);

    const [showReplyEditor, setShowReplyEditor] = useState(false);

    // React to parent forcing editor open
    React.useEffect(() => {
        if (forceOpenReplyEditor) {
            setShowReplyEditor(true);
        }
    }, [forceOpenReplyEditor]);

    const handleReplyEditorClose = () => {
        setShowReplyEditor(false);
        if (onReplyEditorClosed) onReplyEditorClosed();
    };

    const handleReplySent = () => {
        setShowReplyEditor(false);
        if (onReplyEditorClosed) onReplyEditorClosed();
        // Ideally enforce refresh here, but for now user can navigate away or rely on auto-refresh if any
        // In a real app we'd trigger a reload of threads via prop or context
        // Check if there is a refresh mechanism available?
        // The parent index.tsx fetches data. We might need a callback to refresh.
        // For now, simple close is fine, user will see it eventually or we can notify.
        alert('Reply sent successfully!');
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            }).replace(',', '');
        } catch {
            return dateString;
        }
    };

    const formatDateRelative = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

            if (diffInMinutes < 60) {
                return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
            } else if (diffInMinutes < 1440) {
                const hours = Math.floor(diffInMinutes / 60);
                return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'open') return 'status-open';
        if (statusLower === 'closed') return 'status-closed';
        if (statusLower === 'on hold' || statusLower === 'pending') return 'status-pending';
        if (statusLower === 'escalated') return 'status-escalated';
        return 'status-default';
    };

    const getOwnerInitials = () => {
        const contact = ticketDetails.contact;
        if (contact?.firstName && contact?.lastName) {
            return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
        }
        if (contact?.lastName) {
            return contact.lastName.substring(0, 2).toUpperCase();
        }
        return 'BO';
    };

    const getContactName = () => {
        const contact = ticketDetails.contact;
        if (contact?.firstName && contact?.lastName) {
            return `${contact.firstName} ${contact.lastName}`;
        }
        return contact?.lastName || ticketDetails.email || 'Unknown';
    };

    const tabs = [
        { id: 'conversation', label: 'CONVERSATION', count: threads.length || 0 },
        { id: 'user-details', label: 'USER DETAILS' },
        { id: 'certificates', label: 'CERTIFICATES' },
        { id: 'contents', label: 'CONTENTS' },
        { id: 'designations', label: 'DESIGNATIONS' },
        { id: 'approval', label: 'APPROVAL' },
        { id: 'history', label: 'HISTORY' },
    ];

    const renderThread = (thread: ThreadMessage) => (
        <div key={thread.id} className="thread-item">
            <div className="thread-header">
                <div className="thread-author">
                    <div className="author-avatar">
                        <span>
                            {thread.author?.firstName?.[0] ||
                                thread.author?.lastName?.[0] ||
                                thread.author?.name?.[0] ||
                                ticketDetails.contact?.lastName?.[0] ||
                                'U'}
                        </span>
                    </div>
                    <div className="author-info">
                        <div className="author-name">
                            {thread.author?.firstName && thread.author?.lastName
                                ? `${thread.author.firstName} ${thread.author.lastName}`
                                : thread.author?.name ||
                                ticketDetails.contact?.lastName ||
                                ticketDetails.email ||
                                'User'}
                        </div>
                        <div className="thread-meta">
                            <span className="thread-time">{formatDateRelative(thread.createdTime || ticketDetails.createdTime || '')}</span>
                            {thread.channel && (
                                <>
                                    <span className="meta-separator">•</span>
                                    <span className="thread-channel">{thread.channel}</span>
                                </>
                            )}
                            {thread.direction && (
                                <>
                                    <span className="meta-separator">•</span>
                                    <span className={`thread-direction ${thread.direction.toLowerCase()}`}>
                                        {thread.direction === 'in' ? '📥 Incoming' : '📤 Outgoing'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="thread-body">
                {thread.contentType === 'text/html' || thread.contentType === 'html' ? (
                    <div
                        className="thread-text-content"
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: thread.content || ticketDetails.summary || ticketDetails.description || 'No content available' }}
                    />
                ) : (
                    <div className="thread-text-content" style={{ whiteSpace: 'pre-wrap' }}>
                        {thread.content || ticketDetails.summary || ticketDetails.description || 'No content available'}
                    </div>
                )}
                {thread.hasAttach && thread.attachments && thread.attachments.length > 0 && (
                    <div className="thread-attachments">
                        <strong>Attachments:</strong>
                        <ul>
                            {thread.attachments.map((attachment: any, idx: number) => (
                                <li key={idx}>{attachment.name || attachment.fileName || `Attachment ${idx + 1}`}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="conversation-view">
            {/* Enhanced Ticket Header */}
            <div className="ticket-header-enhanced">
                {/* Title Row */}
                <div className="header-title-row">
                    <div className="header-left">
                        <div className="owner-initials-badge">{getOwnerInitials()}</div>
                        <h2 className="ticket-subject-enhanced">
                            {ticketDetails.subject || 'No Subject'}
                        </h2>
                    </div>
                    <div className="header-actions">
                        <div className="ticket-actions">
                            <button className="action-btn primary" onClick={() => setShowReplyEditor(!showReplyEditor)}>
                                <span className="btn-icon">↩</span> Reply
                            </button>
                            {/* Forward button placeholder - functionality not requested yet */}
                            <button className="action-btn">
                                <span className="btn-icon">⏩</span> Forward
                            </button>
                        </div>
                        {/* Status Badge */}
                        <span className={`status-badge-enhanced ${getStatusColor(ticketDetails.status)}`}>
                            {ticketDetails.status || 'Open'}
                        </span>
                    </div>
                </div>

                {/* Meta Row */}
                <div className="header-meta-row">
                    <span className="ticket-number-enhanced">#{ticketDetails.ticketNumber || ticketDetails.id}</span>
                    <span className="meta-dot">•</span>
                    <span className="ticket-contact">{getContactName()}</span>
                    <span className="meta-dot">•</span>
                    <span className="ticket-created">
                        <span className="calendar-icon">📅</span>
                        {formatDate(ticketDetails.createdTime || '')}
                    </span>
                </div>
            </div>

            {/* Reply Editor */}
            {showReplyEditor && (
                <ReplyEditor
                    ticketId={ticketDetails.id}
                    contactEmail={ticketDetails.email}
                    fromEmail={ticketDetails.assignee?.email}
                    initialContent={initialReplyContent}
                    inReplyToThreadId={threads.length > 0 ? threads[0].id : undefined}
                    onReplySent={handleReplySent}
                    onCancel={handleReplyEditorClose}
                />
            )}

            {/* Tabs */}
            <div className="conversation-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="tab-badge">{tab.count}</span>
                        )}
                        {tab.id === 'conversation' && <span className="tab-dropdown">▾</span>}
                    </button>
                ))}
            </div>

            {/* Conversation Content */}
            <div className="conversation-content">
                {activeTab === 'conversation' && (
                    <div className="thread-list">
                        {threads.length > 0 ? (
                            threads.map(thread => renderThread(thread))
                        ) : (
                            <div className="thread-item">
                                <div className="thread-header">
                                    <div className="thread-author">
                                        <div className="author-avatar">
                                            <span>
                                                {ticketDetails.contact?.lastName?.[0] || 'U'}
                                            </span>
                                        </div>
                                        <div className="author-info">
                                            <div className="author-name">
                                                {ticketDetails.contact?.lastName || ticketDetails.email || 'User'}
                                            </div>
                                            <div className="thread-meta">
                                                <span className="thread-time">{formatDateRelative(ticketDetails.createdTime || '')}</span>
                                                <span className="meta-separator">•</span>
                                                <span className="thread-channel">EMAIL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="thread-body">
                                    <div className="thread-text-content">
                                        {ticketDetails.summary || ticketDetails.description || ticketDetails.subject || 'No conversation content available'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <HistoryView history={history || []} />
                )}

                {activeTab === 'user-details' && (
                    <UserDetailsView ticketDetails={ticketDetails} onUserSelect={(userId, userInfo) => {
                        setSelectedUserId(userId);
                        setSelectedUserInfo(userInfo);
                    }} />
                )}

                {activeTab === 'certificates' && (
                    <CertificatesView ticketDetails={ticketDetails} userId={selectedUserId || undefined} userInfo={selectedUserInfo || undefined} />
                )}

                {activeTab === 'contents' && (
                    <ContentsView ticketDetails={ticketDetails} />
                )}

                {activeTab === 'designations' && (
                    <DesignationsView ticketDetails={ticketDetails} />
                )}

                {activeTab !== 'conversation' && activeTab !== 'history' && activeTab !== 'user-details' && activeTab !== 'certificates' && activeTab !== 'contents' && activeTab !== 'designations' && (
                    <div className="tab-placeholder">
                        <p>Content for {tabs.find(t => t.id === activeTab)?.label} is not available yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationView;
