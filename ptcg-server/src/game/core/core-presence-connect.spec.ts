import { Core } from './core';
import { config } from '../../config';

describe('Async private presence connection', () => {
  const wasDuo = config.duo.enabled;
  afterEach(() => { config.duo.enabled = wasDuo; });
  it('reserves the seat synchronously, but never sends a late join after disconnect during refresh', async () => {
    config.duo.enabled = true;
    let finish!: () => void;
    const refresh = new Promise<void>(resolve => { finish = resolve; });
    const core: any = Object.create(Core.prototype); // Avoid unrelated background schedulers.
    core.clients = []; core.games = []; core.lastClientId = 0;
    core.refreshDuoPresence = jasmine.createSpy('refreshDuoPresence').and.returnValue(refresh);
    core.emit = jasmine.createSpy('emit'); core.broadcastUserUpdates = jasmine.createSpy('broadcastUserUpdates');
    const client: any = { id: 0, user: { id: 42 }, games: [] };
    const connecting = core.connect(client);
    expect(client.id).toBe(1);
    expect(core.clients).toEqual([client]);
    core.clients.length = 0; client.core = undefined; // Socket closed before the async query completed.
    finish(); await connecting;
    expect(core.emit).not.toHaveBeenCalled();
    expect(core.broadcastUserUpdates).not.toHaveBeenCalled();
  });
});
