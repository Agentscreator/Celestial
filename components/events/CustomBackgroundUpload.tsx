"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Image, X, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CustomBackgroundUploadProps {
  onBackgroundSelected: (url: string, type: 'image' | 'gif') => void
  onBackgroundRemoved: () => void
  currentBackground?: string
  currentBackgroundType?: 'image' | 'gif'
  className?: string
}

export function CustomBackgroundUpload({ 
  onBackgroundSelected, 
  onBackgroundRemoved, 
  currentBackground,
  currentBackgroundType,
  className = ""
}: CustomBackgroundUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBackground || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload background file to storage (placeholder)
  const uploadBackgroundFile = async (file: File): Promise<{ url: string; type: 'image' | 'gif' }> => {
    // This is a placeholder. In a real implementation, you would:
    // 1. Upload the file to your cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Return the URL and detected type

    return new Promise((resolve) => {
      setTimeout(() => {
        const isGif = file.type === 'image/gif'
        const mockUrl = `https://example.com/backgrounds/${Date.now()}.${isGif ? 'gif' : 'jpg'}`
        
        resolve({
          url: mockUrl,
          type: isGif ? 'gif' : 'image'
        })
      }, 2000) // Simulate 2 second upload
    })
  }

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF).",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload file
      toast({
        title: "Uploading",
        description: "Uploading your background...",
      })

      const result = await uploadBackgroundFile(file)
      
      onBackgroundSelected(result.url, result.type)
      
      toast({
        title: "Success",
        description: "Background uploaded successfully!",
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload background. Please try again.",
        variant: "destructive",
      })
      setPreviewUrl(currentBackground || null)
    } finally {
      setUploading(false)
    }
  }

  // Handle URL submission
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL.",
        variant: "destructive",
      })
      return
    }

    try {
      new URL(urlInput)
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL.",
        variant: "destructive",
      })
      return
    }

    // Detect type from URL
    const url = urlInput.toLowerCase()
    const isGif = url.includes('.gif')
    
    setPreviewUrl(urlInput)
    onBackgroundSelected(urlInput, isGif ? 'gif' : 'image')
    
    toast({
      title: "Success",
      description: "Background set successfully!",
    })
  }

  // Remove background
  const handleRemove = () => {
    setPreviewUrl(null)
    setUrlInput('')
    onBackgroundRemoved()
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    
    toast({
      title: "Background Removed",
      description: "Custom background has been removed.",
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-base font-medium">Custom Background</Label>
        <p className="text-sm text-gray-400 mt-1">
          Upload your own image or GIF as the event background
        </p>
      </div>

      {/* Upload Method Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMethod === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('file')}
          className={uploadMethod === 'file' ? 'bg-blue-600' : 'border-gray-600'}
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
        <Button
          type="button"
          variant={uploadMethod === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('url')}
          className={uploadMethod === 'url' ? 'bg-blue-600' : 'border-gray-600'}
        >
          <Image className="h-4 w-4 mr-1" />
          URL
        </Button>
      </div>

      {/* File Upload */}
      {uploadMethod === 'file' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-gray-600 text-white hover:bg-gray-800"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Background Image
              </>
            )}
          </Button>
        </div>
      )}

      {/* URL Input */}
      {uploadMethod === 'url' && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/background.jpg"
            className="bg-gray-800 border-gray-600 text-white"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Set
          </Button>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="relative">
            <div 
              className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${previewUrl})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <span className="text-white text-sm font-medium">Background Preview</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="absolute top-2 right-2 border-gray-600 text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            {currentBackgroundType === 'gif' ? 'Animated GIF' : 'Static Image'} • 
            This will be used as the event card background
          </div>
        </div>
      )}

      {!previewUrl && (
        <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
          <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No custom background selected</p>
          <p className="text-xs text-gray-500 mt-1">Upload an image or GIF to customize your event</p>
        </div>
      )}
    </div>
  )
}