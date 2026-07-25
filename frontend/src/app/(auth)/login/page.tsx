'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/shared/api/hooks';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      router.push('/');
      router.refresh();
    } catch {
      reset();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your SkillTree account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
                disabled={loginMutation.isPending}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-sm text-destructive" role="alert">{errors.email.message as string}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password', { required: 'Password is required' })}
                disabled={loginMutation.isPending}
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="text-sm text-destructive" role="alert">{errors.password.message as string}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <p className="text-sm text-text-muted text-center">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}