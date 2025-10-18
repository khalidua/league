import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
// Replaced raster bell with inline SVG per user request
import { useAuth } from '../contexts/AuthContext';

interface NotificationItem {
	notificationid: number;
	message: string;
	isread: boolean;
	metadata?: string;
	type?: string;
}

interface NotificationBellProps {
	className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
    const { isAuthenticated, user } = useAuth();
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const btnRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

	useEffect(() => {
		if (!open) return;
		(async () => {
			try {
				const list = await api.listNotifications();
				setItems(list || []);
				const unread = (list || []).filter((n: any) => !n.isread);
				setUnreadCount(unread.length);
				// Mark all as read once opened so badge clears after viewing
				if (unread.length > 0) {
					await Promise.all(unread.map((n: any) => api.markNotificationRead(n.notificationid)));
					setItems((list || []).map((n: any) => ({ ...n, isread: true })) as any);
					setUnreadCount(0);
				}
			} catch {}
		})();
	}, [open]);

	// Prefetch count without opening so badge shows proactively
	useEffect(() => {
		let cancelled = false;
		let intervalId: any;
		const loadCount = async () => {
			try {
				const list = await api.listNotifications();
				if (cancelled) return;
				setUnreadCount((list || []).filter((n: any) => !n.isread).length);
			} catch {}
		};
		loadCount();
		const onFocus = () => loadCount();
		window.addEventListener('focus', onFocus);
		// periodic polling to keep badge fresh
		intervalId = setInterval(loadCount, 30000);
		return () => { cancelled = true; window.removeEventListener('focus', onFocus); clearInterval(intervalId); };
	}, []);

	useEffect(() => {
		const onClickOutside = (e: MouseEvent) => {
			if (open && btnRef.current && panelRef.current &&
				!btnRef.current.contains(e.target as Node) &&
				!panelRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, [open]);

	const markAllRead = async () => {
		try {
			const unread = (items || []).filter((n: any) => !n.isread);
			if (unread.length > 0) {
				await Promise.all(unread.map((n: any) => api.markNotificationRead(n.notificationid)));
				setItems(prev => prev.map(n => ({ ...n, isread: true })) as any);
				setUnreadCount(0);
			}
		} catch {}
	};

	const toggle = () => {
		if (!isAuthenticated) return;
		if (!open && btnRef.current) {
			const rect = btnRef.current.getBoundingClientRect();
			const isMobile = window.innerWidth <= 768;
			const right = isMobile ? 8 : Math.max(8, window.innerWidth - rect.right);
			const top = rect.bottom + 6;
			setPanelPos({ top, right });
		}
		// if closing, mark items as read after viewing
		if (open) {
			markAllRead();
		}
		setOpen(!open);
	};

	if (!isAuthenticated) return null;

	return (
		<>
			<button ref={btnRef} className={`notif-bell ${className}`} aria-label="Notifications" onClick={toggle}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1024" aria-hidden className="bell-icon">
					<path fill="currentColor" d="M960 960H622q-17 29-46 46.5t-64 17.5t-64-17.5t-46-46.5H64q-27 0-45.5-19T0 896v-64q53 0 90.5-75T128 576V448q0-142 91.5-248.5T448 70v-6q0-27 19-45.5T512 0t45 18.5T576 64v6q137 23 228.5 129.5T896 448v128q0 106 37.5 181t90.5 75v64q0 26-18.5 45T960 960z"/>
				</svg>
				{unreadCount > 0 && <span className="badge">{unreadCount}</span>}
			</button>
			{open && createPortal(
				<div ref={panelRef} className="user-dropdown" style={{ position: 'fixed', top: panelPos.top, right: panelPos.right, zIndex: 10000, minWidth: 260 }}>
					<div className="user-info" style={{ padding: '10px 12px' }}>
						<div style={{ fontWeight: 600, color: '#fff' }}>Notifications</div>
					</div>
					<div className="menu-divider"></div>
					<div style={{ maxHeight: 360, overflow: 'auto' }}>
						{items.length === 0 ? (
							<div className="notif-empty" style={{ padding: 14, color: 'rgba(255,255,255,0.75)' }}>No notifications</div>
						) : items.slice(0, 10).map(n => {
							let meta: any = undefined;
							try { meta = n.metadata ? JSON.parse(n.metadata) : undefined; } catch {}
							const linkTo = meta && meta.requester_playerid ? `/players/${meta.requester_playerid}` : undefined;

							// Join request actions when metadata includes a request id
							const isJoinRequest = Boolean(meta && meta.requestid);
							const onRespond = async (action: 'approve' | 'deny') => {
								try {
									await api.respondJoinRequest(meta.requestid, action);
									// Replace actionable notification with a resolved version (no buttons)
									setItems(prev => {
										const next = (prev || []).map((it: any) => {
											try {
												const m = it.metadata ? JSON.parse(it.metadata) : undefined;
												const sameReq = m && m.requestid && meta && meta.requestid && m.requestid === meta.requestid;
												if (sameReq) {
													const resultValue = action === 'approve' ? 'approved' : 'denied';
													const updatedMeta = JSON.stringify({ ...(m || {}), result: resultValue });
													return { ...it, metadata: updatedMeta, isread: true };
												}
												return it;
											} catch { return it; }
										});
										// Recalculate unread count
										const newUnread = next.filter((x: any) => !x.isread).length;
										setUnreadCount(newUnread);
										return next as any;
									});
								} catch {}
							};

                            const result = (meta && meta.result) || undefined;
                            return (
                                <div key={n.notificationid} className="menu-item" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                                        {linkTo ? (
                                            <Link to={linkTo} style={{ color: 'inherit', textDecoration: 'none', flex: 1 }}>
                                                {n.message}
                                            </Link>
                                        ) : (
                                            <span style={{ flex: 1 }}>{n.message}</span>
                                        )}
                                        {/* Status icon when resolved */}
                                        {result && (
                                            <span aria-hidden style={{ fontSize: 14, color: result === 'approved' ? '#9ef59e' : '#ff9e9e' }}>
                                                {result === 'approved' ? '✓' : '✕'}
                                            </span>
                                        )}
                                        {/* Action buttons for pending */}
                                        {!result && isJoinRequest && (
                                            <span style={{ display: 'flex', gap: 6 }}>
                                                <button type="button" onClick={() => onRespond('approve')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#9ef59e', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Approve</button>
                                                <button type="button" onClick={() => onRespond('deny')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ff9e9e', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Deny</button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
						})}
					</div>
				</div>,
				document.body
			)}
			<style>{`
			.notif-bell { position: relative; background: transparent; border: none; color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; width: 20px; height: 20px; outline: none; -webkit-tap-highlight-color: transparent; }
			.notif-bell:hover { background: transparent; }
			.notif-bell:active { background: transparent; }
			.notif-bell:focus, .notif-bell:focus-visible { outline: none; box-shadow: none; }
			.notif-bell .bell-icon { width: 20px; height: 20px; display: block; color: #fff; }
			.notif-bell .badge { position: absolute; top: -4px; right: -6px; background: #e74c3c; color: #fff; border-radius: 10px; padding: 0 6px; font-size: 11px; line-height: 16px; }
			/* Panel visuals are inherited from .user-dropdown & friends */
			`}</style>
		</>
	);
};

export default NotificationBell;


