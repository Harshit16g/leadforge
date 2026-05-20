"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase-client/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManagedAvatarProps {
  userId: string | null;
  name: string;
  className?: string;
  editable?: boolean;
  onUpdate?: (newUrl: string) => void;
  fallbackUrl?: string;
  initialUrl?: string | null;
}

const femaleAvatars = Array.from({ length: 15 }, (_, i) => `/avatars/female_avatar_${i + 1}.png`);
const maleAvatars = Array.from({ length: 9 }, (_, i) => `/avatars/male_avatar_${i + 1}.png`);

/**
 * ManagedAvatar Component
 * Follows the "Discrete Management" standard. 
 * Fetches standardized paths from the DB and handles managed updates.
 */
export function ManagedAvatar({
  userId,
  name,
  className,
  editable,
  onUpdate,
  fallbackUrl,
  initialUrl
}: ManagedAvatarProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initialUrl || null);
  const [loading, setLoading] = React.useState(!initialUrl);
  const [uploading, setUploading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const db = createClient();

  // Sync state if initialUrl changes
  React.useEffect(() => {
    if (initialUrl) {
      setAvatarUrl(initialUrl);
      setLoading(false);
    }
  }, [initialUrl]);

  // Load avatar path from Managed Asset Registry only if not provided or if userId changes
  React.useEffect(() => {
    async function loadAvatar() {
      if (!userId || initialUrl) {
        if (!userId) setLoading(false);
        return;
      }
      try {
        // Query current URL via unified resolver
        const { data: url, error } = await db.rpc("get_managed_avatar_url", { p_target_id: userId });
        if (error) throw error;
        if (url) setAvatarUrl(url);
      } catch (e) {
        console.error("Avatar Discovery Failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadAvatar();
  }, [userId, initialUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      // 1. Get Managed Path from DB
      const { data: path, error: pErr } = await db.rpc("get_managed_avatar_path", { p_target_id: userId });
      if (pErr) throw pErr;

      // 2. Managed Upload to 'avatars' bucket
      const { data: uploadData, error: uErr } = await db.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uErr) throw uErr;

      // 3. Get Public/Signed URL
      const { data: { publicUrl } } = db.storage.from("avatars").getPublicUrl(path);

      // 4. Discrete Managed Update to identity layer
      const { error: fErr } = await db.rpc("update_managed_avatar", {
        p_target_id: userId,
        p_avatar_url: publicUrl
      });

      if (fErr) throw fErr;

      setAvatarUrl(publicUrl);
      if (onUpdate) onUpdate(publicUrl);
      toast.success("Profile photo uploaded successfully!");
    } catch (err: any) {
      console.error("Managed Asset Failure:", err);
      toast.error(err.message || "Credential or Rate Limit Failure");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPlatformAvatar = async (url: string) => {
    if (!userId) return;
    setUploading(true);
    setIsDialogOpen(false);
    try {
      const { error } = await db.rpc("update_managed_avatar", {
        p_target_id: userId,
        p_avatar_url: url
      });
      if (error) throw error;

      setAvatarUrl(url);
      if (onUpdate) onUpdate(url);
      toast.success("Profile picture updated successfully!");
    } catch (err: any) {
      console.error("Platform Avatar Update Failure:", err);
      toast.error(err.message || "Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <Avatar className="size-full">
        <AvatarImage src={avatarUrl || fallbackUrl || undefined} className="object-cover animate-fade-in duration-300" />
        <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold uppercase">
          {name ? name.charAt(0) : "?"}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <button 
          onClick={() => setIsDialogOpen(true)}
          disabled={uploading}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none outline-none",
            uploading && "opacity-100",
            isDialogOpen && "opacity-100"
          )}
        >
          {uploading ? (
            <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-6" />
          ) : (
            <span className="icon-[solar--camera-bold-duotone] size-6" />
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        ref={fileInputRef}
      />

      {/* Avatar Picker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg p-6 rounded-3xl sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="icon-[solar--user-circle-bold-duotone] text-primary size-6" />
              Choose Your Profile Picture
            </DialogTitle>
            <DialogDescription>
              Upload a custom photo or choose from our beautiful platform-provided avatars.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 my-2">
            {/* Upload Custom Trigger */}
            <button
              onClick={() => {
                setIsDialogOpen(false);
                setTimeout(() => {
                  fileInputRef.current?.click();
                }, 100);
              }}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all font-semibold text-primary text-sm group cursor-pointer border-none outline-none"
            >
              <span className="icon-[solar--upload-track-bold-duotone] size-6 group-hover:scale-110 transition-transform" />
              Upload Custom Photo
            </button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-3 text-muted-foreground font-semibold">Or Platform Avatars</span>
              </div>
            </div>

            {/* Female Avatars */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <span className="icon-[solar--hearts-bold-duotone] text-rose-500 size-4" />
                Female Avatars
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {femaleAvatars.map((url) => (
                  <button
                    key={url}
                    onClick={() => handleSelectPlatformAvatar(url)}
                    className={cn(
                      "relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border-2 bg-secondary/20 hover:bg-secondary/40 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/5 border-none outline-none",
                      avatarUrl === url ? "border-primary ring-2 ring-primary/20 scale-105 shadow-md" : "border-border/50 hover:border-primary/40"
                    )}
                  >
                    <img src={url} alt="Female Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Male Avatars */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <span className="icon-[solar--lightning-bold-duotone] text-blue-500 size-4" />
                Male Avatars
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {maleAvatars.map((url) => (
                  <button
                    key={url}
                    onClick={() => handleSelectPlatformAvatar(url)}
                    className={cn(
                      "relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border-2 bg-secondary/20 hover:bg-secondary/40 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/5 border-none outline-none",
                      avatarUrl === url ? "border-primary ring-2 ring-primary/20 scale-105 shadow-md" : "border-border/50 hover:border-primary/40"
                    )}
                  >
                    <img src={url} alt="Male Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
