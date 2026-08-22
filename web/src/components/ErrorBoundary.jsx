import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-primary">Halaman tidak dapat ditampilkan</h1>
        <p className="mt-2 text-gray-600">Muat ulang halaman atau kembali ke beranda.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-primary px-4 py-2 font-semibold text-white"
          >
            Muat Ulang
          </button>
          <a href="/" className="rounded border border-primary px-4 py-2 font-semibold text-primary">
            Beranda
          </a>
        </div>
      </div>
    );
  }
}