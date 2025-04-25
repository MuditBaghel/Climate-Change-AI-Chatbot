import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = async (message = input) => {
        if (!message.trim()) return;

        const userMessage = { role: 'user', text: message, timestamp: new Date().toLocaleTimeString() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        const eventSource = new EventSource('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        let botMessage = { role: 'model', text: '', timestamp: new Date().toLocaleTimeString() };
        setMessages((prev) => [...prev, botMessage]);

        eventSource.onmessage = (event) => {
            botMessage.text += event.data;
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...botMessage };
                return updated;
            });
        };

        eventSource.onerror = () => {
            eventSource.close();
            setIsTyping(false);
            setMessages((prev) => [...prev, { role: 'model', text: 'Oops! Something went wrong. Please try again.', timestamp: new Date().toLocaleTimeString() }]);
        };

        eventSource.onopen = () => {
            fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
        };
    };

    useEffect(() => {
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [messages]);

    return (
        <div className="app">
            <h1>Chat with ClimateBot 🌍</h1>
            <div className="chat-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <span>{msg.text}</span>
                        <small>{msg.timestamp}</small>
                    </div>
                ))}
                {isTyping && <div className="typing">ClimateBot is typing...</div>}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about climate change..."
                    aria-label="Message input"
                />
                <button onClick={() => sendMessage()} aria-label="Send message">Send</button>
            </div>
            <div className="quick-replies">
                <button onClick={() => sendMessage('What is climate change?')}>What is climate change?</button>
                <button onClick={() => sendMessage('How can I help?')}>How can I help?</button>
            </div>
        </div>
    );
}

export default App;