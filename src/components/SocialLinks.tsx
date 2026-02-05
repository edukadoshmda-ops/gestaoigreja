import { Youtube, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const socialLinks = [
  { icon: Youtube, label: 'YouTube', href: '#', color: 'hover:text-red-600' },
  { icon: Facebook, label: 'Facebook', href: '#', color: 'hover:text-blue-600' },
  { icon: Instagram, label: 'Instagram', href: '#', color: 'hover:text-pink-600' },
  { icon: MessageCircle, label: 'WhatsApp', href: '#', color: 'hover:text-green-600' },
];

export function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {socialLinks.map((social) => (
        <Button
          key={social.label}
          variant="ghost"
          size="icon"
          className={`transition-colors ${social.color}`}
          asChild
        >
          <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
            <social.icon className="h-5 w-5" />
          </a>
        </Button>
      ))}
    </div>
  );
}
