'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import { LoadingButton } from '@/components/ui/loading-button';
import { useToast } from '@/components/ui/toast';
import {
  UserPlus,
  Mail,
  User,
  Lock,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['USER', 'ADMIN']),
  sendWelcomeEmail: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don&apos;t match",
  path: ["confirmPassword"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'USER',
      sendWelcomeEmail: false,
    },
  });

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          sendWelcomeEmail: data.sendWelcomeEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      success('User created successfully');
      router.push('/dashboard/admin/users');
    } catch (error) {
      // console.error removed
      showError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = watch('role');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title="Add New User"
        backPath="/dashboard/admin/users"
        showBackButton={true}
        backText="Back to Users"
      >
      </ResponsiveNav>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Add New User
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create a new user account with appropriate permissions and access levels
            </p>
          </div>

          {/* Form */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                User Information
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Fill in the details for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <Input
                    {...register('name')}
                    placeholder="Enter full name"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="Enter email address"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password (min. 6 characters)"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    User Role
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        {...register('role')}
                        type="radio"
                        value="USER"
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Regular User</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Standard access to purchase tracking and reports
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        {...register('role')}
                        type="radio"
                        value="ADMIN"
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Administrator</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Full system access including user management and settings
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                {/* Role Information Alert */}
                <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    {selectedRole === 'ADMIN' ? (
                      <>
                        <strong>Admin users</strong> will have full system access and won&apos;t have individual permission restrictions.
                      </>
                    ) : (
                      <>
                        <strong>Regular users</strong> will be created with default permissions that can be customized later.
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Welcome Email Option */}
                <div className="flex items-center space-x-3">
                  <input
                    {...register('sendWelcomeEmail')}
                    type="checkbox"
                    id="sendWelcomeEmail"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="sendWelcomeEmail"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Send welcome email with login instructions
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </LoadingButton>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/admin/users')}
                    disabled={isSubmitting}
                    className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}