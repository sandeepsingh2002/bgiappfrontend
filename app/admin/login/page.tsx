"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ADMIN_TOKEN_COOKIE, apiFetch } from "@/lib/api";

type TokenResponse = { token: string };

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<TokenResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      document.cookie = `${ADMIN_TOKEN_COOKIE}=${data.token}; Path=/; Max-Age=86400; SameSite=Lax`;
      router.replace("/admin");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-100 p-6">
      <Card className="w-full max-w-md border-2 border-orange-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in to manage verification and traceability operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
