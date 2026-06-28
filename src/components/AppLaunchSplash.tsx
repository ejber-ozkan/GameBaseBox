"use client";

export function AppLaunchSplash() {
  return (
    <div
      aria-hidden="true"
      className="app-launch-splash fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
    >
      <div
        className="app-launch-splash-image absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/launch/c64days-wallpaper.png')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.62)_45%,rgba(0,0,0,0.92)_100%)]" />
      <div
        className="relative px-8 text-center text-6xl font-black uppercase tracking-[0.16em] text-white sm:text-7xl lg:text-8xl xl:text-9xl"
        style={{
          textShadow: `
            -3px -3px 0 rgba(0, 0, 0, 0.92),
             3px -3px 0 rgba(0, 0, 0, 0.92),
            -3px  3px 0 rgba(0, 0, 0, 0.92),
             3px  3px 0 rgba(0, 0, 0, 0.92),
             0   12px 38px rgba(0, 0, 0, 0.7)
          `,
        }}
      >
        GBBox
      </div>
    </div>
  );
}
