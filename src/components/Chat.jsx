import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthModal from './AuthModal';

const ADMIN_EMAIL = 'admin@admin.com'; 

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeMessages;

    try {
      unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) setUser(currentUser);
      }, (err) => {
        console.error("Auth error:", err);
        setIsLocalMode(true);
      });

      const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
      unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(msgs);
        scrollToBottom();
      }, (err) => {
        console.error("Error al obtener mensajes de Firebase:", err);
        setError("Error conectando a Firebase. Activando modo local.");
        setIsLocalMode(true);
      });
    } catch (e) {
      console.error("Error inicializando listeners:", e);
      setIsLocalMode(true);
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  useEffect(() => {
    if (isLocalMode) {
      setMessages([
        {
          id: 'welcome-msg',
          text: '¡Bienvenido al chat (Modo Local)! Usa la papelera para borrar mensajes si eres admin.',
          uid: 'system',
          email: 'Sistema',
          isAdmin: true
        }
      ]);
    }
  }, [isLocalMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    if (!isLocalMode && db) {
      try {
        await addDoc(collection(db, 'messages'), {
          text: newMessage,
          createdAt: serverTimestamp(),
          uid: user.uid,
          email: user.email,
          isAdmin: user.email === ADMIN_EMAIL || user.isAdmin
        });
        setNewMessage('');
      } catch (err) {
        console.error("Error enviando mensaje:", err);
        setError("No se pudo enviar el mensaje.");
        setIsLocalMode(true);
      }
    } else {
      // Fallback local
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: newMessage,
        uid: user.uid,
        email: user.email,
        isAdmin: user.isAdmin
      }]);
      setNewMessage('');
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!user || (!user.isAdmin && user.email !== ADMIN_EMAIL)) return;
    
    if (!isLocalMode && db) {
      try {
        await deleteDoc(doc(db, 'messages', id));
      } catch (err) {
        console.error("Error eliminando mensaje:", err);
        setIsLocalMode(true);
      }
    } else {
      // Fallback local
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleLogout = () => {
    if (!isLocalMode && auth && user && !user.isAdmin) {
      signOut(auth).then(() => setUser(null));
    } else {
      setUser(null);
    }
  };

  return (
    <div className="chat-container fade-in">
      <div className="chat-header">
        <h3>💬 Chat en Vivo</h3>
        {user ? (
          <button className="logout-btn" onClick={handleLogout}>Salir</button>
        ) : (
          <button className="login-btn" onClick={() => setShowAuthModal(true)}>Ingresar</button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}
      
      {isLocalMode && !user && (
        <div className="firebase-warning">
          Modo Local Activo: Firebase desconectado. Ingresa como admin3030 para probar.
        </div>
      )}

      <div className="messages-list">
        {messages.map((msg) => {
          const isMe = user && msg.uid === user.uid;
          const isAdmin = msg.isAdmin || msg.email === ADMIN_EMAIL;
          return (
            <div key={msg.id} className={`message ${isMe ? 'my-message' : ''} ${isAdmin ? 'admin-message' : ''}`}>
              <div className="msg-header">
                <span className="msg-user">{isAdmin ? '👑 ' + (msg.email === 'admin3030' ? 'Admin' : 'Admin') : (msg.email ? msg.email.split('@')[0] : 'Usuario')}</span>
                {user && (user.isAdmin || user.email === ADMIN_EMAIL) && (
                  <button className="delete-msg-btn" onClick={() => handleDeleteMessage(msg.id)}>🗑️</button>
                )}
              </div>
              <div className="msg-text">{msg.text}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={user ? "Escribe un mensaje..." : "Inicia sesión para chatear"}
          disabled={!user}
        />
        <button type="submit" disabled={!user || newMessage.trim() === ''}>
          Enviar
        </button>
      </form>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onMockLogin={(u) => setUser(u)} />}
    </div>
  );
};

export default Chat;
