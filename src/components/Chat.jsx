import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const chatContainerRef = useRef(null);
  const audioRef = useRef(null);
  
  const isAdmin = user && user.email && user.email.startsWith('admin@');

  useEffect(() => {
    const q = query(
      collection(db, 'global_chat'),
      orderBy('timestamp', 'asc'), // Firebase recommend asc if we want oldest at top, newest at bottom
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    const username = user.email.split('@')[0];

    try {
      await addDoc(collection(db, 'global_chat'), {
        text: newMessage.trim(),
        userId: user.uid,
        username: username,
        creationTime: user.metadata.creationTime, // Guardar la edad de la cuenta
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error enviando mensaje: ", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    if (isAdmin && window.confirm("¿Seguro que quieres borrar este mensaje?")) {
      await deleteDoc(doc(db, 'global_chat', msgId));
    }
  };

  const getRank = (creationTime) => {
    if (!creationTime) return { name: '🥉 Novato', className: 'rank-novato' };
    const created = new Date(creationTime);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    
    if (diffDays >= 90) return { name: '💎 VIP', className: 'rank-vip' };
    if (diffDays >= 30) return { name: '🥇 Analista', className: 'rank-analista' };
    if (diffDays >= 7) return { name: '🥈 Apostador', className: 'rank-apostador' };
    return { name: '🥉 Novato', className: 'rank-novato' };
  };

  const toggleRadio = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Error reproduciendo radio:", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3 style={{ 
          background: 'linear-gradient(to right, #60a5fa, #a78bfa)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontWeight: 800
        }}>💬 Chat Global</h3>
        {isAdmin && <span style={{fontSize: '0.8rem', color: '#fcd34d'}}>👑 Modo Admin</span>}
      </div>

      <div className="radio-player">
        <div className="radio-info">
          <span className="radio-icon">📻</span>
          <div className="radio-text">
            <span className="radio-title">Radio</span>
            <span className={`radio-status ${!isPlaying ? 'paused' : ''}`}>
              {isPlaying ? 'En Vivo 🔴' : 'Pausado'}
            </span>
          </div>
        </div>
        <button onClick={toggleRadio} className="radio-btn" title="Reproducir/Pausar Radio">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        {/* Stream estable de Reggaeton/Urbano que no bloquea la reproducción */}
        <audio ref={audioRef} src="https://icecast.omroep.nl/funx-latin-bb-mp3" preload="none" />
      </div>

      {!user && (
        <div className="firebase-warning">
          Debes iniciar sesión para leer y enviar mensajes.
        </div>
      )}

      <div className="messages-list" ref={chatContainerRef}>
        {user && messages.map((msg) => {
          const isMe = msg.userId === user?.uid;
          const msgIsAdmin = msg.username === 'admin';
          const rankInfo = getRank(msg.creationTime);

          let messageClass = 'message';
          if (isMe) messageClass += ' my-message';
          
          if (msgIsAdmin) {
            messageClass += ' admin-message';
          } else {
            // Aplicar la clase de diseño (borde izquierdo y color) correspondiente a su rango
            messageClass += ` msg-${rankInfo.className}`;
          }

          return (
            <div key={msg.id} className={messageClass}>
              <div className="msg-header">
                <span className="msg-user">
                  {msg.username} 
                  {isMe && ' (Tú)'}
                  
                  {/* Etiqueta de Rango Automático */}
                  {msgIsAdmin ? (
                    <span className="rank-badge" style={{background: 'rgba(252, 211, 77, 0.2)', color: '#fcd34d', border: '1px solid #fcd34d'}}>👑 Admin</span>
                  ) : (
                    <span className={`rank-badge ${getRank(msg.creationTime).className}`}>
                      {getRank(msg.creationTime).name}
                    </span>
                  )}
                </span>
                {isAdmin && (
                  <button className="delete-msg-btn" onClick={() => handleDelete(msg.id)}>
                    🗑️
                  </button>
                )}
              </div>
              <div className="msg-text">{msg.text}</div>
            </div>
          );
        })}
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={user ? "Escribe un mensaje..." : "Inicia sesión para chatear"}
          disabled={!user || isSending}
        />
        <button type="submit" disabled={!user || !newMessage.trim() || isSending}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default Chat;
