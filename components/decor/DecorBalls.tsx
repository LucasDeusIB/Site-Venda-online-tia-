// Decorative floating balls — desktop only, on the side gutters, purely cosmetic.
// `hidden lg:block` keeps them off phones/tablets. They sit behind the content
// (the content column is centered with max-w, so the sides stay free for these).
export function DecorBalls() {
  return (
    <div className="hidden lg:block fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* lado esquerdo */}
      <span className="drift-a absolute top-[14%] -left-10 w-44 h-44 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: 'var(--c-yellow)' }} />
      <span className="drift-c absolute bottom-[18%] left-[3%] w-36 h-36 rounded-full blur-3xl opacity-35"
        style={{ backgroundColor: 'var(--c-blue)' }} />
      {/* lado direito */}
      <span className="drift-b absolute top-[22%] -right-12 w-52 h-52 rounded-full blur-3xl opacity-35"
        style={{ backgroundColor: 'var(--c-red)' }} />
      <span className="drift-a absolute bottom-[12%] right-[4%] w-40 h-40 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: 'var(--c-yellow)' }} />
    </div>
  )
}
