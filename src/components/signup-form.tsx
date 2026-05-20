"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase-client/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BrandLogo } from "@/components/common/BrandLogo"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("return")
  const isInvited = returnUrl?.includes("/invite/")
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [businessName, setBusinessName] = React.useState("")
  const [name, setName] = React.useState("")
  const [emailSent, setEmailSent] = React.useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role: isInvited ? "customer" : "partner",
            name,
            business_name: isInvited ? null : businessName,
            onboarding_step: 0,
            status: isInvited ? "active" : "pending_activation",
          },
        },
      })

      if (error) throw error

      if (data.user?.identities?.length === 0) {
        toast.error("This email is already registered. Please sign in.")
        return
      }

      setEmailSent(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0 border-none shadow-2xl">
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="icon-[solar--letter-bold-duotone] text-primary size-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                We sent a verification link to <strong>{email}</strong>. Click it to activate your account and start onboarding.
              </p>
            </div>
            <div className="w-full bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground border border-border">
              Didn&apos;t receive it? Check your spam folder, or{" "}
              <button
                type="button"
                className="text-primary font-semibold hover:underline"
                onClick={() => { setEmailSent(false); setLoading(false); }}
              >
                try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-none shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8 flex flex-col justify-center" onSubmit={handleSignup}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <BrandLogo variant="symbol" size="lg" className="mb-2" />
                <h1 className="text-2xl font-black tracking-tight uppercase" style={{ fontFamily: 'var(--font-brand)' }}>Create account</h1>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Deploy your service infrastructure
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field className={cn(isInvited && "col-span-2")}>
                  <FieldLabel htmlFor="name">Your Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                {!isInvited && (
                  <Field>
                    <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
                    <Input
                      id="businessName"
                      placeholder="Elite Studio"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </Field>
                )}
              </div>
              <Field>
                <FieldLabel htmlFor="email">Work Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FieldDescription>
                  Must be at least 8 characters.
                </FieldDescription>
              </Field>
              <Field className="mt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <span className="icon-[solar--refresh-circle-bold-duotone] mr-2 size-4 animate-spin" />}
                  Get Started for Free
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-4">
                Or sign up with
              </FieldSeparator>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button" className="w-full">
                  <span className="icon-[solar--refresh-circle-bold-duotone] mr-2 size-4" />
                  Google
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  <span className="icon-[solar--refresh-circle-bold-duotone] mr-2 size-4" />
                  WhatsApp
                </Button>
              </div>
              <FieldDescription className="text-center mt-6">
                Already have an account?{" "}
                <Link href={`/login${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ""}`} className="font-semibold text-primary hover:underline underline-offset-4">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/images/auth-bg.png"
              alt="Leaex Premium Salon Management"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
              <p className="text-lg font-medium leading-relaxed italic">
                &quot;The most seamless way to manage my premium business and connect with customers.&quot;
              </p>
              <p className="mt-2 text-sm text-white/80">— Ananya S., Elite Artistry Studio</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs">
        By continuing, you agree to our <a href="#" className="underline">Terms of Service</a>{" "}
        and <a href="#" className="underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
