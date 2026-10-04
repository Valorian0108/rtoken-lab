import { ArrowUpRightIcon } from "../../components/Icons";

interface LandingPageProps {
  onOpenWorkbench: () => void;
}

export function LandingPage({ onOpenWorkbench }: LandingPageProps) {
  return (
    <main className="landing-entry" aria-label="rToken Lab">
      <div className="landing-entry__progress" aria-hidden="true">
        <i />
        <i />
        <i />
        <i className="is-active" />
      </div>

      <section className="landing-entry__content" aria-labelledby="landing-entry-title">
        <p className="landing-entry__kicker">THE INVESTIGATION CONTINUES</p>
        <h1 id="landing-entry-title">Entering the<br />research lab</h1>
        <p className="landing-entry__description">
          Live rToken market data, hourly history, and the research assistant.
        </p>
        <button className="landing-entry__button" type="button" onClick={onOpenWorkbench}>
          Open the workbench <ArrowUpRightIcon className="ui-icon landing-entry__button-icon" />
        </button>
      </section>
    </main>
  );
}
