"use client";

interface Props {
  title: string;
  description: string;
}

export default function StaticSection({ title, description }: Props) {
  return (
    <div className="p-6 bg-slate-50 rounded-xl border border-pd-border text-center">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-pd-muted">{description}</p>
      <div className="mt-4 p-3 bg-white rounded-lg border border-pd-border">
        <p className="text-xs text-pd-muted italic">
          Template preview will appear here when the email template is connected.
        </p>
      </div>
    </div>
  );
}
