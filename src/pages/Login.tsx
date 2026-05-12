import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, AlertCircle } from "lucide-react";
import SessionExpiredLoginNotice from "../components/ui/SessionExpiredLoginNotice";
import { LogIn } from "@/components/animate-ui/icons/log-in";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background animation
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 1,
          ease: "power2.out",
        },
      );

      // Card animation
      gsap.fromTo(
        cardRef.current,
        {
          y: 50,
          opacity: 0,
          scale: 0.96,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power4.out",
        },
      );

      // Logo floating
      gsap.fromTo(
        logoRef.current,
        {
          y: -10,
        },
        {
          y: 10,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
      );

      // Form stagger animation
      gsap.fromTo(
        formRef.current?.children || [],
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out",
        },
      );

      // Button idle pulse
      gsap.to(buttonRef.current, {
        boxShadow: "0px 0px 20px rgba(59,130,246,0.15)",
        repeat: -1,
        yoyo: true,
        duration: 1.8,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  async function onSubmit(values: Form) {
    const t = toast.loading("Signing in...");
    try {
      await login(values.email, values.password);
      toast.success("Welcome!", { id: t });
      nav("/dashboard");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Login failed", { id: t });
    }
  }

  return (
    <>
      <SessionExpiredLoginNotice />

      <div
        ref={containerRef}
        className="min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900"
      >
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 animate-pulse rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 animate-pulse rounded-full bg-sky-100/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 animate-pulse rounded-full bg-indigo-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4">
          <div
            ref={cardRef}
            className="w-full rounded-2xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
          >
            {/* Logo Header */}
            <div className="mb-8 text-center">
              <div className="text-4xl font-black tracking-tight">
                OT
                <span className="bg-gradient-to-r from-brand-blue to-blue-600 bg-clip-text text-transparent">
                  Flow
                </span>
              </div>

              <div className="mt-3 text-sm tracking-wide text-gray-500">
                Overtime Management System
              </div>
            </div>

            <form
              ref={formRef}
              className="space-y-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-4">
                <Input
                  label="Email"
                  placeholder="user@sterlingsteels.com"
                  {...register("email")}
                  error={errors.email?.message}
                  className="border-gray-300 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />

                <Input
                  label="Password"
                  type="password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="border-gray-300 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <Button
                ref={buttonRef}
                type="submit"
                variant="ghost"
                className="group relative w-full overflow-hidden border border-gray-300 bg-white font-black text-gray-700 transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
                disabled={isSubmitting}
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-100/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

                <div className="relative flex items-center justify-center gap-2">
                  {!isSubmitting && (
                    <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  )}

                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                      Signing in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </div>
              </Button>

              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50/90 to-gray-100/70 p-4 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-gray-500" />

                  <div className="text-xs text-gray-600">
                    <div className="font-medium text-gray-900">
                      System Information
                    </div>

                    <div className="mt-1 leading-relaxed">
                      For account assistance or creation, please contact your
                      Administrator.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-4">
                <User className="h-4 w-4 text-gray-400" />

                <div className="text-xs text-gray-500">
                  Developed by{" "}
                  <span className="font-medium text-black">
                    Vidun Hettiarachchi
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
