import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import '../index.css';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar que el usuario solo contenga letras y números (sin @ ni caracteres especiales)
      const usernameRegex = /^[a-zA-Z0-9]+$/;
      if (!usernameRegex.test(username)) {
        setError("El usuario solo puede contener letras y números (sin @ ni espacios).");
        setLoading(false);
        return;
      }

      // Firebase requiere un correo, así que le agregamos un dominio invisible internamente
      const fakeEmail = `${username}@mls-betting.app`;

      if (isLogin) {
        await signInWithEmailAndPassword(auth, fakeEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, fakeEmail, password);
      }
      onClose(); // Cerrar el modal exitosamente
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Ese nombre de usuario ya está ocupado. Elige otro.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Usuario o contraseña incorrectos.");
      } else {
        setError("Error: " + err.message.replace('Firebase: ', ''));
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
          {isLogin ? 'Iniciar Sesión' : 'Crear Usuario'}
        </h2>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Nombre de usuario (Solo letras y números)" 
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            required
            pattern="[a-zA-Z0-9]+"
            title="Solo letras y números permitidos"
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="generate-btn" 
            style={{padding: '0.8rem', marginTop: '1rem', width: '100%'}}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>
        </form>

        <p className="toggle-auth">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
