"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SimpleNewPostTestProps {
  isOpen: boolean
  onClose: () => void
}

export function SimpleNewPostTest({ isOpen, onClose }: SimpleNewPostTestProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed inset-0 w-full h-full max-w-none max-h-none p-0 bg-red-500 border-none rounded-none [&>button]:hidden overflow-hidden z-[100]"
        hideTitle={true}
        title="Test Dialog"
        description="Testing dialog visibility"
        style={{
          transform: 'none',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          maxHeight: 'none',
          position: 'fixed'
        }}
      >
        <div className="relative w-full h-full bg-red-500 flex items-center justify-center">
          <div className="text-white text-2xl font-bold">
            TEST DIALOG IS VISIBLE
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-3"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}