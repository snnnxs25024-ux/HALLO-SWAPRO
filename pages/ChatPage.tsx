import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee, User, Chat, Message } from '../types';
import { Search, Send, Paperclip, MessagesSquare as MessagesSquareIcon, ChevronLeft } from 'lucide-react';

interface ChatPageProps {
    employees: Employee[];
    currentUser: User;
    chats: Record<string, Chat>;
    onUpdate: (chats: Record<string, Chat>) => void;
    onGenerateReply: (employeeId: string, currentChat: Chat) => Promise<void>;
}

const TypingIndicator: React.FC<{employee?: Employee}> = ({ employee }) => (
    <div className="flex items-end gap-3">
        {employee && <img src={employee.profilePhotoUrl} alt={employee.fullName} className="w-8 h-8 rounded-full shadow-sm" />}
        <div className="max-w-md p-3 rounded-2xl bg-white text-slate-800 rounded-bl-lg shadow-sm border border-slate-200">
            <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);


const ChatPage: React.FC<ChatPageProps> = ({ employees, currentUser, chats, onUpdate, onGenerateReply }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const filteredEmployees = useMemo(() => {
        return employees.filter(e => e.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [employees, searchTerm]);

    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id === selectedEmployeeId);
    }, [employees, selectedEmployeeId]);
    
    const selectedChat = selectedEmployeeId ? chats[selectedEmployeeId] : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChat]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedEmployeeId || selectedChat?.isTyping) return;

        const message: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        const currentChatMessages = chats[selectedEmployeeId]?.messages || [];
        const updatedChat: Chat = {
            messages: [...currentChatMessages, message]
        };

        const updatedChats = {
            ...chats,
            [selectedEmployeeId]: updatedChat
        };
        
        onUpdate(updatedChats);
        setNewMessage('');

        await onGenerateReply(selectedEmployeeId, updatedChat);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white shadow-inner overflow-hidden">
            {/* Employee List */}
            <aside className={`
                w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-slate-50
                ${selectedEmployeeId ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">Pesan Karyawan</h2>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-slate-200 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredEmployees.map(employee => (
                        <div
                            key={employee.id}
                            onClick={() => setSelectedEmployeeId(employee.id)}
                            className={`flex items-center p-3 space-x-3 cursor-pointer border-b border-gray-200/50 border-l-4 transition-colors duration-200 ${selectedEmployeeId === employee.id ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-slate-100'}`}
                        >
                            <img src={employee.profilePhotoUrl} alt={employee.fullName} className="w-12 h-12 rounded-full border border-white shadow-sm" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate text-base">{employee.fullName}</p>
                                <p className="text-sm text-slate-500 truncate">{employee.position}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Conversation Area */}
            <main className={`
                flex-1 flex flex-col bg-white
                ${selectedEmployeeId ? 'flex' : 'hidden md:flex'}
            `}>
                {selectedEmployee ? (
                    <>
                        <header className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm">
                            <button onClick={() => setSelectedEmployeeId(null)} className="md:hidden mr-3 p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <img src={selectedEmployee.profilePhotoUrl} alt={selectedEmployee.fullName} className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white shadow-sm" />
                            <div className="ml-3 min-w-0">
                                <h2 className="font-bold text-xl text-slate-800 truncate">{selectedEmployee.fullName}</h2>
                                <p className="text-sm text-slate-500 truncate">{selectedEmployee.position}</p>
                            </div>
                        </header>
                        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50 space-y-4 md:space-y-6">
                            {selectedChat?.messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 md:gap-3 ${msg.senderId === currentUser.id ? 'justify-end' : ''}`}>
                                    {msg.senderId !== currentUser.id && <img src={selectedEmployee.profilePhotoUrl} alt={selectedEmployee.fullName} className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" />}
                                    <div className={`max-w-[85%] md:max-w-md p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-lg' : 'bg-white text-slate-800 rounded-bl-lg border border-slate-200'}`}>
                                        <p className="text-base leading-relaxed">{msg.text}</p>
                                        <p className={`text-xs mt-1.5 opacity-70 ${msg.senderId === currentUser.id ? 'text-blue-100 text-right' : 'text-slate-400 text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    {msg.senderId === currentUser.id && <img src={currentUser.avatar} alt={currentUser.nama} className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" />}
                                </div>
                            ))}
                            {selectedChat?.isTyping && <TypingIndicator employee={selectedEmployee} />}
                            <div ref={messagesEndRef} />
                        </div>
                        <footer className="p-3 md:p-4 border-t border-gray-200 bg-white sticky bottom-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ketik pesan..."
                                    className="w-full pl-4 pr-16 md:pr-24 py-3 bg-slate-100 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base disabled:bg-slate-200"
                                    disabled={selectedChat?.isTyping}
                                />
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                                    <button className="hidden md:block p-2 text-slate-400 hover:text-slate-600 disabled:text-slate-300" disabled={selectedChat?.isTyping}><Paperclip className="w-5 h-5" /></button>
                                    <button onClick={handleSendMessage} className="p-2 md:p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md disabled:from-blue-300 disabled:to-blue-400" disabled={selectedChat?.isTyping || !newMessage.trim()}><Send className="w-4 h-4 md:w-5 md:h-5" /></button>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
                        <div className="bg-white p-6 rounded-full border border-gray-200 mb-4 shadow-lg shadow-slate-200/60">
                            <MessagesSquareIcon className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Pesan</h2>
                        <p className="text-base mt-2">Pilih karyawan untuk memulai percakapan.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatPage;
