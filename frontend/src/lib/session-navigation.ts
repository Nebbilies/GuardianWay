const sessionChangeKey = "guardianway.session-change";

export function navigateAfterSessionChange(path: string) {
    try {
        window.localStorage.setItem(sessionChangeKey, crypto.randomUUID());
    } catch {
        /* Session navigation also works when storage is unavailable. */
    }
    window.location.replace(path);
}

export function watchSessionChanges() {
    const onStorage = (event: StorageEvent) => {
        if (event.key === sessionChangeKey) window.location.reload();
    };
    const onPageShow = (event: PageTransitionEvent) => {
        if (event.persisted) window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("pageshow", onPageShow);
    };
}
