"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Mic, MapPin, Users, Smartphone, Shield, Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Permission {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  required: boolean
  granted: boolean | null
}

interface PermissionStepProps {
  onComplete: (grantedPermissions: string[]) => void
  onSkip: () => void
}

export function PermissionStep({ onComplete, onSkip }: PermissionStepProps) {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: "camera",
      title: "Camera & Photos",
      description: "Take photos and videos to share with your connections",
      icon: Camera,
      required: false,
      granted: null
    },
    {
      id: "microphone",
      title: "Microphone",
      description: "Record voice messages and video calls",
      icon: Mic,
      required: false,
      granted: null
    },
    {
      id: "location",
      title: "Location Services",
      description: "Find people nearby and get location-based recommendations",
      icon: MapPin,
      required: false,
      granted: null
    },
    {
      id: "contacts",
      title: "Contacts",
      description: "Find friends who are already on Mirro",
      icon: Users,
      required: false,
      granted: null
    },
    {
      id: "notifications",
      title: "Push Notifications",
      description: "Get notified about messages and connections",
      icon: Smartphone,
      required: false,
      granted: null
    }
  ])

  const [requesting, setRequesting] = useState(false)

  const requestPermission = async (permissionId: string) => {
    setRequesting(true)
    
    try {
      let granted = false

      switch (permissionId) {
        case "camera":
          try {
            const { requestCameraPermissions } = await import("@/utils/camera")
            const result = await requestCameraPermissions()
            granted = result.granted
          } catch (error) {
            console.error("Camera permission error:", error)
            granted = false
          }
          break

        case "microphone":
          if (typeof navigator !== "undefined" && navigator.mediaDevices) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
              stream.getTracks().forEach(track => track.stop())
              granted = true
            } catch {
              granted = false
            }
          }
          break

        case "location":
          if (typeof navigator !== "undefined" && navigator.geolocation) {
            try {
              await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject)
              })
              granted = true
            } catch {
              granted = false
            }
          }
          break

        case "notifications":
          if (typeof window !== "undefined" && "Notification" in window) {
            try {
              const result = await Notification.requestPermission()
              granted = result === "granted"
            } catch {
              granted = false
            }
          }
          break

        case "contacts":
          // Contacts API is not widely supported, skip for web
          granted = false
          break

        default:
          granted = false
      }

      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, granted } : p
      ))

      if (granted) {
        toast({
          title: "Permission granted",
          description: `${permissions.find(p => p.id === permissionId)?.title} access enabled`,
        })
      } else {
        toast({
          title: "Permission denied",
          description: `${permissions.find(p => p.id === permissionId)?.title} access not granted`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Error requesting ${permissionId} permission:`, error)
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, granted: false } : p
      ))
    } finally {
      setRequesting(false)
    }
  }

  const requestAllPermissions = async () => {
    setRequesting(true)
    
    for (const permission of permissions) {
      if (permission.granted === null) {
        await requestPermission(permission.id)
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    
    setRequesting(false)
  }

  const handleComplete = () => {
    const grantedPermissions = permissions
      .filter(p => p.granted === true)
      .map(p => p.id)
    
    onComplete(grantedPermissions)
  }

  const hasRequestedAll = permissions.every(p => p.granted !== null)
  const grantedCount = permissions.filter(p => p.granted === true).length

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white">App Permissions</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Grant permissions to unlock the full Mirro experience. You can change these anytime in your device settings.
        </p>
      </div>

      <div className="space-y-3">
        {permissions.map((permission) => {
          const IconComponent = permission.icon
          return (
            <Card 
              key={permission.id} 
              className={`bg-gray-800/50 border-gray-700 transition-colors ${
                permission.granted === true ? 'border-green-500/50 bg-green-900/10' :
                permission.granted === false ? 'border-red-500/50 bg-red-900/10' :
                'hover:border-gray-600'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      permission.granted === true ? 'bg-green-500/20 text-green-400' :
                      permission.granted === false ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">
                        {permission.title}
                        {permission.required && (
                          <span className="text-red-400 ml-1 text-xs">*</span>
                        )}
                      </h4>
                      <p className="text-gray-400 text-xs">{permission.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {permission.granted === true && (
                      <div className="flex items-center text-green-400">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {permission.granted === false && (
                      <div className="flex items-center text-red-400">
                        <X className="h-4 w-4" />
                      </div>
                    )}
                    {permission.granted === null && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestPermission(permission.id)}
                        disabled={requesting}
                        className="h-8 text-xs border-gray-600 text-white hover:bg-gray-700"
                      >
                        Grant
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!hasRequestedAll && (
        <div className="text-center">
          <Button
            onClick={requestAllPermissions}
            disabled={requesting}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            {requesting ? "Requesting permissions..." : "Grant All Permissions"}
          </Button>
        </div>
      )}

      {hasRequestedAll && (
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-400">
            {grantedCount > 0 ? (
              <>✓ {grantedCount} of {permissions.length} permissions granted</>
            ) : (
              "No permissions granted"
            )}
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1 border-gray-600 text-white hover:bg-gray-700"
            >
              Continue Without Permissions
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          You can manage these permissions later in your device settings
        </p>
      </div>
    </div>
  )
}