'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, addDoc, collection, query, where, orderBy, getDocs, setDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from 'react-hot-toast';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isForm?: boolean;
  timestamp: string;
  formData?: {
    fields: {
      name: string;
      phone: string;
    };
    submitted?: boolean;
  };
}

interface PageProps {
  params: {
    botId: string;
  };
  previewConfig?: ChatbotData;
  isPreview?: boolean;
  containerClassName?: string;
}

interface Chatbot {
  config: {
    behaviourPrompt: string;
    taskPrompt: string;
    name: string;
    welcomeMessage: string;
    backgroundColor: string;
    botTextColor: string;
    botMessageBg: string;
    userTextColor: string;
    userMessageBg: string;
  };
  trainingData: {
    content: string;
  };
}

interface ConversationState {
  hasName: boolean;
  hasPhone: boolean;
  askedAboutService: boolean;
  customerName: string | null;
  customerPhone: string | null;
  lastResponse: string;
}

interface ChatbotData {
  userId: string;
  config: {
    name: string;
    welcomeMessage: string;
    primaryColor: string;
    backgroundColor: string;
    botTextColor: string;
    botMessageBg: string;
    userTextColor: string;
    userMessageBg: string;
    behaviourPrompt: string;
    taskPrompt: string;
    botIconColor?: string;
    inputFieldBg?: string;
    inputTextColor?: string;
    buttonColor?: string;
    avatar?: string;
  };
  training?: {
    type: 'file' | 'url';
    content: string;
    sources: {
      urls?: string[];
      file?: { name: string; content: string; type: string; } | null;
    };
    products?: Array<{
        name: string;
      price: string;
      description: string;
    }>;
  };
}

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

// Add default config
const DEFAULT_CONFIG: ChatbotData['config'] = {
  name: 'Chat Assistant',
  welcomeMessage: 'Hello! How can I help you today?',
  primaryColor: '#2563eb',
  backgroundColor: '#0a0a0a',
  botTextColor: '#ffffff',
  botMessageBg: '#1e293b',
  userTextColor: '#ffffff',
  userMessageBg: '#2563eb',
  behaviourPrompt: '',
  taskPrompt: '',
  botIconColor: '#4f46e5',
  inputFieldBg: '#1e293b',
  inputTextColor: '#fff'
};

interface ChatContext {
  websiteInfo: string;
  trainingRules: string;
  systemContext: string | null;
  initializedKnowledge: string;
}

// Add these helper functions at the top
const generateDeviceId = () => {
  if (typeof window === 'undefined') return 'default-device-id';
  
  const platform = window.navigator.platform;
  const userAgent = window.navigator.userAgent;
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  return btoa(`${platform}-${userAgent}-${screenSize}`).slice(0, 32);
};

const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return 'default-session-id';
  
  const existingId = localStorage.getItem('chatSessionId');
  if (existingId) return existingId;

  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('chatSessionId', newId);
  return newId;
};

