// Dev-only collision fixture: real shipped chat/orb components, observable local callbacks.
// No authentication, sockets, API calls or database writes; not a production entry point.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Player, StateLog } from 'ptcg-server';
import '../src/i18n/i18n';
import '../src/styles/design-system.css';
import { TableChat } from '../src/table/hud/TableChat';
import { TablePrimaryAction, TablePrimaryActionProvider } from '../src/table/hud/TablePrimaryAction';

const players = [{ id: 1, name: '夹具甲' }, { id: 2, name: '夹具乙' }] as Player[];
function Fixture() {
  const [turn, setTurn] = useState(3);
  const [logs, setLogs] = useState<StateLog[]>([]);
  const [muted, setMuted] = useState(false);
  return <TablePrimaryActionProvider>
    <p data-fixture-turn={turn}>己方回合：{turn}</p>
    <p data-fixture-sent={logs.length}>发送回执：{logs.length}</p>
    <TableChat logs={logs} liveLogs={logs} players={players} clientId={1} topPlayerId={2}
      canSend isReplay={false} muted={muted} onMutedChange={setMuted}
      onSendChat={async (text, emoteId) => {
        setLogs(previous => [...previous, { id: previous.length + 1, client: 1, message: 'LOG_TEXT',
          params: { text, ...(emoteId ? { kind: 'emote', emoteId } : {}) } } as StateLog]);
      }} />
    <TablePrimaryAction priority={0} state="turn" label="结束回合" onActivate={() => setTurn(current => current + 1)} />
  </TablePrimaryActionProvider>;
}
createRoot(document.getElementById('fixture')!).render(<Fixture />);
