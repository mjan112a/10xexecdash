import { InfoIcon } from "lucide-react";
import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function ProtectedPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session-token');

  if (!sessionToken) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Welcome!</h2>
        <p>You have successfully authenticated with the following credentials:</p>
        <pre className="text-xs font-mono p-3 rounded border bg-gray-50">
          Username: ricci
        </pre>
      </div>
      <div className="mt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
