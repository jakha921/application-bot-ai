

import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useCurrentBotData } from '../store/useAppStore';
import { type ChatMessage } from '../types';
import { SendIcon, RobotIcon, SearchIcon, BrainIcon } from './icons';

const Chatbot: React.FC = () => {
    const bot = useCurrentBotData();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !bot) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const thinkingMessage: ChatMessage = { id: `bot-thinking-${Date.now()}`, text: '...', sender: 'bot', isThinking: true };
        setMessages(prev => [...prev, thinkingMessage]);
        
        try {
            // FIX: The apiService.postChatMessage function expects 2 arguments, not 3.
            const botMessage = await apiService.postChatMessage(bot.id, currentInput);
            setMessages(prev => {
                const newMessages = prev.filter(m => m.id !== thinkingMessage.id);
                return [...newMessages, botMessage];
            });
        } catch (error) {
            const errorText = error instanceof Error ? error.message : 'API simulation error';
            const errorMessage: ChatMessage = { id: `bot-error-${Date.now()}`, text: errorText, sender: 'bot' };
            setMessages(prev => {
                const newMessages = prev.filter(m => m.id !== thinkingMessage.id);
                return [...newMessages, errorMessage];
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!bot) return null;

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Chat with {bot.name}</h2>
                 <div className="flex items-center space-x-4">
                    <label htmlFor="thinking-mode-toggle" className="flex items-center cursor-pointer">
                        <span className={`mr-2 text-sm font-medium ${isThinkingMode ? 'text-primary-500' : 'text-gray-500'}`}>Thinking Mode</span>
                        <div className="relative">
                            <input type="checkbox" id="thinking-mode-toggle" className="sr-only" checked={isThinkingMode} onChange={() => setIsThinkingMode(!isThinkingMode)} />
                            <div className={`block w-10 h-6 rounded-full transition ${isThinkingMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isThinkingMode ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                 </div>
            </div>
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="flex flex-col space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <RobotIcon className="w-8 h-8 rounded-full mr-3 text-primary-500 flex-shrink-0" />}
                            <div className={`px-4 py-3 rounded-2xl max-w-lg ${
                                msg.sender === 'user' 
                                ? 'bg-primary-500 text-white rounded-br-none' 
                                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'
                            }`}>
                                {msg.isThinking ? (
                                    <div className="flex items-center justify-center space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    </div>
                                ) : (
                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                                )}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-gray-300 dark:border-gray-600">
                                        <h4 className="text-xs font-semibold mb-1">Sources:</h4>
                                        <ul className="text-xs space-y-1">
                                            {msg.sources.map((source, i) => (
                                                <li key={i}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline truncate block">
                                                        {i+1}. {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 block w-full rounded-full py-3 px-5 bg-white border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="inline-flex items-center justify-center rounded-full h-12 w-12 transition duration-200 ease-in-out text-white bg-primary-500 hover:bg-primary-600 focus:outline-none disabled:bg-primary-300 disabled:cursor-not-allowed">
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;