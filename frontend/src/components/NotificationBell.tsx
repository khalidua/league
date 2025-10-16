import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import bellUrl from '../assets/notification-bell-svgrepo-com.svg';
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
	const { isAuthenticated } = useAuth();
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
				setUnreadCount((list || []).filter((n: any) => !n.isread).length);
				// Mark all as read once opened
				const unread = (list || []).filter((n: any) => !n.isread);
				if (unread.length > 0) {
					await Promise.all(unread.map((n: any) => api.markNotificationRead(n.notificationid)));
					setUnreadCount(0);
				}
			} catch {}
		})();
	}, [open]);

	// Prefetch count without opening so badge shows proactively
	useEffect(() => {
		let cancelled = false;
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
		return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
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

	const toggle = () => {
		if (!isAuthenticated) return;
		if (!open && btnRef.current) {
			const rect = btnRef.current.getBoundingClientRect();
			const isMobile = window.innerWidth <= 768;
			const right = isMobile ? 8 : Math.max(8, window.innerWidth - rect.right);
			const top = rect.bottom + 6;
			setPanelPos({ top, right });
		}
		setOpen(!open);
	};

	if (!isAuthenticated) return null;

	return (
		<>
			<button ref={btnRef} className={`notif-bell ${className}`} aria-label="Notifications" onClick={toggle}>
				<img src={bellUrl} className="bell-icon" alt="" aria-hidden />
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

							// Join request actions for captains
							const isJoinRequest = (((n.type === 'join_request') || (n.type === 'team_invite') || (!n.type && meta && meta.requestid)) && meta && meta.requestid);
							const onRespond = async (action: 'approve' | 'deny') => {
								try {
									await api.respondJoinRequest(meta.requestid, action);
									// Refresh notifications and hide the original invite/request
									const fresh = await api.listNotifications();
									const filtered = (fresh || []).filter((it: any) => {
										try {
											const m = it.metadata ? JSON.parse(it.metadata) : undefined;
											const sameReq = m && m.requestid && meta && meta.requestid && m.requestid === meta.requestid;
											const isActionable = (it.type === 'team_invite' || it.type === 'join_request');
											return !(sameReq && isActionable);
										} catch { return true; }
									});
									setItems(filtered);
									setUnreadCount(filtered.filter((x: any) => !x.isread).length);
								} catch {}
							};

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
										{isJoinRequest && (
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
			.notif-bell { position: relative; background: transparent; border: none; color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; width: 20px; height: 20px; }
			.notif-bell .bell-icon { width: 20px; height: 20px; display: block; filter: brightness(0) invert(1); }
			.notif-bell .badge { position: absolute; top: -4px; right: -6px; background: #e74c3c; color: #fff; border-radius: 10px; padding: 0 6px; font-size: 11px; line-height: 16px; }
			/* Panel visuals are inherited from .user-dropdown & friends */
			`}</style>
		</>
	);
};

export default NotificationBell;


