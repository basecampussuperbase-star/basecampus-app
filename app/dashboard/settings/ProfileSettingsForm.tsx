'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import { Loader2, Save, User, Briefcase, Globe, Linkedin, Instagram, Phone } from 'lucide-react';

import AvatarUpload from '@/components/AvatarUpload';

export default function ProfileSettingsForm({ profile }: { profile: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        headline: profile?.headline || '',
        bio: profile?.bio || '',
        website: profile?.website || '',
        linkedin_url: profile?.linkedin_url || '',
        instagram_url: profile?.instagram_url || '',
        whatsapp: profile?.whatsapp || '',
        avatar_url: profile?.avatar_url || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAvatarUpload = (url: string) => {
        setFormData(prev => ({ ...prev, avatar_url: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await updateProfile(formData);
        setIsLoading(false);
        if (result.success) {
            alert('Perfil actualizado correctamente');
        } else {
            alert('Error al actualizar: ' + result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Información Básica
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-shrink-0">
                        <label className="block text-sm font-medium mb-2 text-center">Foto de Perfil</label>
                        <AvatarUpload
                            uid={profile?.id || 'new'}
                            url={formData.avatar_url}
                            onUpload={handleAvatarUpload}
                        />
                    </div>

                    <div className="flex-1 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre Completo</label>
                            <input
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título Profesional</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    name="headline"
                                    value={formData.headline}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
                                    placeholder="Ej: Senior Software Engineer"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Biografía</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={4}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Cuéntanos sobre tu experiencia..."
                            />
                            <p className="text-[10px] text-muted-foreground text-right">Visible en la página del curso.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Social & Contact */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Redes y Contacto
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sitio Web</label>
                        <input
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="https://tuporfolio.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">WhatsApp (Público)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
                                placeholder="+58 412 1234567"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">LinkedIn URL</label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                name="linkedin_url"
                                value={formData.linkedin_url}
                                onChange={handleChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Instagram URL</label>
                        <div className="relative">
                            <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                name="instagram_url"
                                value={formData.instagram_url}
                                onChange={handleChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}
