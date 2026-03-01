const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

function wrapResponse(data: any, err: any = null) {
	return { data, error: err };
}

export const supabase = { 
	from(table: string) {
		return {
			select(columns = '*') {
				const query: any = { columns, order: undefined, limit: undefined, where: undefined };
				const queryObj: any = {
					async exec() {
						try {
							const res = await fetch(`${API_URL}/api/from/${encodeURIComponent(table)}/select`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(query),
							});
							return await res.json();
						} catch (err: any) {
							return wrapResponse(null, { message: err.message || err });
						}
					},
					order(column: string, opts?: { ascending?: boolean }) {
						query.order = { column, ascending: opts?.ascending ?? false };
						return this;
					},
					limit(count: number) {
						query.limit = count;
						return this;
					},
					eq(column: string, val: any) {
						query.where = { col: column, val };
						return this;
					},
					async single() {
						const result = await this.exec();
						if (result.data && Array.isArray(result.data) && result.data.length > 0) {
							return wrapResponse(result.data[0]);
						}
						return result;
					},
					then(onFulfilled?: any, onRejected?: any) {
						return this.exec().then(onFulfilled, onRejected);
					},
					catch(onRejected?: any) {
						return this.exec().catch(onRejected);
					},
				};
				return queryObj;
			},

			async insert(rows: any) {
				try {
					const res = await fetch(`${API_URL}/api/from/${encodeURIComponent(table)}/insert`, { 
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ rows }),
					});
					return await res.json();
				} catch (err: any) {
					return wrapResponse(null, { message: err.message || err }); 
				}
			},

			update(data: Record<string, any>) {
				return {
					async eq(col: string, val: any) {
						 try { 
							const res = await fetch(`${API_URL}/api/from/${encodeURIComponent(table)}/update`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ data, where: { col, val } }),
							});
							return await res.json();
						} catch (err: any) {
							 return wrapResponse(null, { message: err.message || err }); 
						}
					},
				};
			},

			async upsert(rows: any, options?: { onConflict?: string }) {
				try {
					const res = await fetch(`${API_URL}/api/from/${encodeURIComponent(table)}/upsert`, { 
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ rows, onConflict: options?.onConflict || 'id' }),
					});
					return await res.json();
				} catch (err: any) {
					return wrapResponse(null, { message: err.message || err }); 
				}
			},

			delete() {
				return {
					async eq(col: string, val: any) {
								 try { 
							const res = await fetch(`${API_URL}/api/from/${encodeURIComponent(table)}/delete`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ where: { col, val } }),
							});
							return await res.json();
						} catch (err: any) {
									 return wrapResponse(null, { message: err.message || err }); 
						}
					},
				};
			},
		};
	},
};

// Minimal auth shim used by the app: stores session in localStorage and exposes
// getSession, onAuthStateChange, signInWithPassword, signOut.
const SESSION_KEY = 'app.session';

function broadcastAuthEvent(event: string, session: any) {
	try {
		const payload = JSON.stringify({ event, session });
		window.localStorage.setItem('auth.event', payload);
		// remove quickly to trigger storage event
		window.localStorage.removeItem('auth.event');
	} catch (e) {
		// ignore
	}
}

export const auth = {
	async getSession() {
		try {
			const raw = window.localStorage.getItem(SESSION_KEY);
			const session = raw ? JSON.parse(raw) : null;
			return { data: { session } };
		} catch (err: any) {
			return { data: { session: null }, error: { message: err.message || err } };
		}
	},

	onAuthStateChange(callback: (event: string, session: any) => void) {
		const handler = (e: StorageEvent) => {
			if (e.key === 'auth.event' && e.newValue) {
				try {
					const { event, session } = JSON.parse(e.newValue);
					callback(event, session);
				} catch (e) {}
			}
		};
		window.addEventListener('storage', handler);
		const subscription = {
			unsubscribe() {
				window.removeEventListener('storage', handler);
			}
		};
		return { data: { subscription } };
	},

	async signInWithPassword({ email, password }: { email: string; password: string; }) {
		try {
			const res = await fetch(`${API_URL}/api/auth/signin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});
			const body = await res.json();
			if (body?.data?.user) {
				const session = { user: body.data.user };
				window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
				broadcastAuthEvent('SIGNED_IN', session);
				return { data: { user: body.data.user }, error: null };
			}
			return { data: null, error: body.error || { message: 'Invalid credentials' } };
		} catch (err: any) {
			return { data: null, error: { message: err.message || err } };
		}
	},

	async signOut() {
		try {
			window.localStorage.removeItem(SESSION_KEY);
			broadcastAuthEvent('SIGNED_OUT', null);
			// optional server call
			await fetch(`${API_URL}/api/auth/signout`, { method: 'POST' }).catch(()=>{});
			return { error: null };
		} catch (err: any) {
			return { error: { message: err.message || err } };
		}
	}
};

// attach auth to supabase export for compatibility
(supabase as any).auth = auth;



