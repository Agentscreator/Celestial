import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function toast({ title, description, variant = "default", duration }: ToastProps) {
  const options = {
    description,
    duration,
  }

  if (variant === "destructive") {
    sonnerToast.error(title || "Error", options)
  } else {
    sonnerToast.success(title || "Success", options)
  }
}

export { toast as useToast }