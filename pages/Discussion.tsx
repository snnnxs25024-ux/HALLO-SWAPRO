import React, { useState, useRef, useEffect } from 'react';
import { DataEntry, Chat, User, Message, DataStatus } from '../types';
import { Plus, Send, Paperclip, MessageSquare as MessageSquareIcon, X, ChevronLeft } from 'lucide-react';

interface DiscussionProps {
    dataEntries: DataEntry[];
    chats: Record<string, Chat>;
    currentUser: User;
    adminUser: User;
    onUpdate: (dataEntries: DataEntry[], chats: Record<string, Chat>) => void;
    onAdminReply: (entry: DataEntry, userMessage: Message) => void;
}

const statusConfig = {
    [DataStatus.BARU]: { label: 'Baru', color: 'bg-blue-100 text-blue-700' },
    [DataStatus.PROSES]: { label: 'Proses', color: 'bg-amber-100 text-amber-700' },
    [DataStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    [DataStatus.SELESAI]: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700' },
};

const NewEntryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        onSubmit(title, description);
        setTitle('');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900">Buat Laporan Baru</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 md:p-6 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Judul Laporan</label>
                        <input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Kesalahan Data BPJS Karyawan K001" className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Lengkap</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Jelaskan detail masalah yang perlu ditindak lanjuti..." className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm" required></textarea>
                    </div>
                </div>
                <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 order-2 md:order-1 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-gray-100 transition">Batal</button>
                    <button type="submit" className="px-5 py-2.5 order-1 md:order-2 rounded-lg font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30">Kirim Laporan</button>
                </div>
            </form>
        </div>
    );
};

const Discussion: React.FC<DiscussionProps> = ({ dataEntries, chats, currentUser, adminUser, onUpdate, onAdminReply }) => {
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userEntries = dataEntries.filter(e => e.userId === currentUser.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const selectedEntry = selectedEntryId ? dataEntries.find(e => e.id === selectedEntryId) : null;
    const selectedChat = selectedEntryId ? chats[selectedEntryId] : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChat]);


    const handleCreateEntry = (title: string, description: string) => {
        const newEntry: DataEntry = {
            id: `entry-${Date.now()}`,
            judul: title,
            deskripsi: description,
            userId: currentUser.id,
            status: DataStatus.BARU,
            createdAt: new Date().toISOString(),
        };
        const newChat: Chat = { messages: [] };
        onUpdate([newEntry, ...dataEntries], { ...chats, [newEntry.id]: newChat });
        setIsModalOpen(false);
        setSelectedEntryId(newEntry.id);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedEntryId) return;

        const message: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        const updatedChats = {
            ...chats,
            [selectedEntryId]: {
                messages: [...(chats[selectedEntryId]?.messages || []), message]
            }
        };
        onUpdate(dataEntries, updatedChats);
        onAdminReply(selectedEntry!, message);
        setNewMessage('');
    };

    return (
        <>
            <div className="flex flex-col md:flex-row h-screen bg-white shadow-inner overflow-hidden">
                {/* List Sidebar */}
                <aside className={`
                    w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-slate-50
                    ${selectedEntryId ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-slate-800">Ruang Diskusi</h2>
                        <p className="text-sm text-slate-500">Laporan dan diskusi Anda dengan Admin.</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30">
                            <Plus className="w-5 h-5" />
                            <span>Buat Laporan Baru</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {userEntries.map(entry => (
                            <div key={entry.id} onClick={() => setSelectedEntryId(entry.id)} className={`p-4 border-b border-gray-200/50 cursor-pointer transition-colors duration-200 ${selectedEntryId === entry.id ? 'bg-blue-50' : 'hover:bg-slate-100'}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 flex-1 pr-2 leading-tight">{entry.judul}</h3>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig[entry.status].color}`}>
                                        {statusConfig[entry.status].label}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 truncate mt-1">{entry.deskripsi}</p>
                                <p className="text-xs text-slate-400 mt-2">{new Date(entry.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                            </div>
                        ))}
                        {userEntries.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic">Belum ada laporan.</div>
                        )}
                    </div>
                </aside>

                {/* Chat Main Area */}
                <main className={`
                    flex-1 flex flex-col bg-white
                    ${selectedEntryId ? 'flex' : 'hidden md:flex'}
                `}>
                    {selectedEntry && selectedChat ? (
                        <>
                            <header className="p-4 border-b border-gray-200 bg-white shadow-sm flex items-center">
                                <button onClick={() => setSelectedEntryId(null)} className="md:hidden mr-3 p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-base md:text-lg text-slate-800 truncate">{selectedEntry.judul}</h2>
                                    <p className="text-xs md:text-sm text-slate-500 truncate">Status: {statusConfig[selectedEntry.status].label}</p>
                                </div>
                            </header>
                            <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50 space-y-4 md:space-y-6">
                                {selectedChat.messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-2 md:gap-3 ${msg.senderId === currentUser.id ? 'justify-end' : ''}`}>
                                        {msg.senderId !== currentUser.id && <img src={adminUser.avatar} alt="Admin" className="w-7 h-7 md:w-8 md:h-8 rounded-full" />}
                                        <div className={`max-w-[85%] md:max-w-md p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-lg' : 'bg-white text-slate-800 rounded-bl-lg border border-slate-200'}`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <p className={`text-[10px] mt-1.5 opacity-70 ${msg.senderId === currentUser.id ? 'text-blue-100 text-right' : 'text-slate-400 text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                         {msg.senderId === currentUser.id && <img src={currentUser.avatar} alt={currentUser.nama} className="w-7 h-7 md:w-8 md:h-8 rounded-full" />}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <footer className="p-3 md:p-4 border-t border-gray-200 bg-white sticky bottom-0">
                                { selectedEntry.status === DataStatus.SELESAI ? (
                                    <p className="text-center text-sm text-slate-500 font-semibold py-2">Diskusi ini telah selesai dan ditutup.</p>
                                ) : (
                                    <div className="relative">
                                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ketik pesan..." className="w-full pl-4 pr-16 md:pr-24 py-2.5 md:py-3 bg-slate-100 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm" />
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                                            <button className="hidden md:block p-2 text-slate-400 hover:text-slate-600"><Paperclip className="w-5 h-5" /></button>
                                            <button onClick={handleSendMessage} className="p-2 md:p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md"><Send className="w-4 h-4 md:w-5 md:h-5" /></button>
                                        </div>
                                    </div>
                                )}
                            </footer>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
                            <div className="bg-white p-6 rounded-full border border-gray-200 mb-4 shadow-lg shadow-slate-200/60">
                               <MessageSquareIcon className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Ruang Diskusi</h2>
                            <p className="text-sm mt-2">Pilih laporan di sebelah kiri untuk melihat detail atau buat laporan baru.</p>
                        </div>
                    )}
                </main>
            </div>
            <NewEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateEntry} />
        </>
    );
};

export default Discussion;