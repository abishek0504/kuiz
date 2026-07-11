export const serviceWorkerUpdateEvent = "kuiz:service-worker-update";

let refreshAfterActivation = false;

function announceUpdate(registration: ServiceWorkerRegistration) {
  if (!navigator.serviceWorker.controller || !registration.waiting) return;
  window.dispatchEvent(
    new CustomEvent<ServiceWorkerRegistration>(serviceWorkerUpdateEvent, {
      detail: registration,
    }),
  );
}

export function applyServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  if (!registration.waiting) return false;
  refreshAfterActivation = true;
  registration.waiting.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export function registerServiceWorkerUpdateFlow() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshAfterActivation) return;
    refreshAfterActivation = false;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" })
      .then((registration) => {
        announceUpdate(registration);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") announceUpdate(registration);
          });
        });

        const checkForUpdate = () => void registration.update().catch(() => undefined);
        window.addEventListener("focus", checkForUpdate);
        window.addEventListener("online", checkForUpdate);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });
        window.setInterval(checkForUpdate, 60 * 60 * 1_000);
        checkForUpdate();
      })
      .catch((error: unknown) => {
        console.warn("Kuiz service worker registration failed.", error);
      });
  });
}
