'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import type { DropzoneOptions } from 'react-dropzone';
import type { ChangeEvent } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import BackgroundEffect from '@/components/BackgroundEffect';
import Image from 'next/image';
import { generateEmbedCode } from '@/utils/embedCode';

const ChatbotPreview = dynamic(() => import('@/components/ChatbotPreview'), {
  ssr: false
});

interface ChatbotConfig {
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
  websiteUrl: string;
  botIconColor: string;
  userIconColor: string;
  inputFieldBg?: string;
  buttonColor?: string;
  inputTextColor?: string;
}

interface ProductData {
  name: string;
  price: string;
  description: string;
}

interface WebsiteData {
  urls: string[];
  content: string[];
}

interface TrainingData {
  type: 'file' | 'url';
  content: string;
  source?: string;
  docId?: string;
  websiteData?: WebsiteData;
  productData?: ProductData[];
  products?: ProductData[];
  sources: {
    urls?: string[];
    file?: { name: string; content: string; type: string; } | null;
  };
  originalContent?: any;
}

interface Chatbot {
  id: string;
  name: string;
  config: ChatbotConfig;
  trainingData: TrainingData;
  createdAt: Date;
  userId: string;
}

interface DeploymentResult {
  botUrl: string;
  embedCode: string;
}

// Add interface for preview data
interface PreviewData {
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  url: string;
  content: string;
}

declare global {
  interface Window {
    screenshotTimeout?: NodeJS.Timeout;
  }
}

