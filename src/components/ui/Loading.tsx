import React from "react";
import { motion } from "framer-motion";

export interface LoadingProps {
  /**
   * Type of loader to display
   * @default 'spinner'
   */
  variant?: "spinner" | "dots";

  /**
   * Size of the loader
   * @default 'medium'
   */
  size?: "small" | "medium" | "large";

  /**
   * Color of the loader
   * @default '#3b82f6' (Tailwind blue-500)
   */
  color?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Text to display below the loader
   */
  text?: string;

  /**
   * How to center the loader
   * @default 'none' - inline/in-container
   * 'page' - fixed position in middle of viewport
   * 'screen' - full screen overlay with backdrop
   * 'parent' - absolute position within parent container
   */
  center?: "none" | "page" | "screen" | "parent";

  /**
   * Background color when using 'screen' center mode
   * @default 'rgba(255, 255, 255, 0.8)'
   */
  backdropColor?: string;

  /**
   * Blur effect on backdrop when using 'screen' center mode
   * @default true
   */
  backdropBlur?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  variant = "spinner",
  size = "medium",
  color = "#3b82f6",
  className = "",
  text,
  center = "none",
  backdropColor = "rgba(255, 255, 255, 0.8)",
  backdropBlur = true,
}) => {
  // Size mappings for different variants
  const spinnerSizes = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const dotSizes = {
    small: 6,
    medium: 8,
    large: 12,
  };

  // Spinner Component
  const Spinner = () => {
    const spinnerSize = spinnerSizes[size];

    return (
      <motion.div
        className="rounded-full border-4 border-transparent"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderTopColor: color,
          borderRightColor: color,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    );
  };

  // Dots Component
  const Dots = () => {
    const dotSize = dotSizes[size];
    const containerSize = spinnerSizes[size];

    return (
      <div
        className="flex items-center justify-center space-x-2"
        style={{ width: containerSize, height: containerSize }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  };

  // Render based on variant
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <Dots />;
      case "spinner":
      default:
        return <Spinner />;
    }
  };

  // Content to render (loader + text)
  const content = (
    <div className="flex flex-col items-center justify-center">
      {renderLoader()}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-sm font-medium text-gray-600"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  // Handle different centering modes
  switch (center) {
    case "page":
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {content}
        </div>
      );

    case "screen":
      return (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: backdropColor,
            backdropFilter: backdropBlur ? "blur(4px)" : "none",
          }}
        >
          {content}
        </div>
      );

    case "parent":
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          {content}
        </div>
      );

    case "none":
    default:
      return (
        <div
          className={`inline-flex flex-col items-center justify-center ${className}`}
        >
          {renderLoader()}
          {text && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-sm font-medium text-gray-600"
              style={{ color: text ? undefined : "transparent" }}
            >
              {text || "."}
            </motion.p>
          )}
        </div>
      );
  }
};

export default Loading;
