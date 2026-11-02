import { useState } from 'react';
import { checkC64Vice } from '../../lib/tauri-bridge';

export function C64ViceCheck({ executablePath }: { executablePath: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <div className="space-y-2">
    <button type="button" disabled={!executablePath.trim() || busy} className="focus-idx-39 min-h-11 rounded-theme border border-theme-outline-variant px-3 text-xs text-theme-text disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-theme-primary"
      onClick={async () => {
        setBusy(true);
        try {
          const info = await checkC64Vice(executablePath);
          setMessage(`${info.version} · Drive switches: ${info.driveSwitches} · Virtual devices: ${info.virtualDeviceSwitches}`);
        } catch (error) { setMessage(String(error)); }
        finally { setBusy(false); }
      }}>{busy ? 'Checking VICE…' : 'Check VICE compatibility'}</button>
    {message && <p role="status" className="text-xs leading-relaxed text-theme-text-muted">{message}</p>}
  </div>;
}
