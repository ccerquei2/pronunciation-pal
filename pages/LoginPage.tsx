import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const LoginPage: React.FC = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    navigate('/dashboard', { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-sm bg-slate-800 p-6 rounded shadow">
        <h1 className="text-xl mb-4 text-center">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
        {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
          <button type="submit" className="w-full bg-blue-600 py-2 rounded">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button onClick={handleGoogle} className="mt-4 w-full bg-red-500 py-2 rounded">
          Sign in with Google
        </button>
        <button
          onClick={() => setIsSignUp((p) => !p)}
          className="mt-2 text-sm text-slate-300 w-full"
        >
          {isSignUp ? 'Have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};
