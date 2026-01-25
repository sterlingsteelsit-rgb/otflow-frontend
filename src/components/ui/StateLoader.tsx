/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Key,
  Shield,
  ShieldCheck,
  Settings,
  Database,
  Activity,
} from "lucide-react";

type ExternalProgress = {
  step: number;
  total: number;
  percent: number;
  label: string;
};

interface StateLoaderProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  connectionSpeed?: "slow" | "medium" | "fast";
  size?: "sm" | "md" | "lg";
  className?: string;
  showConnectionSteps?: boolean;
  progress?: ExternalProgress;
  progressDuration?: number;
  backdropBlur?: boolean;
  backdropOpacity?: boolean;
}

const StateLoader: React.FC<StateLoaderProps> = ({
  message = "Connecting",
  subMessage,
  showProgress = true,
  size = "md",
  className = "",
  showConnectionSteps = true,
  progress,
  progressDuration = 3000,
  backdropOpacity = true,
}) => {
  const usingExternalProgress = !!progress;

  const [internalProgress, setInternalProgress] = useState(0);
  const [internalActiveStep, setInternalActiveStep] = useState(0);

  const connectionSteps = useMemo(
    () => [
      { id: 1, label: "Init", icon: Settings },
      { id: 2, label: "Auth", icon: Key },
      { id: 3, label: "Secure", icon: Shield },
      { id: 4, label: "Verify", icon: ShieldCheck },
      { id: 5, label: "Sync", icon: Database },
    ],
    [],
  );

  const progressValue = usingExternalProgress
    ? progress.percent
    : internalProgress;

  const activeStep = usingExternalProgress
    ? Math.min(
        connectionSteps.length - 1,
        Math.max(
          0,
          Math.round(
            ((progress.step || 0) / Math.max(progress.total || 1, 1)) *
              (connectionSteps.length - 1),
          ),
        ),
      )
    : internalActiveStep;

  const finalSubMessage =
    subMessage ??
    (usingExternalProgress ? progress.label : "Establishing connection...");

  useEffect(() => {
    if (!showProgress || usingExternalProgress) return;

    setInternalProgress(0);
    const intervalDuration = progressDuration / 100;
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + (Math.random() * 8 + 2), 100);
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [showProgress, progressDuration, usingExternalProgress]);

  useEffect(() => {
    if (!showConnectionSteps || usingExternalProgress) return;

    setInternalActiveStep(0);
    const interval = setInterval(() => {
      setInternalActiveStep((prev) => {
        if (prev >= connectionSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, progressDuration / connectionSteps.length);

    return () => clearInterval(interval);
  }, [
    showConnectionSteps,
    progressDuration,
    connectionSteps.length,
    usingExternalProgress,
  ]);

  const sizeConfig = {
    sm: {
      container: "max-w-sm p-6",
      messageSize: "text-base",
      textSize: "text-sm",
      iconSize: "w-3.5 h-3.5",
      stepIconSize: "w-3 h-3",
    },
    md: {
      container: "max-w-md p-8",
      messageSize: "text-lg",
      textSize: "text-sm",
      iconSize: "w-4 h-4",
      stepIconSize: "w-3.5 h-3.5",
    },
    lg: {
      container: "max-w-lg p-10",
      messageSize: "text-xl",
      textSize: "text-base",
      iconSize: "w-4.5 h-4.5",
      stepIconSize: "w-4 h-4",
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <>
      {backdropOpacity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="fixed inset-0 bg-gray-900 z-40"
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`bg-white rounded-lg shadow-lg border border-gray-200 ${currentSize.container} ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-px bg-gray-300" />
              <span className="text-xs font-medium text-gray-500 tracking-wider">
                CONNECTING
              </span>
            </div>
            <motion.div
              animate={progressValue < 100 ? { rotate: 360 } : {}}
              transition={{
                duration: 2,
                repeat: progressValue < 100 ? Infinity : 0,
                ease: "linear",
              }}
            >
              <RefreshCw className={`${currentSize.iconSize} text-gray-400`} />
            </motion.div>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <div
              className={`${currentSize.messageSize} font-normal text-gray-900 mb-2`}
            >
              {message}
            </div>
            <div className={`${currentSize.textSize} text-gray-500`}>
              {finalSubMessage}
            </div>
          </div>

          {/* Connection Steps */}
          {showConnectionSteps && (
            <div className="mb-8">
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-px bg-gray-800 -translate-y-1/2 transition-all duration-300"
                  style={{
                    width: `${(activeStep / (connectionSteps.length - 1)) * 100}%`,
                  }}
                />

                <div className="relative flex justify-between">
                  {connectionSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === activeStep;
                    const isCompleted = index < activeStep;

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <div
                          className={`
                            p-2 rounded-md mb-2
                            ${
                              isCompleted
                                ? "bg-gray-900"
                                : isActive
                                  ? "bg-white border border-gray-300"
                                  : "bg-gray-100"
                            }
                          `}
                        >
                          {isCompleted ? (
                            <div className="text-white">
                              <Icon className={currentSize.stepIconSize} />
                            </div>
                          ) : (
                            <Icon
                              className={`${currentSize.stepIconSize} ${
                                isActive ? "text-gray-900" : "text-gray-400"
                              }`}
                            />
                          )}
                        </div>
                        <div
                          className={`text-xs ${
                            index <= activeStep
                              ? "text-gray-900 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {showProgress && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className={currentSize.iconSize} />
                  <span>Progress</span>
                </div>
                <span className="font-medium">
                  {Math.round(progressValue)}%
                </span>
              </div>

              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gray-800 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressValue}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {progressValue >= 100 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600 text-center">
                    Connection established
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default StateLoader;
