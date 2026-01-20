import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-lg">
          {/* Logo Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
            </div>
            <div className="text-3xl font-black tracking-tight">
              OT
              <span className="bg-gradient-to-r from-brand-blue to-blue-600 bg-clip-text text-transparent">
                Flow
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Overtime Management System
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Email"
                placeholder="admin@company.com"
                {...register("email")}
                error={errors.email?.message}
                className="border-gray-300"
              />
              <Input
                label="Password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
                className="border-gray-300"
              />
            </div>

            <Button
              type="submit"
              variant="ghost"
              icon={<LogIn className="h-4 w-4" />}
              iconPosition="left"
              className="w-full text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </Button>

            <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50/80 to-gray-100/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="text-xs text-gray-600">
                  <div className="font-medium text-gray-900">
                    System Information
                  </div>
                  <div className="mt-1">
                    For account assistance or creation, please contact your Administrator.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
              <Shield className="h-4 w-4 text-gray-400" />
              <div className="text-xs text-gray-500">
                By Vidun Hettiarachchi
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
