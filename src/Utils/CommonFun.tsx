import { Facebook, Instagram, Linkedin, Youtube, Music } from 'lucide-react';
import React from 'react';

export const formatISODateToReadable = (isoDateString: string) => {
    if (!isoDateString) return '—';

    try {
        const date = new Date(isoDateString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
};

export const XLogo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <img
            src="/X.png"
            alt="X"
            className={`w-5 h-5 object-contain rounded-full dark:brightness-0 dark:invert text-white ${className || ''}`}

        />
    );
};


export const platformIcons = {
    facebook: Facebook,
    twitter: XLogo,
    x: XLogo,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    tiktok: Music,
};