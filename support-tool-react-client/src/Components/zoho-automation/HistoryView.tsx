import React from 'react';
import { HistoryEvent } from '../../services/zoho.service';

interface HistoryViewProps {
    history: HistoryEvent[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
    // Group events by date
    const groupEventsByDate = (events: HistoryEvent[]) => {
        const groups: { [key: string]: HistoryEvent[] } = {};

        events.forEach(event => {
            const date = new Date(event.eventTime);
            const dateKey = date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            });

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(event);
        });

        return groups;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toUpperCase();
    };

    const renderFieldChange = (change: { field: string; oldValue?: string; newValue?: string }) => {
        if (change.oldValue && change.newValue) {
            return (
                <div className="history-field-change" key={change.field}>
                    <span className="field-name">{change.field}</span>
                    <span className="field-changed"> changed from </span>
                    <span className="field-old-value">{change.oldValue}</span>
                    <span className="field-changed"> to </span>
                    <span className="field-new-value">{change.newValue}</span>
                </div>
            );
        } else if (change.newValue) {
            return (
                <div className="history-field-value" key={change.field}>
                    <span className="field-name">{change.field}</span>
                    <span className="field-value-text">  {change.newValue}</span>
                </div>
            );
        }
        return null;
    };

    const renderEventDetails = (event: HistoryEvent) => {
        switch (event.name) {
            case 'Sla_Updated_Ticket':
                return (
                    <>
                        <div className="event-detail">
                            <span className="detail-label">SLA Name</span>
                            <span className="detail-value">{event.slaName}</span>
                        </div>
                        {event.changes?.map(change => renderFieldChange(change))}
                    </>
                );

            case 'CustomFunction_Triggered':
                return (
                    <>
                        <div className="event-detail">
                            <span className="detail-label">Rule Name</span>
                            <span className="detail-value">{event.ruleName}</span>
                        </div>
                        <div className="event-detail">
                            <span className="detail-label">Custom Function Name</span>
                            <span className="detail-value highlight">{event.customFunctionName}</span>
                        </div>
                    </>
                );

            case 'NotificationRule_Applied':
                return (
                    <>
                        <div className="event-detail">
                            <span className="detail-label">Rule Name</span>
                            <span className="detail-value">{event.ruleName}</span>
                        </div>
                        <div className="event-detail">
                            <span className="detail-label">Recipients</span>
                            <span className="detail-value">{event.recipients}</span>
                        </div>
                        <div className="event-detail">
                            <span className="detail-label">Notification Type</span>
                            <span className="detail-value">{event.notificationType}</span>
                        </div>
                    </>
                );

            case 'RoundRobin_Updated_Ticket':
                return (
                    <>
                        <div className="event-detail">
                            <span className="detail-label">Rule Name</span>
                            <span className="detail-value">{event.ruleName}</span>
                        </div>
                        <div className="event-detail">
                            <span className="detail-label">Assignment Type</span>
                            <span className="detail-value">{event.assignmentType}</span>
                        </div>
                        <div className="event-detail">
                            <span className="detail-label">Execution Type</span>
                            <span className="detail-value">{event.executionType}</span>
                        </div>
                        {event.changes?.map(change => renderFieldChange(change))}
                    </>
                );

            case 'Ticket_Updated':
                return (
                    <>
                        {event.customFunctionName && (
                            <div className="event-detail">
                                <span className="detail-label">Custom Function Name</span>
                                <span className="detail-value highlight">{event.customFunctionName}</span>
                            </div>
                        )}
                        {event.changes?.map(change => renderFieldChange(change))}
                    </>
                );

            case 'Ticket_Created':
                return (
                    <div className="history-ticket-created">
                        {event.changes?.map(change => renderFieldChange(change))}
                    </div>
                );

            default:
                return (
                    <>
                        {event.changes?.map(change => renderFieldChange(change))}
                    </>
                );
        }
    };

    const groupedEvents = groupEventsByDate(history);

    if (!history || history.length === 0) {
        return (
            <div className="history-empty">
                <p>No history available for this ticket.</p>
            </div>
        );
    }

    return (
        <div className="history-view">
            <div className="history-header">
                <span className="history-title">Ticket History</span>
                <span className="history-filter">All ▾</span>
                <span className="history-filter-by">Filter by: <span className="filter-value">None ▾</span></span>
            </div>

            <div className="history-timeline">
                {Object.entries(groupedEvents).map(([dateKey, events]) => (
                    <div className="history-date-group" key={dateKey}>
                        <div className="history-date-header">
                            <span className="date-icon">📅</span>
                            <span className="date-text">{dateKey}</span>
                        </div>

                        <div className="history-events">
                            {events.map((event, idx) => (
                                <div className="history-event" key={`${event.eventTime}-${idx}`}>
                                    <div className="event-timeline">
                                        <div className="timeline-dot"></div>
                                        {idx < events.length - 1 && <div className="timeline-line"></div>}
                                    </div>
                                    <div className="event-content">
                                        <div className="event-time">{formatTime(event.eventTime)}</div>
                                        <div className="event-title">{event.webLabel}</div>
                                        <div className="event-details">
                                            {renderEventDetails(event)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryView;
