import React, { useState, useEffect } from 'react';
import TicketProperties from './TicketProperties';
import ConversationView from './ConversationView';
import zohoService, { TicketDetails, ThreadMessage, HistoryEvent } from '../../services/zoho.service';
import './styles.css';

export const ZohoAutomation: React.FC = () => {
    const [ticketId, setTicketId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
    const [threads, setThreads] = useState<ThreadMessage[]>([]);
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [formFields, setFormFields] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reply state lifted up
    const [replyContent, setReplyContent] = useState('');
    const [openReplyEditor, setOpenReplyEditor] = useState(false);

    const handleSuggestionSelected = (content: string) => {
        setReplyContent(content);
        setOpenReplyEditor(true);
    };

    // Fetch form fields on component mount
    useEffect(() => {
        const fetchFormFields = async () => {
            try {
                const fields = await zohoService.getFormFields();
                setFormFields(fields);
            } catch (err: any) {
                console.error('Failed to load form fields:', err);
            }
        };

        fetchFormFields();
    }, []);

    const handleLoadTicket = async () => {
        if (!inputValue.trim()) {
            setError('Please enter a ticket ID');
            return;
        }

        setLoading(true);
        setError(null);
        setTicketDetails(null);
        setThreads([]);
        setHistory([]);

        try {
            // Fetch ticket details, all threads with content, and history in parallel
            const [details, threadsData, hist] = await Promise.all([
                zohoService.getTicketDetails(inputValue),
                zohoService.getAllThreadsWithContent(inputValue),
                zohoService.getTicketHistory(inputValue),
            ]);

            console.log('📊 Ticket Details:', details);
            console.log('💬 Threads Data:', threadsData);
            console.log('📜 History Data:', hist);

            setTicketDetails(details);
            setThreads(threadsData);
            setHistory(hist || []);
            setTicketId(inputValue);
        } catch (err: any) {
            console.error('Error loading ticket:', err);

            // Fallback for API Limit Exceeded (429) to allow UI testing
            if (err.response?.status === 429 || err.message?.includes('429')) {
                console.warn('⚠️ API Limit Exceeded. Using mock data for testing.');
                setTicketDetails({
                    id: inputValue,
                    ticketNumber: inputValue,
                    subject: 'Mock Ticket (API Limit Exceeded)',
                    status: 'Open',
                    contact: { firstName: 'Mock', lastName: 'User' },
                    createdTime: new Date().toISOString(),
                    description: 'This is a mock ticket loaded because the Zoho API limit was exceeded.',
                    summary: 'Mock ticket summary.'
                });
                setThreads([]);
                setHistory([]);
                setTicketId(inputValue);
                setError(null); // Clear error to allow rendering
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to load ticket. Please check the ticket ID and try again.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTicket = async (modifiedFields: any) => {
        if (!ticketId) {
            throw new Error('No ticket loaded');
        }

        console.log('💾 Saving ticket changes:', modifiedFields);

        try {
            const result = await zohoService.updateTicket(ticketId, modifiedFields);
            console.log('✅ Save result:', result);

            // Optionally reload ticket details to get fresh data
            const updatedDetails = await zohoService.getTicketDetails(ticketId);
            setTicketDetails(updatedDetails);

            alert('Ticket updated successfully!');
        } catch (err: any) {
            console.error('Failed to save ticket:', err);
            alert(`Failed to save changes: ${err.message}`);
            throw err;
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLoadTicket();
        }
    };

    return (
        <div className="zoho-automation-container">
            <div className="zoho-header-compact">
                <h2>Zoho Ticket Viewer</h2>
                <div className="ticket-input-group">
                    <input
                        type="text"
                        className="ticket-input"
                        placeholder="Enter Ticket ID"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                    <button
                        className="load-ticket-btn"
                        onClick={handleLoadTicket}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Load'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading ticket data...</p>
                </div>
            )}

            {!loading && ticketDetails && (
                <div className="zoho-content">
                    <div className="ticket-properties-panel">
                        <TicketProperties
                            ticketDetails={ticketDetails}
                            formFields={formFields}
                            onSave={handleSaveTicket}
                            onSuggestionSelected={handleSuggestionSelected}
                        />
                    </div>
                    <div className="conversation-panel">
                        <ConversationView
                            ticketDetails={ticketDetails}
                            threads={threads}
                            history={history}
                            initialReplyContent={replyContent}
                            forceOpenReplyEditor={openReplyEditor}
                            onReplyEditorClosed={() => setOpenReplyEditor(false)}
                        />
                    </div>
                </div>
            )}

            {!loading && !ticketDetails && !error && (
                <div className="empty-state">
                    <div className="empty-state-icon">🎫</div>
                    <h3>No Ticket Loaded</h3>
                    <p>Enter a ticket ID above to view ticket details and conversation</p>
                </div>
            )}
        </div>
    );
};

export default ZohoAutomation;

