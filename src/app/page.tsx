import { LaunchGate } from "@/components/app/launch-gate";

// The app has no landing page of its own: it opens straight into Home or the welcome flow.
export default function Page() {
  return <LaunchGate />;
}
