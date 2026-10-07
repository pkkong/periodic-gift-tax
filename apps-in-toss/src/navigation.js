// Native back closes an open sheet before leaving the current wizard step.
export async function navigateBack({ overlays, stepIndex, closeOverlay, previousStep, closeView }) {
  const openOverlay = overlays.find((overlay) => !overlay.hidden);
  if (openOverlay) {
    closeOverlay(openOverlay);
    return;
  }
  if (stepIndex > 0) {
    previousStep();
    return;
  }
  await closeView();
}
