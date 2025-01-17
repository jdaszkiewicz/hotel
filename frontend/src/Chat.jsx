import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, ListGroup, Container, Badge } from 'react-bootstrap';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const ws = useRef(null);
  const username = localStorage.getItem('username') || 'Anonymous';

  useEffect(() => {
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${username}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, { 
        text: data.message, 
        isMe: false,
        sender: data.sender 
      }]);
    };

    return () => {
      ws.current.close();
    };
  }, [username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && ws.current) {
      const messageData = {
        sender: username,
        message: message,
        replyTo: replyTo
      };
      ws.current.send(JSON.stringify(messageData));
      setMessages((prev) => [...prev, { 
        text: message, 
        isMe: true,
        sender: username,
        replyTo: replyTo
      }]);
      setMessage('');
      setReplyTo(null);
    }
  };

  const handleReply = (messageId) => {
    setReplyTo(messageId);
    document.querySelector('.chat-form input').focus();
  };

  return (
    <Container className="chat-container mt-4">
      <h3 className="mb-3">Chat</h3>
      <ListGroup className="mb-3 chat-messages">
        {messages.map((msg, index) => (
          <ListGroup.Item 
            key={index}
            className={`chat-message ${msg.isMe ? 'me' : 'other'}`}
            onClick={() => handleReply(index)}
          >
            {msg.replyTo !== null && msg.replyTo !== undefined && (
              <div className="message-reply">
                <Badge bg="secondary">Odpowiedź do:</Badge>
                <div className="reply-text">
                  {messages[msg.replyTo].text}
                </div>
              </div>
            )}
            <div className="message-sender">
              {msg.isMe ? 'Ty' : msg.sender}
            </div>
            <div className="message-text">
              {msg.text}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Form onSubmit={sendMessage} className="chat-form">
        <div className="d-flex">
          <Form.Control
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button type="submit" variant="primary" className="ms-2">
            Send
          </Button>
        </div>
      </Form>

      <style>{`
        .chat-container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .chat-messages {
          height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
        }
        
        .chat-message {
          margin-bottom: 5px;
          padding: 8px 12px;
          border-radius: 4px;
          max-width: 80%;
          word-wrap: break-word;
        }
        
        .chat-message.me {
          background-color: #007bff;
          color: white;
          margin-left: auto;
          max-width: 70%;
        }
        
        .chat-message.other {
          background-color: #f1f1f1;
          margin-right: auto;
          max-width: 70%;
        }
        
        .message-sender {
          font-size: 0.8rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .message-text {
          word-wrap: break-word;
        }
        
        .chat-form {
          margin-top: 10px;
          position: relative;
        }
        
        .message-reply {
          background: rgba(0,0,0,0.05);
          border-left: 3px solid #007bff;
          padding: 5px;
          margin-bottom: 5px;
          border-radius: 4px;
        }
        
        .reply-text {
          font-size: 0.8em;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .chat-message {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .chat-message:hover {
          background-color: rgba(0,0,0,0.05);
        }
      `}</style>
    </Container>
  );
};

export default Chat;
