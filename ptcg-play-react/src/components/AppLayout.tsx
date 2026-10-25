import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCoreSession } from '../context/CoreSessionContext';
import { trainerDisplayName } from '../duo/chineseCatalog';
import { TrainerPortrait } from '../duo/TrainerPortrait';
import { WalletButton } from '../collection/WalletButton';
import { HomeTour } from '../tutorial/HomeTour';
import { useViewportBounds } from '../hooks/useViewportBounds';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/games', label: '大厅', icon: 'home', tour: 'nav-lobby' },
  { to: '/deck', label: '卡组', icon: 'decks', tour: 'nav-deck' },
  { to: '/collection', label: '收藏', icon: 'collection', tour: 'nav-collection' },
  { to: '/shop', label: '商店', icon: 'shop', tour: 'nav-shop' },
  { to: '/records', label: '战绩', icon: 'trophy', tour: 'nav-records' },
] as const;

// SVG 图标组件
function Icon({ name, size = 20 }: { name: 'home' | 'decks' | 'collection' | 'shop' | 'trophy' | 'settings' | 'logout' | 'arrow'; size?: number }) {
  const icons = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
    decks: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M7 4v16M17 4v16M3 12h18" /></>,
    collection: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    shop: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></>,
    trophy: <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6M3.2 9l5.2 3m6 0l5.2-3M3.2 15l5.2-3m6 0l5.2 3" /></>,
    logout: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
    arrow: <path d="M6 9l6 6 6-6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

export function AppLayout() {
  const { pathname, key: locationKey } = useLocation();
  const viewport = useViewportBounds();
  const { user, logout } = useAuth();
  const { connected } = useCoreSession();
  const table = pathname.startsWith('/table/') || pathname.startsWith('/tutorial');
  const editor = /^\/deck\/[^/]+\/?$/.test(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  function closeMenu(restoreFocus = false) {
    setMenuOpen(false);
    if (restoreFocus) menuTriggerRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    setMenuOpen(false);
    if (!table && menuRef.current?.contains(document.activeElement)) {
      menuTriggerRef.current?.focus({ preventScroll: true });
    }
  }, [locationKey, table]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
        // 可聚焦的外部目标随后按原生 pointerdown 获得焦点；空白外点则返回头像。
        if (menuRef.current?.contains(document.activeElement)) menuTriggerRef.current?.focus({ preventScroll: true });
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      menuTriggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // 牌桌页面使用不同的布局
  if (table) {
    return (
      <div className={styles.tableLayout} style={{ height: viewport.height }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className={`${styles.layout} ${editor ? styles.layoutEditor : ''}`}>
      {/* 导航栏 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo 区域 */}
          <Link to="/games" className={styles.brand} data-tour="brand">
            <div className={styles.pokeball}>
              <svg viewBox="0 0 40 40" width="32" height="32">
                <circle cx="20" cy="20" r="18" fill="#ee1515" />
                <circle cx="20" cy="20" r="18" fill="#ffffff" clipPath="url(#logo-bottom)" />
                <circle cx="20" cy="20" r="6" fill="#ffffff" stroke="#2a2a2a" strokeWidth="2" />
                <circle cx="20" cy="20" r="3.5" fill="#2a2a2a" />
                <rect x="2" y="18" width="36" height="4" fill="#2a2a2a" />
                <defs>
                  <clipPath id="logo-bottom">
                    <rect x="2" y="20" width="36" height="18" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <span className={styles.brandText}>训练家卡桌</span>
          </Link>

          {/* 导航菜单 */}
          <nav className={styles.nav}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                data-tour={item.tour}
                aria-label={item.label}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* 用户区域 */}
          <div className={styles.userArea}>
            <div className={styles.connectionStatus}>
              <span
                className={`${styles.statusDot} ${connected ? styles.statusOnline : styles.statusOffline}`}
                title={connected ? '已连接' : '连接中'}
              />
            </div>

            <WalletButton />

            {/* 用户菜单 */}
            <div ref={menuRef} className={styles.userMenu} onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
            }}>
              <button
                ref={menuTriggerRef}
                type="button"
                className={styles.menuTrigger}
                aria-label={`账户菜单：${trainerDisplayName(user?.name ?? '')}`}
                aria-expanded={menuOpen}
                aria-controls="account-menu"
                onClick={() => setMenuOpen(open => !open)}
              >
                <TrainerPortrait name={user?.name ?? 'red'} size={32} />
                <span className={styles.userName}>{trainerDisplayName(user?.name ?? '')}</span>
                <Icon name="arrow" size={16} />
              </button>

              <div id="account-menu" className={styles.menuDropdown} data-open={menuOpen} inert={!menuOpen}>
                <Link to="/settings" className={styles.menuItem} onClick={() => closeMenu(true)}>
                  <Icon name="settings" size={18} />
                  <span>偏好设置</span>
                </Link>
                {user?.roleId === 4 && (
                  <Link to="/admin" className={styles.menuItem} onClick={() => closeMenu(true)}>
                    <Icon name="settings" size={18} />
                    <span>管理</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { closeMenu(); void logout(); }}
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                >
                  <Icon name="logout" size={18} />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* 新手导览：仅在大厅页自动激活，其余页面静默 */}
      <HomeTour />
    </div>
  );
}
