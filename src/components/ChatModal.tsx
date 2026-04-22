import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Loader2, MessageSquare, ShieldCheck, Paperclip, Mic, Smile, FileText, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
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
  updateDoc
} from 'firebase/firestore';
import { Listing, User as AppUser } from '../types';
import { useAuth } from '../context/AuthContext';

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

    setIsLoading(true);
    setError(null);

    // Sync Conversation Status
    const convRef = doc(db, 'conversations', conversationId);
    const unsubConv = onSnapshot(convRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setConvStatus(data.status || 'inquiry');
        setConvData(data);
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
        updatedAt: serverTimestamp()
      });

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
        await setDoc(convRef, {
          id: conversationId,
          tenantId: currentUser.id,
          agentId: agentId,
          listingId: listing.id.toString(),
          tenantName: currentUser.name,
          agentName: listing.agent?.name || 'Agent',
          listingTitle: listing.title,
          listingImage: listing.image,
          listingPrice: listing.price,
          status: 'inquiry',
          updatedAt: serverTimestamp(),
          lastMessage: newMessage.trim()
        });
      } else {
        await setDoc(convRef, {
          lastMessage: newMessage.trim(),
          updatedAt: serverTimestamp()
        }, { merge: true });
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
            className="relative w-full max-w-lg bg-white rounded-t-xl sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[650px] max-h-[95vh] overflow-hidden m-0 sm:m-4 pointer-events-auto"
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <button 
                onClick={() => {
                  if (listing.agent?.id) {
                    onClose();
                    setSelectedAgentId(listing.agent.id);
                  }
                }}
                className="flex items-center gap-2.5 sm:gap-3 hover:opacity-75 transition-opacity text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold border border-primary-100 uppercase text-xs sm:text-base">
                  {listing.agent?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-none mb-1 truncate max-w-[120px] sm:max-w-none">{listing.agent?.name}</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active</p>
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Property Reference Banner */}
            <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sm:gap-3 shrink-0">
              <img 
                src={listing.image} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-slate-200" 
                referrerPolicy="no-referrer"
                alt={listing.title}
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">Inquiry</p>
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-700 truncate">{listing.title}</h4>
              </div>
              <div className="bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                <p className="text-[10px] font-bold text-primary-600">{listing.price}</p>
              </div>
            </div>

            {/* Transaction Action Prompts */}
            <AnimatePresence>
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-white border-b border-slate-100 overflow-x-auto shrink-0 scrollbar-hide"
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
                          className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-primary-100 transition-colors border border-primary-100 shadow-sm"
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
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
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
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-slate-100 transition-colors border border-slate-200">
                    Negotiate Rent
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/30 space-y-3 sm:space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold text-center uppercase tracking-wide">
                  {error}
                </div>
              )}
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Securing Connection</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 text-primary-200">
                    <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">No conversation history</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 max-w-[220px]">
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
                      <div className="bg-white border border-slate-200 py-2 sm:py-3 px-4 sm:px-5 rounded-2xl shadow-sm flex flex-col items-center text-center max-w-[90%] sm:max-w-[80%]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-50 flex items-center justify-center mb-2 sm:mb-3 text-primary-600">
                          {msg.actionType === 'paid' ? <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-800 mb-0.5 leading-tight uppercase tracking-wide">Transaction Step</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 italic">"{msg.content}"</p>
                      </div>
                    ) : (
                      <div 
                        className={`max-w-[85%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[13px] sm:text-sm shadow-sm ${
                          msg.senderId === currentUser.id 
                            ? 'bg-primary-600 text-white rounded-br-none shadow-primary-200' 
                            : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
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
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="relative group flex items-center gap-2">
                <button type="button" className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="relative flex-1">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-slate-100/80 border-2 border-transparent px-4 py-2.5 sm:py-3.5 pr-10 rounded-lg text-[13px] sm:text-sm outline-none focus:bg-white focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all placeholder:text-slate-400"
                    disabled={isSending}
                  />
                  <button type="button" className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-warning-500 transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {newMessage.trim() === '' && !isSending ? (
                      <motion.button 
                        key="mic"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        type="button"
                        className="hidden sm:flex w-11 h-11 rounded-xl items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                      >
                        <Mic className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button 
                        key="send"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center transition-all ${
                          newMessage.trim() && !isSending 
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/40' 
                            : 'bg-slate-100 text-slate-300'
                        }`}
                      >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 px-1 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1.5 opacity-60">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">E2E Encryption</span>
                </div>
                <div className="bg-slate-50 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tighter shadow-inner pulse-subtle">
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
