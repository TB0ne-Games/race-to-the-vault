import React, { useEffect } from 'react';

const Notification = ({ notifications, onRemove }) => {
    return (
        <div className="notification-container">
            {notifications.map((note) => (
                <Toast
                    key={note.id}
                    note={note}
                    onRemove={() => onRemove(note.id)}
                />
            ))}
        </div>
    );
};

const Toast = ({ note, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(onRemove, 5000);
        return () => clearTimeout(timer);
    }, [onRemove]);

    const getIcon = (type) => {
        switch (type) {
            case 'intel': return '🔍';
            case 'sabotage': return '🔧';
            case 'info': return '📡';
            default: return '🔔';
        }
    };

    return (
        <div className={`notification-toast ${note.type}`}>
            <div className="toast-icon">{getIcon(note.type)}</div>
            <div className="toast-body">{note.message}</div>
        </div>
    );
};

export default Notification;
