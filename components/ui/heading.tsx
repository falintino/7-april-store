interface Props {
  badge?: string;
  title: string;
  description?: string;
}

export default function Heading({
  badge,
  title,
  description,
}: Props) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">

      {badge && (
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400">
          {badge}
        </span>
      )}

      <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-lg text-slate-400">
          {description}
        </p>
      )}

    </div>
  );
}