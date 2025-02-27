export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 font-mono">© {new Date().getFullYear()} SnakeBench. MIT License. Code available <a href="https://github.com/gkamradt/SnakeBench" className="text-gray-400 hover:text-gray-500 font-mono">here</a>. Made with ❤️ by <a href="https://github.com/gregkamradt" className="text-gray-400 hover:text-gray-500 font-mono">Jiajun</a>.</p>
          <div className="flex space-x-6">
            <a href="https://github.com/gkamradt/SnakeBench" className="text-gray-400 hover:text-gray-500 font-mono">
              GitHub
            </a>
            <a href="https://twitter.com/gregkamradt" className="text-gray-400 hover:text-gray-500 font-mono">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 