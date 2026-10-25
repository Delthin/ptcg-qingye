import { Link } from 'react-router-dom';
import { GameWinner } from 'ptcg-server';
import type { DuoMatch, DuoPlayer } from './duoApi';
import { trainerDisplayName } from './chineseCatalog';

export function DuoRecentMatches({ matches, players, userId }: { matches: DuoMatch[]; players: DuoPlayer[]; userId: number }) {
  if (!matches.length) return <div className="duo-empty"><span className="duo-ball" aria-hidden /><div><strong>暂无对局记录</strong></div></div>;
  return <div className="duo-match-list">{matches.map(match => {
    const isFirst = match.player1Id === userId;
    const draw = match.winner === GameWinner.DRAW;
    const won = match.winner === (isFirst ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2);
    const first = players.find(player => player.userId === match.player1Id);
    const second = players.find(player => player.userId === match.player2Id);
    return <div className="duo-match-row" key={match.id}>
      <span className={`duo-result ${draw ? 'draw' : won ? 'won' : 'lost'}`}>{draw ? '平局' : won ? '胜利' : '落败'}</span>
      <div><strong>{first?.label ?? trainerDisplayName(first?.name ?? '训练家')}<span className="duo-versus">vs</span>{second?.label ?? trainerDisplayName(second?.name ?? '训练家')}</strong>
        <p>{match.deck1 || '自组卡组'}<span className="duo-versus"> / </span>{match.deck2 || '自组卡组'}</p></div>
      <time dateTime={new Date(match.created).toISOString()}>{new Date(match.created).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
      <Link className="duo-text-link" to={`/table/replay/${match.id}`}>回放 ↗</Link>
    </div>;
  })}</div>;
}
