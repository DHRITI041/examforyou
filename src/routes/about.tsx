import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — TestKart" },
      { name: "description", content: "TestKart is a free, open exam platform. Anyone can take or build practice tests." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">About</div>
      <h1 className="mt-2 font-display text-5xl">A community exam platform.</h1>
      <div className="prose mt-8 space-y-5 text-foreground/80 leading-relaxed">
        <p>
          TestKart is a free, open practice-test platform inspired by JEE and NEET prep.
          There's no login, no paywall, and no per-country restriction — anyone in the world can
          take an exam right now.
        </p>
        <p>
          The timer is built for both serious mock tests and casual study: hide it, pause it, or
          let it run all the way to zero. Your call.
        </p>
        <p>
          Every exam is editable from the <strong>Admin</strong> panel. You can add a new exam,
          write questions, set the correct answer and duration — all without writing a line of code.
        </p>
      </div>
    </div>
  );
}
