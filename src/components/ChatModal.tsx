import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Loader2, MessageSquare, ShieldCheck, Paperclip, Mic, FileText, CreditCard, ChevronRight, CheckCircle2, ArrowRight, MessageCircle, Play, Pause, Volume2, Trash2, Check, AlertTriangle, Calendar, CalendarPlus, Download, CalendarRange, Clock } from 'lucide-react';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import SafeImage from './SafeImage';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDoc,
  getDocs,
  updateDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Listing, User as AppUser, VerificationLevel, UserRole, Message, MessageType } from '../types';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from './VerificationBadge';
import { createNotification } from '../lib/notifications';
import { calculateVerificationLevel } from '../lib/verification';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  currentUser: AppUser;
  overrideConversationId?: string;
}

type ConversationStatus = 'inquiry' | 'tour_requested' | 'tour_confirmed' | 'contract_sent' | 'escrow_locked' | 'disputed' | 'completed';

const AudioPlayer: React.FC<{ src: string; isOwn: boolean }> = ({ src, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate deterministic waveform based on src string
  const waveform = useMemo(() => {
    const bars = 25;
    const seed = src.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: bars }).map((_, i) => {
      const x = Math.sin(seed + i * 0.8) * 5 + 8;
      return Math.max(3, Math.min(16, x));
    });
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      } else {
        audioRef.current.play();
        const update = () => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            animationFrameRef.current = requestAnimationFrame(update);
          }
        };
        animationFrameRef.current = requestAnimationFrame(update);
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedProgress = x / rect.width;
      const newTime = clickedProgress * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progress = duration ? currentTime / duration : 0;

  return (
    <div className={`flex items-center gap-4 p-3 rounded-[28px] w-64 shadow-sm transition-all ${
      isOwn 
        ? 'bg-blue-500 text-white' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
    }`}>
      <audio 
        ref={audioRef} 
        src={src} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }}
      />
      
      <div className="flex-1 flex items-center gap-2">
        {/* Waveform Visualization */}
        <div 
          onClick={handleWaveformClick}
          className="flex-1 h-8 flex items-center gap-[2px] cursor-pointer group"
        >
          {waveform.map((height, i) => {
            const barProgress = i / waveform.length;
            const isActive = progress > barProgress;
            return (
              <div 
                key={`bar-${i}`}
                style={{ height: `${height}px` }}
                className={`w-[2.5px] rounded-full transition-colors ${
                  isActive 
                    ? (isOwn ? 'bg-white' : 'bg-blue-500') 
                    : (isOwn ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600')
                }`}
              />
            );
          })}
        </div>
        
        <span className={`text-[11px] font-bold tabular-nums shrink-0 ${isOwn ? 'text-white/80' : 'text-slate-500'}`}>
          {formatTime(currentTime || duration)}
        </span>
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0 shadow-sm ${
          isOwn 
            ? 'bg-white text-blue-500' 
            : 'bg-blue-500 text-white'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </motion.button>
    </div>
  );
};

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, listing, currentUser, overrideConversationId }) => {
  const { setSelectedAgentId, setCurrentListing } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [visualizerLevels, setVisualizerLevels] = useState<number[]>(new Array(30).fill(2));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTourFormOpen, setIsTourFormOpen] = useState(false);
  const [tourDate, setTourDate] = useState('');
  const [tourTime, setTourTime] = useState('');
  const [tourNote, setTourNote] = useState('');

  const [counterFormMsgId, setCounterFormMsgId] = useState<string | null>(null);
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('');
  const [counterNote, setCounterNote] = useState('');

  const [convStatus, setConvStatus] = useState<ConversationStatus>('inquiry');
  const [convData, setConvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBillingSlip, setShowBillingSlip] = useState(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);
  const [otherUser, setOtherUser] = useState<{ name: string; avatarUrl?: string; verificationLevel?: VerificationLevel; role: UserRole; phoneNumber?: string; isSuspended?: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [realtimeListingStatus, setRealtimeListingStatus] = useState<string | null>(null);
  const [realtimePriceValue, setRealtimePriceValue] = useState<number | null>(null);
  const [realtimePriceString, setRealtimePriceString] = useState<string | null>(null);

  const loadPaystack = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  };

  const parsePriceToValue = (priceString: string | number | undefined): number => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    const cleaned = priceString.replace(/[₦,$/a-zA-Z\s\-]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getListingPriceValue = (): number => {
    if (realtimePriceValue !== null) return realtimePriceValue;
    if (listing?.priceValue) return Number(listing.priceValue);
    if (!listing?.price) return 0;
    return parsePriceToValue(listing.price);
  };

  const isChatSuspended = realtimeListingStatus === 'suspended' || (currentUser as any)?.isSuspended || otherUser?.isSuspended;
  const isCompletedBySomeoneElse = realtimeListingStatus === 'completed' && 
    (currentUser.role === 'tenant' && convData?.status !== 'completed' && convData?.status !== 'escrow_locked');

  // Live status tracking for suspended listings & real-time updates
  useEffect(() => {
    if (!isOpen || !listing?.id) return;
    const unsub = onSnapshot(doc(db, 'listings', listing.id.toString()), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRealtimeListingStatus(data.status || null);
        if (data.priceValue !== undefined) {
          setRealtimePriceValue(Number(data.priceValue));
        }
        if (data.price !== undefined) {
          setRealtimePriceString(data.price);
        }
      }
    }, (error) => {
      console.warn("Chat listings error:", error);
    });
    return () => unsub();
  }, [isOpen, listing?.id]);

  // Stable Conversation ID processing
  // If we have an override (from Inbox), use it. 
  // Otherwise, if tenant, form the key. 
  // Warning: If agent opens from listing details (unlikely but possible), the tenant ID might be missing.
  const conversationId = overrideConversationId || (
    currentUser.role === 'tenant' 
      ? `${currentUser.id}_${listing.agent?.id || 'unknown'}_${listing.id}`
      : `unknown_${currentUser.id}_${listing.id}` 
  );

  useEffect(() => {
    if (!isOpen) return;

    // Reset unread count for current user
    const resetUnread = async () => {
      try {
        const convRef = doc(db, 'conversations', conversationId);
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          const fieldToReset = currentUser.role === 'tenant' ? 'unreadCount_tenant' : 'unreadCount_agent';
          if (convSnap.data()[fieldToReset] > 0) {
            await updateDoc(convRef, {
              [fieldToReset]: 0,
              updatedAt: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`));
          }
        }
      } catch (err) {
        console.error("Error resetting unread count:", err);
      }
    };
    resetUnread();

    setIsLoading(true);
    setError(null);

    // Sync Conversation Status
    const convRef = doc(db, 'conversations', conversationId);
    let unsubOther: (() => void) | undefined;

    const unsubConv = onSnapshot(convRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConvStatus(data.status || 'inquiry');
        setConvData(data);

        // Fetch other user's verification status with live listener
        const otherId = currentUser.role === 'tenant' ? data.agentId : data.tenantId;
        if (otherId && !unsubOther) {
          unsubOther = onSnapshot(doc(db, 'users', otherId), (userSnap) => {
            if (userSnap.exists()) {
              const d = userSnap.data();
              setOtherUser({
                name: d.firstName || d.lastName ? `${d.firstName || ''} ${d.lastName || ''}`.trim() : (d.name || "User"),
                avatarUrl: d.avatarUrl,
                verificationLevel: d.verificationLevel === 'verified' ? 'verified' : calculateVerificationLevel(d as any),
                role: d.role,
                phoneNumber: d.phoneNumber,
                isSuspended: d.isSuspended || false
              });
            }
          }, (err) => handleFirestoreError(err, OperationType.GET, `users/${otherId}`));
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `conversations/${conversationId}`));

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    // Simplified query: No redundant filtering on subcollection fields to avoid composite index requirements.
    // Permissions are already checked at the parent conversation level.
    const q = query(
      messagesRef, 
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setIsLoading(false);
      setError(null); // Clear any transient errors
      
      // Auto scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Chat listener error:", err);
      handleFirestoreError(err, OperationType.LIST, `conversations/${conversationId}/messages`);
      // Only set error if it's NOT a permission denied on a likely non-existent conversation
      // If it's a new chat (convData is null), permission-denied is expected from the parent-check rule
      if (err.code === 'permission-denied') {
        if (convData) {
          setError("Missing permissions. Please ensure your session is active.");
        }
        // If no convData, we just stay in a 'ready to start' state
      } else {
        setError("Failed to load messages.");
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      unsubConv();
      if (unsubOther) unsubOther();
    };
  }, [isOpen, conversationId, currentUser.id, currentUser.role]);

  const handleInitiatePayment = () => {
    setShowBillingSlip(true);
  };

  const processPayment = async () => {
    await loadPaystack();
    const handler = (window as any).PaystackPop.setup({
      key: (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_4d1af99ee88278c56911355296411efe956a7b98',
      email: currentUser?.email || 'user@directrent.com',
      amount: (getListingPriceValue() + 15000) * 100, // Amount in kobo, plus 15k fee
      reference: `DR-TXN-${(new Date()).getTime()}-${Math.floor(Math.random() * 100000)}`,
      callback: async (reference: any) => {
        try {
          const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
          const agentId = listing.agent?.id || convData?.agentId || 'unknown';
          const tenantName = convData?.tenantName || (currentUser.role === 'tenant' ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : 'Tenant');
          
          const propertyRent = getListingPriceValue();
          const escrowFee = 15000;
          const gatewayFee = Math.min((propertyRent + escrowFee) * 0.015, 2000);

          let deadline = new Date();
          deadline.setDate(deadline.getDate() + 7);

          await addDoc(collection(db, 'transactions'), {
            id: reference.reference || `DR-TXN-${(new Date()).getTime()}`,
            reference: reference.reference || `DR-TXN-${(new Date()).getTime()}`,
            listingId: listing.id.toString(),
            propertyTitle: listing.title || 'Property',
            rentAmount: propertyRent,
            platformFee: escrowFee,
            gatewayFee: gatewayFee,
            totalPaid: propertyRent + escrowFee + gatewayFee,
            tenantId: tenantId,
            tenantName: tenantName,
            agentId: agentId,
            agentName: listing.agent?.name || convData?.agentName || 'Agent',
            status: 'locked',
            escrowDeadline: deadline,
            date: new Date(),
            createdAt: new Date()
          });
        } catch(e) {
          console.error("Failed to save transaction: ", e);
        }
        setShowBillingSlip(false);
        await handleAction('escrow_locked', `Security deposit securely locked in DirectRent Escrow [Tx: ${reference.reference}].`, 'escrow_locked');
      },
      onClose: () => {
        // User closed modal
      }
    });

    handler.openIframe();
  };

  const downloadIcsFile = (date: string, time: string, title: string, address: string) => {
    const startDay = date.replace(/-/g, '');
    const [hh, mm] = time.split(':');
    const startHourStr = hh.padStart(2, '0');
    const startMinStr = mm.padStart(2, '0');
    
    const startTime = `${startHourStr}${startMinStr}00`;
    const endHourObj = (parseInt(hh, 10) + 1);
    const endHourStr = (endHourObj >= 24 ? 23 : endHourObj).toString().padStart(2, '0');
    const endTime = `${endHourStr}${startMinStr}00`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:Inspection: ${title}`,
      `DESCRIPTION:Inspection tour for property: ${title}. Let's meet on site.`,
      `LOCATION:${address || 'Property Address'}`,
      `DTSTART:${startDay}T${startTime}`,
      `DTEND:${startDay}T${endTime}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inspection_tour_${date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarUrl = (date: string, time: string, title: string, address: string) => {
    const startDay = date.replace(/-/g, '');
    const [hh, mm] = time.split(':');
    const startHourStr = hh.padStart(2, '0');
    const startMinStr = mm.padStart(2, '0');
    
    const startTime = `${startHourStr}${startMinStr}00`;
    const endHourObj = (parseInt(hh, 10) + 1);
    const endHourStr = (endHourObj >= 24 ? 23 : endHourObj).toString().padStart(2, '0');
    const endTime = `${endHourStr}${startMinStr}00`;
    
    const dates = `${startDay}T${startTime}/${startDay}T${endTime}`;
    const details = encodeURIComponent(`Inspection tour for property: ${title}. Let's meet on site.`);
    const loc = encodeURIComponent(address || 'Property Address');
    const text = encodeURIComponent(`Inspection: ${title}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${loc}`;
  };

  const handleRequestTour = async () => {
    if (!tourDate || !tourTime) {
      setError("Please select both a date and time.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || convData?.agentId || 'unknown';
      const convRef = doc(db, 'conversations', conversationId);

      const payload = {
        type: 'tour_requested',
        date: tourDate,
        time: tourTime,
        note: tourNote || '',
        status: 'pending',
        proposedBy: 'tenant'
      };

      const convDoc = await getDoc(convRef);
      if (!convDoc.exists()) {
        let agentImage = '';
        if (agentId !== 'unknown') {
          const agentDoc = await getDoc(doc(db, 'users', agentId));
          if (agentDoc.exists()) {
            agentImage = agentDoc.data().avatarUrl || '';
          }
        }

        await setDoc(convRef, {
          id: conversationId,
          tenantId: currentUser.id,
          agentId: agentId,
          listingId: listing.id.toString(),
          tenantName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User',
          agentName: listing.agent?.name || 'Agent',
          tenantImage: currentUser.avatarUrl || '',
          agentImage: agentImage,
          listingTitle: listing.title,
          listingImage: listing.image,
          listingPrice: listing.price,
          listingPriceValue: getListingPriceValue(),
          status: 'tour_requested',
          updatedAt: serverTimestamp(),
          lastMessage: `Tour proposed: ${tourDate} at ${tourTime}`,
          unreadCount_tenant: currentUser.role === 'tenant' ? 0 : 1,
          unreadCount_agent: currentUser.role === 'agent' ? 0 : 1
        });

        const listingDocRef = doc(db, 'listings', listing.id.toString());
        await setDoc(listingDocRef, { 
          inquiryCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });

      } else {
        await updateDoc(convRef, {
          status: 'tour_requested',
          lastMessage: `Tour proposed: ${tourDate} at ${tourTime}`,
          updatedAt: serverTimestamp(),
          unreadCount_agent: increment(1)
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`));
      }

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: JSON.stringify(payload),
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'action',
        actionType: 'tour_requested',
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages`));

      setTourDate('');
      setTourTime('');
      setTourNote('');
      setIsTourFormOpen(false);

      if (agentId && agentId !== 'unknown') {
        await createNotification(
          agentId,
          "Property Tour Requested",
          `A tenant has requested an inspection tour on ${tourDate} at ${tourTime}.`,
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Tour request sending issue:", err);
      setError("Failed to send tour request.");
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmTour = async (originalDate: string, originalTime: string, originalNote: string) => {
    setIsSending(true);
    setError(null);
    try {
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || convData?.agentId || 'unknown';
      const convRef = doc(db, 'conversations', conversationId);

      const payload = {
        type: 'tour_confirmed',
        date: originalDate,
        time: originalTime,
        note: originalNote || '',
        status: 'confirmed'
      };

      await updateDoc(convRef, {
        status: 'tour_confirmed',
        lastMessage: `Tour confirmed: ${originalDate} at ${originalTime}`,
        updatedAt: serverTimestamp(),
        [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`));

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: JSON.stringify(payload),
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'action',
        actionType: 'tour_confirmed',
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages`));

      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          "Property Tour Confirmed",
          `Great news! Your property tour on ${originalDate} at ${originalTime} has been confirmed.`,
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Tour confirmation issue:", err);
      setError("Failed to confirm tour.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeclineTour = async () => {
    setIsSending(true);
    setError(null);
    try {
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || convData?.agentId || 'unknown';
      const convRef = doc(db, 'conversations', conversationId);

      const payload = {
        type: 'tour_declined',
        status: 'declined'
      };

      // Reset conversation status back to inquiry so the process starts again
      await updateDoc(convRef, {
        status: 'inquiry',
        lastMessage: `Tour proposal was declined. Ready to reschedule.`,
        updatedAt: serverTimestamp(),
        [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`));

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: JSON.stringify(payload),
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'action',
        actionType: 'tour_declined',
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages`));

      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          "Tour Request Declined",
          `The scheduled tour session was declined. You can propose a new schedule.`,
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Tour decline issue:", err);
      setError("Failed to decline tour.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCounterProposal = async () => {
    if (!counterDate || !counterTime) {
      setError("Please select proposed date and time.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || convData?.agentId || 'unknown';
      const convRef = doc(db, 'conversations', conversationId);

      const payload = {
        type: 'tour_counter',
        date: counterDate,
        time: counterTime,
        note: counterNote || '',
        status: 'pending',
        proposedBy: currentUser.role
      };

      // Keep status as tour_requested
      await updateDoc(convRef, {
        status: 'tour_requested',
        lastMessage: `Counter-proposal: ${counterDate} at ${counterTime}`,
        updatedAt: serverTimestamp(),
        [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`));

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: JSON.stringify(payload),
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'action',
        actionType: 'tour_counter',
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages`));

      setCounterDate('');
      setCounterTime('');
      setCounterNote('');
      setCounterFormMsgId(null);

      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          "Tour Counter Proposed",
          `A counter-proposal was submitted for ${counterDate} at ${counterTime}.`,
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Counter proposal send error:", err);
      setError("Failed to send counter proposal.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAction = async (actionType: string, content: string, nextStatus: ConversationStatus) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const convRef = doc(db, 'conversations', conversationId);
      const agentId = listing.agent?.id || convData?.agentId || 'unknown';
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);

      // Update status
      await updateDoc(convRef, {
        status: nextStatus,
        lastMessage: content,
        updatedAt: serverTimestamp(),
        [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`));

      if (nextStatus === 'completed' || nextStatus === 'disputed') {
        try {
          const txQuery = query(collection(db, 'transactions'), 
            where('listingId', '==', listing.id.toString()), 
            where('tenantId', '==', tenantId),
            where('status', '==', 'locked')
          );
          const txSnapshot = await getDocs(txQuery);
          if (!txSnapshot.empty) {
            for (const docSnapshot of txSnapshot.docs) {
              await updateDoc(doc(db, 'transactions', docSnapshot.id), {
                status: nextStatus === 'completed' ? 'released' : 'disputed'
              });
            }
          }
        } catch (e) {
          console.error("Failed to update transaction status:", e);
        }
      }

      // If completing, increment agent's success count and update listing status
      if (nextStatus === 'completed' && agentId !== 'unknown') {
        const agentDocRef = doc(db, 'users', agentId);
        await updateDoc(agentDocRef, {
          completedTxns: increment(1),
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${agentId}`));

        if (listing.id) {
          const listingDocRef = doc(db, 'listings', listing.id.toString());
          await updateDoc(listingDocRef, {
            status: 'completed',
            updatedAt: serverTimestamp()
          }).catch(err => console.error("Failed to update listing to completed status:", err));
        }
      }

      // Add system message
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: content,
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'action',
        actionType: actionType,
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages`));

      // Send notification to the OTHER user
      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          `Transaction Update: ${actionType.replace('_', ' ')}`,
          content,
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Action error:", err);
      setError("Failed to process transaction step.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDocument = async (file: File) => {
    if (realtimeListingStatus === 'suspended' || (currentUser as any)?.isSuspended || otherUser?.isSuspended) {
      setError("Conversation is currently suspended.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum file size is 10MB.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || 'unknown';

      // Upload file to Firebase Storage
      const fileRef = ref(storage, `conversations/${conversationId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      // Format file size
      const formattedSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      // Check if conversation exists, if not create metadata
      const convRef = doc(db, 'conversations', conversationId);
      const convDoc = await getDoc(convRef);
      
      const nextStatus = (currentUser.role === 'agent' && convStatus === 'tour_confirmed') ? 'contract_sent' : convStatus;
      const notificationTitle = currentUser.role === 'agent' ? "Tenancy Contract Sent" : "Document Attachment";
      const notificationBody = `Uploaded file: ${file.name}`;

      if (!convDoc.exists()) {
        let agentImage = '';
        if (agentId !== 'unknown') {
          const agentDoc = await getDoc(doc(db, 'users', agentId));
          if (agentDoc.exists()) {
            agentImage = agentDoc.data().avatarUrl || '';
          }
        }

        await setDoc(convRef, {
          id: conversationId,
          tenantId: currentUser.role === 'tenant' ? currentUser.id : tenantId,
          agentId: agentId,
          listingId: listing.id.toString(),
          tenantName: currentUser.role === 'tenant' ? (`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User') : (convData?.tenantName || 'Tenant'),
          agentName: listing.agent?.name || 'Agent',
          tenantImage: currentUser.role === 'tenant' ? (currentUser.avatarUrl || '') : (convData?.tenantImage || ''),
          agentImage: agentImage,
          listingTitle: listing.title,
          listingImage: listing.image,
          listingPrice: listing.price,
          listingPriceValue: getListingPriceValue(),
          status: nextStatus,
          updatedAt: serverTimestamp(),
          lastMessage: `Document: ${file.name}`,
          unreadCount_tenant: currentUser.role === 'tenant' ? 0 : 1,
          unreadCount_agent: currentUser.role === 'agent' ? 0 : 1
        });

        const listingDocRef = doc(db, 'listings', listing.id.toString());
        await setDoc(listingDocRef, { 
          inquiryCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await updateDoc(convRef, {
          status: nextStatus,
          lastMessage: `Document: ${file.name}`,
          updatedAt: serverTimestamp(),
          [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
        });
      }

      // Add file to messages
      const msgData = {
        content: fileUrl, // Store Firebase Storage download URL
        fileName: file.name,
        fileSize: formattedSize,
        fileType: file.type,
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'document',
        createdAt: serverTimestamp()
      };
      
      console.log("[DIAGNOSTIC LOG - sendMessage (document)]");
      console.log("Firestore Path:", `conversations/${conversationId}/messages`);
      console.log("User Auth Object:", currentUser);
      console.log("Document Data Payload:", JSON.stringify({
        ...msgData,
        createdAt: "serverTimestamp()"
      }, null, 2));

      try {
        await addDoc(collection(db, 'conversations', conversationId, 'messages'), msgData);
      } catch (err) {
        console.error("Failed to add msgData: ", err);
        throw err;
      }

      // Create extra system message if the agent sent a tenancy agreement transitioning the conversation
      if (currentUser.role === 'agent' && convStatus === 'tour_confirmed') {
        const actionMsg = {
          content: `Tenancy agreement "${file.name}" sent for review. Please proceed to lease review and deposit resolution.`,
          senderId: currentUser.id,
          tenantId: tenantId,
          agentId: agentId,
          type: 'action',
          actionType: 'contract_sent',
          createdAt: serverTimestamp()
        };
        try {
          await addDoc(collection(db, 'conversations', conversationId, 'messages'), actionMsg);
        } catch (err) {
          console.error("Failed to add actionMsg: ", err);
          throw err;
        }
      }

      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          notificationTitle,
          notificationBody,
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Failed to send document: ", err);
      setError("Failed to send document.");
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // Visualizer Setup
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Normalize and pick levels for a "WhatsApp" wave look
        const levels = Array.from(dataArray).slice(0, 30).map(v => Math.max(2, v / 4));
        setVisualizerLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        handleSendAudio(audioBlob);
        
        // Clean up visualizer
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (recordingIntervalRef.current) window.clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
        setVisualizerLevels(new Array(30).fill(2));
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      updateVisualizer();
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone.");
    }
  };

  const stopRecording = (cancel = false) => {
    if (cancel) {
      mediaRecorderRef.current?.stop();
      // On stop logic will handle sending, but we want to ignore if canceled
      // Let's set a flag or just stop it.
      // Actually simpler: override onstop just for this cancel action
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          // No-op cleanup
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          if (audioContextRef.current) audioContextRef.current.close();
          if (recordingIntervalRef.current) window.clearInterval(recordingIntervalRef.current);
          setRecordingTime(0);
          setVisualizerLevels(new Array(30).fill(2));
        };
        mediaRecorderRef.current.stop();
      }
    } else {
      mediaRecorderRef.current?.stop();
    }
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const handleSendAudio = async (blob: Blob) => {
    if (realtimeListingStatus === 'suspended' || (currentUser as any)?.isSuspended || otherUser?.isSuspended) {
      setError("Conversation is currently suspended.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const convRef = doc(db, 'conversations', conversationId);
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || 'unknown';

      // Upload audio to Firebase Storage
      const fileRef = ref(storage, `conversations/${conversationId}/${Date.now()}_audio.webm`);
      await uploadBytes(fileRef, blob);
      const fileUrl = await getDownloadURL(fileRef);

      // Check if conversation exists, if not create metadata
      const convDoc = await getDoc(convRef);
      if (!convDoc.exists()) {
        let agentImage = '';
        if (agentId !== 'unknown') {
          const agentDoc = await getDoc(doc(db, 'users', agentId));
          if (agentDoc.exists()) {
            agentImage = agentDoc.data().avatarUrl || '';
          }
        }

        await setDoc(convRef, {
          id: conversationId,
          tenantId: currentUser.role === 'tenant' ? currentUser.id : tenantId,
          agentId: agentId,
          listingId: listing.id.toString(),
          tenantName: currentUser.role === 'tenant' ? (`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User') : (convData?.tenantName || 'Tenant'),
          agentName: listing.agent?.name || 'Agent',
          tenantImage: currentUser.role === 'tenant' ? (currentUser.avatarUrl || '') : (convData?.tenantImage || ''),
          agentImage: agentImage,
          listingTitle: listing.title,
          listingImage: listing.image,
          listingPrice: listing.price,
          listingPriceValue: getListingPriceValue(),
          status: 'inquiry',
          updatedAt: serverTimestamp(),
          lastMessage: "Audio message",
          unreadCount_tenant: currentUser.role === 'tenant' ? 0 : 1,
          unreadCount_agent: currentUser.role === 'agent' ? 0 : 1
        });

        const listingDocRef = doc(db, 'listings', listing.id.toString());
        await setDoc(listingDocRef, { 
          inquiryCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await updateDoc(convRef, {
          lastMessage: "Audio message",
          updatedAt: serverTimestamp(),
          [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
        });
      }

      // Send as message directly to Firestore (embedded)
      const msgData = {
        content: fileUrl,
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'audio',
        createdAt: serverTimestamp()
      };
      
      console.log("[DIAGNOSTIC LOG - sendMessage (audio)]");
      console.log("Firestore Path:", `conversations/${conversationId}/messages`);
      console.log("User Auth Object:", currentUser);
      console.log("Document Data Payload:", JSON.stringify({
        ...msgData,
        createdAt: "serverTimestamp()"
      }, null, 2));

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), msgData);
      
      // Send notification
      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          `New audio message from ${`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User'}`,
          "Audio message",
          'message',
          'chat',
          conversationId
        );
      }
    } catch (err) {
      console.error("Audio processing/send error:", err);
      setError("Failed to send audio message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    if (realtimeListingStatus === 'suspended' || (currentUser as any)?.isSuspended || otherUser?.isSuspended) {
      setError("Conversation is currently suspended.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const convRef = doc(db, 'conversations', conversationId);
      const agentId = listing.agent?.id || 'unknown';
      
      // Check if conversation exists, if not create metadata
      const convDoc = await getDoc(convRef);
      if (!convDoc.exists()) {
        const agentId = listing.agent?.id || 'unknown';
        let agentImage = '';
        
        // Try to fetch agent's image if not in listing
        if (agentId !== 'unknown') {
          const agentDoc = await getDoc(doc(db, 'users', agentId));
          if (agentDoc.exists()) {
            agentImage = agentDoc.data().avatarUrl || '';
          }
        }

        await setDoc(convRef, {
          id: conversationId,
          tenantId: currentUser.id,
          agentId: agentId,
          listingId: listing.id.toString(),
          tenantName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User',
          agentName: listing.agent?.name || 'Agent',
          tenantImage: currentUser.avatarUrl || '',
          agentImage: agentImage,
          listingTitle: listing.title,
          listingImage: listing.image,
          listingPrice: listing.price,
          listingPriceValue: getListingPriceValue(),
          status: 'inquiry',
          updatedAt: serverTimestamp(),
          lastMessage: newMessage.trim(),
          unreadCount_tenant: currentUser.role === 'tenant' ? 0 : 1,
          unreadCount_agent: currentUser.role === 'agent' ? 0 : 1
        });

        // Increment inquiryCount on the listing
        const listingDocRef = doc(db, 'listings', listing.id.toString());
        await setDoc(listingDocRef, { 
          inquiryCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });

      } else {
        await updateDoc(convRef, {
          lastMessage: newMessage.trim(),
          updatedAt: serverTimestamp(),
          [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
        });
      }

      // Add message to subcollection with metadata fields for relational rules
      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      
      const msgData = {
        content: newMessage.trim(),
        senderId: currentUser.id,
        tenantId: tenantId, 
        agentId: agentId,
        type: 'text',
        createdAt: serverTimestamp()
      };
      
      console.log("[DIAGNOSTIC LOG - sendMessage (text)]");
      console.log("Firestore Path:", `conversations/${conversationId}/messages`);
      console.log("User Auth Object:", currentUser);
      console.log("Document Data Payload:", JSON.stringify({
        ...msgData,
        createdAt: "serverTimestamp()"
      }, null, 2));

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), msgData);

      // Send notification to the OTHER user
      const recipientId = currentUser.role === 'tenant' ? agentId : tenantId;
      if (recipientId && recipientId !== 'unknown') {
        await createNotification(
          recipientId,
          `New message from ${`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User'}`,
          newMessage.trim(),
          'message',
          'chat',
          conversationId
        );
      }

      setNewMessage('');
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[650px] max-h-[95vh] overflow-hidden m-0 sm:m-4 pointer-events-auto border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 transition-all duration-300"
          >
            <AnimatePresence>
              {showBillingSlip && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowBillingSlip(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border-[0.5px] border-slate-200 dark:border-[#0f172b]"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white leading-tight">Escrow Deposit</h3>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Secure Payment Request</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500 font-medium">Property Rent</span>
                        <span className="font-bold text-slate-900 dark:text-white">₦{getListingPriceValue().toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500 font-medium">DirectRent Escrow Fee</span>
                        <span className="font-bold text-slate-900 dark:text-white">₦15,000</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500 font-medium">Gateway Fee (est.)</span>
                        <span className="font-bold text-slate-900 dark:text-white">₦{Math.min((getListingPriceValue() + 15000) * 0.015, 2000).toLocaleString()}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase">Total Amount</span>
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₦{(getListingPriceValue() + 15000 + Math.min((getListingPriceValue() + 15000) * 0.015, 2000)).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed text-center mb-6 px-4">
                      Funds are held securely in escrow. They will only be released to the agent upon successful key handoff and your confirmation.
                    </p>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowBillingSlip(false)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={processPayment}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" /> Pay & Lock
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="px-4 py-4 border-b border-slate-105 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 shadow-sm">
              <div className="flex items-center gap-3.5 text-left">
                <button 
                  onClick={() => {
                    const idToView = listing.agent?.id || convData?.agentId;
                    if (idToView && idToView !== 'unknown') {
                      onClose();
                      setSelectedAgentId(idToView);
                    }
                  }}
                  className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold border border-slate-150/60 dark:border-slate-700 overflow-hidden shrink-0 uppercase text-sm relative shadow-inner cursor-pointer hover:scale-105 transition-all duration-300"
                >
                  {otherUser?.avatarUrl ? (
                    <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    (otherUser?.name || listing.agent?.name || 'A').charAt(0)
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </button>
                <div className="min-w-0">
                  <button 
                    onClick={() => {
                      const idToView = listing.agent?.id || convData?.agentId;
                      if (idToView && idToView !== 'unknown') {
                        onClose();
                        setSelectedAgentId(idToView);
                      }
                    }}
                    className="flex items-center gap-1.5 mb-0.5 text-left hover:text-primary-600 dark:hover:text-primary-400 group cursor-pointer"
                  >
                    <h3 className="font-display font-extrabold text-[#111827] dark:text-white text-sm sm:text-base leading-tight truncate tracking-tight group-hover:underline">
                      {otherUser?.name || listing.agent?.name}
                    </h3>
                    {otherUser?.verificationLevel && (
                      <VerificationBadge level={otherUser.verificationLevel} role={otherUser.role} showText={false} className="scale-90" />
                    )}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Active Secure Node</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Property Reference Banner */}
            <div className="px-4.5 py-3.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-105 dark:border-slate-800/60 flex items-center gap-3.5 shrink-0 backdrop-blur-md">
              <button 
                onClick={() => {
                  onClose();
                  setCurrentListing(listing);
                }}
                className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-150 dark:border-slate-800 relative group/ref cursor-pointer active:scale-95 transition-all"
              >
                <SafeImage 
                  src={listing.image} 
                  className="w-full h-full object-cover transition-transform group-hover/ref:scale-110 duration-300" 
                  alt={listing.title}
                />
              </button>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Referenced Rental</p>
                <button 
                  onClick={() => {
                    onClose();
                    setCurrentListing(listing);
                  }}
                  className="text-xs font-bold text-slate-800 dark:text-slate-250 hover:text-primary-600 dark:hover:text-primary-450 text-left truncate tracking-tight hover:underline cursor-pointer"
                >
                  {listing.title}
                </button>
              </div>
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-150/60 dark:border-slate-800/80 shrink-0 shadow-sm">
                <p className="text-xs font-black text-primary-605 dark:text-primary-450">{realtimePriceString ?? listing.price}</p>
              </div>
            </div>

            {/* Sticky Milestone Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-10 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide w-full min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 min-w-max pr-1 shrink-0">
                  <span className={'text-primary-600 dark:text-primary-400'}>1. Inspection</span>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  <span className={convStatus === 'contract_sent' || convStatus === 'escrow_locked' || convStatus === 'disputed' || convStatus === 'completed' ? 'text-primary-600 dark:text-primary-400' : ''}>2. Contract</span>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  <span className={convStatus === 'escrow_locked' || convStatus === 'disputed' || convStatus === 'completed' ? 'text-primary-600 dark:text-primary-400' : ''}>3. Escrow</span>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  <span className={convStatus === 'completed' ? 'text-emerald-500' : ''}>4. Handoff</span>
                </div>
                
                <div className="flex-shrink-0">
                  {currentUser.role === 'tenant' ? (
                    <>
                      {convStatus === 'inquiry' && (
                        <button onClick={() => !isChatSuspended && setIsTourFormOpen(true)} disabled={isChatSuspended} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap flex items-center gap-1">
                          <CalendarRange className="w-3.5 h-3.5" /> Book Tour
                        </button>
                      )}
                      {convStatus === 'tour_requested' && (
                        <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-bold whitespace-nowrap animate-pulse flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> Tour Pending Approval
                        </span>
                      )}
                      {convStatus === 'tour_confirmed' && (
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-150 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tour Confirmed
                        </span>
                      )}
                      {convStatus === 'contract_sent' && (
                        <button onClick={() => !isChatSuspended && handleInitiatePayment()} disabled={isChatSuspended} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3" /> Review & Pay Deposit
                        </button>
                      )}
                      {convStatus === 'escrow_locked' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => !isChatSuspended && handleAction('disputed', 'I need mediation. The keys were not handed over or terms were violated.', 'disputed')} disabled={isChatSuspended} className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg text-[11px] font-bold border border-rose-200 dark:border-rose-900/50 shadow-sm whitespace-nowrap">
                            Dispute
                          </button>
                          <button onClick={() => !isChatSuspended && handleAction('completed', 'Keys received! Release the funds to the agent.', 'completed')} disabled={isChatSuspended} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" /> Confirm Key Handoff
                          </button>
                        </div>
                      )}
                      {convStatus === 'disputed' && (
                        <span className="px-3 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 rounded-lg text-[11px] font-bold whitespace-nowrap">
                          In Mediation
                        </span>
                      )}
                      {convStatus === 'completed' && (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {convStatus === 'inquiry' && (
                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[11px] font-bold whitespace-nowrap">
                          Awaiting Request
                        </span>
                      )}
                      {convStatus === 'tour_requested' && (
                        <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-bold whitespace-nowrap animate-pulse">
                          Pending Tour Schedule
                        </span>
                      )}
                      {convStatus === 'tour_confirmed' && (
                        <button onClick={() => !isChatSuspended && fileInputRef.current?.click()} disabled={isChatSuspended} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Send Contract
                        </button>
                      )}
                      {convStatus === 'contract_sent' && (
                        <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-[11px] font-bold whitespace-nowrap">
                          Waiting for Deposit
                        </span>
                      )}
                      {convStatus === 'escrow_locked' && (
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-[11px] font-bold whitespace-nowrap">
                          Awaiting Handoff
                        </span>
                      )}
                      {convStatus === 'disputed' && (
                        <span className="px-3 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 rounded-lg text-[11px] font-bold whitespace-nowrap">
                          Disputed
                        </span>
                      )}
                      {convStatus === 'completed' && (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Released to Wallet
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Disclosure Banner */}
            <AnimatePresence>
              {showPrivacyBanner && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 px-4 py-3 flex items-start gap-3 shrink-0"
                >
                  <div className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      We keep a history of your chats for safety and quality assurance. Please note that security protections only apply to interactions within the DirectRent app.
                    </p>
                  </div>
                  <button onClick={() => setShowPrivacyBanner(false)} className="text-amber-400 hover:text-amber-600">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/30 dark:bg-slate-950/30 space-y-4 sm:space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 text-[11px] font-bold text-center uppercase tracking-wide">
                  {error}
                </div>
              )}
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Securing Connection</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800 text-primary-200 dark:text-primary-800">
                    <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">No conversation history</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 max-w-[220px]">
                    Start the discussion by asking about the lease terms or requesting a viewing.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${
                      msg.type === 'action'
                        ? (msg.actionType?.startsWith('tour_')
                          ? (msg.senderId === currentUser.id ? 'justify-end' : 'justify-start')
                          : 'justify-center')
                        : (msg.senderId === currentUser.id ? 'justify-end' : 'justify-start')
                    }`}
                  >
                    {msg.type === 'action' ? (
                      (() => {
                        const isTourAction = msg.actionType && msg.actionType.startsWith('tour_');
                        let tourDetails: any = null;
                        
                        if (isTourAction && msg.content) {
                          if (msg.content.trim().startsWith('{')) {
                            try {
                              tourDetails = JSON.parse(msg.content);
                            } catch (e) {
                              // Non-JSON
                            }
                          }
                          
                          if (!tourDetails) {
                            tourDetails = {
                              type: msg.actionType,
                              date: '',
                              time: '',
                              note: msg.content,
                              status: msg.actionType === 'tour_confirmed' ? 'confirmed' : msg.actionType === 'tour_declined' ? 'declined' : 'pending',
                              proposedBy: msg.actionType === 'tour_requested' ? 'tenant' : 'agent'
                            };
                          }
                        }

                        if (isTourAction && tourDetails) {
                          const latestTourAction = [...messages]
                            .reverse()
                            .find(m => m.type === 'action' && m.actionType && m.actionType.startsWith('tour_'));
                          const isLatestProposal = latestTourAction && latestTourAction.id === msg.id;
                          const isStaleProposal = (msg.actionType === 'tour_requested' || msg.actionType === 'tour_counter') && !isLatestProposal;

                          const msgIndex = messages.findIndex(m => m.id === msg.id);
                          const subsequentTourAction = msgIndex !== -1 
                            ? messages.slice(msgIndex + 1).find(m => m.type === 'action' && m.actionType && m.actionType.startsWith('tour_'))
                            : null;

                          const isConfirmed = tourDetails.status === 'confirmed';
                          const isDeclined = tourDetails.status === 'declined';
                          const isCounter = tourDetails.type === 'tour_counter';
                          
                          const proposedByCurrent = tourDetails.proposedBy === currentUser.role;

                          let displayStatus = tourDetails.status;
                          let badgeColorClasses = 'bg-amber-50 text-amber-600 dark:bg-amber-950/25 dark:text-amber-400';

                          if (isConfirmed || (subsequentTourAction && subsequentTourAction.actionType === 'tour_confirmed')) {
                            displayStatus = 'confirmed';
                            badgeColorClasses = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400';
                          } else if (isDeclined || (subsequentTourAction && subsequentTourAction.actionType === 'tour_declined')) {
                            displayStatus = 'declined';
                            badgeColorClasses = 'bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400';
                          } else if (subsequentTourAction && subsequentTourAction.actionType === 'tour_counter') {
                            displayStatus = 'countered';
                            badgeColorClasses = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                          } else if (isStaleProposal) {
                            displayStatus = 'closed';
                            badgeColorClasses = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                          } else {
                            displayStatus = tourDetails.status;
                            badgeColorClasses = 'bg-amber-50 text-amber-600 dark:bg-amber-950/25 dark:text-amber-400';
                          }

                          return (
                            <div className={`w-full max-w-[345px] sm:max-w-sm border p-3.5 shadow-sm space-y-3 font-sans text-left font-normal transition-all ${
                              msg.senderId === currentUser.id
                                ? 'bg-indigo-50/15 dark:bg-slate-900/95 border-indigo-150/60 dark:border-indigo-900/40 rounded-[22px] rounded-br-[4px] shadow-indigo-500/5'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-[22px] rounded-bl-[4px] shadow-black/5'
                            }`}>
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${displayStatus === 'confirmed' ? 'text-emerald-500' : displayStatus === 'declined' ? 'text-rose-500' : 'text-indigo-500 dark:text-indigo-400'}`} />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-750 dark:text-slate-300 truncate">
                                    {displayStatus === 'confirmed' ? 'Tour Confirmed' : displayStatus === 'declined' ? 'Tour Declined' : isCounter ? 'Tour Counter-Proposal' : 'Tour Request'}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${badgeColorClasses}`}>
                                  {displayStatus}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] font-medium leading-none">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                <span className="font-semibold">{new Date(tourDetails.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
                                <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                <span className="font-semibold">{(() => {
                                  if (!tourDetails.time) return '';
                                  const [hh, mm] = tourDetails.time.split(':');
                                  const h = parseInt(hh, 10);
                                  const ampm = h >= 12 ? 'PM' : 'AM';
                                  const displayH = h % 12 || 12;
                                  return `${displayH}:${mm} ${ampm}`;
                                })()}</span>
                              </div>

                              {tourDetails.note && (
                                <div className="bg-indigo-50/5 dark:bg-indigo-950/5 p-2 border-l-2 border-indigo-400 dark:border-indigo-600 text-[11px] text-left font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                                  <span className="font-semibold text-[9px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-0.5">Note from sender</span>
                                  <p className="italic font-sans">"{tourDetails.note}"</p>
                                </div>
                              )}

                              {/* Action Options */}
                              {tourDetails.status === 'pending' && !isStaleProposal && (
                                <div className="pt-1 text-left font-normal">
                                  {proposedByCurrent ? (
                                    <div className="text-center py-1.5 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                                      Waiting for response...
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <button 
                                          onClick={() => handleConfirmTour(tourDetails.date, tourDetails.time, tourDetails.note)}
                                          disabled={isSending}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider rounded-xl shadow-xs transition-colors flex-1 cursor-pointer"
                                        >
                                          Accept
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setCounterFormMsgId(msg.id);
                                            setCounterDate(tourDetails.date || '');
                                            setCounterTime(tourDetails.time || '');
                                            setCounterNote('');
                                          }}
                                          disabled={isSending}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[9px] sm:text-[10px] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold uppercase tracking-wider rounded-xl transition-colors flex-1 cursor-pointer"
                                        >
                                          Counter
                                        </button>
                                        <button 
                                          onClick={() => handleDeclineTour()}
                                          disabled={isSending}
                                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:hover:bg-rose-900/30 text-[9px] sm:text-[10px] text-rose-600 font-extrabold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                        >
                                          Decline
                                        </button>
                                      </div>

                                      {/* Counter Proposal Form Inline */}
                                      {counterFormMsgId === msg.id && (
                                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 space-y-2.5 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-850/40">
                                          <p className="text-[9px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 font-sans">Propose Counter Time</p>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[8.5px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-0.5 block">New Date</label>
                                              <input 
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={counterDate}
                                                onChange={(e) => setCounterDate(e.target.value)}
                                                className="w-full text-[10.5px] p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-550 font-semibold text-slate-800 dark:text-slate-100"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[8.5px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-0.5 block">New Time</label>
                                              <input 
                                                type="time"
                                                value={counterTime}
                                                onChange={(e) => setCounterTime(e.target.value)}
                                                className="w-full text-[10.5px] p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-550 font-semibold text-slate-800 dark:text-slate-100"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[8.5px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-0.5 block">Note</label>
                                            <textarea
                                              placeholder="Why counters? Leave preferences..."
                                              value={counterNote}
                                              onChange={(e) => setCounterNote(e.target.value)}
                                              className="w-full text-[10.5px] p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-550 text-slate-800 dark:text-slate-100 focus:outline-none"
                                              rows={2}
                                            />
                                          </div>
                                          <div className="flex items-center gap-1.5 justify-end">
                                            <button 
                                              type="button"
                                              onClick={() => setCounterFormMsgId(null)}
                                              className="px-2 py-1 rounded-lg text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80 uppercase tracking-widest cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => handleSendCounterProposal()}
                                              disabled={!counterDate || !counterTime}
                                              className="px-3 py-1 rounded-lg text-[9px] font-extrabold bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm uppercase tracking-widest disabled:opacity-50 cursor-pointer"
                                            >
                                              Submit
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {tourDetails.status === 'confirmed' && (
                                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                  <a
                                    href={getGoogleCalendarUrl(tourDetails.date, tourDetails.time, listing.title, listing.location)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-all rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex-1 text-center cursor-pointer"
                                  >
                                    <CalendarPlus className="w-3.5 h-3.5" /> Google Calendar
                                  </a>
                                  <button
                                    onClick={() => downloadIcsFile(tourDetails.date, tourDetails.time, listing.title, listing.location)}
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 transition-all rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex-1 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" /> iCal (.ics)
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                                         // Standard fall-through action message formatting
                        let displayLabel = msg.content;
                        if (msg.actionType === 'contract_sent') {
                          displayLabel = currentUser.role === 'agent' 
                            ? 'Lease contract sent. Awaiting review...' 
                            : 'Contract sent. Please review & sign.';
                        } else if (msg.actionType === 'escrow_locked' || msg.actionType === 'paid') {
                          displayLabel = currentUser.role === 'tenant'
                            ? 'Deposit successfully paid & locked in escrow.'
                            : 'Deposit locked in escrow. Safe to finalize handoff.';
                        } else if (msg.actionType === 'completed') {
                          displayLabel = 'Lease finalized & keys handed over successfully!';
                        }

                        return (
                          <div className="bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-150/45 dark:border-indigo-900/40 px-4 py-2 rounded-full text-[11px] font-sans font-medium text-slate-705 dark:text-slate-300 flex items-center justify-center gap-2 max-w-[95%] sm:max-w-[80%] shadow-xs animate-fade-in">
                            {msg.actionType === 'paid' || msg.actionType === 'escrow_locked' ? (
                              <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            )}
                            <span className="truncate">{displayLabel}</span>
                          </div>
                        );
                      })()
                    ) : msg.type === 'audio' ? (
                      <div className="flex flex-col gap-1">
                        <AudioPlayer src={msg.content} isOwn={msg.senderId === currentUser.id} />
                      </div>
                    ) : msg.type === 'document' ? (
                      <div className={`flex flex-col gap-1 max-w-[85%] ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`flex items-start gap-3 p-3.5 rounded-[22px] text-[13px] sm:text-sm shadow-sm transition-colors border font-sans tracking-tight leading-normal ${
                            msg.senderId === currentUser.id 
                              ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-none shadow-indigo-500/10' 
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-bl-none shadow-black/5'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            msg.senderId === currentUser.id 
                              ? 'bg-indigo-700/50 text-indigo-100' 
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500'
                          }`}>
                            <FileText className="w-5 h-5 pointer-events-none" />
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-bold text-[12px] sm:text-[13px] truncate leading-tight pr-4">
                              {msg.fileName || 'document.pdf'}
                            </p>
                            <p className={`text-[9.5px] mt-0.5 uppercase tracking-wider font-extrabold ${
                              msg.senderId === currentUser.id ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {msg.fileSize || 'Unknown Size'} • Tenancy Agreement
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <a 
                                href={msg.content} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all shadow-sm ${
                                  msg.senderId === currentUser.id
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/80'
                                }`}
                              >
                                {msg.content?.startsWith('data:') ? 'Download' : 'View Document'}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`max-w-[85%] px-4 py-2.5 rounded-[22px] text-[13px] sm:text-sm shadow-sm transition-colors font-sans tracking-tight ${
                          msg.senderId === currentUser.id 
                            ? 'bg-blue-500 text-white rounded-br-none shadow-blue-500/10' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-black/5'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {realtimeListingStatus === 'suspended' || (currentUser as any)?.isSuspended || otherUser?.isSuspended ? (
              <div className="p-4 border-t border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/5 transition-colors text-center font-sans">
                <div className="max-w-md mx-auto py-2 flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Conversation Suspended</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                    {(currentUser as any)?.isSuspended
                      ? "Your account is currently suspended. Messages and inquiries inside this conversation are paused."
                      : otherUser?.isSuspended
                        ? "This account has been suspended. No further messages can be sent or received."
                        : "This Listing is currently suspended. Messages and inquiries inside this conversation are paused."}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <AnimatePresence>
                  {isTourFormOpen && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.98 }}
                      className="mb-3.5 p-4 bg-indigo-50/50 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl shadow-sm space-y-3.5 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="w-4 h-4 text-indigo-500" />
                          <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Schedule Property Tour</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsTourFormOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Preferred Date</label>
                          <input 
                            type="date" 
                            value={tourDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setTourDate(e.target.value)}
                            required
                            className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Preferred Time</label>
                          <input 
                            type="time" 
                            value={tourTime}
                            onChange={(e) => setTourTime(e.target.value)}
                            required
                            className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Optional Note to Agent</label>
                        <textarea 
                          placeholder="Introduce yourself or state any preferred visual slots..." 
                          value={tourNote}
                          onChange={(e) => setTourNote(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button 
                          type="button"
                          onClick={() => setIsTourFormOpen(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          onClick={handleRequestTour}
                          disabled={!tourDate || !tourTime || isSending}
                          className="px-4 py-2 rounded-lg text-xs font-black bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isSending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Send Tour Proposal
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative group flex items-center gap-3">
                  <div className="relative flex-1">
                    {isRecording ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="w-full flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 sm:py-2.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm"
                      >
                        <div className="flex items-center gap-2 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                          <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 tabular-nums shrink-0 tracking-widest">
                            {Math.floor(recordingTime / 60)}:{Math.floor(recordingTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center gap-[3px] h-10 overflow-hidden">
                          {visualizerLevels.map((lvl, i) => (
                            <motion.div 
                              key={`bar-${i}`}
                            initial={{ height: 2 }}
                            animate={{ height: lvl }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`w-[3px] rounded-full shrink-0 ${
                              i % 2 === 0 ? 'bg-rose-400 dark:bg-rose-50' : 'bg-rose-300 dark:bg-rose-200'
                            }`}
                          />
                        ))}
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: -10 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => stopRecording(true)}
                        className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Message..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-[24px] text-[13px] sm:text-sm outline-none focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white font-sans tracking-tight"
                      disabled={isSending}
                    />
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSendDocument(file);
                      }
                      e.target.value = ''; // Reset
                    }} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.jpg,.png,.jpeg" 
                  />
                  <AnimatePresence mode="wait">
                    {!isRecording ? (
                      <div className="flex items-center gap-1">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()} 
                          className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                          title="Attach document/contract"
                          disabled={isSending}
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={startRecording} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                          <Mic className="w-5 h-5" />
                        </button>
                        <button 
                          type="submit" 
                          disabled={!newMessage.trim() || isSending}
                          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all disabled:opacity-50 disabled:grayscale shadow-sm"
                        >
                          <ChevronRight className="w-5 h-5 stroke-[3px]" />
                        </button>
                      </div>
                    ) : (
                      <motion.button 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => stopRecording(false)}
                        className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-sm"
                      >
                        <ChevronRight className="w-5 h-5 stroke-[3px]" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// End of file
