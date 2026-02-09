'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: formData.phone,
            password: formData.password,
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          setSuccess('Account created successfully! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        } else {
          setSuccess('Account created successfully!');
        }
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'phone') {
      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData({
        ...formData,
        phone: digitsOnly,
      });
      return;
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-6 px-4 sm:py-10 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Join us today
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-4 sm:space-y-6" onSubmit={handleRegister}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
                        +91
                      </span>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="\\d*"
                        maxLength={10}
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="XXXXXXXXXX"
                        className="pl-12"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-0">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 sm:h-11"
                    variant="default"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  {/* Return to Home Page just below submit */}
                  <div className="flex items-center justify-center gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-green-700 text-xs h-auto p-0 leading-none">
                      <Link href="/">Return to Home Page</Link>
                    </Button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <Button asChild variant="ghost" size="sm" className="text-green-700 text-xs h-auto p-0 leading-none">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </div>
                </div>
              </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
