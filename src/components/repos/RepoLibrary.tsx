"use client";

/**
 * THE REPOS PAGE (the /repos page, "Repos" in the header), plain for now: the language key, every
 * public repo by language (buttons: the keyboard and screen-reader way in) and the chosen repo's
 * details (its language, when it was started and last pushed, its GitHub description, links to it
 * and to its case study). The newest repo is open to begin with. The 3D library that stood above
 * this (./Library3D) was removed at Prajwal's request ("no need of this kind animation"); its file
 * stays, unmounted.
 */
import { useState } from "react";
import { garden, monthYear, shortDate } from "@/content/garden";
import { routes } from "@/lib/routes";
import { ExternalLink } from "@/components/ui";
import { TransitionLink } from "@/components/transition";
import { BOOKS, SHELF_LANGUAGES, type Book } from "./books";

const NEWEST = BOOKS.reduce((a, b) => (b.repo.created > a.repo.created ? b : a), BOOKS[0]);

export function RepoLibrary() {
  const [selected, setSelected] = useState<number | null>(NEWEST?.i ?? null);
  const book = selected === null ? null : (BOOKS[selected] ?? null);

  return (
    <div data-qa="repos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul aria-label="Languages" className="flex flex-wrap gap-x-4 gap-y-1.5">
          {SHELF_LANGUAGES.map((l) => (
            <li key={l.language} className="type-mono flex items-center gap-1.5 text-graphite">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: l.cloth }} />
              {l.language} <span className="tabular-nums">{l.count}</span>
            </li>
          ))}
        </ul>
        <p className="type-mono text-graphite">
          {garden.profile.replace("https://", "")} · {BOOKS.length} public repos · updated {shortDate(garden.fetched)} {garden.fetched.slice(0, 4)}
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-12">
        <RepoList selected={selected} onSelect={setSelected} />
        <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          <Details book={book} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

/** Every repo, by language. */
function RepoList({ selected, onSelect }: { selected: number | null; onSelect: (i: number | null) => void }) {
  return (
    <section aria-labelledby="repo-list-title" className="rounded-[16px] border border-line-strong bg-paper-2 p-4 sm:p-5">
      <h2 id="repo-list-title" className="type-micro tracking-[0.16em] text-graphite uppercase">
        All repos
      </h2>
      <div className="mt-3 grid gap-4">
        {SHELF_LANGUAGES.map((l) => (
          <div key={l.language}>
            <p className="type-mono flex items-center gap-2 text-graphite">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: l.cloth }} />
              {l.language}
            </p>
            <ul className="mt-1.5 grid gap-1">
              {BOOKS.filter((b) => b.language === l.language).map((b) => (
                <li key={b.repo.name}>
                  <button
                    type="button"
                    data-qa="catalogue-card"
                    aria-pressed={selected === b.i}
                    onClick={() => onSelect(selected === b.i ? null : b.i)}
                    className="type-ui flex min-h-10 w-full items-center justify-between gap-3 rounded-[8px] border border-line bg-card px-3 text-left transition-colors duration-(--dur-ui) ease-arrive hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
                  >
                    <span className="min-w-0 truncate">{b.title}</span>
                    <span className="type-micro shrink-0 tabular-nums opacity-70">
                      {b.caseStudy ? "case study · " : ""}
                      {b.repo.created.slice(0, 4)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The chosen repo. */
function Details({ book, onClose }: { book: Book | null; onClose: () => void }) {
  if (!book) {
    return (
      <div aria-live="polite" className="grid min-h-64 place-items-center rounded-[16px] border border-dashed border-line-strong p-8 text-center">
        <p className="type-hand-sm text-graphite">pick a repo to read about it here</p>
      </div>
    );
  }
  const r = book.repo;
  return (
    <article aria-live="polite" data-qa="open-book" className="relative grid overflow-hidden rounded-[16px] border border-line-strong bg-card sm:grid-cols-2">
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 hidden w-px bg-line-strong sm:block" />
      <div className="p-6 sm:p-7">
        <p className="type-mono flex items-center gap-2 text-graphite">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: book.cloth }} />
          {book.language}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.05] font-extrabold tracking-[-0.02em] break-words">{book.title}</h2>
        <dl className="type-small mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-graphite">
          <dt>Started</dt>
          <dd className="text-ink">{monthYear(r.created)}</dd>
          <dt>Last push</dt>
          <dd className="text-ink">{monthYear(r.pushed)}</dd>
          {r.stars ? (
            <>
              <dt>Stars</dt>
              <dd className="text-ink tabular-nums">{r.stars}</dd>
            </>
          ) : null}
        </dl>
      </div>
      <div className="flex flex-col border-t border-line-strong p-6 sm:border-t-0 sm:p-7">
        <p className="type-body flex-1 text-ink">{r.description ?? "No description on GitHub yet."}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ExternalLink href={r.url} hint="the repository on GitHub, opens in a new tab" data-cursor="blue" className="type-ui text-blue-deep underline decoration-blue-deep/40 underline-offset-4 hocus:decoration-blue-deep">
            Open on GitHub<span className="sr-only">: {r.name}</span>
          </ExternalLink>
          {book.caseStudy ? (
            <TransitionLink href={routes.work(book.caseStudy.id)} label={book.caseStudy.title} className="type-ui text-ink underline decoration-line-strong underline-offset-4 hocus:decoration-ink">
              Read the case study<span className="sr-only">: {book.caseStudy.title}</span>
            </TransitionLink>
          ) : null}
          <button type="button" onClick={onClose} className="type-ui ml-auto text-graphite underline decoration-line-strong underline-offset-4 hover:text-ink">
            Close
          </button>
        </div>
      </div>
    </article>
  );
}
