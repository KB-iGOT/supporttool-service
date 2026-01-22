import React, { useState } from 'react';
import { TicketDetails, TicketConversation, HistoryEvent } from '../../services/zoho.service';
import HistoryView from './HistoryView';
import UserDetailsView from './UserDetailsView';
import CertificatesView from './CertificatesView';
import { ContentsView } from './ContentsView';
import { DesignationsView } from './DesignationsView';

interface ConversationViewProps {
    ticketDetails: TicketDetails;
    conversation: TicketConversation;
    history?: HistoryEvent[];
}

const ConversationView: React.FC<ConversationViewProps> = ({ ticketDetails, conversation, history }) => {
    const [activeTab, setActiveTab] = useState('conversation');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserInfo, setSelectedUserInfo] = useState<{ name: string; email: string } | null>(null);

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
        { id: 'conversation', label: 'CONVERSATION', count: 1 },
        { id: 'user-details', label: 'USER DETAILS' },
        { id: 'certificates', label: 'CERTIFICATES' },
        { id: 'contents', label: 'CONTENTS' },
        { id: 'designations', label: 'DESIGNATIONS' },
        { id: 'approval', label: 'APPROVAL' },
        { id: 'history', label: 'HISTORY' },
    ];

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

            {/* Tabs */}
            <div className="conversation-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.count && (
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
                        {conversation && conversation.content ? (
                            <div key={conversation.id} className="thread-item">
                                <div className="thread-header">
                                    <div className="thread-author">
                                        <div className="author-avatar">
                                            <span>
                                                {conversation.author?.firstName?.[0] ||
                                                    conversation.author?.lastName?.[0] ||
                                                    conversation.author?.name?.[0] ||
                                                    ticketDetails.contact?.lastName?.[0] ||
                                                    'U'}
                                            </span>
                                        </div>
                                        <div className="author-info">
                                            <div className="author-name">
                                                {conversation.author?.firstName && conversation.author?.lastName
                                                    ? `${conversation.author.firstName} ${conversation.author.lastName}`
                                                    : conversation.author?.name ||
                                                    ticketDetails.contact?.lastName ||
                                                    ticketDetails.email ||
                                                    'User'}
                                            </div>
                                            <div className="thread-meta">
                                                <span className="thread-time">{formatDateRelative(conversation.createdTime || ticketDetails.createdTime || '')}</span>
                                                {conversation.channel && (
                                                    <>
                                                        <span className="meta-separator">•</span>
                                                        <span className="thread-channel">{conversation.channel}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="thread-body">
                                    {conversation.contentType === 'text/html' || conversation.contentType === 'html' ? (
                                        <div
                                            className="thread-text-content"
                                            style={{ whiteSpace: 'pre-wrap' }}
                                            dangerouslySetInnerHTML={{ __html: conversation.content || ticketDetails.summary || ticketDetails.description || 'No conversation content available' }}
                                        />
                                    ) : (
                                        <div className="thread-text-content" style={{ whiteSpace: 'pre-wrap' }}>
                                            {conversation.content || ticketDetails.summary || ticketDetails.description || 'No conversation content available'}
                                        </div>
                                    )}
                                    {conversation.hasAttach && conversation.attachments && conversation.attachments.length > 0 && (
                                        <div className="thread-attachments">
                                            <strong>Attachments:</strong>
                                            <ul>
                                                {conversation.attachments.map((attachment: any, idx: number) => (
                                                    <li key={idx}>{attachment.name || attachment.fileName || `Attachment ${idx + 1}`}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
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