export default function TrainingPage() {
  const { user } = useAuth() as { user: FirebaseUser | null };
  const [step, setStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<'file' | 'url' | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const searchParams = useSearchParams();
  const botId = searchParams.get('botId');
  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);
  const [isProcessingUrls, setIsProcessingUrls] = useState<boolean[]>([false]);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const router = useRouter();
  const [botData, setBotData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBotId, setEditingBotId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const [config, setConfig] = useState<ChatbotConfig>({
    name: 'Support Assistant',
    welcomeMessage: 'Hi! How can I help you today?',
    primaryColor: '#2563eb',
    backgroundColor: '#0d1117',
    botTextColor: '#ffffff',
    botMessageBg: '#1e293b',
    userTextColor: '#ffffff',
    userMessageBg: '#2563eb',
    behaviourPrompt: `You are a friendly and enthusiastic customer support assistant. 
      - Be warm and engaging in your responses
      - Show genuine interest in the customer's needs
      - Use positive language and encouragement
      - Build trust through professional yet friendly tone
      - Keep responses concise but helpful
      - Subtly highlight benefits and value propositions`,
    taskPrompt: `Your key objectives:
      1. Actively identify customer interests and needs
      2. Build interest by:
         - Highlighting relevant benefits
         - Sharing specific features from the knowledge base
         - Using social proof when available    
      3. Never make up information - only use knowledge base data
      4. For pricing/services:
         - Quote exact details from knowledge base
         - If information isn't available, offer to connect with the team`,
    websiteUrl: '',
    botIconColor: '#4f46e5',
    userIconColor: '#7c3aed'
  });

  const [formValidation, setFormValidation] = useState({
    name: false,
    welcomeMessage: false,
    behaviourPrompt: false,
    taskPrompt: false,
    trainingData: false
  });

  const isFormValid = Object.values(formValidation).every(Boolean);
  const isAnyProcessing = isFileProcessing || isProcessingUrls.some(p => p) || isProcessing;

  useEffect(() => {
    const loadExistingBot = async () => {
      if (!botId) return;
      
      try {
        const docRef = doc(db, 'chatbots', botId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const botData = docSnap.data();
          setConfig(botData.config);
          
          // Set training data and source type
          if (botData.trainingData) {
            setTrainingData(botData.trainingData);
            setSelectedSource(botData.trainingData.type);
            
            // If URL source, set the website URL
            if (botData.trainingData.type === 'url') {
              setWebsiteUrl(botData.trainingData.source || '');
            }
          }

          // Load scraped data if exists
          if (botData.trainingData?.docId) {
            const scrapedRef = doc(db, 'scraped_data', botData.trainingData.docId);
            const scrapedSnap = await getDoc(scrapedRef);
            if (scrapedSnap.exists()) {
              const scrapedData = scrapedSnap.data();
              setTrainingData(prev => ({
                ...prev,
                type: prev?.type || 'url',
                originalContent: scrapedData.originalContent
              } as TrainingData));
            }
          }
        }
      } catch (error) {
        console.error('Error loading chatbot:', error);
        toast.error('Failed to load chatbot');
      }
    };

    loadExistingBot();
  }, [botId]);

  useEffect(() => {
    const loadBotData = async () => {
      if (botId) {
        const docRef = doc(db, 'chatbots', botId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.screenshotUrl) {
            setPreviewImage(data.screenshotUrl);
          }
          if (data.websiteUrl) {
            setWebsiteUrl(data.websiteUrl);
          }
        }
      }
    };
    
    loadBotData();
  }, [botId]);

  const addUrlField = () => {
    if (websiteUrls.length < 3) {
      setWebsiteUrls([...websiteUrls, '']);
      setIsProcessingUrls([...isProcessingUrls, false]);
    }
  };

  const removeUrlField = (index: number) => {
    const newUrls = websiteUrls.filter((_, i) => i !== index);
    const newProcessing = isProcessingUrls.filter((_, i) => i !== index);
    setWebsiteUrls(newUrls);
    setIsProcessingUrls(newProcessing);
  };

  const handleUrlChange = (index: number, newUrl: string) => {
    const newUrls = [...websiteUrls];
    newUrls[index] = newUrl;
    setWebsiteUrls(newUrls);
    
    // Clear existing timeout
    if (window.screenshotTimeout) {
      clearTimeout(window.screenshotTimeout);
    }
    
    // Reset preview if URL is empty
    if (!newUrl) {
      setPreviewImage(null);
      return;
    }
    
    // Set new timeout for screenshot
    window.screenshotTimeout = setTimeout(() => {
      handleCaptureScreenshot(newUrl).catch(console.error);
    }, 1000);
  };

  const handleWebsiteUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setWebsiteUrl(url);
    
    // Debounce the screenshot capture to avoid too many requests
    if (url) {
      const timer = setTimeout(() => {
        handleCaptureScreenshot(url);
      }, 1000); // Wait 1 second after typing stops

      return () => clearTimeout(timer);
    }
  };

  const handleUrlProcess = async () => {
    if (!user?.uid) {
      toast.error('Please sign in first');
      return;
    }

    const validUrls = websiteUrls.filter(url => url.trim());
    if (validUrls.length === 0) {
      toast.error('Please enter at least one valid URL');
      return;
    }

    setIsProcessingUrls(validUrls.map(() => true));
    const websiteData: WebsiteData = { urls: [], content: [] };

    try {
      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i];
        const response = await fetch('/api/scrape-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, userId: user.uid }),
        });

        if (!response.ok) {
          throw new Error(`Failed to process URL: ${url}`);
        }

        const data = await response.json();
        websiteData.urls.push(url);
        websiteData.content.push(data.summary);
      }

      setTrainingData({
        type: 'url',
        content: websiteData.content.join('\n\n'),
        source: websiteData.urls.join(', '),
        websiteData: websiteData,
        sources: {
          urls: websiteData.urls,
          file: null
        }
      });

      toast.success('All websites processed successfully!');
    } catch (error) {
      console.error('Error processing websites:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process websites');
    } finally {
      setIsProcessingUrls(websiteData.urls.map(() => false));
    }
  };

  const processFileContent = (content: string): { 
    products: Array<{ name: string; price: string; description: string }> 
  } => {
    const lines = content.split('\n').filter(line => line.trim());
    const products = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Try to extract product information
        const parts: string[] = line.split(/[,|;|\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          products.push({
            name: parts[0],
            price: parts[1],
            description: parts[2] || ''
          });
        }
      }
    }

    return { products };
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsFileProcessing(true);
      
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type
      });

      try {
        let content = '';
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Send to extraction API
        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to extract text from file');
        }

        const data = await response.json();
        
        if (!data.text) {
          throw new Error('No text extracted from file');
        }

        content = data.text;
        console.log('Extracted content:', content);

        // Try to parse products from the content
        const products = content.split('\n')
          .filter(line => line.trim())
          .map(line => {
            // Try different delimiters
            const delimiters = [',', ';', '\t', '|'];
            let parts: string[] = [];
            
            for (const delimiter of delimiters) {
              parts = line.split(delimiter).map(p => p.trim());
              if (parts.length >= 2) break;
            }

            // Try to identify price in the text
            const priceMatch = parts.find(p => p.match(/\$?\d+/));
            const nameMatch = parts.find(p => !p.match(/\$?\d+/));
            
            if (priceMatch && nameMatch) {
              return {
                name: nameMatch,
                price: priceMatch,
                description: parts.filter(p => p !== nameMatch && p !== priceMatch).join(' ')
              };
            }
            return null;
          })
          .filter(p => p !== null);

        // Store both raw content and structured data
        setTrainingData(prev => ({
          type: 'file',
          content: content,
          originalContent: data,
          sources: {
            file: {
              name: file.name,
              content: content,
              type: file.type
            },
            urls: []
          },
          products: data.products?.filter(Boolean) || []
        }));

        console.log('Processed training data:', trainingData);

        if (products.length > 0) {
          toast.success(`Processed ${products.length} products successfully!`);
        } else {
          toast.success('File processed successfully!');
        }
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(error instanceof Error ? error.message : 'Error processing file');
        setUploadedFile(null);
      } finally {
        setIsFileProcessing(false);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleSaveAndDeploy = async () => {
    if (!isFormValid) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      const chatbotId = botId || uuidv4();
      const chatbotRef = doc(db, 'chatbots', chatbotId);

      // Get the current domain
      const domain = process.env.NEXT_PUBLIC_VERCEL_URL 
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.NEXT_PUBLIC_DOMAIN_URL || window.location.origin;

      // Process URLs if provided
      let websiteContent = '';
      if (websiteUrls.some(url => url.trim())) {
        const validUrls = websiteUrls.filter(url => url.trim());
        const websiteData: WebsiteData = { urls: [], content: [] };

        for (const url of validUrls) {
          const response = await fetch('/api/scrape-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, userId: user?.uid }),
          });

          if (!response.ok) {
            throw new Error(`Failed to process URL: ${url}`);
          }

          const data = await response.json();
          websiteData.urls.push(url);
          websiteData.content.push(data.summary);
        }

        websiteContent = websiteData.content.join('\n\n');
      }

      // Combine all training content
      const combinedContent = [
        trainingData?.content || '',
        websiteContent
      ].filter(Boolean).join('\n\n');

      // Structure the chatbot data properly
      const chatbot = {
        id: chatbotId,
        name: config.name,
        userId: user?.uid,
        config,
        training: {
          type: trainingData?.type || 'combined',
          content: combinedContent,
          sources: {
            file: trainingData?.sources?.file || null,
            urls: websiteUrls.filter(url => url.trim())
          },
          products: trainingData?.products || []
        },
        conversations: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving chatbot with data:', chatbot);
      await setDoc(chatbotRef, chatbot);
      
      const result = {
        botUrl: `/bot/${chatbotId}`,
        embedCode: generateEmbedCode(chatbotId)
      };
      
      setDeploymentResult(result);
      toast.success(botId ? 'Chatbot updated successfully!' : 'Chatbot deployed successfully!');
    } catch (error) {
      console.error('Error deploying chatbot:', error);
      toast.error(error instanceof Error ? error.message : 'Error deploying chatbot');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    setFormValidation({
      name: Boolean(config.name.trim()),
      welcomeMessage: Boolean(config.welcomeMessage.trim()),
      behaviourPrompt: Boolean(config.behaviourPrompt.trim()),
      taskPrompt: Boolean(config.taskPrompt.trim()),
      trainingData: Boolean(trainingData?.content)
    });
  }, [config, trainingData]);

  useEffect(() => {
    if (config.websiteUrl) {
      try {
        new URL(config.websiteUrl);
        // URL is valid, force a re-render of the preview
        setConfig(prev => ({ ...prev }));
      } catch {
        // Invalid URL, do nothing
      }
    }
  }, [config.websiteUrl]);

  const handleCaptureScreenshot = async (url: string) => {
    if (!url) return;
    
    try {
      setIsCapturingScreenshot(true);
      
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to capture screenshot');
      }

      const data = await response.json();
      if (data.imageUrl) {
        setPreviewImage(data.imageUrl);
        if (botId) {
          await updateDoc(doc(db, 'chatbots', botId), {
            screenshotUrl: data.imageUrl,
            websiteUrl: url
          });
        }
      }
    } catch (error) {
      console.error('Screenshot error:', error);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleSave = async () => {
    try {
      const botId = searchParams.get('botId') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'chatbots', botId), {
        ...botData,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Bot saved successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving bot:', error);
      toast.error('Failed to save bot');
    }
  };

  // Add this useEffect to handle initial and value-based resizing
  useEffect(() => {
    const adjustTextareaHeights = () => {
      const behaviorTextarea = document.getElementById('behavior-prompt') as HTMLTextAreaElement;
      const taskTextarea = document.getElementById('task-prompt') as HTMLTextAreaElement;
      
      if (behaviorTextarea) {
        behaviorTextarea.style.height = 'auto';
        behaviorTextarea.style.height = `${behaviorTextarea.scrollHeight}px`;
      }
      
      if (taskTextarea) {
        taskTextarea.style.height = 'auto';
        taskTextarea.style.height = `${taskTextarea.scrollHeight}px`;
      }
    };

    adjustTextareaHeights();
  }, [config.behaviourPrompt, config.taskPrompt]);

  const handlePreviewWebsite = async (url: string) => {
    try {
      const response = await fetch('/api/preview-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) return; // Silently return on error
      
      const preview = await response.json() as PreviewData;
      if ('error' in preview) return; // Silently return on error

      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error); // Keep logging for debugging
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <BackgroundEffect />
      <div className="relative z-10 flex flex-col lg:flex-row gap-4 sm:gap-8 justify-center">
        {/* Configuration Steps - Increased max width */}
        <div className="flex-1 space-y-8 max-w-6xl mx-auto w-full">
          <div>
            {/* Step 1: Basic Configuration */}
            <div className={`space-y-6 ${step !== 1 && 'hidden'}`}>
              <div className="bg-[#0d1117] rounded-lg p-8 border border-[#1e293b]">
                <h2 className="text-xl font-semibold text-white mb-4">Basic Configuration</h2>
                <div className="space-y-4">
                  {/* Basic Info Section */}
                  <div className="p-6 rounded-lg border border-[#1e293b] space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-lg font-medium text-white">Basic Info</span>
                    </div>
                    
                    {/* Name input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Chatbot Name
                      </label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-[#1e293b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Support Assistant"
                      />
                      {!formValidation.name && (
                        <p className="text-red-500 text-sm mt-1">Please enter a name for your chatbot</p>
                      )}
                    </div>

                    {/* Welcome Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Welcome Message
                      </label>
                      <input
                        type="text"
                        value={config.welcomeMessage}
                        onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                        className="w-full px-4 py-2 bg-[#1e293b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Hi! How can I help you today?"
                      />
                      {!formValidation.welcomeMessage && (
                        <p className="text-red-500 text-sm mt-1">Please enter a welcome message</p>
                      )}
                    </div>
                  </div>

                  {/* Website URLs section - Add after Basic Info section */}
                  <div className="p-6 rounded-lg border border-[#1e293b] space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-lg font-medium text-white">Website URLs</span>
                    </div>
                    <p className="text-gray-400 text-sm">Add up to 3 website URLs to train your bot</p>
                    
                    <div className="space-y-4 max-w-3xl">
                      {websiteUrls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleUrlChange(index, e.target.value)}
                            className="w-full px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            placeholder={`Website URL ${index + 1}`}
                          />
                          {index > 0 && (
                            <button
                              onClick={() => removeUrlField(index)}
                              className="px-3 py-2 text-red-500 hover:text-red-400 flex-shrink-0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {websiteUrls.length < 3 && (
                        <button
                          onClick={addUrlField}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          + Add another URL
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Color Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <span className="text-lg font-medium text-white">Colors</span>
                    </div>
                    
                    {/* Chat Window Colors */}
                    <div className="space-y-4 p-4 border border-[#1e293b] rounded-lg">
                      <h4 className="text-md font-medium text-gray-400">Chat Window</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Window Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.backgroundColor}
                              onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.backgroundColor}
                              onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Bot Name Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.primaryColor}
                              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.primaryColor}
                              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Input Field Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.inputFieldBg || config.botMessageBg}
                              onChange={(e) => setConfig({ ...config, inputFieldBg: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.inputFieldBg || config.botMessageBg}
                              onChange={(e) => setConfig({ ...config, inputFieldBg: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Buttons Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.botIconColor}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                botIconColor: e.target.value,
                                buttonColor: e.target.value
                              }))}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.botIconColor}
                              onChange={(e) => setConfig({ ...config, botIconColor: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages Colors */}
                    <div className="space-y-4 p-4 border border-[#1e293b] rounded-lg">
                      <h4 className="text-md font-medium text-gray-400">Messages</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bot Messages */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Bot Message Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.botMessageBg}
                              onChange={(e) => {
                                setConfig({ ...config, botMessageBg: e.target.value });
                              }}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.botMessageBg}
                              onChange={(e) => {
                                setConfig({ ...config, botMessageBg: e.target.value });
                              }}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Bot Message Text
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.botTextColor}
                              onChange={(e) => setConfig({ ...config, botTextColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.botTextColor}
                              onChange={(e) => setConfig({ ...config, botTextColor: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>

                        {/* User Messages */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            User Message Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.userMessageBg}
                              onChange={(e) => setConfig({ ...config, userMessageBg: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.userMessageBg}
                              onChange={(e) => setConfig({ ...config, userMessageBg: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            User Message Text
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.userTextColor}
                              onChange={(e) => setConfig({ ...config, userTextColor: e.target.value })}
                              className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                            />
                            <input
                              type="text"
                              value={config.userTextColor}
                              onChange={(e) => setConfig({ ...config, userTextColor: e.target.value })}
                              className="w-24 h-10 px-3 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prompts Configuration */}
                  <div className="p-6 rounded-lg border border-[#1e293b] space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                      <span className="text-lg font-medium text-white">Behavior Instructions</span>
                    </div>
                    <p className="text-gray-400 text-sm">Define how the chatbot should behave and interact</p>
                    <textarea
                      id="behavior-prompt"
                      value={config.behaviourPrompt}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, behaviourPrompt: e.target.value }));
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Enter behavior instructions..."
                      className="w-full px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="p-6 rounded-lg border border-[#1e293b] space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="text-lg font-medium text-white">Task Instructions</span>
                    </div>
                    <p className="text-gray-400 text-sm">Define the chatbot's specific tasks and objectives</p>
                    <textarea
                      id="task-prompt"
                      value={config.taskPrompt}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, taskPrompt: e.target.value }));
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Enter task instructions..."
                      className="w-full px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg focus:border-blue-500 focus:ring-0 text-white min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 rounded-lg border border-[#1e293b] space-y-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-lg font-medium text-white">Products or Services list</span>
                      </div>
                      <p className="text-gray-400 text-sm">Upload a file containing your products/services with prices and descriptions</p>
                      
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-[#1e293b] hover:border-blue-500'}`}
                      >
                        <input {...getInputProps()} />
                        <div className="space-y-4">
                          {uploadedFile ? (
                            // Show uploaded file info
                            <div className="space-y-2">
                              <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <div className="text-gray-400">
                                <p className="font-medium">{uploadedFile.name}</p>
                                <p className="text-sm">{uploadedFile.size}</p>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFile(null);
                                    setTrainingData(null);
                                  }}
                                  className="mt-2 text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove file
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Original upload UI
                            <>
                              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                                <div className="text-gray-400">
                                  {isDragActive ? (
                                    <p>Drop the file here...</p>
                                  ) : (
                                    <>
                                      <p>Drag & drop your file, or click to select</p>
                                      <p className="text-sm mt-2">
                                        Accepts TXT, PDF, DOC, DOCX, XLS, XLSX files
                                      </p>
                                    </>
                                  )}
                                </div>
                            </>
                          )}
                        
                          {isFileProcessing && (
                            <div className="mt-4">
                              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                              <p className="text-gray-400 mt-2">Processing file...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <button
                        onClick={handleSaveAndDeploy}
                        disabled={!isFormValid || isAnyProcessing}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAnyProcessing ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          'Save and Deploy'
                        )}
                      </button>
                      {(!isFormValid || isAnyProcessing) && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {isAnyProcessing ? 'Please wait while we process everything' : 'Please fill in all required fields'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="w-full lg:w-1/2">
          <div className="lg:fixed lg:right-0 lg:w-[40%] lg:top-24 lg:pr-8">
            <div className="relative h-[400px] sm:h-[500px] md:h-[600px] bg-gray-900 rounded-lg border border-[#1e293b] overflow-hidden">
              {/* Mock browser frame */}
              <div className="h-8 bg-[#1e293b] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              
              {/* Preview content */}
              <div className="relative h-[calc(100%-2rem)] bg-[#0a0a0a] overflow-hidden">
                {isCapturingScreenshot ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading Website...</span>
                    </div>
                  </div>
                ) : previewImage ? (
                  <div className="relative w-full">
                    <Image
                      src={previewImage}
                      alt="Website Preview"
                      width={1280}
                      height={800}
                      className="w-full h-auto rounded-lg shadow-lg"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Enter a website URL to see preview
                  </div>
                )}

                {isCapturingScreenshot && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Capturing screenshot...
                  </div>
                )}

                {/* Chatbot Preview */}
                <div className="absolute bottom-0 right-5 w-full h-full pointer-events-none">
                  <div className="relative w-full h-full">
                    <ChatbotPreview 
                      params={{ botId: 'preview' }}
                      previewConfig={{
                        userId: 'preview',
                        config: {
                          ...config,
                          name: config.name || 'Preview Bot',
                          welcomeMessage: config.welcomeMessage || 'Hello! How can I help you?',
                          primaryColor: config.primaryColor || '#2563eb',
                          backgroundColor: config.backgroundColor || '#0d1117',
                          botTextColor: config.botTextColor || '#ffffff',
                          botMessageBg: config.botMessageBg || '#1e293b',
                          userTextColor: config.userTextColor || '#ffffff',
                          userMessageBg: config.userMessageBg || '#2563eb',
                          botIconColor: config.botIconColor || '#4f46e5',
                          inputFieldBg: config.inputFieldBg || '#1e293b',
                          inputTextColor: config.inputTextColor || '#ffffff',
                          buttonColor: config.buttonColor || '#4f46e5'
                        },
                        training: trainingData || {
                          type: 'file',
                          content: '',
                          sources: { urls: [], file: null },
                          products: []
                        }
                      }}
                      isPreview={true}
                      containerClassName={`
                        absolute bottom-0 right-0 transform 
                        scale-[0.55] sm:scale-[0.65] md:scale-[0.75] lg:scale-[0.75]
                        translate-y-[80%] sm:translate-y-[75%] md:translate-y-[70%] lg:translate-y-[70%]
                        translate-x-[15%] sm:translate-x-[10%] md:translate-x-[5%] lg:translate-x-[5%]
                        pointer-events-auto
                        origin-bottom-right
                        [&>div]:border-0 [&>div]:shadow-none
                      `}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {deploymentResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[#0d1117] rounded-lg p-6 max-w-lg w-full border border-[#1e293b]">
              <h3 className="text-xl font-semibold text-white mb-4">Chatbot Deployed Successfully!</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Chatbot URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={window.location.origin + deploymentResult.botUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg text-white"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + deploymentResult.botUrl);
                        toast.success('URL copied to clipboard!');
                      }}
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
                      value={deploymentResult.embedCode}
                      readOnly
                      className="flex-1 px-4 py-2 bg-[#1e293b] border border-transparent rounded-lg text-white"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(deploymentResult.embedCode);
                        toast.success('Embed code copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setDeploymentResult(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Website Preview Modal */}
        {showPreview && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowPreview(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div 
              className="relative bg-[#1e293b] p-6 rounded-lg w-full max-w-2xl mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Website Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {previewData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {previewData.favicon && (
                      <img src={previewData.favicon} alt="Site Icon" className="w-6 h-6" />
                    )}
                    <h4 className="text-xl font-semibold text-white">{previewData.title}</h4>
                  </div>
                  
                  {previewData.image && (
                    <img 
                      src={previewData.image} 
                      alt="Preview" 
                      className="w-full rounded-lg object-cover max-h-[300px]"
                    />
                  )}
                  
                  <p className="text-gray-300">{previewData.description}</p>
                  
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">{previewData.content}</p>
                  </div>
                  
                  <a 
                    href={previewData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Visit Website →
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-400">Loading preview...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
