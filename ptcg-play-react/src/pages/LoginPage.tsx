import { useEffect, useState } from 'react';
import { ApiErrorEnum } from 'ptcg-server';
import { ApiError } from '../api/apiError';
import { getDuoRoles } from '../duo/duoApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    void getDuoRoles().then(roles => { if (alive) setRegistrationEnabled(roles.registrationEnabled); })
      .catch(() => { if (alive) setRegistrationEnabled(false); });
    return () => { alive = false; };
  }, []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError('请填写完整信息');
      return;
    }

    if (mode === 'register') {
      if (!registrationEnabled) { setError('邀请注册暂未开放'); return; }
      if (!roomPassword) { setError('请填写注册口令'); return; }
      if (password !== confirmPassword) { setError('两次密码不一致'); return; }
      if (password.length < 6 || password.length > 64 || /\s/.test(password)) {
        setError('密码须为 6–64 个字符且不含空白'); return;
      }
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(name.trim(), password);
        navigate('/games');
      } else {
        await register(name.trim(), password, roomPassword);
        setRoomPassword(''); setConfirmPassword('');
        try {
          await login(name.trim(), password);
          navigate('/games');
        } catch {
          setMode('login'); setPassword('');
          setError('注册成功，自动登录未完成。请用此用户名手动登录。');
        }
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      const messages: Partial<Record<ApiErrorEnum, string>> = {
        [ApiErrorEnum.REGISTER_DISABLED]: '邀请注册暂未开放',
        [ApiErrorEnum.REGISTER_INVALID_SERVER_PASSWORD]: '注册口令不正确',
        [ApiErrorEnum.REGISTER_NAME_EXISTS]: '此用户名已被使用',
        [ApiErrorEnum.REQUESTS_LIMIT_REACHED]: '操作过于频繁，请稍后再试',
        [ApiErrorEnum.LOGIN_INVALID]: '用户名或密码不正确',
        [ApiErrorEnum.USER_BANNED]: '此账号已被停用',
        [ApiErrorEnum.VALIDATION_INVALID_PARAM]: err instanceof ApiError && err.param === 'name'
          ? mode === 'register' ? '训练家名称须为 1–10 个汉字、英文字母或数字' : '请使用注册时的完整训练家名称'
          : '密码或注册信息格式不正确',
      };
      setError((code && messages[code]) || '连接或服务异常，请稍后重试');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.container}>
      {/* 3D 背景层 */}
      <div className={styles.bgScene}>
        <div className={styles.bgSky} />
        <div className={styles.bgClouds}>
          <div className={styles.cloud} style={{ '--delay': '0s' } as React.CSSProperties} />
          <div className={styles.cloud} style={{ '--delay': '5s' } as React.CSSProperties} />
          <div className={styles.cloud} style={{ '--delay': '10s' } as React.CSSProperties} />
        </div>
        <div className={styles.bgMountain} />
        <div className={styles.bgGrass} />
      </div>

      {/* 精灵球装饰 */}
      <div className={styles.pokeballs}>
        <div className={styles.pokeball} style={{ '--index': 0 } as React.CSSProperties} />
        <div className={styles.pokeball} style={{ '--index': 1 } as React.CSSProperties} />
        <div className={styles.pokeball} style={{ '--index': 2 } as React.CSSProperties} />
      </div>

      {/* 主内容区 */}
      <div className={styles.content}>
        {/* Logo 区域 */}
        <div className={styles.logoSection}>
          <div className={styles.logoRing}>
            <div className={styles.logoCenter}>
              <svg viewBox="0 0 100 100" className={styles.logoSvg} aria-hidden="true">
                <circle cx="50" cy="50" r="40" fill="#fffdf6" />
                <path d="M10 50a40 40 0 0 1 80 0H10Z" fill="#b93228" />
                <path d="M10 50h80" stroke="#2a1f14" strokeWidth="6" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2a1f14" strokeWidth="4" />
                <circle cx="50" cy="50" r="12" fill="#fffdf6" stroke="#2a1f14" strokeWidth="5" />
                <circle cx="50" cy="50" r="5" fill="#2a1f14" />
              </svg>
            </div>
          </div>
          <h1 className={styles.logoText}>
            <span className={styles.logoMain}>一起打牌</span>
            <span className={styles.logoSub}>Pokémon Trading Card Game</span>
          </h1>
        </div>

        {/* 表单卡片 */}
        <div className={styles.formCard}>
          <div className={styles.formTabs}>
            <button
              type="button"
              className={`${styles.formTab} ${mode === 'login' ? styles.formTabActive : ''}`}
              disabled={loading}
              onClick={() => { setMode('login'); setError(''); }}
            >
              登录
            </button>
            <button
              type="button"
              className={`${styles.formTab} ${mode === 'register' ? styles.formTabActive : ''}`}
              disabled={loading || !registrationEnabled}
              onClick={() => { setMode('register'); setError(''); }}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formField}>
              <label htmlFor="name" className={styles.formLabel}>训练家名称</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.formInput}
                placeholder={mode === 'register' ? '1–10 个汉字、英文字母或数字' : '输入你的训练家名称'}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="password" className={styles.formLabel}>密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.formInput}
                placeholder="输入密码"
                disabled={loading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && <>
              <div className={styles.formField}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>确认密码</label>
                <input id="confirmPassword" type="password" value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)} className={styles.formInput}
                  disabled={loading} autoComplete="new-password" required />
              </div>
              <div className={styles.formField}>
                <label htmlFor="roomPassword" className={styles.formLabel}>注册口令</label>
                <input id="roomPassword" type="password" value={roomPassword}
                  onChange={event => setRoomPassword(event.target.value)} className={styles.formInput}
                  disabled={loading} autoComplete="off" maxLength={256} required />
              </div>
            </>}
            {!registrationEnabled && <p className={styles.formHint}>邀请注册暂未开放。如需账号，请联系房间管理员。</p>}
            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 16 16" className={styles.errorIcon}>
                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 4v5M8 11v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  <span>{mode === 'login' ? '登录中...' : '注册中...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? '开始冒险' : '创建账号'}</span>
              )}
            </button>
          </form>

          <div className={styles.formFooter}>
            <p className={styles.formHint}>
              {mode === 'login'
                ? registrationEnabled
                  ? '还没有账号？请向房间管理员获取注册口令，再点击上方注册'
                  : '还没有账号？请联系房间管理员了解开放注册安排'
                : '已有账号？点击上方登录继续你的冒险'}
            </p>
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className={styles.footer}>
        <div className={styles.footerPattern} />
      </div>
    </div>
  );
}
