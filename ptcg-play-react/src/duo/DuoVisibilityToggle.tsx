import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DuoSwitch } from './DuoSwitch';
import { getDuoState, setDuoVisibility } from './duoApi';

export function DuoVisibilityToggle({ value, onSaved, tone = 'dark' }: { value?: boolean; onSaved?: () => Promise<void>; tone?: 'dark' | 'paper' }) {
  const { user } = useAuth();
  const owner = useRef(user?.userId);
  owner.current = user?.userId;
  const pending = useRef(false);
  const [checked, setChecked] = useState(value ?? false);
  const [ready, setReady] = useState(value !== undefined);
  const [loading, setLoading] = useState(value === undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    pending.current = false;
    setError('');
    if (value !== undefined) { setChecked(value); setReady(true); setLoading(false); }
    else {
      setReady(false); setLoading(true);
      void getDuoState().then(state => {
        if (alive) { setChecked(!!state.players.find(player => player.userId === user?.userId)?.duoPublic); setReady(true); }
      }).catch(() => { if (alive) setError('可见性读取失败，请刷新后重试。'); })
        .finally(() => { if (alive) setLoading(false); });
    }
    return () => { alive = false; };
  }, [value, user?.userId]);
  async function change(next: boolean) {
    if (!ready || pending.current) return;
    const userId = owner.current;
    pending.current = true;
    setLoading(true); setError('');
    try {
      await setDuoVisibility(next);
      if (owner.current !== userId) return;
      setChecked(next);
      if (onSaved) await onSaved();
      else window.dispatchEvent(new Event('duo:changed'));
    } catch { if (owner.current === userId) setError('保存失败，请重试。'); }
    finally { if (owner.current === userId) { pending.current = false; setLoading(false); } }
  }
  return <>
    <DuoSwitch
      tone={tone}
      data-tour="lobby-visibility"
      checked={checked}
      disabled={loading || !ready}
      onChange={next => void change(next)}
      hint="关闭后，好友或知道你完整用户名的人仍可挑战。"
    >
      出现在公开大厅
    </DuoSwitch>
    {error && <p role="alert" className="duo-error">{error}</p>}
  </>;
}
