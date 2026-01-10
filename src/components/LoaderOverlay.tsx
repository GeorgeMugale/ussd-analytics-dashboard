import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type LoaderOverlayProps = {
  isLoading: boolean;
  text?: string;
};

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ isLoading, text }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center space-y-4">
            {/* Spinner */}
            <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
            {text && <span className="text-white font-medium">{text}</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoaderOverlay;
