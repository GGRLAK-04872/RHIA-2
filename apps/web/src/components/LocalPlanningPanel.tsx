import { useEffect, useState } from "react";
import {
  type GeneratePlanInput,
  type LocalPlanningSnapshot,
  localPlanningService,
  type RecordPlanningFeedbackInput,
} from "../application/localPlanningService";
import { PlanningPanel } from "./PlanningPanel";
import styles from "./PlanningPanel.module.css";

export function LocalPlanningPanel() {
  const [snapshot, setSnapshot] = useState<LocalPlanningSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (operation: () => Promise<LocalPlanningSnapshot>): Promise<void> => {
    try {
      setError(null);
      setSnapshot(await operation());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Planungsaktion fehlgeschlagen.");
    }
  };

  useEffect(() => {
    let active = true;
    void localPlanningService
      .initialize()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Planung nicht verfügbar.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error && !snapshot) {
    return (
      <section className={styles.panel} role="alert">
        Planung konnte nicht geladen werden: {error}
      </section>
    );
  }
  if (!snapshot) {
    return (
      <section className={styles.panel} aria-busy="true">
        Planung und Briefings werden lokal geladen …
      </section>
    );
  }

  return (
    <>
      {error ? <p role="alert">Planungsaktion fehlgeschlagen: {error}</p> : null}
      <PlanningPanel
        snapshot={snapshot}
        onGeneratePlan={(input: GeneratePlanInput) =>
          run(() => localPlanningService.generatePlan(input))
        }
        onCreateEveningReview={(periodStart, periodEnd) =>
          run(() => localPlanningService.createEveningReview(periodStart, periodEnd))
        }
        onRecordFeedback={(input: RecordPlanningFeedbackInput) =>
          run(() => localPlanningService.recordFeedback(input))
        }
        onTrashBriefing={(briefing) =>
          run(() => localPlanningService.moveBriefingToTrash(briefing.id, briefing.revision))
        }
        onRestoreBriefing={(briefing) =>
          run(() => localPlanningService.restoreBriefing(briefing.id, briefing.revision))
        }
      />
    </>
  );
}
