import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import '../index.css';

const EditProfileModal = ({ onClose }) => {
  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(newUsername)) {
      setError("El nuevo usuario solo puede contener letras y números (sin @ ni espacios).");
      return;
    }

    setLoading(true);
    const fakeEmail = `${newUsername}@mls-betting.app`;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado.");

      // Re-autenticar por seguridad antes de cambiar datos sensibles
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Cambiar el "correo" (nuestro nombre de usuario falso)
      await updateEmail(user, fakeEmail);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Ese nombre de usuario ya está ocupado por otra persona.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("La contraseña actual es incorrecta.");
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2 style={{justifyContent: 'center', fontSize: '1.2rem', marginBottom: '1.5rem'}}>
          Editar Perfil
        </h2>
        
        {error && <div className="error-msg">{error}</div>}
        {success && <div style={{background: '#4ade80', color: '#064e3b', padding: '10px', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center'}}>¡Usuario actualizado con éxito!</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Nuevo nombre de usuario" 
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value.trim())}
            required
            pattern="[a-zA-Z0-9]+"
            title="Solo letras y números permitidos"
          />
          <input 
            type="password" 
            placeholder="Tu contraseña actual (por seguridad)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="generate-btn" 
            style={{padding: '0.8rem', marginTop: '1rem', width: '100%'}}
            disabled={loading || success}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
