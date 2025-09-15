"use client"

import React, { useEffect } from "react"
import { createPortal } from "react-dom"

interface FullscreenDialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function FullscreenDialog({ isOpen, onClose, children }: FullscreenDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999
      }}
    >
      {children}
    </div>,
    document.body
  )
}