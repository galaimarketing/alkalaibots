'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { generateEmbedCode } from '@/utils/embedCode';

interface Chatbot {
  id: string;
  name: string;
  config: {
    // ... existing config fields
  };
  trainingData: {
    content: string;
    source?: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState<Chatbot[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBots();
  }, [user]);

  const fetchBots = async () => {
    if (!user) return;

    try {
      const botsRef = collection(db, 'chatbots');
      const q = query(botsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const fetchedBots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chatbot[];

      setBots(fetchedBots);
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      toast.error('Failed to load chatbots');
    }
  };

  const handleDelete = async (botId: string) => {
    try {
      await deleteDoc(doc(db, 'chatbots', botId));
      setBots(bots.filter(bot => bot.id !== botId));
      setShowDeleteModal(null);
      toast.success('Chatbot deleted successfully');
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      toast.error('Failed to delete chatbot');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleCopyEmbed = (botId: string) => {
    navigator.clipboard.writeText(generateEmbedCode(botId));
    toast.success('Embed code copied to clipboard');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-16 pt-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Chatbots</h1>
          <p className="text-gray-400 mt-3 text-lg">Create and manage your AI assistants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
            <div className="text-gray-400 text-center">
              <svg 
                className="w-16 h-16 mx-auto mb-4" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path 
                  d="M17.7530511,13.999921 C18.9956918,13.999921 20.0030511,15.0072804 20.0030511,16.249921 L20.0030511,17.1550008 C20.0030511,18.2486786 19.5255957,19.2878579 18.6957793,20.0002733 C17.1303315,21.344244 14.8899962,22.0010712 12,22.0010712 C9.11050247,22.0010712 6.87168436,21.3444691 5.30881727,20.0007885 C4.48019625,19.2883988 4.00354153,18.2500002 4.00354153,17.1572408 L4.00354153,16.249921 C4.00354153,15.0072804 5.01090084,13.999921 6.25354153,13.999921 L17.7530511,13.999921 Z M17.7530511,15.499921 L6.25354153,15.499921 C5.83932796,15.499921 5.50354153,15.8357075 5.50354153,16.249921 L5.50354153,17.1572408 C5.50354153,17.8128951 5.78953221,18.4359296 6.28670709,18.8633654 C7.5447918,19.9450082 9.44080155,20.5010712 12,20.5010712 C14.5599799,20.5010712 16.4578003,19.9446634 17.7186879,18.8621641 C18.2165778,18.4347149 18.5030511,17.8112072 18.5030511,17.1550005 L18.5030511,16.249921 C18.5030511,15.8357075 18.1672647,15.499921 17.7530511,15.499921 Z M11.8985607,2.00734093 L12.0003312,2.00049432 C12.380027,2.00049432 12.6938222,2.2826482 12.7434846,2.64872376 L12.7503312,2.75049432 L12.7495415,3.49949432 L16.25,3.5 C17.4926407,3.5 18.5,4.50735931 18.5,5.75 L18.5,10.254591 C18.5,11.4972317 17.4926407,12.504591 16.25,12.504591 L7.75,12.504591 C6.50735931,12.504591 5.5,11.4972317 5.5,10.254591 L5.5,5.75 C5.5,4.50735931 6.50735931,3.5 7.75,3.5 L11.2495415,3.49949432 L11.2503312,2.75049432 C11.2503312,2.37079855 11.5324851,2.05700336 11.8985607,2.00734093 L12.0003312,2.00049432 L11.8985607,2.00734093 Z M16.25,5 L7.75,5 C7.33578644,5 7,5.33578644 7,5.75 L7,10.254591 C7,10.6688046 7.33578644,11.004591 7.75,11.004591 L16.25,11.004591 C16.6642136,11.004591 17,10.6688046 17,10.254591 L17,5.75 C17,5.33578644 16.6642136,5 16.25,5 Z M9.74928905,6.5 C10.4392523,6.5 10.9985781,7.05932576 10.9985781,7.74928905 C10.9985781,8.43925235 10.4392523,8.99857811 9.74928905,8.99857811 C9.05932576,8.99857811 8.5,8.43925235 8.5,7.74928905 C8.5,7.05932576 9.05932576,6.5 9.74928905,6.5 Z M14.2420255,6.5 C14.9319888,6.5 15.4913145,7.05932576 15.4913145,7.74928905 C15.4913145,8.43925235 14.9319888,8.99857811 14.2420255,8.99857811 C13.5520622,8.99857811 12.9927364,8.43925235 12.9927364,7.74928905 C12.9927364,7.05932576 13.5520622,6.5 14.2420255,6.5 Z"
                  fill="currentColor"
                  fillOpacity="0.4"
                />
              </svg>
              <h3 className="text-xl font-medium mb-2">No chatbots yet</h3>
              <p className="mb-4">Create your first AI assistant to get started</p>
              <Link
                href="/dashboard/training"
                className="flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Create New Chatbot</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </div>
          </div>
        ) : (
          bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-[#0d1117] rounded-lg p-6 border border-[#1e293b] hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{bot.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareModal(bot.id)}
                    className="text-gray-400 hover:text-white"
                    title="Share"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(bot.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => router.push(`/dashboard/training?botId=${bot.id}`)}
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                >
                  Manage Bot →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1117] rounded-lg p-6 max-w-md w-full border border-[#1e293b]">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Chatbot</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to delete this chatbot? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1117] rounded-lg p-6 max-w-lg w-full border border-[#1e293b]">
            <h3 className="text-xl font-semibold text-white mb-4">Share Chatbot</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Chatbot URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/bot/${showShareModal}`}
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/bot/${showShareModal}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Embed Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generateEmbedCode(showShareModal)}
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg text-white"
                  />
                  <button
                    onClick={() => handleCopyEmbed(showShareModal)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowShareModal(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 