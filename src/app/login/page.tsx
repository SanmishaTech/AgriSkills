'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  // Initialize login form
  const loginForm = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Initialize register form
  const registerForm = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Handle field-specific errors
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((fieldError: any) => {
            if (fieldError.path && fieldError.message && Array.isArray(fieldError.path)) {
              const fieldName = fieldError.path[fieldError.path.length - 1] || fieldError.path[0];
              if (typeof fieldName === 'string' && (fieldName === 'phone' || fieldName === 'password')) {
                loginForm.setError(fieldName as keyof LoginFormInputs, {
                  type: 'server',
                  message: fieldError.message
                });
              }
            }
          });
        } else {
          // Set a general error
          loginForm.setError('root', {
            type: 'server',
            message: result.error || 'Login failed'
          });
        }
      }
    } catch (error) {
      loginForm.setError('root', {
        type: 'server',
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormInputs) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: data.phone,
            password: data.password,
          }),
        });

        const loginResult = await loginResponse.json();

        if (loginResponse.ok) {
          localStorage.setItem('token', loginResult.token);
          localStorage.setItem('user', JSON.stringify(loginResult.user));
          router.push('/dashboard');
        } else {
          registerForm.setError('root', {
            type: 'server',
            message: loginResult.error || 'Registration succeeded but login failed'
          });
        }
      } else {
        // Handle field-specific errors
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((fieldError: any) => {
            if (fieldError.path && fieldError.message && Array.isArray(fieldError.path)) {
              const fieldName = fieldError.path[fieldError.path.length - 1] || fieldError.path[0];
              if (typeof fieldName === 'string' && ['name', 'phone', 'password'].includes(fieldName)) {
                registerForm.setError(fieldName as keyof RegisterFormInputs, {
                  type: 'server',
                  message: fieldError.message
                });
              }
            }
          });
        } else {
          // Set a general error
          registerForm.setError('root', {
            type: 'server',
            message: result.error || 'Registration failed'
          });
        }
      }
    } catch (error) {
      registerForm.setError('root', {
        type: 'server',
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset forms when switching modes
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-dvh bg-orange-50 flex flex-col">
        {/* Mobile Illustration - Full width from top */}
        <div className="flex-1 flex flex-col justify-start pt-0">
          <img 
            src="/images/login.png" 
            alt="AgriSkills Login Illustration" 
            className="block w-full h-auto object-contain mt-0"
          />
        </div>
        
        {/* Mobile Form - No card, directly on background */}
        <div className="bg-orange-50 px-4 pb-4">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{isSignUp ? 'Create Account' : 'Login'}</h1>
            </div>
            
            <div className="space-y-4">
              {/* Login Form */}
              {!isSignUp && (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    {loginForm.formState.errors.root && (
                      <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">
                        {loginForm.formState.errors.root.message}
                      </div>
                    )}
                    
                    <FormField
                      control={loginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
                                +91
                              </span>
                              <Input
                                type="tel"
                                placeholder="XXXXXXXXXX"
                                className="h-12 bg-white border-gray-200 rounded-xl pl-12"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={10}
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                onInput={(e) => {
                                  const value = (e.currentTarget as HTMLInputElement).value;
                                  const sanitized = value.replace(/\D/g, '').slice(0, 10);
                                  if (sanitized !== value) field.onChange(sanitized);
                                }}
                                onPaste={(e) => {
                                  e.preventDefault();
                                  const pasted = e.clipboardData.getData('text');
                                  field.onChange(pasted.replace(/\D/g, '').slice(0, 10));
                                }}
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Password"
                              className="h-12 bg-white border-gray-200 rounded-xl"
                              {...field}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-0">
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'LOGIN'
                        )}
                      </Button>
                      <div className="text-center">
                        <Button asChild variant="ghost" size="sm" className="text-green-700 text-xs h-auto p-0 leading-none">
                          <Link href="/">Return to Home Page</Link>
                        </Button>
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-600">
                        You do not have account ?
                      </p>
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-green-600 font-medium underline mt-1"
                      >
                        Create New Account Here
                      </button>
                    </div>
                  </form>
                </Form>
              )}
            
            {/* Registration Form */}
            {isSignUp && (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  {registerForm.formState.errors.root && (
                    <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">
                      {registerForm.formState.errors.root.message}
                    </div>
                  )}
                  
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Full Name"
                            className="h-12 bg-white border-gray-200 rounded-xl"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
                              +91
                            </span>
                            <Input
                              type="tel"
                              placeholder="XXXXXXXXXX"
                              className="h-12 bg-white border-gray-200 rounded-xl pl-12"
                              inputMode="numeric"
                              pattern="\d*"
                              maxLength={10}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              onInput={(e) => {
                                const value = (e.currentTarget as HTMLInputElement).value;
                                const sanitized = value.replace(/\D/g, '').slice(0, 10);
                                if (sanitized !== value) field.onChange(sanitized);
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pasted = e.clipboardData.getData('text');
                                field.onChange(pasted.replace(/\D/g, '').slice(0, 10));
                              }}
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Password"
                            className="h-12 bg-white border-gray-200 rounded-xl"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm Password"
                            className="h-12 bg-white border-gray-200 rounded-xl"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-0">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl mt-6"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'CREATE ACCOUNT'
                      )}
                    </Button>
                    {/* Inline Return | Sign In row */}
                    <div className="flex items-center justify-center gap-2">
                      <Button asChild variant="ghost" size="sm" className="text-green-700 text-xs h-auto p-0 leading-none">
                        <Link href="/">Return to Home Page</Link>
                      </Button>
                      <span className="text-muted-foreground text-xs">|</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleMode}
                        className="text-green-700 text-xs h-auto p-0 leading-none"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                  
                </form>
              </Form>
            )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
          {/* Toggle Button */}
          <Button
            onClick={toggleMode}
            variant="outline"
            className="absolute right-4 top-4 md:right-8 md:top-8 z-30"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Button>
          
          {/* Left Column - Cover Image */}
          <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')`
              }} 
            />
            <div className="relative z-20 flex items-center text-lg font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-6 w-6"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16.21 2.34.21 3.5 0 5.16-1 9-5.45 9-11V7l-10-5z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              AgriSkills
            </div>
            <div className="relative z-20 mt-auto">
              <blockquote className="space-y-2">
                <p className="text-lg">
                  {isSignUp 
                    ? "Join thousands of farmers transforming agriculture with cutting-edge knowledge and sustainable practices."
                    : "Empowering farmers with knowledge and skills for sustainable agriculture. Transform your farming practices with expert guidance."
                  }
                </p>
                <footer className="text-sm">AgriSkills Team</footer>
              </blockquote>
            </div>
          </div>
          
          {/* Right Column - Dynamic Form */}
          <div className="lg:p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp 
                ? 'Enter your details to create your AgriSkills account'
                : 'Enter your credentials to access your account'
              }
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Login Form */}
            {!isSignUp && (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <div className="grid gap-4">
                    {/* Show general error */}
                    {loginForm.formState.errors.root && (
                      <div className="text-sm text-destructive text-center">
                        {loginForm.formState.errors.root.message}
                      </div>
                    )}

                    {/* Email Field */}
                    <FormField
                      control={loginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel htmlFor="phone">Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
                                +91
                              </span>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="XXXXXXXXXX"
                                autoComplete="tel"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={10}
                                className="pl-12"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                onInput={(e) => {
                                  const value = (e.currentTarget as HTMLInputElement).value;
                                  const sanitized = value.replace(/\D/g, '').slice(0, 10);
                                  if (sanitized !== value) field.onChange(sanitized);
                                }}
                                onPaste={(e) => {
                                  e.preventDefault();
                                  const pasted = e.clipboardData.getData('text');
                                  field.onChange(pasted.replace(/\D/g, '').slice(0, 10));
                                }}
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password Field */}
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <div className="flex items-center">
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <Link
                              href="/forgot-password"
                              className="ml-auto inline-block text-sm underline"
                            >
                              Forgot your password?
                            </Link>
                          </div>
                          <FormControl>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              {...field}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Registration Form */}
            {isSignUp && (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <div className="grid gap-4">
                    {/* Show general error */}
                    {registerForm.formState.errors.root && (
                      <div className="text-sm text-destructive text-center">
                        {registerForm.formState.errors.root.message}
                      </div>
                    )}

                    {/* Name Field */}
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel htmlFor="name">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter your full name"
                              autoComplete="name"
                              {...field}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email Field */}
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel htmlFor="signup-phone">Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
                                +91
                              </span>
                              <Input
                                id="signup-phone"
                                type="tel"
                                placeholder="XXXXXXXXXX"
                                autoComplete="tel"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={10}
                                className="pl-12"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                onInput={(e) => {
                                  const value = (e.currentTarget as HTMLInputElement).value;
                                  const sanitized = value.replace(/\D/g, '').slice(0, 10);
                                  if (sanitized !== value) field.onChange(sanitized);
                                }}
                                onPaste={(e) => {
                                  e.preventDefault();
                                  const pasted = e.clipboardData.getData('text');
                                  field.onChange(pasted.replace(/\D/g, '').slice(0, 10));
                                }}
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password Field */}
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel htmlFor="signup-password">Password</FormLabel>
                          <FormControl>
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Create a password"
                              autoComplete="new-password"
                              {...field}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password Field */}
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel htmlFor="confirm-password">Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm your password"
                              autoComplete="new-password"
                              {...field}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
            
          </div>

          {/* Return to Home Page (Desktop) */}
          <div className="text-center">
            <Button asChild variant="ghost" size="sm" className="text-green-700">
              <Link href="/">Return to Home Page</Link>
            </Button>
          </div>
          
          {/* Test Credentials - Show only on login */}
          {!isSignUp && (
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Test Credentials: (update after you seed a phone-based admin)
              </p>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
