'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Session disimpan di httpOnly cookie oleh server
        // Redirect ke dashboard
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green to-green-hover flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center text-white text-2xl font-bold">
            RF
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl font-bold text-charcoal text-center mb-2">
          Rumah Familiku
        </h1>
        <p className="text-center text-gray-text text-sm mb-8">
          Admin Panel Login
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-green"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-green"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-white py-2 rounded-lg font-bold hover:bg-green-hover transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        {/* ===== DEMO CREDENTIALS DIHAPUS ===== */}
        {/* Tidak ada lagi demo credentials yang ditampilkan */}
      </div>
    </div>
  );
}