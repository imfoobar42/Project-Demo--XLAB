import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CSS/ChatInterface.css';

const ChatInterface = ({ videoTime, videoDuration, newVideoUploaded, setNewVideoUploaded, seekToTime }) => {
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [expandedMessages, setExpandedMessages] = useState({});
  const [context, setContext] = useState();
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const processedMessages = useRef(new Set());
  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!context) return;
    if (context === 'askParentName' || context === 'askChildName') return;

    try {
      const response = await fetch(
        `${REACT_APP_API_BASE_URL}/api/chat/${context}?videoTime=${videoTime || 0}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      let data = await response.json();

      if (parentName && childName) {
        data = data.map((msg) => {
          let newText = msg.text;
          newText = newText.replace(/\[Parent’s Name\]/g, parentName);
          newText = newText.replace(/\[Child’s Name\]/g, childName);
          return { ...msg, text: newText };
        });
      }

      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [context, videoTime, REACT_APP_API_BASE_URL, parentName, childName]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = messages.filter(
        (msg) => !processedMessages.current.has(msg.text + (msg.timestamp || ''))
      );

      newMessages.forEach((msg) => {
        processedMessages.current.add(msg.text + (msg.timestamp || ''));
      });

      setMessageQueue((prevQueue) => [...prevQueue, ...newMessages]);
    }
  }, [messages]);

  useEffect(() => {
    if (!isAwaitingResponse && messageQueue.length > 0 && !isTyping) {
      setIsTyping(true);

      const nextMessage = messageQueue[0];
      typingTimeoutRef.current = setTimeout(() => {
        setAllMessages((prevMessages) => [...prevMessages, nextMessage]);

        if (nextMessage.awaitResponse) {
          setIsAwaitingResponse(true);
        }

        setMessageQueue((prevQueue) => prevQueue.slice(1));
        setIsTyping(false);
      }, 1000);
    }
  }, [messageQueue, isAwaitingResponse, isTyping]);

  useEffect(() => {
    if (newVideoUploaded) {
      const videoUploadMessage = {
        text: "A new video has been successfully uploaded.",
        sender: 'bot',
      };

      if (!processedMessages.current.has(videoUploadMessage.text)) {
        processedMessages.current.add(videoUploadMessage.text);
        setAllMessages((prevMessages) => [...prevMessages, videoUploadMessage]);
      }

      setNewVideoUploaded(false);
      setContext('askParentName');
      const askParentMsg = {
        text: "Please enter the parent's name:",
        sender: 'bot'
      };
      setAllMessages((prev) => [...prev, askParentMsg]);
      setIsAwaitingResponse(true);
    }
  }, [newVideoUploaded, setNewVideoUploaded]);

  useEffect(() => {
    const initialMessage = {
      text: "Hi, I'm a conversational assistant designed to help.",
      sender: 'bot',
    };

    if (!processedMessages.current.has(initialMessage.text)) {
      processedMessages.current.add(initialMessage.text);
      setAllMessages([initialMessage]);
    }
  }, []);

  useEffect(() => {
    if (context === 'introduction') {
    } else if (context === 'selfReflection' && videoTime > 0) {
      setContext('fidelity');
    } else if (context === 'fidelity' && videoTime >= videoDuration - 1) {
      setContext('problemSolvingDialogue');
    } else if (context === 'problemSolvingDialogue' && videoTime >= videoDuration) {
      setContext('jointPlanning');
    }
  }, [context, videoTime, videoDuration]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [allMessages, isTyping]);

  const handleYesClick = () => {
    if (context === 'introduction' && isAwaitingResponse) {
      setIsAwaitingResponse(false);
      setContext('selfReflection');
    }
  };

  const sendMessage = () => {
    if (currentMessage.trim() !== '') {
      const userMessage = {
        text: currentMessage,
        sender: 'user',
      };

      setAllMessages((prevMessages) => [...prevMessages, userMessage]);
      setCurrentMessage('');
      if (isAwaitingResponse) {
        setIsAwaitingResponse(false);
      }

      if (context === 'askParentName') {
        setParentName(userMessage.text.trim());
        const askChildMsg = {
          text: "Please enter the child's name:",
          sender: 'bot'
        };
        setAllMessages((prev) => [...prev, askChildMsg]);
        setContext('askChildName');
        setIsAwaitingResponse(true);
      } else if (context === 'askChildName') {
        setChildName(userMessage.text.trim());
        setContext('introduction');
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const toggleExpandMessage = (index) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="chat-interface">
      <h2>AI Assistant</h2>
      <div className="chat-box" ref={chatBoxRef}>
        {allMessages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            {msg.sender === 'bot' && msg.timestamp && (
              <span className="message-timestamp">
                [
                <button onClick={() => seekToTime(msg.timestamp)}>
                  {formatTime(msg.timestamp)}
                </button>
                ]
              </span>
            )}
            <span className="message-text">
              {msg.text.length > 210 && !expandedMessages[index] ? (
                <>
                  {msg.text.substring(0, 210)}...{' '}
                  <button className="toggle-expand-btn" onClick={() => toggleExpandMessage(index)}>
                    Show More
                  </button>
                </>
              ) : msg.text.length > 210 && expandedMessages[index] ? (
                <>
                  {msg.text}{' '}
                  <button className="toggle-expand-btn" onClick={() => toggleExpandMessage(index)}>
                    Show Less
                  </button>
                </>
              ) : (
                msg.text
              )}
            </span>
            {msg.awaitResponse && context === 'introduction' && isAwaitingResponse && (
              <button className="response-buttons" onClick={handleYesClick}>Yes</button>
            )}
          </div>
        ))}

        {isTyping && !isAwaitingResponse && (
          <div className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
        />
        <button className="send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
