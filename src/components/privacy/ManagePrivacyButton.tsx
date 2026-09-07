'use client';

import { Icon } from '@/components/media/Icon';

export function ManagePrivacyButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('grub:open-privacy'))}
      className="inline-flex items-center gap-xs text-xs text-on-surface-variant hover:text-on-surface underline font-medium"
    >
      <Icon name="shield" className="text-sm" />
      Manage Cookie & Privacy Preferences
    </button>
  );
}
