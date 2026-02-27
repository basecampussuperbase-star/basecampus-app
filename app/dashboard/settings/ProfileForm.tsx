'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import { Loader2, Save, Upload, User, Smartphone, Youtube, Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface Profile {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
    description: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
    linkedin_url: string | null;
    facebook_url: string | null;
    twitter_url: string | null;
    whatsapp_number: string | null;
}

export default function ProfileForm({ user }: { user: Profile }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url);

    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        description: user.description || '',
        instagram_url: user.instagram_url || '',
        tiktok_url: user.tiktok_url || '',
        youtube_url: user.youtube_url || '',
        linkedin_url: user.linkedin_url || '',
        facebook_url: user.facebook_url || '',
        twitter_url: user.twitter_url || '',
        whatsapp_number: user.whatsapp_number || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload 
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(publicUrl);

            // Auto-save avatar update
            await updateProfile({ avatar_url: publicUrl });
            router.refresh();

        } catch (error: any) {
            alert('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile(formData);
            alert('Perfil actualizado correctamente');
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert('Error al actualizar el perfil: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            {/* 1. Basic Info */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Foto de Perfil</label>
                        <div className="flex items-center gap-4">
                            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted border">
                                {avatarUrl && avatarUrl.startsWith('http') ? (
                                    <Image
                                        src={avatarUrl}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                        priority
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <User className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label
                                    htmlFor="avatar-upload"
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer text-sm font-medium transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    Subir nueva foto
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                                <p className="text-xs text-muted-foreground mt-2">Recomendado: 400x400px. JPG o PNG.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre Completo</label>
                        <input
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Tu nombre público"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Biografía / Descripción</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            placeholder="Cuéntale a tus estudiantes sobre ti..."
                        />
                        <p className="text-xs text-muted-foreground">Se mostrará en la página de tu perfil y cursos.</p>
                    </div>
                </div>

                {/* 2. Social Media & Contact */}
                <div className="space-y-4 border rounded-lg p-6 bg-card">
                    <h3 className="font-semibold text-lg mb-4">Redes Sociales y Contacto</h3>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <Instagram className="h-3 w-3" /> Instagram
                            </label>
                            <input
                                name="instagram_url"
                                value={formData.instagram_url}
                                onChange={handleChange}
                                placeholder="https://instagram.com/usuario"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <span className="font-bold text-[10px]">TikTok</span> TikTok
                            </label>
                            <input
                                name="tiktok_url"
                                value={formData.tiktok_url}
                                onChange={handleChange}
                                placeholder="https://tiktok.com/@usuario"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <Youtube className="h-3 w-3" /> YouTube
                            </label>
                            <input
                                name="youtube_url"
                                value={formData.youtube_url}
                                onChange={handleChange}
                                placeholder="https://youtube.com/c/canal"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <Linkedin className="h-3 w-3" /> LinkedIn
                            </label>
                            <input
                                name="linkedin_url"
                                value={formData.linkedin_url}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/in/usuario"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <Twitter className="h-3 w-3" /> X (Twitter)
                            </label>
                            <input
                                name="twitter_url"
                                value={formData.twitter_url}
                                onChange={handleChange}
                                placeholder="https://x.com/usuario"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
                                <Facebook className="h-3 w-3" /> Facebook
                            </label>
                            <input
                                name="facebook_url"
                                value={formData.facebook_url}
                                onChange={handleChange}
                                placeholder="https://facebook.com/usuario"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2 mt-4">
                            <label className="text-xs font-medium uppercase text-green-600 flex items-center gap-2">
                                <Smartphone className="h-3 w-3" /> WhatsApp Business
                            </label>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-muted-foreground">wa.me/</span>
                                <input
                                    name="whatsapp_number"
                                    value={formData.whatsapp_number}
                                    onChange={handleChange}
                                    placeholder="584121234567"
                                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Ingresa el número con código de país (ej. 58 para Venezuela) sin el signo +.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}