// Add these helper functions at the top
const extractCustomerInfo = (messages: Message[]) => {
  let customerName = '';
  let customerPhone = '';
  
  // Join last few messages to analyze context
  const conversationText = messages.slice(-5).map(m => m.content.toLowerCase()).join(' ');
  
  // Smart name extraction
  const namePatterns = [
    /(?:i am|i'm|name is|call me) ([a-zA-Z\s]+)/i,
    /^([a-zA-Z\s]+)$/i, // Single word responses after asking for name
    /([a-zA-Z]+)\s+([a-zA-Z]+)/, // First and last name pattern
  ];

  // Smart phone extraction
  const phonePatterns = [
    /\+?([0-9\s-]{8,})/g, // International format
    /(\d{3,}[\s-]?\d{3,}[\s-]?\d{3,})/g, // General number pattern
    /(?:phone|number|contact|tel)[:\s]+([0-9\s-+]{8,})/i, // Labeled phone numbers
  ];

  for (const pattern of namePatterns) {
    const match = conversationText.match(pattern);
    if (match && match[1]) {
      customerName = match[1].trim();
      break;
    }
  }

  for (const pattern of phonePatterns) {
    const match = conversationText.match(pattern);
    if (match && match[1]) {
      customerPhone = match[1].replace(/[\s-]/g, '');
      break;
    }
  }

  return { customerName, customerPhone };
};

// Add this function to detect service interest
const detectServiceInterest = (messages: Message[]) => {
  const conversationText = messages.slice(-5).map(m => m.content.toLowerCase()).join(' ');
  
  const services = {
    seo: ['seo', 'search engine', 'ranking', 'google ranking'],
    webdev: ['website', 'web development', 'web design'],
    marketing: ['marketing', 'advertising', 'promotion'],
    // Add other services
  };

  for (const [service, keywords] of Object.entries(services)) {
    if (keywords.some(keyword => conversationText.includes(keyword))) {
      return service;
    }
  }

  return null;
};

// Add retry utility at the top
const retryOperation = async (operation: () => Promise<any>, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Add at the top with other constants
const CORE_RULES = `
Core Rules:
1. Only use information from the knowledge base
2. Never make up information
3. For pricing/services:
   - Quote exact details from knowledge base
   - If unavailable, offer to connect with the team
4. Keep responses human-like and warm
5. Stay focused on helping the customer
6. Never mention being a bot or AI
`;

// Add these SVG components at the top
const BotIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M14 2C14 2.74028 13.5978 3.38663 13 3.73244V4H20C21.6569 4 23 5.34315 23 7V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V7C1 5.34315 2.34315 4 4 4H11V3.73244C10.4022 3.38663 10 2.74028 10 2C10 0.895431 10.8954 0 12 0C13.1046 0 14 0.895431 14 2ZM4 6H11H13H20C20.5523 6 21 6.44772 21 7V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V7C3 6.44772 3.44772 6 4 6ZM15 11.5C15 10.6716 15.6716 10 16.5 10C17.3284 10 18 10.6716 18 11.5C18 12.3284 17.3284 13 16.5 13C15.6716 13 15 12.3284 15 11.5ZM16.5 8C14.567 8 13 9.567 13 11.5C13 13.433 14.567 15 16.5 15C18.433 15 20 13.433 20 11.5C20 9.567 18.433 8 16.5 8ZM7.5 10C6.67157 10 6 10.6716 6 11.5C6 12.3284 6.67157 13 7.5 13C8.32843 13 9 12.3284 9 11.5C9 10.6716 8.32843 10 7.5 10ZM4 11.5C4 9.567 5.567 8 7.5 8C9.433 8 11 9.567 11 11.5C11 13.433 9.433 15 7.5 15C5.567 15 4 13.433 4 11.5ZM10.8944 16.5528C10.6474 16.0588 10.0468 15.8586 9.55279 16.1056C9.05881 16.3526 8.85858 16.9532 9.10557 17.4472C9.68052 18.5971 10.9822 19 12 19C13.0178 19 14.3195 18.5971 14.8944 17.4472C15.1414 16.9532 14.9412 16.3526 14.4472 16.1056C13.9532 15.8586 13.3526 16.0588 13.1056 16.5528C13.0139 16.7362 12.6488 17 12 17C11.3512 17 10.9861 16.7362 10.8944 16.5528Z" fill="currentColor"/>
  </svg>
);

const UserIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// First define the interface outside
interface ChatMetadata {
  customerName: string | null;
  customerPhone: string | null;
  hasReservation: boolean;
  reservationId: string | null;
  customerInfo: {
    name: string | null;
    phone: string | null;
    service: string | null;
    requestedDate: string | null;
  };
}

// TypingIndicator component with new animation
const TypingIndicator = ({ chatbot }: { chatbot: ChatbotData }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: chatbot.config.botMessageBg }}>
      <BotIcon className="w-5 h-5 m-1.5" style={{ color: chatbot.config.botTextColor }} />
    </div>
    <div className="rounded-2xl px-4 py-2.5 max-w-[80%]"
         style={{ backgroundColor: chatbot.config.botMessageBg }}>
      <div className="flex gap-1">
        <div 
          className="w-2 h-2 rounded-full animate-[bounce_1s_infinite]" 
          style={{ backgroundColor: chatbot.config.botTextColor }} 
        />
        <div 
          className="w-2 h-2 rounded-full animate-[bounce_1s_infinite_0.2s]" 
          style={{ backgroundColor: chatbot.config.botTextColor }} 
        />
        <div 
          className="w-2 h-2 rounded-full animate-[bounce_1s_infinite_0.4s]" 
          style={{ backgroundColor: chatbot.config.botTextColor }} 
        />
      </div>
    </div>
  </div>
);

