'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BackgroundEffect from '@/components/BackgroundEffect';

interface ChatHistory {
  id: string;
  userId: string;
  botId: string;
  sessionId: string;
  customerName: string;
  customerPhone: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  createdAt: string;
  lastMessage: string;
  lastActive: string;
}

export default function BotInboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatHistory | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'chat_history'),
          where('userId', '==', user.uid),
          orderBy('lastActive', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const allChats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatHistory[];

        // Group conversations by customer (name + phone)
        const groupedChats = allChats.reduce((acc, chat) => {
          const customerKey = `${chat.customerName}-${chat.customerPhone}`.toLowerCase();
          
          if (!acc[customerKey]) {
            acc[customerKey] = {
              ...chat,
              customerKey,
              chatIds: [chat.id],
              customerName: chat.customerName,
              customerPhone: chat.customerPhone,
              messages: chat.messages || [],
              createdAt: chat.createdAt,
              lastActive: chat.lastActive,
              lastMessage: chat.lastMessage
            };
          } else {
            // Add chat ID to the group
            acc[customerKey].chatIds.push(chat.id);
            
            // Create a map of existing messages using timestamp as key to prevent duplicates
            const existingMessages = new Map(
              acc[customerKey].messages.map(msg => [
                `${msg.timestamp}-${msg.role}-${msg.content}`,
                msg
              ])
            );

            // Add new messages only if they don't exist
            chat.messages.forEach(msg => {
              const messageKey = `${msg.timestamp}-${msg.role}-${msg.content}`;
              if (!existingMessages.has(messageKey)) {
                existingMessages.set(messageKey, msg);
              }
            });

            // Convert back to array and sort by timestamp
            acc[customerKey].messages = Array.from(existingMessages.values())
              .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeA - timeB;
              });

            // Update last active if more recent
            if (new Date(chat.lastActive) > new Date(acc[customerKey].lastActive)) {
              acc[customerKey].lastActive = chat.lastActive;
              acc[customerKey].lastMessage = chat.lastMessage;
            }
          }
          return acc;
        }, {} as Record<string, ChatHistory & { customerKey: string; chatIds: string[] }>);

        const combinedChats = Object.values(groupedChats)
          .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

        setConversations(combinedChats);
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  const handleDelete = async (conversation: ChatHistory) => {
    try {
      // Get all conversations with the same phone number
      const q = query(
        collection(db, 'chat_history'),
        where('customerPhone', '==', conversation.customerPhone),
        where('userId', '==', user?.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Delete all matching conversations
      await Promise.all(
        querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      );
      
      // Update local state by removing all conversations with same phone
      setConversations(prevConversations => 
        prevConversations.filter(chat => 
          chat.customerPhone !== conversation.customerPhone
        )
      );

      // Clear selected chat if it was from the same customer
      if (selectedChat?.customerPhone === conversation.customerPhone) {
        setSelectedChat(null);
      }

      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversations:', error);
      toast.error('Failed to delete conversations');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <div className="relative z-10 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Bot Inbox</h1>
        
        {/* Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className={`${
            selectedChat ? 'hidden md:block' : ''
          } md:col-span-1 border border-[#1e293b] rounded-lg p-4 space-y-4 
            md:h-[calc(100vh-200px)] 
            max-h-[500px] md:max-h-none 
            overflow-y-auto`}
          >
            {conversations.map((conversation) => (
              <div 
                key={conversation.id} 
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors border ${
                  selectedChat?.id === conversation.id 
                    ? 'border-blue-600/50 bg-blue-600/10' 
                    : 'border-[#1e293b] hover:bg-[#1e293b]/10'
                }`}
                onClick={() => setSelectedChat(conversation)}
              >
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {conversation.customerName || 'Anonymous User'}
                    </p>
                    <div className="flex justify-between text-sm text-gray-400">
                      <p className="truncate">{conversation.lastMessage}</p>
                      <span className="ml-2 flex-shrink-0">
                        {new Date(conversation.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conversation);
                  }}
                  className="ml-4 p-2 text-red-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No conversations found
              </div>
            )}
          </div>

          {/* Chat View */}
          <div className={`${
            !selectedChat ? 'hidden md:block' : ''
          } md:col-span-2 border border-[#1e293b] rounded-lg p-4 h-[calc(100vh-200px)] overflow-y-auto relative`}>
            {selectedChat ? (
              <>
                <div className="space-y-4">
                  <div className="border-b border-gray-700 pb-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden text-gray-400 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-xl font-medium text-white">
                        Conversation with {selectedChat.customerName}
                      </h2>
                    </div>
                    <p className="text-gray-400">{selectedChat.customerPhone}</p>
                    <p className="text-sm text-gray-500">
                      Started: {new Date(selectedChat.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedChat.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#0d1117] text-gray-300'
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 