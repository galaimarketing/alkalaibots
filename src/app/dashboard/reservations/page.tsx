'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BackgroundEffect from '@/components/BackgroundEffect';

// Replace Radix icons with simple SVG icons
const CheckCircleIcon = () => (
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

const ClockIcon = () => (
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

interface Reservation {
  id: string;
  userId: string;
  botId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  requestedDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  createdAt: string;
  chatSessionId: string;
  lastMessage: string;
  analysis?: {
    customerName: string | null;
    customerPhone: string | null;
    interestedService: string | null;
    interestLevel: 'high' | 'medium' | 'low';
    summary: string;
    nextSteps: string;
  };
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500/20 text-green-500';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'cancelled':
      return 'bg-red-500/20 text-red-500';
    default:
      return 'bg-gray-500/20 text-gray-500';
  }
};

export default function ReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    const loadReservations = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'reservations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Reservation[];

        setReservations(data);
      } catch (error) {
        console.error('Error loading reservations:', error);
        toast.error('Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    void loadReservations();
  }, [user]);

  const updateReservationStatus = async (reservationId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await setDoc(doc(db, 'reservations', reservationId), {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, status: newStatus } : res
      ));

      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (reservationId: string) => {
    try {
      await deleteDoc(doc(db, 'reservations', reservationId));
      setReservations(prev => prev.filter(r => r.id !== reservationId));
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Failed to delete reservation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading reservations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <div className="relative z-10 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Reservations</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-400">
                  Customer
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-400">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-400">
                  Inquiry
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {reservations.map((reservation) => (
                <tr 
                  key={reservation.id}
                  className="hover:bg-[#1e293b]/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedReservation(reservation)}
                >
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                    <div>
                      <div className="font-medium text-white">{reservation.customerName}</div>
                      <div className="text-gray-400">{reservation.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                    {formatDate(reservation.requestedDate)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                    {reservation.service}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateReservationStatus(reservation.id, reservation.status === 'pending' ? 'confirmed' : 'pending');
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-2 ${
                          getStatusColor(reservation.status)
                        }`}
                      >
                        {reservation.status === 'confirmed' ? <CheckCircleIcon /> : <ClockIcon />}
                        {reservation.status}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(reservation.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] rounded-lg w-[600px] max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-[#0d1117] flex justify-between items-center">
                <h2 className="text-xl font-medium text-white">Reservation Details</h2>
                <button 
                  onClick={() => setSelectedReservation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Summary</h3>
                  <p className="text-white mt-1">{selectedReservation.analysis?.summary}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Next Steps</h3>
                  <p className="text-white mt-1">{selectedReservation.analysis?.nextSteps}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Notes</h3>
                  <p className="text-white mt-1">{selectedReservation.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 