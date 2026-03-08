import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { PillButton } from "@/components/ui/PillButton";
import { Terminal, Home } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageContainer className="flex items-center justify-center min-h-[80vh]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <MinimalCard className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <Terminal className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl font-mono font-bold text-foreground mb-2 tracking-tight">404</h1>
          <h2 className="text-xl font-semibold text-muted-foreground mb-4">Sector Not Found</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-[250px] mx-auto leading-relaxed">
            The coordinates you provided do not exist in the current directory tree.
          </p>
          <Link to="/">
            <PillButton className="gap-2">
              <Home className="w-4 h-4" />
              Return to Base
            </PillButton>
          </Link>
        </MinimalCard>
      </motion.div>
    </PageContainer>
  );
};

export default NotFound;
