export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🚀 MoveYield Copilot
          </h1>
          <p className="text-xl text-gray-300">
            Non-custodial DeFi Yield Aggregator on Movement Blockchain
          </p>
        </div>

        {/* Description */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-gray-700">
          <p className="text-gray-300 text-lg leading-relaxed">
            Manage your DeFi positions directly from Telegram. Deposit, withdraw, 
            and track your yields with one-click transactions powered by Movement Network.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="https://t.me/moveYieldCopilot_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
            </svg>
            Open Telegram Bot
          </a>
          
          <a
            href="https://github.com/nikillxh/moveyield-copilot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg border border-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="text-white font-semibold mb-1">Non-Custodial</h3>
            <p className="text-gray-400 text-sm">Your keys, your crypto</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-white font-semibold mb-1">One-Click</h3>
            <p className="text-gray-400 text-sm">Deposit & withdraw easily</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-white font-semibold mb-1">Track Yields</h3>
            <p className="text-gray-400 text-sm">Monitor your positions</p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-gray-500 text-sm">
          Built on Movement Network • Powered by Nightly Wallet
        </div>
      </div>
    </div>
  );
}
