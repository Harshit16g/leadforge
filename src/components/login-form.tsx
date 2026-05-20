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
import { BootstrapScreen } from "@/components/system/BootstrapScreen"

const ADMIN_ROLES   = new Set(["admin", "core_admin", "mgmt_admin", "ops_admin", "support_admin", "audit_admin"])
const PARTNER_ROLES = new Set(["partner", "org_owner", "owner_partner", "mgr_partner", "branch_partner", "franchise_partner"])
const STAFF_ROLES   = new Set(["employee", "supervisor", "floor_staff", "cashier", "technician"])

function roleHome(role?: string): string {
  if (role && ADMIN_ROLES.has(role))   return "/admin/dashboard"
  if (role && PARTNER_ROLES.has(role)) return "/partner/dashboard"
  if (role && STAFF_ROLES.has(role))   return "/employee/today"
  return "/customer"
}

export function LoginForm({
  className,
  showSignupLink = true,
  ...props
}: React.ComponentProps<"div"> & { showSignupLink?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("return")
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)
  const [isBootstrapping, setIsBootstrapping] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<string>("partner")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      const userRole = (data.user?.user_metadata?.role as any) || 'partner'
      setRole(userRole)
      
      // Start the splash experience immediately
      setIsBootstrapping(true)
      toast.success("Welcome back!")
      
      router.push(returnUrl || roleHome(userRole))

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid login credentials")
    } finally {
      setLoading(false)
    }
  }

  if (isBootstrapping) {
    return <BootstrapScreen stage="idle" role={role as any} />
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-none shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8 flex flex-col justify-center" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <BrandLogo variant="symbol" size="lg" className="mb-2" />
                <h1 className="text-2xl font-black tracking-tight uppercase" style={{ fontFamily: 'var(--font-brand)' }}>Welcome back</h1>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Operational Intelligence Interface
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm font-medium text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field className="mt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <span className="icon-[solar--refresh-circle-bold-duotone] mr-2 size-4 animate-spin" />}
                  Sign In
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-4">
                Or continue with
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
              {showSignupLink && (
                <FieldDescription className="text-center mt-6">
                  Don&apos;t have an account?{" "}
                  <Link href={`/signup${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ""}`} className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign up
                  </Link>
                </FieldDescription>
              )}
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
                &quot;The most seamless way to manage my luxury salon and connect with customers.&quot;
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
