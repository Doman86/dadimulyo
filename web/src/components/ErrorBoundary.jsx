import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  getHomePath() {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return '/';
      const user = JSON.parse(raw);
      const role = user?.role?.name;
      if (['admin', 'sales', 'truck_seller', 'orange_seller'].includes(role)) {
        return '/admin/dashboard';
      }
      return '/dashboard';
    } catch {
      return '/';
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const homePath = this.getHomePath();

    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="card-lux max-w-lg w-full p-10 text-center !rounded-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 text-red-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal">Terjadi Kesalahan</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Halaman tidak dapat ditampilkan. Silakan muat ulang atau kembali ke dasbor.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-lux rounded-xl px-6 py-2.5 text-sm font-bold"
            >
              Muat Ulang
            </button>
            <a
              href={homePath}
              className="btn-dark-lux rounded-xl px-6 py-2.5 text-sm font-bold no-underline"
            >
              Dasbor
            </a>
          </div>
        </div>
      </div>
    );
  }
}
