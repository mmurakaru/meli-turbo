'use client';

import { Button } from '@repo/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ plan }: { plan: string }) {
  const { pending } = useFormStatus();
  const isFreePlan = plan === 'Free';

  return (
    <Button
      type="submit"
      disabled={pending}
      variant={isFreePlan ? 'outline' : 'default'}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          Loading...
        </>
      ) : (
        <>{isFreePlan ? 'Get Started' : `Choose ${plan}`}</>
      )}
    </Button>
  );
}
