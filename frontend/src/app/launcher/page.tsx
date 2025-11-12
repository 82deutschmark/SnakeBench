import MatchLauncher from "@/components/launcher/MatchLauncher";
import BatchLauncher from "@/components/launcher/BatchLauncher";

export default function LauncherPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-press-start text-gray-900">Match Launcher</h1>
        <p className="mt-2 text-sm font-mono text-gray-600">
          Start matches and batch simulations without using the CLI
        </p>
      </div>

      <div className="space-y-8">
        <MatchLauncher />
        <BatchLauncher />
      </div>
    </div>
  );
}
