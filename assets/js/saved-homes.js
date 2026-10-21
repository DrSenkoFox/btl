const savedHomesStorageKey = "homefit-saved-homes";

function getSavedHomes() {
  try {
    const savedHomes = JSON.parse(
      localStorage.getItem(savedHomesStorageKey) || "[]",
    );
    return Array.isArray(savedHomes)
      ? savedHomes.filter((home) => home && typeof home.id === "string")
      : [];
  } catch {
    return [];
  }
}

function saveHome(home) {
  if (!home || typeof home.id !== "string" || !home.id.trim()) return false;

  const savedHomes = getSavedHomes();
  if (savedHomes.some((savedHome) => savedHome.id === home.id)) return false;

  savedHomes.push(home);
  localStorage.setItem(savedHomesStorageKey, JSON.stringify(savedHomes));
  window.dispatchEvent(new CustomEvent("homefit:saved-homes-change"));
  return true;
}

function removeSavedHome(homeId) {
  const savedHomes = getSavedHomes().filter((home) => home.id !== homeId);
  localStorage.setItem(savedHomesStorageKey, JSON.stringify(savedHomes));
  window.dispatchEvent(new CustomEvent("homefit:saved-homes-change"));
}

window.HomeFitSavedHomes = Object.freeze({
  getAll: getSavedHomes,
  save: saveHome,
  remove: removeSavedHome,
});
