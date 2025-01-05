'use client';

import { deleteAccount, updateAccount, updatePassword } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Loader2 } from 'lucide-react';
import { startTransition, useActionState } from 'react';

type ActionState = {
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const { user } = useUser();
  const [passwordState, passwordAction, isPasswordPending] = useActionState<ActionState, FormData>(updatePassword, {
    error: '',
    success: '',
  });

  const [deleteState, deleteAction, isDeletePending] = useActionState<ActionState, FormData>(deleteAccount, {
    error: '',
    success: '',
  });

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTransition.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
      passwordAction(new FormData(event.currentTarget));
    });
  };

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      deleteAction(new FormData(event.currentTarget));
    });
  };

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateAccount, {
    error: '',
    success: '',
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTranstion.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
      formAction(new FormData(event.currentTarget));
    });
  };

  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-extrabold text-gray-900 mb-6">Account Settings</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                defaultValue={user?.name || ''}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Your email"
                defaultValue={user?.email || ''}
                required
              />
            </div>
            {state.error && <p className="text-red-500 text-xs">{state.error}</p>}
            {state.success && <p className="text-green-500 text-xs">{state.success}</p>}
            <Button
              type="submit"
              variant={'secondary'}
              disabled={isPending}
              size="sm"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handlePasswordSubmit}
          >
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {passwordState.error && <p className="text-red-500 text-xs">{passwordState.error}</p>}
            {passwordState.success && <p className="text-green-500 text-xs">{passwordState.success}</p>}
            <Button
              type="submit"
              variant={'secondary'}
              disabled={isPasswordPending}
              size="sm"
            >
              {isPasswordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update Password</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Account deletion is non-reversable. Please proceed with caution.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleDeleteSubmit}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="delete-password">Confirm Password</Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {deleteState.error && <p className="text-red-500 text-xs">{deleteState.error}</p>}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletePending}
              size="sm"
            >
              {isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Delete Account</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
