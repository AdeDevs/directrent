import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Loader2, MessageSquare, ShieldCheck, Paperclip, Mic, FileText, CreditCard, ChevronRight, CheckCircle2, ArrowRight, MessageCircle, Play, Pause, Volume2, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
  updateDoc,
  increment
} from 'firebase/firestore';
import { Listing, User as AppUser, VerificationLevel, UserRole } from '../types';
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

type ConversationStatus = 'inquiry' | 'negotiating' | 'contract_requested' | 'contract_sent' | 'paid' | 'completed';

interface Message {
  id: string;
  content: string;
  senderId: string;
  tenantId: string;
  agentId: string;
  type?: 'text' | 'action' | 'audio';
  duration?: number; // Optional duration for audio
  actionType?: string;
  createdAt: any;
}

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
  const { setSelectedAgentId } = useAuth();
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
  const [convStatus, setConvStatus] = useState<ConversationStatus>('inquiry');
  const [convData, setConvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWhatsAppDisclaimer, setShowWhatsAppDisclaimer] = useState(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);
  const [otherUser, setOtherUser] = useState<{ name: string; avatarUrl?: string; verificationLevel?: VerificationLevel; role: UserRole; phoneNumber?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                phoneNumber: d.phoneNumber
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

      // If completing, increment agent's success count
      if (nextStatus === 'completed' && agentId !== 'unknown') {
        const agentDocRef = doc(db, 'users', agentId);
        await updateDoc(agentDocRef, {
          completedTxns: increment(1),
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${agentId}`));
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

  const handleWhatsAppTransition = () => {
    const phoneNumber = otherUser?.phoneNumber || convData?.agentPhone;
    if (!phoneNumber) {
      setError("Agent's contact number is not available yet.");
      return;
    }
    setShowWhatsAppDisclaimer(true);
  };

  const confirmWhatsApp = () => {
    const phoneNumber = otherUser?.phoneNumber || convData?.agentPhone;
    if (!phoneNumber) return;

    // Clean phone number: remove non-digits, ensure 234 prefix for Nigeria if needed
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('234')) {
      cleanPhone = '234' + cleanPhone;
    }

    const message = encodeURIComponent(`Hi, I'm interested in your listing: ${listing.title} on DirectRent. Listing Ref: ${listing.id}`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    setShowWhatsAppDisclaimer(false);
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
    setIsSending(true);
    setError(null);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const tenantId = convData?.tenantId || (currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0]);
      const agentId = listing.agent?.id || 'unknown';

      // Send as message directly to Firestore (embedded)
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: base64Data,
        senderId: currentUser.id,
        tenantId: tenantId,
        agentId: agentId,
        type: 'audio',
        createdAt: serverTimestamp()
      });
      
      // Update conv metadata for audio
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: "Audio message",
        updatedAt: serverTimestamp(),
        [currentUser.role === 'tenant' ? 'unreadCount_agent' : 'unreadCount_tenant']: increment(1)
      });

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
      
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        content: newMessage.trim(),
        senderId: currentUser.id,
        tenantId: tenantId, 
        agentId: agentId,
        type: 'text',
        createdAt: serverTimestamp()
      });

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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[650px] max-h-[95vh] overflow-hidden m-0 sm:m-4 pointer-events-auto border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 transition-all duration-300"
          >
            {/* WhatsApp Disclaimer Modal */}
            <AnimatePresence>
              {showWhatsAppDisclaimer && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowWhatsAppDisclaimer(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[320px] bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">Security Notice</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center mb-6 leading-relaxed">
                      Finalizing terms on WhatsApp? Note that DirectRent can only protect transactions processed through this app.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={confirmWhatsApp}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20"
                      >
                        Connect on WhatsApp
                      </button>
                      <button 
                        onClick={() => setShowWhatsAppDisclaimer(false)}
                        className="w-full py-3 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest"
                      >
                        Keep it Secure
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            {/* Header */}
            <div className="px-4 py-4 border-b border-slate-105 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 shadow-sm">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold border border-slate-150/60 dark:border-slate-700 overflow-hidden shrink-0 uppercase text-sm relative shadow-inner">
                  {otherUser?.avatarUrl ? (
                    <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    (otherUser?.name || listing.agent?.name || 'A').charAt(0)
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate tracking-tight">
                      {otherUser?.name || listing.agent?.name}
                    </h3>
                    {otherUser?.verificationLevel && (
                      <VerificationBadge level={otherUser.verificationLevel} role={otherUser.role} showText={false} className="scale-90" />
                    )}
                  </div>
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
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-150 dark:border-slate-800 relative group/ref">
                <SafeImage 
                  src={listing.image} 
                  className="w-full h-full object-cover transition-transform group-hover/ref:scale-105 duration-300" 
                  alt={listing.title}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Referenced Rental</p>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate tracking-tight">{listing.title}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-150/60 dark:border-slate-800/80 shrink-0 shadow-sm">
                <p className="text-xs font-black text-primary-600 dark:text-primary-450">{listing.price}</p>
              </div>
            </div>

            {/* Transaction Action Prompts */}
            <AnimatePresence>
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 scrollbar-hide"
              >
                <div className="p-3 flex items-center gap-2 min-w-max">
                  {currentUser.role === 'tenant' && (
                    <AnimatePresence mode="popLayout">
                      {(convStatus === 'inquiry' || convStatus === 'negotiating') && (
                        <motion.div 
                          key="tenant-actions"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.button 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            key="request_contract"
                            onClick={() => handleAction('contract_requested', 'I\'d like to request a formal contract for this property.', 'contract_requested')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100 dark:border-primary-800 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" /> Request Contract
                          </motion.button>
                          
                        </motion.div>
                      )}
                      {convStatus === 'contract_sent' && (
                        <motion.button 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          key="pay_deposit"
                          onClick={() => handleAction('paid', 'Payment of security deposit has been initiated.', 'paid')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-100 dark:border-emerald-800 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay Deposit
                        </motion.button>
                      )}
                    </AnimatePresence>
                  )}

                  {currentUser.role === 'agent' && (
                    <AnimatePresence mode="popLayout">
                      {convStatus === 'contract_requested' && (
                        <motion.button 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          key="send_contract"
                          onClick={() => handleAction('contract_sent', 'I have prepared and sent the draft contract for your review.', 'contract_sent')}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                        >
                          <FileText className="w-3.5 h-3.5" /> Send Contract
                        </motion.button>
                      )}
                      {convStatus === 'paid' && (
                        <motion.button 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          key="close_txn"
                          onClick={() => handleAction('completed', 'Transaction completed successfully. Welcome to your new home!', 'completed')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Close Transaction
                        </motion.button>
                      )}
                    </AnimatePresence>
                  )}
                  
                  <button 
                    onClick={() => {/* Custom Negotiation Logic */}}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Negotiate Rent
                  </button>

                  <button 
                    onClick={handleWhatsAppTransition}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors border border-emerald-100 dark:border-emerald-800/50"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Continue on WhatsApp
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

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
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/30 dark:bg-slate-950/30 space-y-3 sm:space-y-4">
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
                    className={`flex ${msg.type === 'action' ? 'justify-center my-4 sm:my-6' : msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'action' ? (
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-500/20 py-2 sm:py-3 px-4 sm:px-5 rounded-2xl shadow-sm flex flex-col items-center text-center max-w-[95%] sm:max-w-[80%] backdrop-blur-sm">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-2 sm:mb-3 text-indigo-600 dark:text-indigo-400 shadow-sm">
                          {msg.actionType === 'paid' ? <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <p className="text-[10px] sm:text-xs font-display font-black text-indigo-600 dark:text-indigo-400 mb-0.5 leading-tight uppercase tracking-[0.2em]">Update</p>
                        <p className="text-[11px] sm:text-xs font-sans text-slate-800 dark:text-slate-200 font-medium leading-relaxed">"{msg.content}"</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-display font-black uppercase tracking-widest">Verified Property Block</p>
                      </div>
                    ) : msg.type === 'audio' ? (
                      <div className="flex flex-col gap-1">
                        <AudioPlayer src={msg.content} isOwn={msg.senderId === currentUser.id} />
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
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
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
                  <AnimatePresence mode="wait">
                    {!isRecording ? (
                      <div className="flex items-center gap-1">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// End of file
