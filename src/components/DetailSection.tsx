interface DetailSectionProps {
  label: string
  children: React.ReactNode
  /** Extra controls on the right of the heading row (tabs, sort…). */
  actions?: React.ReactNode
}

/** A titled block under a detail page's hero, matching the Episodes section. */
export default function DetailSection({ label, children, actions }: DetailSectionProps) {
  return (
    <section className="px-12 pb-12 max-[600px]:px-5 max-[600px]:pb-8">
      <div className="w-full h-px mb-8 opacity-40 bg-linear-to-r from-accent2 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-sans text-[9px] font-normal tracking-[0.3em] uppercase text-accent">{label}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}
