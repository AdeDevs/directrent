import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Loader2, MessageSquare, ShieldCheck, Paperclip, Mic, Smile, FileText, CreditCard, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
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
import { Listing, User as AppUser, VerificationLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from './VerificationBadge';
import { createNotification } from '../lib/notifications';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  currentUser: AppUser;
  overrideConversationId?: string;
}

type ConversationStatus = 'inquiry' | 'negotiating' | 'contract_requested' | 'contract_sent' | 'paid' | 'completed';

import { calculateVerificationLevel } from '../lib/verification';

interface Message {
  id: string;
  content: string;
  senderId: string;
  tenantId: string;
  agentId: string;
  type?: 'text' | 'action';
  actionType?: string;
  createdAt: any;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, listing, currentUser, overrideConversationId }) => {
  const { setSelectedAgentId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [convStatus, setConvStatus] = useState<ConversationStatus>('inquiry');
  const [convData, setConvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{ name: string; avatarUrl?: string; verificationLevel?: VerificationLevel; role: string } | null>(null);
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
            });
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
                role: d.role
              });
            }
          });
        }
      }
    });

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    // For listing messages, we filtering where we are a participant
    const fieldToFilter = currentUser.role === 'tenant' ? 'tenantId' : 'agentId';
    const q = query(
      messagesRef, 
      where(fieldToFilter, '==', currentUser.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setIsLoading(false);
      
      // Auto scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Chat listener error:", err);
      if (err.code === 'permission-denied') {
        setError("Missing permissions. Please ensure your session is active.");
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
      });

      // If completing, increment agent's success count
      if (nextStatus === 'completed' && agentId !== 'unknown') {
        const agentDocRef = doc(db, 'users', agentId);
        await updateDoc(agentDocRef, {
          completedTxns: increment(1),
          updatedAt: serverTimestamp()
        }).catch(e => console.warn("Could not increment agent completedTxns:", e));
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
      });

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
      const tenantId = currentUser.role === 'tenant' ? currentUser.id : conversationId.split('_')[0];
      
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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[650px] max-h-[95vh] overflow-hidden m-0 sm:m-4 pointer-events-auto"
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 uppercase text-xs sm:text-base scale-110">
                  {otherUser?.avatarUrl ? (
                    <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    (otherUser?.name || listing.agent?.name || 'A').charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-none truncate max-w-[120px] sm:max-w-none tracking-tight">
                      {otherUser?.name || listing.agent?.name}
                    </h3>
                    {otherUser?.verificationLevel && (
                      <VerificationBadge level={otherUser.verificationLevel} showText={false} className="px-1 py-0.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Property Reference Banner */}
            <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 sm:gap-3 shrink-0">
              <img 
                src={listing.image} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800" 
                referrerPolicy="no-referrer"
                alt={listing.title}
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[9px] font-display font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Inquiry</p>
                <h4 className="text-[10px] sm:text-xs font-display font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">{listing.title}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400">{listing.price}</p>
              </div>
            </div>

            {/* Transaction Action Prompts */}
            <AnimatePresence>
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0 scrollbar-hide"
              >
                <div className="p-3 flex items-center gap-2 min-w-max">
                  {currentUser.role === 'tenant' && (
                    <AnimatePresence mode="popLayout">
                      {(convStatus === 'inquiry' || convStatus === 'negotiating') && (
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
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                    Negotiate Rent
                  </button>
                </div>
              </motion.div>
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
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 text-primary-200 dark:text-primary-800">
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
                    ) : (
                      <div 
                        className={`max-w-[85%] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[13px] sm:text-sm shadow-sm transition-colors font-sans tracking-tight ${
                          msg.senderId === currentUser.id 
                            ? 'bg-primary-600 text-white rounded-br-none shadow-primary-500/20' 
                            : 'bg-white dark:bg-slate-200 text-slate-900 border border-slate-100 dark:border-slate-300 rounded-bl-none'
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
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="relative group flex items-center gap-2">
                <button type="button" className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-all flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="relative flex-1">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-slate-100/80 dark:bg-slate-800 border-2 border-transparent px-4 py-2.5 sm:py-3.5 pr-10 rounded-lg text-[13px] sm:text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 dark:focus:ring-primary-900/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white font-sans tracking-tight"
                    disabled={isSending}
                  />
                  <button type="button" className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-warning-500 transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {newMessage.trim() === "" && !isSending ? (
                      <motion.button 
                        key="mic"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="w-11 h-11 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all rounded-xl"
                      >
                        <Mic className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button 
                        key="send-button"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all relative overflow-hidden shadow-lg ${
                          newMessage.trim() && !isSending 
                            ? 'bg-primary-600 text-white shadow-primary-500/20 active:shadow-none' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700'
                        }`}
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ArrowRight 
                            className={`w-5 h-5 transition-all duration-300 ${newMessage.trim() ? 'stroke-[3px]' : 'opacity-40'}`} 
                          />
                        )}
                        {newMessage.trim() && !isSending && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/send:translate-x-full transition-transform duration-1000 pointer-events-none" />
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 px-1 border-t border-slate-50 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-1.5 opacity-60">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
                  <span className="text-[9px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-tight">E2E Encryption</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 dark:text-slate-700 uppercase tracking-tighter shadow-inner pulse-subtle">
                  Live Transaction Tracking
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

export default ChatModal;