// Add this interface at the top
interface ConversationSummary {
  customerName: string | null;
  customerPhone: string | null;
  interestedService: string | null;
  interestLevel: 'high' | 'medium' | 'low';
  summary: string;
  nextSteps: string;
  keyPoints: string[];
  potentialRevenue: 'high' | 'medium' | 'low';
  followUpPriority: 'high' | 'medium' | 'low';
  recommendedActions: string[];
}

// Add this function to analyze the conversation
const analyzeConversation = async (messages: Message[]) => {
  try {
    // Format messages for analysis
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create a structured prompt for analysis
    const analysisPrompt = `
      Analyze this conversation and return a JSON object with this exact structure (no markdown, no code blocks, just the JSON):
      {
        "summary": "brief summary of the conversation",
        "nextSteps": "recommended next steps",
        "interestedService": "identified service or 'General Inquiry'",
        "interestLevel": "high/medium/low",
        "keyPoints": ["key point 1", "key point 2"],
        "potentialRevenue": "high/medium/low",
        "followUpPriority": "high/medium/low",
        "recommendedActions": ["action 1", "action 2"]
      }

      Conversation to analyze:
      ${conversationText}

      Remember: Return only the JSON object, no markdown formatting or code blocks.
    `;

    // Get AI response
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    
    try {
      // Clean and parse the response
      const cleanedResponse = response.text()
        .replace(/```json\n?|\n?```/g, '') // Remove any markdown code blocks
        .replace(/^[\s\n]*{/, '{')  // Clean start
        .replace(/}[\s\n]*$/, '}')  // Clean end
        .trim();

      const analysis = JSON.parse(cleanedResponse);
      
      // Return with guaranteed structure and default values
      return {
        summary: analysis.summary || "No summary available",
        nextSteps: analysis.nextSteps || "Follow up with customer",
        interestedService: analysis.interestedService || "General Inquiry",
        interestLevel: analysis.interestLevel || "medium",
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
        potentialRevenue: analysis.potentialRevenue || "medium",
        followUpPriority: analysis.followUpPriority || "medium",
        recommendedActions: Array.isArray(analysis.recommendedActions) ? analysis.recommendedActions : []
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return default values if parsing fails
      return {
        summary: "Conversation analysis unavailable",
        nextSteps: "Follow up with customer",
        interestedService: "General Inquiry",
        interestLevel: "medium",
        keyPoints: [],
        potentialRevenue: "medium",
        followUpPriority: "medium",
        recommendedActions: []
      };
    }
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    // Return default values if analysis fails
    return {
      summary: "Analysis failed",
      nextSteps: "Follow up with customer",
      interestedService: "General Inquiry",
      interestLevel: "medium",
      keyPoints: [],
      potentialRevenue: "medium",
      followUpPriority: "medium",
      recommendedActions: []
    };
  }
};

// Add new interface for user chat session
interface UserChatSession {
  userId: string;
  customerName: string;
  customerPhone: string;
  conversations: Message[];
  startedAt: string;
  lastActive: string;
}

// Add new interfaces
interface UserForm {
  name: string;
  countryCode: string;
  phone: string;
}

interface FormMessage extends Message {
  isForm?: boolean;
  formData?: {
    fields: {
      name: string;
      phone: string;
    };
    submitted?: boolean;
  };
}

// Add country codes interface
interface CountryCode {
  code: string;
}
const countryCodes: CountryCode[] = [
  { code: '+966' },
  { code: '+971' },
  { code: '+974' },
  { code: '+968' },
  { code: '+965' },
  { code: '+973' },
];

// Helper function to darken color
const darkenColor = (color: string): string => {
  const darkenAmount = 30; // Percentage to darken
  const rgb = color.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
  const darkened = rgb.map(c => Math.max(0, c - (c * darkenAmount / 100)));
  return `#${darkened.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
};

// Add at the top with other interfaces
interface BotConfig {
  // ... existing properties
  avatar?: string;
}

// Add this helper function at the top with other utilities
const isLightColor = (color: string) => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

export default function ChatbotPreview({ params, previewConfig, isPreview = false, containerClassName = '' }: PageProps): JSX.Element {
  // Move the state declarations inside the component
  const [metadata, setMetadata] = useState<ChatMetadata>({
    customerName: null,
    customerPhone: null,
    hasReservation: false,
    reservationId: null,
    customerInfo: {
      name: null,
      phone: null,
      service: null,
      requestedDate: null
    }
  });

  const [existingMessages, setExistingMessages] = useState<Message[]>([]);
  const [chatbot, setChatbot] = useState<ChatbotData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [conversationState, setConversationState] = useState<ConversationState>({
    hasName: false,
    hasPhone: false,
    askedAboutService: false,
    customerName: null,
    customerPhone: null,
    lastResponse: ''
  });
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(true);
  const [sessionId] = useState(getOrCreateSessionId);
  const [isAIInitialized, setIsAIInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userSession, setUserSession] = useState<UserChatSession | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'name' | 'phone' | 'chat' | null>(null);
  const [userForm, setUserForm] = useState<UserForm>({ 
    name: '', 
    countryCode: '+966',
    phone: '' 
  });
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const INACTIVITY_TIMEOUT = 10000; // 10 seconds in milliseconds
  const [botConfig, setBotConfig] = useState<BotConfig>({
    // ... other defaults
    avatar: '/avatars/avatar-1.png' // Add default avatar
  });

  // Check if we're in widget mode
  const isWidget = window.location.pathname.includes('/widget');

  useEffect(() => {
    setIsLoading(true);
    const initializeChat = async () => {
      if (isPreview && previewConfig) {
        // Only show welcome message initially
        const config = {
          ...DEFAULT_CONFIG,
          ...previewConfig.config
        };
        setChatbot({
          ...previewConfig,
          config
        });
        setMessages([
          { 
            role: 'assistant', 
            content: previewConfig.config.welcomeMessage || DEFAULT_CONFIG.welcomeMessage,
            timestamp: Date.now().toString()
          }
        ]);
        setIsInitialized(true);
        setIsAIInitialized(true);
        setIsLoading(false);
        return;
      }

      const docRef = doc(db, 'chatbots', params.botId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const botData = docSnap.data() as ChatbotData;
        setChatbot(botData);

        try {
          // Combine all training content
          const websiteContent = botData.training?.content || '';
          const productContent = botData.training?.products?.map(p => 
            `Product: ${p.name}\nPrice: ${p.price}\nDescription: ${p.description}`
          ).join('\n\n') || '';

          const fullKnowledge = `
            Company Knowledge Base:
            ${websiteContent}

            Products and Services:
            ${productContent}
          `;

          console.log('Initializing with knowledge:', fullKnowledge);

          // Initialize AI with full context
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const initialPrompt = `
            You are ${botData.config.name}.
            
            Your Behavior Instructions:
            ${botData.config.behaviourPrompt}
            
            Your Task Instructions:
            ${botData.config.taskPrompt}

            Your Knowledge Base (use this information to provide accurate responses):
            ${fullKnowledge}

            ${CORE_RULES}

            Reply with exactly "UNDERSTOOD" (in uppercase) if you comprehend these instructions.
          `;

          const result = await model.generateContent(initialPrompt);
          const response = result.response.text().trim().toUpperCase();
          
          if (response === 'UNDERSTOOD') {
            setChatContext({
              websiteInfo: websiteContent,
              trainingRules: `${botData.config.behaviourPrompt}\n${botData.config.taskPrompt}`,
              systemContext: 'initialized',
              initializedKnowledge: fullKnowledge
            });
            setIsAIInitialized(true);
            setIsInitialized(true);
            console.log('AI successfully initialized');
          } else {
            console.error('Unexpected AI response:', response);
            throw new Error('AI initialization failed - unexpected response');
          }
        } catch (error) {
          console.error('Error initializing AI:', error);
          toast.error('Failed to initialize chat system. Please try refreshing the page.');
          setIsInitialized(false);
          setIsAIInitialized(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    void initializeChat();
  }, [isPreview, previewConfig, params.botId]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (chatbot?.config) {
      setMessages([
        { 
          role: 'assistant', 
          content: chatbot.config.welcomeMessage || DEFAULT_CONFIG.welcomeMessage,
          timestamp: new Date().toISOString()
        }
      ]);
      // Remove initial form display
      setShowForm(false);
    }
  }, [chatbot]);

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!userForm.name || !userForm.phone) {
      toast.error('Please fill in all fields');
      return;
    }

    setFormSubmitted(true);
    setShowForm(false);
    setIsTyping(true); // Show typing indicator

    // Create user session with validated data
    const updatedSession = {
      userId: sessionId,
      customerName: userForm.name.trim(),
      customerPhone: `${userForm.countryCode}${userForm.phone.trim()}`,
      conversations: messages,
      startedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'chat_sessions', sessionId), updatedSession);
      setUserSession(updatedSession);
      
      // Add confirmation message instead of replacing all messages
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Thanks ${userForm.name}! How can I help you today?`,
          timestamp: new Date().toISOString()
        }]);
      }, 1000); // Show typing for 1 second
      
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save your information');
      setFormSubmitted(false);
      setIsTyping(false);
    }
  };

  // Update handleSend function to show form after first user message
  const handleSend = async () => {
    if (!input.trim()) return;

    setLastActivityTime(Date.now());
    const newMessage = { role: 'user' as const, content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Show form after first user message if not submitted yet
    if (!formSubmitted && messages.length === 1) {
      // First add the message explaining the form
      const formIntroMessage: Message = {
        role: 'assistant' as const,
        content: 'To better assist you, please fill out the form below:',
        timestamp: new Date().toISOString()
      };
      
      // Then add the form
      const formMessage: FormMessage = {
        role: 'assistant' as const,
        content: '',  // Empty content since we're showing the form
        isForm: true,
        timestamp: new Date().toISOString(),
        formData: {
          fields: {
            name: '',
            phone: ''
          }
        }
      };
      
      setMessages(prev => [...prev, formIntroMessage, formMessage]);
      setShowForm(true);
      return;
    }

    // Only proceed with AI response if form is submitted
    if (formSubmitted) {
      setIsTyping(true);
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const responseText = await retryOperation(async () => {
          if (chatbot) {
            const result = await model.generateContent(`
              You are ${chatbot.config.name}, a friendly customer service representative.
              
              Current Context:
              Speaking with: ${userForm.name}
              Phone: ${userForm.countryCode}${userForm.phone}
            
              Available Information:
              ${chatbot.training?.content || ''}

              ${chatbot.config.behaviourPrompt}
              ${chatbot.config.taskPrompt}

              Recent Conversation:
              ${messages.slice(-3).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

              Rules:
              1. Keep responses concise and natural
              2. Stay focused on the current topic
              3. Only provide information from the knowledge base

              ${CORE_RULES}

              User's message: ${input}
              Respond naturally without repeating previous responses.
            `);
            return result.response.text();
          }
          return '';  // Add default return
        });

        const aiMessage = {
          role: 'assistant' as const,
          content: responseText,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);

        // Save to chat_history (Bot Inbox)
        if (chatbot) {
          const chatHistoryRef = await addDoc(collection(db, 'chat_history'), {
            userId: chatbot.userId,
            botId: params.botId,
            sessionId,
            customerName: userForm.name,
            customerPhone: userForm.countryCode + userForm.phone,
            messages: [...messages, newMessage, aiMessage],
            createdAt: new Date().toISOString(),
            lastMessage: input,
            lastActive: new Date().toISOString()
          });

          // Check for conversation end to create reservation
          const isEndingChat = input.toLowerCase().match(/(?:bye|goodbye|thank|thanks|ok|that's all|done)/);
          if (isEndingChat) {
            const analysis = await analyzeConversation([...messages, newMessage, aiMessage]);
            
            // Create reservation
            const reservationData: Reservation = {
              id: sessionId,
              userId: chatbot.userId,
              botId: params.botId,
              customerName: userForm.name,
              customerPhone: userForm.countryCode + userForm.phone,
              service: analysis.interestedService || 'General Inquiry',
              requestedDate: new Date().toISOString(),
              status: 'pending',
              notes: `
Key Points:
${analysis.keyPoints?.join('\n')}

Potential Revenue: ${analysis.potentialRevenue || 'Not assessed'}
Follow-up Priority: ${analysis.followUpPriority || 'Not set'}

Recommended Actions:
${analysis.recommendedActions?.join('\n')}
              `.trim(),
              createdAt: new Date().toISOString(),
              chatSessionId: sessionId,
              lastMessage: input,
              analysis: {
                customerName: userForm.name,
                customerPhone: userForm.countryCode + userForm.phone,
                interestedService: analysis.interestedService,
                interestLevel: analysis.interestLevel || 'medium',
                summary: analysis.summary,
                nextSteps: analysis.nextSteps
              }
            };

            // Save to Firestore with explicit ID
            await setDoc(doc(db, 'reservations', sessionId), reservationData);
            
            // Update chatbot document with the new reservation
            await updateDoc(doc(db, 'chatbots', params.botId), {
              reservations: arrayUnion(sessionId)
            });

            console.log('Created reservation:', reservationData);
          }

          // Update chat session
          await setDoc(doc(db, 'chat_sessions', sessionId), {
            userId: chatbot.userId,
            customerName: userForm.name,
            customerPhone: userForm.countryCode + userForm.phone,
            conversations: [...messages, newMessage, aiMessage],
            startedAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Chat error:', error);
        setIsTyping(false);
        toast.error('Failed to get response. Please try again.');
      }
    }
  };

  // Update chat history loading
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!chatbot) return;
      
      try {
        const chatRef = doc(db, 'chatbots', params.botId, 'conversations', sessionId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
          const data = chatDoc.data();
          const sortedMessages = data.messages
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(({ role, content }: { role: 'user' | 'assistant', content: string }) => ({
              role,
              content
            }));

          setMessages(sortedMessages);
          console.log('Loaded chat history for session:', sessionId);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast.error('Failed to load chat history');
      }
    };

    loadChatHistory();
  }, [chatbot, params.botId, sessionId]);

  // Update the inactivity check useEffect
  useEffect(() => {
    if (!formSubmitted || messages.length <= 1) return;
    let timeoutId: NodeJS.Timeout;

    const handleInactivity = async () => {
      try {
        if (!chatbot || !userForm || messages.filter(m => m.role === 'user').length === 0) return;

        const analysis = await analyzeConversation(messages);
        
        const reservationData: Reservation = {
          id: sessionId,
          userId: chatbot.userId,
          botId: params.botId,
          customerName: userForm.name,
          customerPhone: userForm.countryCode + userForm.phone,
          service: analysis.interestedService || 'General Inquiry',
          requestedDate: new Date().toISOString(),
          status: 'pending',
          notes: `
Key Points:
${analysis.keyPoints?.join('\n')}

Potential Revenue: ${analysis.potentialRevenue || 'Not assessed'}
Follow-up Priority: ${analysis.followUpPriority || 'Not set'}

Recommended Actions:
${analysis.recommendedActions?.join('\n')}
          `.trim(),
          createdAt: new Date().toISOString(),
          chatSessionId: sessionId,
          lastMessage: messages[messages.length - 1].content,
          analysis: {
            customerName: userForm.name,
            customerPhone: userForm.countryCode + userForm.phone,
            interestedService: analysis.interestedService,
            interestLevel: analysis.interestLevel,
            summary: analysis.summary,
            nextSteps: analysis.nextSteps
          }
        };

        // Save to Firestore
        await setDoc(doc(db, 'reservations', sessionId), reservationData);
        
        // Update chatbot document
        await setDoc(doc(db, 'chatbots', params.botId), {
          reservations: arrayUnion(sessionId)
        }, { merge: true });

        console.log('Created/Updated reservation after analysis:', analysis);
      } catch (error) {
        console.error('Error handling inactivity:', error);
      }
    };

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    };

    resetTimeout();
    messages.length > 0 && resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messages, formSubmitted, userForm, chatbot, params.botId, sessionId]);

  // Also update message receiving to reset timer
  useEffect(() => {
    if (messages.length > 0) {
      setLastActivityTime(Date.now());
    }
  }, [messages]);

  // Update the avatar change handler
  const handleAvatarChange = async (newAvatar: string) => {
    try {
      if (!isPreview && params.botId) {
        await setDoc(doc(db, 'chatbots', params.botId), {
          config: {
            ...botConfig,
            avatar: newAvatar
          }
        }, { merge: true });
      }
      
      setBotConfig(prev => ({
        ...prev,
        avatar: newAvatar
      }));
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
    }
  };

  // Update the initialization useEffect
  useEffect(() => {
    const initializeBot = async () => {
      try {
        if (!isPreview && params.botId) {
          const docRef = doc(db, 'chatbots', params.botId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const botData = docSnap.data();
            setBotConfig({
              ...botData.config,
              avatar: botData.config.avatar || '/avatars/avatar-1.png' // Set default if none exists
            });
          }
        } else if (previewConfig) {
          setBotConfig({
            ...previewConfig.config,
            avatar: previewConfig.config.avatar || '/avatars/avatar-1.png' // Set default for preview
          });
        }
      } catch (error) {
        console.error('Error initializing bot:', error);
      }
    };

    initializeBot();
  }, [isPreview, params.botId, previewConfig]);

  // Update form rendering with correct colors
  const renderForm = () => {
    if (!chatbot?.config) return null;
    
    return (
      <div className="space-y-4 p-4 rounded-lg" 
        style={{ backgroundColor: 'transparent' }}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium" 
            style={{ color: chatbot.config.botMessageBg }}
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            value={userForm.name}
            onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: 'transparent',
              color: chatbot.config.botMessageBg,
              border: `1px solid ${chatbot.config.botMessageBg}`
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium"
            style={{ color: chatbot.config.botMessageBg }}
          >
            Phone Number
          </label>
          <div className="flex gap-2">
            <select
              value={userForm.countryCode}
              onChange={(e) => setUserForm(prev => ({ ...prev, countryCode: e.target.value }))}
              className="w-20 px-2 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'transparent',
                color: chatbot.config.botMessageBg,
                border: `1px solid ${chatbot.config.botMessageBg}`
              }}
            >
              {countryCodes.map(({ code }) => (
                <option 
                  key={code} 
                  value={code} 
                  style={{ 
                    backgroundColor: chatbot.config.backgroundColor,
                    color: chatbot.config.botMessageBg
                  }}
                >
                  {code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              id="phone"
              value={userForm.phone}
              onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-44 px-2 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'transparent',
                color: chatbot.config.botMessageBg,
                border: `1px solid ${chatbot.config.botMessageBg}`
              }}
              required
            />
          </div>
        </div>
        <button
          onClick={handleFormSubmit}
          className="w-full text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          style={{ backgroundColor: chatbot.config.botIconColor }}
        >
          Start Chat
        </button>
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsChatOpen(false);
    // Add debug logs
    console.log('Attempting to close chat widget');
    console.log('Is iframe?:', window.parent !== window);
    
    if (window.parent !== window) {
      try {
        window.parent.postMessage('closeChatWidget', '*');
        console.log('Close message sent to parent');
      } catch (error) {
        console.error('Error sending close message:', error);
      }
    }
  };

  // Remove loader check
  if (!chatbot?.config) {
    return <div></div>;
  }

  return (
    <div className={containerClassName} style={{ background: 'transparent' }}>
      {/* Chat Window */}
      <div className={`fixed bottom-24 right-8 z-50 ${isChatOpen ? 'block' : 'hidden'} w-80`} 
           style={{ background: 'transparent' }}>
        <div className="rounded-lg shadow-xl overflow-hidden" 
             style={{ backgroundColor: chatbot.config.backgroundColor }}>
          {/* Chat Header */}
          <div className="p-2.5 flex items-center gap-2" 
               style={{ borderBottomColor: chatbot.config.botMessageBg, borderBottomWidth: '1px' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: chatbot.config.botIconColor || chatbot.config.primaryColor }}>
              <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="font-medium" style={{ color: chatbot.config.primaryColor }}>
                {chatbot.config.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 text-sm" 
                      style={{ color: 'rgb(34 197 94)' }}>
                  Online
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:opacity-80 transition-opacity"
              style={{ 
                color: chatbot.config.botIconColor || chatbot.config.primaryColor 
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages - Made smaller */}
          <div className="p-3 h-[350px] overflow-y-auto space-y-2.5">
            {messages.map((message, index) => (
              <div key={index}>
                {/* Regular message */}
                {!message.isForm && (
                  <div className={`flex items-start gap-3 ${message.role === 'assistant' ? '' : 'justify-end'}`}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: chatbot.config.botMessageBg }}>
                        <BotIcon className="w-5 h-5 m-1.5" style={{ color: chatbot.config.botTextColor }} />
                      </div>
                    )}
                    <div className="rounded-2xl px-4 py-2 max-w-[80%]"
                         style={{
                           backgroundColor: message.role === 'assistant' ? chatbot.config.botMessageBg : chatbot.config.userMessageBg,
                           color: message.role === 'assistant' ? chatbot.config.botTextColor : chatbot.config.userTextColor
                         }}>
                      {message.content}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: chatbot.config.userMessageBg }}>
                        <UserIcon className="w-5 h-5 m-1.5" style={{ color: chatbot.config.userTextColor }} />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Form message */}
                {message.isForm && showForm && (
                  renderForm()
                )}
              </div>
            ))}
            {isTyping && <TypingIndicator chatbot={chatbot} />}
          </div>

          {/* Input Area */}
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-full overflow-hidden pr-2" 
              style={{ backgroundColor: chatbot.config.inputFieldBg || '#1e293b' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-transparent focus:outline-none"
                style={{ 
                  color: isLightColor(chatbot.config.backgroundColor) ? '#000000' : '#ffffff'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-full hover:bg-opacity-80 transition-colors disabled:opacity-50"
                style={{ backgroundColor: chatbot.config.botIconColor }}
              >
                <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button - Only show in preview mode */}
      {!isWidget && (
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:opacity-80 transition-colors"
          style={{ 
            backgroundColor: chatbot.config.botIconColor || chatbot.config.primaryColor,
            color: chatbot.config.botTextColor 
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
