import { useEffect, useState } from 'react';
import { ShareIcon } from '../icons';

/** Shares the current URL, which always encodes the view (mode, languages, country). */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    if ('share' in navigator && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // The share sheet was dismissed.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access was refused; the address bar still holds the link.
    }
  };

  return (
    <button
      type="button"
      className="header-button"
      onClick={share}
      aria-label={copied ? 'Link copied' : 'Share a link to this view'}
    >
      <ShareIcon />
      <span className="header-button-label" aria-hidden="true">
        {copied ? 'Copied' : 'Share'}
      </span>
    </button>
  );
}
