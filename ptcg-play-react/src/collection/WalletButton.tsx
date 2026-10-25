import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DuoDialog } from '../duo/DuoDialog';
import { useEconomy } from './EconomyContext';
import { formatGameMoney } from './economyTypes';
import styles from './WalletButton.module.css';

export function WalletButton() {
  const economy = useEconomy();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const ready = economy.status === 'ready' && !!economy.snapshot;
  const checkIn = economy.snapshot?.checkIn;
  const claimable = ready && !!checkIn && !checkIn.claimed;
  const statusLabel = economy.status === 'loading' ? '同步中' : economy.status === 'error' ? '连接失败' : '未接入';

  async function claim() {
    if (!ready || !claimable || economy.busy) return;
    setNotice('');
    try {
      await economy.claimCheckIn();
      setNotice(`签到成功，+${formatGameMoney(checkIn!.rewardMinor)} 游戏元已入账`);
    } catch { /* Provider surfaces the authoritative error and retry guidance. */ }
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.walletBtn} ${claimable ? styles.hasReward : ''}`}
        onClick={() => { setOpen(true); setNotice(''); }}
        aria-label={claimable
          ? `游戏元余额 ${formatGameMoney(economy.snapshot!.balanceMinor)}，今日签到可领`
          : ready
            ? `游戏元余额 ${formatGameMoney(economy.snapshot!.balanceMinor)}`
            : statusLabel
        }
      >
        <svg className={styles.coinIcon} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6v12M8 9.5h6a2 2 0 110 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.amount}>
          {ready ? formatGameMoney(economy.snapshot!.balanceMinor) : statusLabel}
        </span>
        {claimable && (
          <span className={styles.badge}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <circle cx="4" cy="4" r="4" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <DuoDialog title="训练家钱包" onClose={() => setOpen(false)}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceLabel}>游戏元余额</div>
            <div className={styles.balanceAmount}>
              {ready ? formatGameMoney(economy.snapshot!.balanceMinor) : '—'}
            </div>
            <div className={styles.balanceNote}>游戏内资源，不涉及真实支付</div>
          </div>

          {ready && checkIn && (
            <div className={`${styles.checkInCard} ${checkIn.claimed ? styles.claimed : ''}`}>
              <div className={styles.checkInContent}>
                <div>
                  <div className={styles.checkInTitle}>每日签到</div>
                  <div className={styles.checkInDesc}>
                    {checkIn.claimed
                      ? `今日已签到${checkIn.lastClaimDay ? ` · ${checkIn.lastClaimDay}` : ''}`
                      : `领取 ${formatGameMoney(checkIn.rewardMinor)} 游戏元`
                    }
                  </div>
                </div>
                {!checkIn.claimed && (
                  <button
                    type="button"
                    className={styles.checkInBtn}
                    disabled={economy.busy}
                    onClick={() => void claim()}
                  >
                    {economy.busy ? '领取中...' : '签到'}
                  </button>
                )}
                {checkIn.claimed && (
                  <div className={styles.checkmark}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}

          {notice && (
            <div className={styles.notice} role="status">
              {notice}
            </div>
          )}

          {!ready ? (
            <div className={styles.notice} role="status">
              {economy.status === 'pending'
                ? '钱包服务尚未接入'
                : economy.error || '正在同步钱包'
              }
            </div>
          ) : (
            <>
              <div className={styles.transactionsHeader}>
                <h3>最近收支</h3>
              </div>
              {economy.snapshot!.transactions.length ? (
                <div className={styles.transactions}>
                  {economy.snapshot!.transactions.map(entry => (
                    <div key={entry.id} className={styles.transaction}>
                      <div className={styles.transactionInfo}>
                        <div className={styles.transactionLabel}>{entry.label}</div>
                        <div className={styles.transactionTime}>
                          {new Date(entry.createdAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className={`${styles.transactionAmount} ${entry.amountMinor >= 0 ? styles.income : styles.expense}`}>
                        {entry.amountMinor > 0 ? '+' : ''}{formatGameMoney(entry.amountMinor)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>还没有收支记录</div>
              )}
            </>
          )}

          {economy.error && ready && (
            <div className={styles.error} role="alert">
              {economy.error}
            </div>
          )}

          <div className={styles.actions}>
            <Link to="/shop" className={styles.shopLink} onClick={() => setOpen(false)}>
              去商店
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {economy.status !== 'pending' && (
              <button
                type="button"
                className={styles.refreshBtn}
                disabled={economy.busy}
                onClick={() => void economy.refresh()}
              >
                刷新
              </button>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
            >
              关闭
            </button>
          </div>
        </DuoDialog>
      )}
    </>
  );
}
