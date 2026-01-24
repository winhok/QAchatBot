export function BackgroundEffects() {
  return (
    <>
      {/* Dark base with subtle grid/noise pattern */}
      <div className="absolute inset-0 opacity-[0.15]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.12) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        ></div>
      </div>

      {/* Radial gradient orbs for depth - neon purple/pink and emerald/teal accents */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Purple-pink gradient orb - top left */}
        <div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.3) 50%, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        ></div>

        {/* Emerald-teal accent - top right */}
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-15"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(20, 184, 166, 0.25) 50%, transparent 70%)',
            animation: 'pulse 10s ease-in-out infinite',
            animationDelay: '2s',
          }}
        ></div>

        {/* Pink-purple gradient - bottom center */}
        <div
          className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] rounded-full blur-3xl opacity-15"
          style={{
            background:
              'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 70%)',
            animation: 'pulse 12s ease-in-out infinite',
            animationDelay: '4s',
          }}
        ></div>

        {/* Cyan-teal accent - bottom right */}
        <div
          className="absolute -bottom-20 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{
            background:
              'radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, rgba(20, 184, 166, 0.25) 50%, transparent 70%)',
            animation: 'pulse 9s ease-in-out infinite',
            animationDelay: '6s',
          }}
        ></div>
      </div>
    </>
  )
}
