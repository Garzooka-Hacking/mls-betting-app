import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthModal from './AuthModal';

const ADMIN_EMAIL = 'admin@admin.com'; // El usuario debe registrarse con este correo para ser admin

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!auth || !db) return; // Si Firebase no está configurado, no hacer nada

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      scrollToBottom();
    }, (err) => {
      console.error("Error al obtener mensajes:", err);
      setError("Error conectando al chat. Verifica la configuración de Firebase.");
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMessages();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !db) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: user.uid,
        email: user.email,
        isAdmin: user.email === ADMIN_EMAIL
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError("No se pudo enviar el mensaje.");
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!user || user.email !== ADMIN_EMAIL || !db) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error("Error eliminando mensaje:", err);
    }
  };

  return (
    <div className="chat-container fade-in">
      <div className="chat-header">
        <h3>💬 Chat en Vivo</h3>
        {user ? (
          <button className="logout-btn" onClick={() => signOut(auth)}>Salir</button>
        ) : (
          <button className="login-btn" onClick={() => setShowAuthModal(true)}>Ingresar</button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}
      
      {(!auth || !db) && (
        <div className="firebase-warning">
          El chat está desactivado porque Firebase no ha sido configurado aún.
        </div>
      )}

      <div className="messages-list">
        {messages.map((msg) => {
          const isMe = user && msg.uid === user.uid;
          const isAdmin = msg.isAdmin || msg.email === ADMIN_EMAIL;
          return (
            <div key={msg.id} className={`message ${isMe ? 'my-message' : ''} ${isAdmin ? 'admin-message' : ''}`}>
              <div className="msg-header">
                <span className="msg-user">{isAdmin ? '👑 Admin' : msg.email.split('@')[0]}</span>
                {user && user.email === ADMIN_EMAIL && (
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
          disabled={!user || !db}
        />
        <button type="submit" disabled={!user || !db || newMessage.trim() === ''}>
          Enviar
        </button>
      </form>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default Chat;
