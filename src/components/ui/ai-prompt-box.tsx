"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Paperclip, Square, X, StopCircle, Mic, Wallet, TrendingUp, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const STYLE_TAG_ID = "atlas-prompt-input-styles";
const styles = `
  textarea.atlas-textarea::-webkit-scrollbar { width: 6px; }
  textarea.atlas-textarea::-webkit-scrollbar-track { background: transparent; }
  textarea.atlas-textarea::-webkit-scrollbar-thumb { background-color: var(--gold-muted, #8A7548); border-radius: 3px; }
  textarea.atlas-textarea::-webkit-scrollbar-thumb:hover { background-color: var(--gold-primary, #C9A961); }
`;
if (typeof document !== "undefined" && !document.getElementById(STYLE_TAG_ID)) {
  const tag = document.createElement("style");
  tag.id = STYLE_TAG_ID;
  tag.innerText = styles;
  document.head.appendChild(tag);
}

// ──────────────── Textarea ────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "atlas-textarea flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none",
      className,
    )}
    style={{ color: "var(--text-primary)" }}
    ref={ref}
    rows={1}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ──────────────── Tooltip ────────────────
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
      className,
    )}
    style={{
      borderColor: "var(--border-default)",
      background: "var(--bg-elevated-2)",
      color: "var(--text-primary)",
    }}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ──────────────── Dialog ────────────────
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border p-0 shadow-xl rounded-2xl",
        className,
      )}
      style={{
        borderColor: "var(--border-default)",
        background: "var(--bg-elevated)",
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full p-2 transition-all hover:opacity-80" style={{ background: "var(--bg-elevated-2)" }}>
        <X className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    style={{ color: "var(--text-primary)" }}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ──────────────── Button ────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "h-8 w-8 rounded-full aspect-[1/1]",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// ──────────────── Voice Recorder ────────────────
interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onStopRecording(time);
      setTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full transition-all duration-300 py-3",
        isRecording ? "opacity-100" : "opacity-0 h-0",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--signal-negative)" }} />
        <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatTime(time)}
        </span>
      </div>
      <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
        {[...Array(visualizerBars)].map((_, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full animate-pulse"
            style={{
              background: "var(--gold-primary)",
              height: `${Math.max(15, Math.random() * 100)}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ──────────────── Image View ────────────────
interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}
const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw] md:max-w-[800px]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "var(--bg-elevated)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Full preview" className="w-full max-h-[80vh] object-contain rounded-2xl" />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// ──────────────── Prompt Input Context ────────────────
interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});
function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput must be used within a PromptInput");
  return context;
}

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue: onValueChange ?? handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "glass-surface rounded-3xl p-2 transition-all duration-300",
              className,
            )}
            style={{
              borderColor: isLoading ? "var(--gold-bright)" : undefined,
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  },
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps {
  disableAutosize?: boolean;
  placeholder?: string;
}
const PromptInputTextarea: React.FC<PromptInputTextareaProps & React.ComponentProps<typeof Textarea>> = ({
  className,
  onKeyDown,
  disableAutosize = false,
  placeholder,
  ...props
}) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-base", className)}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
};

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {}
const PromptInputActions: React.FC<PromptInputActionsProps> = ({ children, className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const CustomDivider: React.FC = () => (
  <div className="relative h-6 w-[1.5px] mx-1">
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: "linear-gradient(to top, transparent, var(--gold-muted, #8A7548) 50%, transparent)",
        opacity: 0.7,
      }}
    />
  </div>
);

// ──────────────── Public PromptInputBox ────────────────
export type AtlasPromptMode = "default" | "accounts" | "insights" | "goals";

interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[], mode?: AtlasPromptMode) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  initialMode?: AtlasPromptMode;
}

export const PromptInputBox = React.forwardRef((props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
  const {
    onSend = () => {},
    isLoading = false,
    placeholder = "Ask Atlas about your portfolio…",
    className,
    initialMode = "default",
  } = props;
  const [input, setInput] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [filePreviews, setFilePreviews] = React.useState<{ [key: string]: string }>({});
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [showAccounts, setShowAccounts] = React.useState(initialMode === "accounts");
  const [showInsights, setShowInsights] = React.useState(initialMode === "insights");
  const [showGoals, setShowGoals] = React.useState(initialMode === "goals");
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const promptBoxRef = React.useRef<HTMLDivElement>(null);

  const handleToggle = (which: "accounts" | "insights" | "goals") => {
    if (which === "accounts") {
      setShowAccounts((p) => !p);
      setShowInsights(false);
      setShowGoals(false);
    } else if (which === "insights") {
      setShowInsights((p) => !p);
      setShowAccounts(false);
      setShowGoals(false);
    } else {
      setShowGoals((p) => !p);
      setShowAccounts(false);
      setShowInsights(false);
    }
  };

  const currentMode: AtlasPromptMode = showAccounts
    ? "accounts"
    : showInsights
      ? "insights"
      : showGoals
        ? "goals"
        : "default";

  const isImageFile = (file: File) => file.type.startsWith("image/");

  const processFile = (file: File) => {
    if (!isImageFile(file)) return;
    if (file.size > 10 * 1024 * 1024) return;
    setFiles([file]);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreviews({ [file.name]: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files);
    const imageFiles = dropped.filter((f) => isImageFile(f));
    if (imageFiles.length > 0 && imageFiles[0]) processFile(imageFiles[0]);
  }, []);

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove && filePreviews[fileToRemove.name]) setFilePreviews({});
    setFiles([]);
  };

  const openImageModal = (imageUrl: string) => setSelectedImage(imageUrl);

  const handlePaste = React.useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it && it.type.indexOf("image") !== -1) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          break;
        }
      }
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input.trim(), files, currentMode);
    setInput("");
    setFiles([]);
    setFilePreviews({});
  };

  const handleStartRecording = () => {
    /* placeholder */
  };

  const handleStopRecording = (duration: number) => {
    setIsRecording(false);
    onSend(`[Voice message — ${duration}s]`, [], currentMode);
  };

  const hasContent = input.trim() !== "" || files.length > 0;

  const modeColor = "var(--gold-primary)";
  const modeBg = "rgba(201,169,97,0.12)";
  const modeBorder = "var(--gold-primary)";

  const toggleClass = (active: boolean) =>
    cn(
      "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
      active ? "" : "bg-transparent border-transparent hover:opacity-80",
    );
  const toggleStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: modeBg, borderColor: modeBorder, color: modeColor }
      : { color: "var(--text-tertiary)" };

  return (
    <>
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        className={cn("w-full transition-all duration-300 ease-in-out", className)}
        disabled={isLoading || isRecording}
        ref={ref || promptBoxRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.length > 0 && !isRecording && (
          <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") && filePreviews[file.name] && (
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                    onClick={() => openImageModal(filePreviews[file.name]!)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={filePreviews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={cn("transition-all duration-300", isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100")}>
          <PromptInputTextarea
            placeholder={
              showAccounts
                ? "Ask about your accounts and holdings…"
                : showInsights
                  ? "Ask for deeper portfolio analysis…"
                  : showGoals
                    ? "Ask about your goals and progress…"
                    : placeholder
            }
            className="text-base"
          />
        </div>

        {isRecording && (
          <VoiceRecorder
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
          />
        )}

        <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
          <div className={cn("flex items-center gap-1 transition-opacity duration-300", isRecording ? "opacity-0 invisible h-0" : "opacity-100 visible")}>
            <PromptInputAction tooltip="Upload image">
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:opacity-80"
                style={{ color: "var(--text-tertiary)" }}
                disabled={isRecording}
              >
                <Paperclip className="h-5 w-5" />
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]!);
                    if (e.target) e.target.value = "";
                  }}
                  accept="image/*"
                />
              </button>
            </PromptInputAction>

            <div className="flex items-center">
              <button type="button" onClick={() => handleToggle("accounts")} className={toggleClass(showAccounts)} style={toggleStyle(showAccounts)}>
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{ rotate: showAccounts ? 360 : 0, scale: showAccounts ? 1.1 : 1 }}
                    whileHover={{ rotate: showAccounts ? 360 : 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  >
                    <Wallet className="w-4 h-4" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showAccounts && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
                    >
                      Accounts
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <CustomDivider />

              <button type="button" onClick={() => handleToggle("insights")} className={toggleClass(showInsights)} style={toggleStyle(showInsights)}>
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{ rotate: showInsights ? 360 : 0, scale: showInsights ? 1.1 : 1 }}
                    whileHover={{ rotate: showInsights ? 360 : 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showInsights && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
                    >
                      Insights
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <CustomDivider />

              <button type="button" onClick={() => handleToggle("goals")} className={toggleClass(showGoals)} style={toggleStyle(showGoals)}>
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{ rotate: showGoals ? 360 : 0, scale: showGoals ? 1.1 : 1 }}
                    whileHover={{ rotate: showGoals ? 360 : 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  >
                    <Target className="w-4 h-4" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showGoals && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
                    >
                      Goals
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          <PromptInputAction
            tooltip={
              isLoading ? "Stop generation" : isRecording ? "Stop recording" : hasContent ? "Send message" : "Voice message"
            }
          >
            <Button
              size="icon"
              className={cn("h-8 w-8 rounded-full transition-all duration-200")}
              style={{
                background: hasContent ? "var(--gold-primary)" : "transparent",
                color: hasContent ? "var(--bg-base)" : "var(--text-tertiary)",
              }}
              onClick={() => {
                if (isRecording) setIsRecording(false);
                else if (hasContent) handleSubmit();
                else setIsRecording(true);
              }}
              disabled={isLoading && !hasContent}
            >
              {isLoading ? (
                <Square className="h-4 w-4 animate-pulse" style={{ fill: "var(--gold-primary)" }} />
              ) : isRecording ? (
                <StopCircle className="h-5 w-5" style={{ color: "var(--signal-negative)" }} />
              ) : hasContent ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>

      <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
});
PromptInputBox.displayName = "PromptInputBox";
