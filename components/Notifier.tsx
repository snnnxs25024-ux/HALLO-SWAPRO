import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string, type: NotificationType) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed top-5 right-5 z-[200] space-y-3 w-full max-w-xs">
                {notifications.map(notification => (
                    <NotificationToast key={notification.id} notification={notification} onClose={() => removeNotification(notification.id)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const NotificationToast: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);
    
    const icons = {
        success: <CheckCircle className="w-6 h-6 text-emerald-500" />,
        error: <XCircle className="w-6 h-6 text-red-500" />,
        info: <Info className="w-6 h-6 text-blue-500" />,
    };

    const styles = {
        success: 'bg-emerald-50 border-emerald-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
    };

    return (
        <div className={`flex items-start p-4 rounded-xl shadow-lg border animate-[slideIn_0.3s_ease-out] ${styles[notification.type]}`}>
            <div className="flex-shrink-0">{icons[notification.type]}</div>
            <div className="ml-3 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-slate-800">{notification.message}</p>
            </div>
            <button onClick={onClose} className="ml-4 p-1 rounded-full text-slate-400 hover:bg-slate-200/50">
                <X className="w-4 h-4" />
            </button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export const useNotifier = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifier must be used within a NotificationProvider');
    }
    return context;
};
