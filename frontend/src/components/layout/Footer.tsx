import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const Footer: React.FC<FooterProps> = ({ className = '', variant = 'full' }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const socialLinks = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      handle: '+91 7088951914',
      rawText: '7088951914',
      url: 'https://wa.me/917088951914',
      bgGlow: 'hover:shadow-emerald-500/30 hover:border-emerald-500/50',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: (
        <svg className="w-5 h-5 fill-current text-emerald-400" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      )
    },
    {
      id: 'telegram',
      name: 'Telegram',
      handle: '+91 7088951914',
      rawText: '7088951914',
      url: 'https://t.me/+917088951914',
      bgGlow: 'hover:shadow-sky-500/30 hover:border-sky-500/50',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: (
        <svg className="w-5 h-5 fill-current text-sky-400" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.198 1.006.128.832.942z"/>
        </svg>
      )
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@sparshchauhan050',
      rawText: 'sparshchauhan050',
      url: 'https://instagram.com/sparshchauhan050',
      bgGlow: 'hover:shadow-pink-500/30 hover:border-pink-500/50',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      icon: (
        <svg className="w-5 h-5 fill-current text-pink-400" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    }
  ];

  if (variant === 'compact') {
    return (
      <footer
        className={`w-full py-2.5 px-4 border-t flex flex-wrap items-center justify-between gap-3 select-none text-xs transition-colors duration-300 ${className}`}
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold opacity-80">Sparsh Chauhan</span>
          <span className="bg-accent/10 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded border border-accent/20">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {socialLinks.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border hover:scale-110 transition-all opacity-80 hover:opacity-100 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              title={`Connect on ${item.name}: ${item.handle}`}
            >
              {item.icon}
              <span className="text-[11px] font-medium hidden sm:inline">{item.name}</span>
            </a>
          ))}
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`w-full border-t p-4 sm:p-5 rounded-2xl select-none transition-all duration-300 shadow-xl ${className}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Creator Info */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h4 className="font-extrabold text-sm tracking-tight">Sparsh Chauhan</h4>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> Sole Administrator
              </span>
            </div>
            <p className="text-xs opacity-60 mt-0.5">
              Direct Contact & Socials • Phone: <span className="font-mono text-accent">7088951914</span> • IG: <span className="font-mono text-accent">@sparshchauhan050</span>
            </p>
          </div>
        </div>

        {/* Social Link Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {socialLinks.map((item) => (
            <div
              key={item.id}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${item.bgGlow}`}
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group-hover:opacity-100 transition-opacity"
                title={`Open ${item.name}`}
              >
                {item.icon}
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>{item.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] opacity-60 font-mono leading-tight">{item.handle}</div>
                </div>
              </a>

              {/* Quick Copy Button */}
              <button
                onClick={() => handleCopy(item.rawText, item.id)}
                className="ml-1 p-1 rounded-md opacity-40 hover:opacity-100 hover:bg-white/10 transition-all text-xs"
                title={`Copy ${item.name} info`}
              >
                {copied === item.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};
