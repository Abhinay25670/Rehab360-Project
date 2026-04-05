import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { FaBrain } from "react-icons/fa";

const Login = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center">
            <FaBrain className="text-white" />
          </div>
          <span className="font-semibold text-lg text-zinc-900">Rehab</span>
        </Link>
      </header>

      {/* Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <SignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none border border-zinc-200 rounded-xl",
              headerTitle: "text-zinc-900 font-semibold",
              headerSubtitle: "text-zinc-600",
              socialButtonsBlockButton: "border-zinc-300 hover:bg-zinc-50",
              socialButtonsBlockButtonText: "text-zinc-700 font-medium",
              dividerLine: "bg-zinc-200",
              dividerText: "text-zinc-500",
              formFieldLabel: "text-zinc-700",
              formFieldInput: "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500",
              formButtonPrimary: "bg-zinc-900 hover:bg-zinc-800",
              footerActionLink: "text-zinc-900 hover:text-zinc-700",
              identityPreviewEditButton: "text-zinc-600 hover:text-zinc-900"
            }
          }}
        />
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-sm text-zinc-500">
          © 2026 Rehab. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Login;
