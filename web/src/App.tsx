import { t, displayLabel, formatLocale, language, matchesLabel, setLanguage } from "./language";
import { ReportPage } from "./ReportPage";
import { HelpPage } from "./HelpPage";
import { SummaryOverview } from "./SummaryOverview";
import { HistoryCalendar } from "./HistoryCalendar";
import { BodyHistory } from "./BodyHistory";
import { LibrarySelect } from "./LibrarySelect";
import { HomeSnapshot } from "./HomeSnapshot";
import { RecordTiles } from "./RecordTiles";
import { entrySymptoms, entryTitle, libraryScope, quickOptions } from "./logging";
import { isReadingCategory, readingLabels, glucoseContexts, glucoseUnits, periodFlows, type LogCategory, type SymptomRating } from "./store";
import { LocationObservation } from "./LocationObservation";
import { specificLocationName } from "./subregions";
import { PhotoEditor, EntryPhotos } from "./EntryPhotos";
import { profileModel, profileIllustration } from "./anatomy";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SearchInput,
  Shell,
  type NavItem,
} from "@freeappstore/sdk/ui";
import {
  buttonPrimary,
  buttonSecondary,
  inputClass,
  Icon,
  ProfileInitial,
  StepProgress,
  SeverityRating,
} from "./ui";
import { fas } from "./platform";
import { TemperatureHistory } from "./TemperatureHistory";
import { HistoryRecap } from "./HistoryRecap";
import { LocationSketch, RegionPicker } from "./BodyMap";
import { FeelingsSummary } from "./GeneralFeelings";
import {
  emptyDiary,
  mergeDiaryBackup,
  profileEntries,
  validateDiary,
  type Diary,
  type BodyIllustration,
  type Entry,
  type GeneralFeeling,
  type Location,
  type Profile,
  type Sex,
} from "./store";

import { DiaryConflict, maxBackupBytes, openJournal, readLegacyForRecovery, serializeBackup, writeJournal } from "./journal-storage";

const NAV: NavItem[] = [
  { label: "Home", href: "/", title: "Home — Symptom Journal" },
  { label: "Summary", href: "/history", title: "Summary — Symptom Journal" },
  { label: "Report", href: "/report", title: "Report — Symptom Journal" },
  {
    label: "Settings",
    href: "/settings",
    title: "Backup — Symptom Journal",
  },
];
const input = inputClass;
const primary = buttonPrimary;
const secondary = buttonSecondary;
const sexLabel: Record<Sex, string> = {
  female: "Female",
  male: "Male",
  other: "Another option",
  unspecified: "Prefer not to say",
};
const when = (s: string) =>
  new Date(s).toLocaleString(formatLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  });
const localTime = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] bg-panel p-5 shadow-sm sm:p-6">
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
function download(diary: Diary, kind = "backup") {
  const url = URL.createObjectURL(serializeBackup(diary));
  const a = document.createElement("a");
  a.href = url;
  a.download = `symptom-journal-${kind}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const [locale, setLocale] = useState(language);
  const [diary, setDiary] = useState(emptyDiary);
  const revision = useRef<string | null>(null);
  const saving = useRef(false);
  const [loading, setLoading] = useState(true);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [failedDraft, setFailedDraft] = useState<Diary | null>(null);
  const [persistence, setPersistence] = useState<"unknown" | "granted" | "denied" | "unavailable">("unknown");
  const [exportDate, setExportDate] = useState(() => {
    try { return localStorage.getItem("symptom-journal:last-export") ?? ""; }
    catch { return ""; }
  });
  const [notice, setNotice] = useState("");
  const [path, setPath] = useState(window.location.pathname);
  const [active, setActive] = useState<string | null>(null);
  const [step, setStep] = useState<
    | "home"
    | "new"
    | "editProfile"
    | "chooseCategory"
    | "map"
    | "record"
    | "detail"
  >("home");
  const [category,setCategory]=useState<LogCategory>("body");
  const [historyPart,setHistoryPart]=useState("");
  const [feelings, setFeelings] = useState<GeneralFeeling[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [draft, setDraft] = useState<
    Omit<Entry, "id" | "profileId" | "location"> | undefined
  >();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Diary | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const profile = diary.profiles.find((p) => p.id === active);
  const entries = profile ? profileEntries(diary, profile.id) : [];
  const historyEntries=historyPart?entries.filter(e=>e.location && (e.location.region===historyPart || specificLocationName(e.location)===historyPart)):entries;
  const entry = entries.find((e) => e.id === entryId);
  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname);
      setStep("home");
      setEntryId(null);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step, path]);
  useEffect(() => {
    let cancelled = false;
    openJournal().then(saved => {
      if (cancelled) return;
      revision.current = saved.revision;
      setDiary(saved.diary);
    }).catch(() => {
      if (cancelled) return;
      setDiary(readLegacyForRecovery());
      setStorageUnavailable(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(granted => {
        if (!cancelled && granted) setPersistence("granted");
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!failedDraft) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [failedDraft]);

  async function commit(next: Diary, unsavedEntry?: Entry) {
    const keepEntry = () => {
      if (unsavedEntry) setFailedDraft({
        ...emptyDiary(),
        profiles: next.profiles.filter(profile => profile.id === unsavedEntry.profileId),
        entries: [unsavedEntry],
      });
    };
    if (loading || saving.current) {
      keepEntry();
      setError("Another save is in progress. Try saving again.");
      return false;
    }
    saving.current = true;
    setNotice("");
    try {
      if (!revision.current) throw new Error();
      const saved = await writeJournal(next, revision.current);
      revision.current = saved.revision;
      setDiary(saved.diary);
      if (unsavedEntry) setFailedDraft(null);
      setError("");
      return true;
    } catch (cause) {
      keepEntry();
      setError(cause instanceof DiaryConflict
        ? "Your diary changed in another tab. Download your unsaved changes before reloading."
        : cause instanceof Error && cause.message === "Backup exceeds the 50 MB limit."
          ? "This diary has reached the 50 MB backup limit. Export a backup before freeing up space."
          : "Could not save. Your changes have not been stored. Try again.");
      return false;
    } finally {
      saving.current = false;
    }
  }

  async function protectStorage() {
    try {
      if (!navigator.storage?.persist) {
        setPersistence("unavailable");
        return;
      }
      setPersistence(await navigator.storage.persist() ? "granted" : "denied");
    } catch {
      setPersistence("unavailable");
    }
  }

  const saveCustom=async (names:string[],scope:string)=>{
    if(!profile)return;
    const old=diary.customSymptoms??[];
    const additions=names.filter(name=>!old.some(c=>c.profileId===profile.id && c.scope===scope && c.name.toLowerCase()===name.toLowerCase()));
    if(!additions.length)return;
    if(old.length+additions.length>500){setError("Your library is full. You can still record these symptoms.");return;}
    const customSymptoms=[...old,...additions.map(name=>({profileId:profile.id,name,scope}))];
    if(await commit({...diary,customSymptoms}))setNotice("Saved to your symptom library.");
  };
  const navigate = (href: string) => {
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setPath(href);
    setStep("home");
    setEntryId(null);
    setNotice("");
  };
  const start = (nextCategory:LogCategory="body") => {
    setCategory(nextCategory);
    setFeelings([]);

    setDraft(undefined);
    setLocation(null);
    setEntryId(null);
    setStep(nextCategory==="body"?"map":"record");
    setNotice("");
  };
  const choose = (p: Profile) => {
    setActive(p.id);
    navigate("/");
    setNotice("");
  };
  const openEntry = (e: Entry) => {
    setEntryId(e.id);
    setStep("detail");
  };
  const languagePicker = (
    <label className="mb-4 flex items-center justify-between gap-3 text-sm font-semibold">
      {t("Language")}
      <select className="min-h-11 rounded-xl bg-panel px-3" value={locale} onChange={event => {
        const value = event.target.value === "vi" ? "vi" : "en";
        setLanguage(value);
        setLocale(value);
      }}>
        <option value="en" lang="en">English</option>
        <option value="vi" lang="vi">Tiếng Việt</option>
      </select>
    </label>
  );
  const heading =
    step === "chooseCategory"
      ? "What would you like to record?"
      : step === "new"
      ? "Create a profile"
      : step === "editProfile"
        ? "Edit profile"
        : path === "/help"
          ? "How to use Symptom Journal"
        : path === "/profile"
          ? "Profile details"
          : step === "map"
            ? "Where do you feel it?"
            : step === "record"
                  ? category==="body"?"Review entry":category==="physical"?"General symptoms":isReadingCategory(category)?readingLabels[category]:"Mental health"
                  : step === "detail"
                    ? "Entry details"
                    : path === "/report"
                      ? "Symptom report"
                      : path === "/settings"
                        ? "Backup & privacy"
                        : path === "/history"
                          ? "Summary"
                          : !profile
                            ? "Who is using Symptom Journal?"
                            : t("Hello, {name}", {name:profile.name});
  const isRecordingMenu = step === "home" && path === "/" && !!profile;
  const switchProfile = () => {
    setActive(null);
    navigate("/");
  };
  return (
    <div className="[&_.fas-main]:pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:[&_.fas-main]:pb-0 [&:has(>div>footer)_.fas-main]:pb-[calc(7rem+env(safe-area-inset-bottom))] sm:[&:has(>div>footer)_.fas-main]:pb-[calc(2.5rem+env(safe-area-inset-bottom))] [&:has(>div>footer)_nav[data-journal-nav]]:bottom-[calc(2.5rem+env(safe-area-inset-bottom))] [&>div>header>div:first-child>a]:hidden [&>div>header>div:first-child>span]:text-accent [&>div>header>div:first-child>span]:font-extrabold [&>div>header>div:first-child>span]:text-base sm:[&>div>header>div:first-child>span]:text-lg [&>div>header]:flex-wrap [&>div>header]:gap-y-2 [&>div>header_button.bg-accent]:text-paper">
      <Shell app={fas} appName="Symptom Journal" signInLabel={t("Sign in")} nav={NAV.map(item => ({...item, label:t(item.label), title:locale === "en" ? item.title : `${t(item.label)} — Symptom Journal`}))} onNavigate={navigate} renderNav={({items,currentPath,onNavigate})=><nav data-journal-nav aria-label={t("Main")} className="fixed inset-x-0 bottom-0 z-50 flex justify-around gap-1 border-t border-line bg-panel px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-lg sm:static sm:border-0 sm:p-0 sm:shadow-none">
          {items.map(item=><a key={item.href} href={item.href} aria-current={currentPath===item.href?"page":undefined} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onNavigate(item.href);}}} className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 sm:px-4 text-xs font-bold text-muted aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent sm:flex-row sm:text-sm"><Icon name={item.href === "/" ? "home" : item.href === "/history" ? "chart" : item.href === "/report" ? "report" : "settings"}/><span>{item.label}</span></a>)}
        </nav>}>
        <div className={`mx-auto w-full max-w-2xl [&_h1]:text-[1.5rem] [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-ink-strong ${isRecordingMenu ? "px-4 py-3 sm:px-8 sm:py-5 [@media(max-height:580px)]:py-2 [&_.fas-page-header]:mb-0 [&_.fas-page-header]:items-center [&_.fas-page-header]:gap-2" : "px-5 py-6 sm:px-8 sm:py-10"}`}>
          <div className="print:hidden">
            {["map", "record"].includes(step) && (
              <>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {step === "record" && <button className="min-h-11 font-semibold text-accent" type="submit"
                      form="entry-form" formNoValidate name="intent" value="back">{t("← Back")}</button>}
                    <span className="font-semibold text-muted">{entryId ? t("Edit entry") : t("New entry")}</span>
                  </div>
                  <button
                    className="min-h-11 text-muted"
                    onClick={() => {
                      setStep(entryId ? "detail" : "home");
                      setNotice("");
                    }}
                  >
                    {t("Cancel")}
                  </button>
                </div>
                {category==="body" && <StepProgress current={step === "record" ? 2 : 1}/>}
              </>
            )}
            <PageHeader
              title={t(heading)}
              actions={isRecordingMenu && (
                <button type="button" className="min-h-11 shrink-0 text-xs text-accent underline underline-offset-4" onClick={switchProfile}>
                  {t("Switch profile")}
                </button>
              )}
              description={
                !profile && step === "home" && path === "/"
                  ? t("Choose a profile on this device.")
                  : undefined
              }
            />
            {profile && !isRecordingMenu && (
              <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-2 font-semibold">
                  <Icon name="user" className="size-3.5" />
                  {profile.name}
                </span>
                {!(["map","record"].includes(step)) && <button
                  className="min-h-11 text-accent underline underline-offset-4"
                  onClick={switchProfile}
                >
                  {t("Switch profile")}
                </button>}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="my-4 rounded-xl border border-danger bg-danger-soft p-4 text-ink"
              >
                {t(error)}
              </div>
            )}
            {failedDraft && (
              <div className="my-4 rounded-xl bg-panel p-4 text-sm">
                <p>{t("An entry did not save. You can download a backup containing just that entry and its profile.")}</p>
                <button type="button" className="mt-2 min-h-11 font-semibold text-accent underline" onClick={() => {
                  try {
                    download(failedDraft);
                    setNotice("Check Downloads or Files to make sure the backup was saved.");
                  } catch {
                    setError("Could not export the backup. Please try again.");
                  }
                }}>{t("Download unsaved entry backup")}</button>
              </div>
            )}
            {loading && <p role="status">{t("Opening your diary…")}</p>}
            {storageUnavailable && (
              <p role="alert" className="my-4 rounded-xl border border-danger bg-danger-soft p-4 text-sm">
                {t("Could not open journal storage. Reload to retry. If you can see your diary, export a backup.")}
                {" "}
                {path !== "/settings" && <button type="button" className="font-semibold underline" onClick={() => navigate("/settings")}>{t("Backup options")}</button>}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="my-4 rounded-xl bg-accent-soft p-3 text-sm"
              >
                {t(notice)}
              </p>
            )}
          </div>
          <div className={isRecordingMenu ? "mt-2 space-y-3" : "mt-5 space-y-5"}>
            {(step === "new" || step === "editProfile") && (
              <ProfileForm
                key={step}
                profile={step === "editProfile" ? profile : undefined}
                onCancel={() => profile ? navigate("/profile") : setStep("home")}
                onSave={async (values) => {
                  const p: Profile = {
                    ...values,
                    id:
                      step === "editProfile" && profile
                        ? profile.id
                        : crypto.randomUUID(),
                  };
                  const next = {
                    ...diary,
                    profiles:
                      step === "editProfile"
                        ? diary.profiles.map((old) =>
                            old.id === p.id ? p : old,
                          )
                        : [...diary.profiles, p],
                  };
                  if (await commit(next)) {
                    setActive(p.id);
                    navigate(step === "editProfile" ? "/profile" : "/");
                  }
                }}
              />
            )}
            {step === "home" && path === "/profile" && (profile ? (
              <Panel>
                <div className="flex items-center gap-4">
                  <ProfileInitial
                    name={profile.name}
                    tone={diary.profiles.findIndex((p) => p.id === profile.id)}
                  />
                  <div>
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <p className="mt-1 text-muted">
                      {t("Age")} {profile.age} · {t(sexLabel[profile.sex])}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t("Body map:")}{" "}
                      {profileIllustration(profile) === "list"
                        ? t("Body-part list")
                        : profileIllustration(profile) === "male"
                          ? t("Male")
                          : t("Female")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className={primary} onClick={() => navigate("/")}>
                    {t("Open diary")}
                  </button>
                  <button
                    className={secondary}
                    onClick={() => setStep("editProfile")}
                  >
                    {t("Edit details")}
                  </button>
                </div>
              </Panel>
            ) : <ChooseFirst onChoose={() => navigate("/")}/>)}
            {step === "home" && path === "/" && !profile && (
              <>
                {languagePicker}
                <div className="divide-y divide-line overflow-hidden rounded-2xl bg-panel">
                  {diary.profiles.map((p, index) => (
                    <button
                      key={p.id}
                      disabled={loading || storageUnavailable}
                      className="flex min-h-20 w-full items-center gap-4 bg-panel p-4 text-left text-sm transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent"
                      onClick={() => choose(p)}
                    >
                      <ProfileInitial name={p.name} tone={index} />
                      <span className="min-w-0 flex-1 break-words font-semibold">
                        {p.name}
                      </span>
                    </button>
                  ))}
                  <button
                    disabled={loading || storageUnavailable}
                    className="flex min-h-20 w-full items-center gap-4 bg-panel p-4 text-left text-sm hover:bg-accent-soft"
                    onClick={() => setStep("new")}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-2xl"
                    >
                      <Icon name="plus" className="size-7" />
                    </span>
                    <span className="font-semibold">{t("Create a profile")}</span>
                  </button>
                </div>
                <button type="button" className="min-h-11 text-sm font-semibold text-accent underline disabled:opacity-50" disabled={loading || storageUnavailable} onClick={() => file.current?.click()}>
                  {t("Restore backup")}
                </button>
                <div className="flex gap-3 p-2">
                  <Icon name="shield" className="mt-0.5 size-5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold">
                      {t("Separate profiles. One device.")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {t("Profiles are not password-protected.")}
                    </p>
                  </div>
                </div>
              </>
            )}
            {step === "home" && path === "/" && profile && (
              <>
                <HomeSnapshot entries={entries} onOpen={openEntry} onHistory={() => navigate("/history")} />
                <h2 className="text-base sm:text-lg [@media(max-height:580px)]:sr-only">{t("What would you like to record?")}</h2>
                <RecordTiles onChoose={start}/>
                <button type="button" className="min-h-11 text-sm font-semibold text-accent underline" onClick={() => navigate("/settings")}>
                  {t("Backup options")}
                </button>
              </>
            )}
            {step === "chooseCategory" && profile && (
              <>
                <RecordTiles onChoose={start}/>
                <button type="button" className={secondary} onClick={() => setStep("detail")}>
                  {t("Cancel")}
                </button>
              </>
            )}
            {step === "map" && profile && (
              <>
                <p className="sr-only">
                  {t("Step 1 of 2")}
                </p>
                <RegionPicker
                  model={profileModel(profile) ?? undefined}
                  key={profileModel(profile)}
                  skipLabel={t("No specific location")}
                  initialValue={location}
                  ready={entrySymptoms(draft ?? (entryId?entry:undefined)).length>0}
                  selection={l=><LocationObservation location={l} value={entrySymptoms(draft ?? (entryId?entry:undefined))}
                    custom={(diary.customSymptoms??[]).filter(c=>c.profileId===profile.id && c.scope===libraryScope(l,"body")).map(c=>c.name)}
                    onSaveCustom={names=>saveCustom(names,libraryScope(l,"body"))}
                    onChange={symptoms=>setDraft(old=>({...old,kind:"symptom",symptoms:symptoms.length?symptoms:undefined,symptom:symptoms[0]?.name??"",severity:symptoms[0]?.severity??5,occurredAt:old?.occurredAt??entry?.occurredAt??new Date().toISOString(),duration:old?.duration??entry?.duration??"",notes:old?.notes??entry?.notes??"",photos:old?.photos??entry?.photos}))}/>}
                  onSkip={() => start("physical")}
                  showVisual={profileModel(profile) !== null}
                  onChoose={(l) => {
                    setLocation(l);
                    setStep("record");
                  }}
                />
              </>
            )}
            {step === "record" && profile && (
              <RecordForm
                key={entryId ?? "new"}
                entry={draft ?? (entryId ? entry : undefined)}
                location={location}
                category={category}
                custom={(diary.customSymptoms??[]).filter(c=>c.profileId===profile.id && c.scope===libraryScope(location,category)).map(c=>c.name)}
                onSaveCustom={names=>saveCustom(names,libraryScope(location,category))}
                feelings={feelings}
                onBack={(values) => {
                  setDraft(values);
                  setStep(category==="body"?"map":"home");
                }}
                onLocation={(values) => {
                  setDraft(values);

                  setStep("map");
                }}
                onSave={async (values) => {
                  const e: Entry = {
                    ...values,
                    category,
                    kind: isReadingCategory(category)?"symptom":values.symptoms?.length?"symptom":feelings.length?"general":"symptom",
                    symptom:isReadingCategory(category)?readingLabels[category]:values.symptoms?.[0]?.name??values.symptom,
                    severity:isReadingCategory(category)?undefined:values.symptoms?.[0]?.severity??values.severity,
                    ...(feelings.length?{feelings}:{}),
                    id: entryId ?? crypto.randomUUID(),
                    profileId: profile.id,
                    location,
                  };
                  const next = {
                    ...diary,
                    entries: entryId
                      ? diary.entries.map((old) =>
                          old.id === entryId ? e : old,
                        )
                      : [...diary.entries, e],
                  };
                  if (await commit(next, e)) {
                    setEntryId(e.id);
                    setStep("detail");
                    setNotice("Entry saved.");
                  }
                }}
              />
            )}
            {step === "detail" && entry && (
              <>
                <Panel>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="break-words text-2xl font-bold">
                        {displayLabel(entryTitle(entry))}
                      </h2>
                      <p className="mt-2 text-sm text-muted">
                        {when(entry.occurredAt)}
                      </p>
                    </div>
                    {entry.kind !== "general" && !isReadingCategory(entry.category) && !entry.symptoms && (
                      <SeverityRating value={entry.severity} />
                    )}
                  </div>
                  {!!entry.symptoms?.length && <ul className="mt-4 divide-y divide-line">{entry.symptoms.map(s=><li key={s.name} className="flex items-center justify-between py-3"><span>{displayLabel(s.name)}</span><SeverityRating value={s.severity}/></li>)}</ul>}
                  {entry.temperature && <p className="mt-3 text-sm text-muted">{displayLabel(entry.temperature.method) || t("Measurement site not recorded")}</p>}
                  {entry.bloodGlucose?.context && <p className="mt-3 text-sm text-muted">{displayLabel(entry.bloodGlucose.context)}</p>}
                  {!isReadingCategory(entry.category) && <dl className="my-5 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted">{t("Location")}</dt>
                      <dd className="font-semibold">
                        {entry.location ? displayLabel(specificLocationName(entry.location)) : t("No specific location")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">{t("Duration")}</dt>
                      <dd className="break-words font-semibold">
                        {entry.duration || t("Not recorded")}
                      </dd>
                    </div>
                  </dl>}
                  {entry.location && (
                    <LocationSketch
                      value={entry.location}
                      readOnly
                      showVisual={
                        entry.location.illustration === "adult-female" ||
                        entry.location.illustration === "adult-male"
                      }
                    />
                  )}{" "}
                  {!!entry.feelings?.length && (
                    <FeelingsSummary
                      value={entry.feelings}
                      heading={entry.kind !== "general"}
                    />
                  )}
                  <EntryPhotos photos={entry.photos} />
                  {entry.notes && (
                    <div className="mt-5 rounded-3xl bg-sky-soft p-4">
                      <h3 className="mb-2 text-sm font-semibold">{t("Your notes")}</h3>
                      <p className="whitespace-pre-wrap break-words">
                        {entry.notes}
                      </p>
                    </div>
                  )}
                </Panel>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={primary}
                    onClick={() => {
                      setNotice("");
                      setStep("chooseCategory");
                    }}
                  >
                    {t("Add another entry")}
                  </button>
                  <button
                    className={secondary}
                    onClick={() => {
                      setDraft(undefined);
                      setNotice("");
                      setCategory(entry.category??(entry.location?"body":entry.feelings?.some(f=>f.kind==="mood")?"mental":"physical"));
                      setLocation(entry.location);
                      setFeelings(entry.feelings ?? []);

                      setStep("record");
                    }}
                  >
                    {t("Edit entry")}
                  </button>
                  <button type="button" className={secondary} onClick={() => {
                    if (!profile) return;
                    try {
                      download({ ...emptyDiary(), profiles: [profile], entries: [entry] }, "entry");
                      setError("");
                      setNotice("Check Downloads or Files to make sure the backup was saved.");
                    } catch {
                      setError("Could not export the backup. Please try again.");
                    }
                  }}>{t("Export entry (JSON)")}</button>
                  <button
                    className={secondary}
                    onClick={() => {
                      setStep("home");
                      setEntryId(null);
                    }}
                  >
                    {t("Back to diary")}
                  </button>
                  <button
                    className="min-h-12 px-3 text-danger underline"
                    onClick={() => setDeleteEntry(entry.id)}
                  >
                    {t("Delete entry")}
                  </button>
                </div>
              </>
            )}
            {step === "home" &&
              path === "/history" &&
              (profile ? (
                <>
                  <SummaryOverview key={profile.id} entries={entries} onOpen={openEntry} />
                  <label className="block space-y-2 text-sm font-bold">{t("Body-part history")}
                    <LibrarySelect label={t("Filter history by body part")} value={historyPart} onChange={setHistoryPart} options={[{id:"",label:"All entries"},...[...new Set(entries.flatMap(e=>e.location?[e.location.region,specificLocationName(e.location)]:[]))].sort().map(label=>({id:label,label}))]}/>

                  </label>
                  <TemperatureHistory entries={historyEntries} onOpen={id=>{const e=entries.find(e=>e.id===id);if(e)openEntry(e);}}/>
                  <BodyHistory entries={entries} onOpen={id=>{const found=entries.find(e=>e.id===id);if(found)openEntry(found);}}/>
                  <HistoryRecap
                    key={profile.id}
                    entries={historyEntries}
                    onOpen={(id) => {
                      const found = entries.find((e) => e.id === id);
                      if (found) openEntry(found);
                    }}
                  />
                  <label className="block">
                    <span className="sr-only">{t("Search your diary")}</span>
                    <SearchInput
                      value={query}
                      onChange={setQuery}
                      placeholder={t("Search your diary")}
                    />
                  </label>
                  <HistoryCalendar entries={historyEntries.filter(e=>matchesLabel(`${entryTitle(e)}${e.location?` · ${specificLocationName(e.location)}`:""}`,query))}>{day=><EntryList entries={day} onOpen={openEntry}/>}</HistoryCalendar>

                </>
              ) : (
                <ChooseFirst onChoose={() => navigate("/")} />
              ))}
            {step === "home" && path === "/report" && (profile ? (
              <ReportPage key={profile.id} entries={entries} profileName={profile.name} />
            ) : <ChooseFirst onChoose={() => navigate("/")} />)}
            {step === "home" && path === "/help" && <HelpPage onBackup={()=>navigate("/settings")}/>}
            {step === "home" && path === "/settings" && (
              <>
                {languagePicker}
                <Panel><h2 className="text-lg font-bold">{t("Profile")}</h2><button className={`${secondary} mt-3`} onClick={()=>navigate("/profile")}>{t("View or edit profile details →")}</button></Panel>
                <Panel>
                  <h2 className="text-lg font-bold">{t("Keep a copy")}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {t("A JSON backup includes all diary profiles, entries, and photos in this browser. Save it somewhere private so you can restore your diary later.")}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {t("Use your regular browser for entries you want to keep. Private browsing can erase entries when it ends. Export a backup before switching from an in-app browser.")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className={primary}
                      onClick={() => {
                        try {
                          download(diary);
                          const date = new Date().toISOString();
                          setExportDate(date);
                          try { localStorage.setItem("symptom-journal:last-export", date); } catch { /* Export is still available. */ }
                          setError("");
                          setNotice("Check Downloads or Files to make sure the backup was saved.");
                        } catch {
                          setNotice("");
                          setError("Could not export the backup. Please try again.");
                        }
                      }}
                      disabled={loading || (storageUnavailable && diary.profiles.length === 0)}
                    >
                      {t("Export backup")}
                    </button>
                    <button
                      className={secondary}
                      onClick={() => file.current?.click()}
                      disabled={loading || storageUnavailable}
                    >
                      {t("Restore backup")}
                    </button>
                  </div>
                  {exportDate && Number.isFinite(Date.parse(exportDate)) && <p className="mt-2 text-sm text-muted">{t("Last backup requested")}: {when(exportDate)}</p>}
                  <button type="button" className={`${secondary} mt-3`} disabled={persistence === "granted"} onClick={() => void protectStorage()}>{t("Protect local storage")}</button>
                  {persistence !== "unknown" && <p role="status" className="mt-2 text-sm text-muted">{t({
                    granted: "Storage protection granted. Keep a backup in case site data is cleared.",
                    denied: "This browser did not grant storage protection. Keep a backup.",
                    unavailable: "Storage protection is unavailable here. Keep a backup.",
                  }[persistence])}</p>}
                  <details className="mt-3 text-sm text-muted">
                    <summary className="min-h-11 cursor-pointer py-3 font-semibold">{t("Moving to the Home Screen app or another browser?")}</summary>
                    <p className="mb-2">{t("On iPhone, open the Share menu in Safari and choose Add to Home Screen. On Android, use Install app in the browser menu when available.")}</p>
                    <p>{t("Export here first. Then open Symptom Journal in the new app or browser and choose Restore backup.")}</p>
                  </details>
                </Panel>
                <Panel>
                  <h2 className="text-lg font-bold">{t("On this device")}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                    <p>
                      {t("No symptom data is sent to a server. No analytics or remote error reporting.")}
                    </p>
                    <p>
                      {t("Clearing browser data or losing this device can erase your diary. There is no automatic sync or recovery.")}
                    </p>
                    <p>
                      {t("Local profiles are not locked. Anyone using this browser may open them.")}
                    </p>
                    <p>
                      {t("Platform sign-in is separate from diary profiles and does not back up this diary.")}
                    </p>
                  </div>
                </Panel>
                <Panel>
                  <h2 className="text-lg font-bold">{t("About the diary")}</h2>
                  <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-accent underline underline-offset-4" onClick={() => navigate("/help")}>
                    {t("How to use Symptom Journal")}
                  </button>
                  <p className="mt-3 text-sm text-muted">
                    {t("Record what you feel. This app does not diagnose conditions, assess urgency or recommend treatment.")}
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    {t("Body drawings are approximate surface guides. They do not identify organs or the cause of pain.")}
                  </p>
                  <a
                    href="https://freeappstore.online"
                    className="mt-3 inline-flex min-h-11 items-center text-sm text-accent underline"
                  >
                    {t("Part of FreeAppStore")}
                  </a>
                </Panel>
              </>
            )}
            {step === "home" &&
              !["/", "/history", "/settings", "/profile", "/help", "/report"].includes(path) && (
                <EmptyState
                  title={t("Page not found")}
                  message={t("Open Diary to continue.")}
                  action={
                    <button className={secondary} onClick={() => navigate("/")}>
                      {t("Open diary")}
                    </button>
                  }
                />
              )}
          </div>
        </div>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label={t("Choose a Symptom Journal backup")}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              if (f.size > maxBackupBytes)
                throw Error(
                  "Backup exceeds the 50 MB limit.",
                );
              setError("");
              setPending(validateDiary(JSON.parse(await f.text())));
            } catch (ex) {
              setError(
                ex instanceof SyntaxError ? "Could not read this file." : ex instanceof Error ? ex.message : "Could not read this file.",
              );
            }
          }}
        />
        <ConfirmDialog
          open={pending !== null}
          title={t("Import this backup?")}
          message={
            pending
              ? t("This backup contains {profiles} profiles and {entries} entries. Import adds new items and keeps your current versions of items already in the diary.", {profiles:pending.profiles.length, entries:pending.entries.length})
                + (error ? " " + t(error) : "")
              : ""
          }
          confirmLabel={t("Import backup")}
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            if (!pending) return;
            const merged = mergeDiaryBackup(diary, pending);
            const added = merged.entries.length - diary.entries.length;
            if (await commit(merged)) {
              setPending(null);
              setNotice(t("Backup imported. Entries added: {added}. Already present: {skipped}.", {
                added,
                skipped: pending.entries.length - added,
              }));
            }
          }}
        />
        <ConfirmDialog
          open={deleteEntry !== null}
          title={t("Delete this entry?")}
          message={t("This cannot be undone. Other entries will stay in your diary.")}
          confirmLabel={t("Delete entry")}
          variant="danger"
          onCancel={() => setDeleteEntry(null)}
          onConfirm={async () => {
            if (
              await commit({
                ...diary,
                entries: diary.entries.filter((e) => e.id !== deleteEntry),
              })
            ) {
              setDeleteEntry(null);
              setEntryId(null);
              setStep("home");
              setNotice("Entry deleted.");
            }
          }}
        />
      </Shell>
    </div>
  );
}
function ChooseFirst({ onChoose }: { onChoose: () => void }) {
  return (
    <Panel>
      <EmptyState
        title={t("Choose a profile")}
        message={t("History is separate for each person.")}
        action={
          <button className={primary} onClick={onChoose}>
            {t("Choose a profile")}
          </button>
        }
      />
    </Panel>
  );
}
function ProfileForm({
  profile,
  onSave,
  onCancel,
}: {
  profile?: Profile;
  onSave: (p: Omit<Profile, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age.toString() ?? "");
  const [sex, setSex] = useState<Sex>(profile?.sex ?? "unspecified");
  const [bodyChoice, setBodyChoice] = useState<BodyIllustration>(
    profile ? profileIllustration(profile) : "list",
  );
  const [customBody, setCustomBody] = useState(
    profile?.bodyIllustration !== undefined,
  );
  return (
    <Panel>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim())
            onSave({
              name: name.trim(),
              age: Number(age),
              sex,
              bodyIllustration: Number(age) < 18 ? "list" : bodyChoice,
            });
        }}
      >
        <Field label={t("Name or nickname")}>
          <input
            className={input}
            autoFocus
            required
            maxLength={40}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("Age")}>
            <input
              className={input}
              required
              type="number"
              inputMode="numeric"
              min="0"
              max="120"
              step="1"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </Field>
          <Field label={t("Sex")}>
            <select
              aria-label={t("Sex")}
              className={input}
              value={sex}
              onChange={(e) => {
                const next = e.target.value as Sex;
                setSex(next);
                if (!customBody)
                  setBodyChoice(
                    next === "male" || next === "female" ? next : "list",
                  );
              }}
            >
              {Object.entries(sexLabel).map(([k, v]) => (
                <option value={k} key={k}>
                  {t(v)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {age !== "" && Number(age) >= 18 ? (
          <Field label={t("Body illustration")}>
            <select
              aria-label={t("Body illustration")}
              className={input}
              value={bodyChoice}
              onChange={(e) => {
                setCustomBody(true);
                setBodyChoice(e.target.value as BodyIllustration);
              }}
            >
              <option value="female">{t("Female")}</option>
              <option value="male">{t("Male")}</option>
              <option value="list">{t("Body-part list")}</option>
            </select>
            <p className="mt-2 text-xs text-muted">
              {t("Reference illustration only. Choose what suits you.")}
            </p>
          </Field>
        ) : (
          <p className="text-sm text-muted">
            {t("Under-18 profiles use the body-part list.")}
          </p>
        )}
        <div className="flex gap-3">
          <button className="min-h-12 px-2 text-sm font-semibold text-accent underline" type="button" onClick={onCancel}>{t("Cancel")}</button>
          <button className={`${primary} ml-auto`} type="submit">{t("Save profile")}</button>
        </div>
      </form>
    </Panel>
  );
}
function RecordForm({entry,location,onSave,onLocation,onBack,feelings,category,custom,onSaveCustom}: {
 entry?:Omit<Entry,"id"|"profileId"|"location">;location:Location|null;category:LogCategory;custom:string[];onSaveCustom:(names:string[])=>void;
 onSave:(e:Omit<Entry,"id"|"profileId"|"location">)=>void;onLocation:(e:Omit<Entry,"id"|"profileId"|"location">)=>void;onBack:(e:Omit<Entry,"id"|"profileId"|"location">)=>void;
 feelings:GeneralFeeling[];
}) {
 const [symptoms,setSymptoms]=useState<SymptomRating[]>(entrySymptoms(entry));
 const [occurredAt,setOccurredAt]=useState(entry?(()=>{const d=new Date(entry.occurredAt);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);})():localTime());
 const [duration,setDuration]=useState(entry?.duration??""),[notes,setNotes]=useState(entry?.notes??""),[photos,setPhotos]=useState(entry?.photos??[]),[busy,setBusy]=useState(false);
 const [temperature,setTemperature]=useState(entry?.temperature?.celsius.toString()??""),[unit,setUnit]=useState("C"),[method,setMethod]=useState(entry?.temperature?.method??"");
 const celsius=unit==="C"?Number(temperature):(Number(temperature)-32)*5/9;
 const valid=category==="temperature" ? temperature!=="" && celsius>=30 && celsius<=45
   : isReadingCategory(category) || symptoms.length>0 || feelings.length>0;
 const snapshot=()=>({symptom:symptoms[0]?.name??entry?.symptom??"",severity:symptoms[0]?.severity??entry?.severity,symptoms:symptoms.length?symptoms:undefined,
   occurredAt:occurredAt && Number.isFinite(Date.parse(occurredAt))?new Date(occurredAt).toISOString():new Date().toISOString(),duration,notes,photos,
   ...(category==="temperature"?{temperature:{celsius:Math.round(celsius*100)/100,method}}:{})});
 const submit=(e:FormEvent)=>{e.preventDefault();if(busy)return;if((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value")==="back"){onBack(snapshot());return;}if (!valid) return;
   const values = snapshot();
   const data = new FormData(e.currentTarget as HTMLFormElement);
   if (category === "bloodPressure") {
     onSave({ ...values, bloodPressure: { systolic: Number(data.get("systolic")), diastolic: Number(data.get("diastolic")) } });
   } else if (category === "bloodGlucose") {
     const unit = glucoseUnits.find(unit => unit === data.get("glucoseUnit"));
     if (unit) onSave({ ...values, bloodGlucose: {
       value: Number(data.get("glucose")),
       unit,
       context: glucoseContexts.find(context => context === data.get("glucoseContext")) ?? "",
     } });
   } else if (category === "period") {
     const flow = periodFlows.find(flow => flow === data.get("flow"));
     if (flow) onSave({ ...values, period: { flow } });
   } else onSave(values);};
 return <form id="entry-form" className="space-y-5" onSubmit={submit}>
   {category==="body" ? <><div className="flex items-center justify-between gap-3"><h2 className="text-lg">{location?displayLabel(specificLocationName(location)):t("No location")}</h2><button type="button" className="min-h-11 text-sm text-accent underline" disabled={busy} onClick={()=>onLocation(snapshot())}>{t("Edit body part")}</button></div>
     <ul className="divide-y divide-line rounded-2xl bg-panel px-4">{symptoms.map(v=><li key={v.name} className="flex items-center justify-between gap-3 py-4"><span className="font-bold">{displayLabel(v.name)}</span><SeverityRating value={v.severity}/></li>)}</ul>
   </> : category==="temperature" ? <div className="space-y-4 rounded-3xl bg-panel p-5"><div className="grid grid-cols-[1fr_6rem] gap-3"><Field label={t("Temperature")}><input aria-label={t("Temperature")} type="number" min={unit==="C"?30:86} max={unit==="C"?45:113} step="0.1" required inputMode="decimal" className={input} value={temperature} onChange={e=>setTemperature(e.target.value)}/></Field><Field label={t("Unit")}><select aria-label={t("Temperature unit")} className={input} value={unit} onChange={e=>{const old=unit;if(temperature)setTemperature((old==="C"?Number(temperature)*9/5+32:(Number(temperature)-32)*5/9).toFixed(1));setUnit(e.target.value);}}><option value="C">°C</option><option value="F">°F</option></select></Field></div><Field label={t("Measurement site (optional)")}><select className={input} value={method} onChange={e=>setMethod(e.target.value)}><option value="">{t("Not recorded")}</option>{["Mouth","Armpit","Ear","Forehead","Rectal","Other"].map(m=><option key={m} value={m}>{t(m)}</option>)}</select></Field></div> : category === "bloodPressure" ? (
     <fieldset className="space-y-3 rounded-3xl bg-panel p-4 sm:p-5">
       <legend className="px-1 text-sm font-semibold">{t("Copy your monitor reading")}</legend>
       <p className="text-sm text-muted">{t("Match SYS and DIA by their labels. The layout can vary by monitor.")}</p>
       <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper-deep p-3 shadow-sm">
         <div className="divide-y divide-line rounded-2xl bg-sky-soft px-3">
           <label className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
             <span><strong className="block">SYS</strong><span className="block text-xs text-muted">{t("Systolic")} · mmHg</span></span>
             <input aria-label={t("SYS · Systolic (mmHg)")} name="systolic" type="number" inputMode="numeric" min={1} max={999} required className={`${input} text-right font-mono text-xl tabular-nums`} defaultValue={entry?.bloodPressure?.systolic} />
           </label>
           <label className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
             <span><strong className="block">DIA</strong><span className="block text-xs text-muted">{t("Diastolic")} · mmHg</span></span>
             <input aria-label={t("DIA · Diastolic (mmHg)")} name="diastolic" type="number" inputMode="numeric" min={1} max={999} required className={`${input} text-right font-mono text-xl tabular-nums`} defaultValue={entry?.bloodPressure?.diastolic} />
           </label>
           <div className="flex items-center justify-between gap-2 py-2 text-xs text-muted">
             <span>{t("PULSE · Heart rate")}</span><span>{t("Separate reading")}</span>
           </div>
         </div>
       </div>
       <p className="text-xs text-muted">{t("Check that your monitor shows mmHg before copying the numbers.")}</p>
     </fieldset>
   ) : category === "bloodGlucose" ? (
     <div className="space-y-4 rounded-3xl bg-panel p-5">
       <div className="grid grid-cols-[1fr_7rem] gap-3">
         <Field label={t("Blood sugar")}><input name="glucose" type="number" inputMode="decimal" min={0.01} max={9999} step="any" required className={input} defaultValue={entry?.bloodGlucose?.value} /></Field>
         <Field label={t("Unit")}><select name="glucoseUnit" className={input} defaultValue={entry?.bloodGlucose?.unit ?? "mg/dL"}>{glucoseUnits.map(unit => <option key={unit}>{unit}</option>)}</select></Field>
       </div>
       <Field label={t("Meal timing (optional)")}>
         <select name="glucoseContext" className={input} defaultValue={entry?.bloodGlucose?.context ?? ""}>
           <option value="">{t("Not recorded")}</option>
           {glucoseContexts.map(context => <option key={context} value={context}>{t(context)}</option>)}
         </select>
       </Field>
     </div>
   ) : category === "period" ? (
     <div className="rounded-3xl bg-panel p-5">
       <Field label={t("Period flow")}>
         <select name="flow" required className={input} defaultValue={entry?.period?.flow ?? ""}>
           <option value="" disabled>{t("Choose flow")}</option>
           {periodFlows.map(flow => <option key={flow} value={flow}>{t(flow)}</option>)}
         </select>
       </Field>
     </div>
   ) : <LocationObservation title={category==="mental"?t("How are you feeling?"):t("What are you noticing?")} location={null} value={symptoms} onChange={setSymptoms} options={quickOptions[category]} custom={custom} onSaveCustom={onSaveCustom}/>}
   {!!feelings.length && <FeelingsSummary value={feelings}/>}
   <Field label={t("When")}><input className={input} type="datetime-local" required value={occurredAt} onChange={e=>setOccurredAt(e.target.value)}/></Field>
   {!isReadingCategory(category) && <Field label={t("Duration (optional)")}><input className={input} maxLength={80} placeholder={t("e.g. 45 minutes")} value={duration} onChange={e=>setDuration(e.target.value)}/></Field>}
   <Field label={t("Notes (optional)")}><textarea aria-label={t("Notes (optional)")} className={input} maxLength={2000} rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
   <PhotoEditor value={photos} onChange={setPhotos} onBusy={setBusy}/>
   <button className={`${primary} w-full`} type="submit" disabled={busy||!valid}><Icon name="check"/> {t("Save entry")}</button>
 </form>;
}
function EntryList({
  entries,
  onOpen,
  groupByDay = false,
}: {
  entries: Entry[];
  onOpen: (e: Entry) => void;
  groupByDay?: boolean;
}) {
  if (!entries.length)
    return (
      <Panel>
        <EmptyState
          title={t("No entries found")}
          message={t("Saved symptoms will appear here.")}
        />
      </Panel>
    );
  const groups: { label: string; entries: Entry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.occurredAt);
    const key = groupByDay
      ? d.toLocaleDateString(formatLocale(), {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    const previous = groups.at(-1);
    if (previous?.label === key) previous.entries.push(e);
    else groups.push({ label: key, entries: [e] });
  }
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          {groupByDay && (
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">{group.label}</h2>
              <span className="text-xs text-muted">
                {group.entries.length}{" "}
                {group.entries.length === 1 ? t("entry") : t("entries")}
              </span>
            </div>
          )}
          <div className="divide-y divide-line overflow-hidden rounded-2xl bg-panel">
          {group.entries.map((e) => (
            <button
              key={e.id}
              onClick={() => onOpen(e)}
              className="flex w-full items-center gap-3 bg-panel p-4 text-left transition-colors hover:bg-sky-soft/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name={e.location ? "pin" : "cloud"} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-bold">
                  {e.location ? displayLabel(specificLocationName(e.location)) : displayLabel(entryTitle(e))}
                </span>
                <span className="mt-1 block break-words text-xs text-muted">
                  {e.location
                    ? displayLabel(entryTitle(e))
                    : e.symptoms?.length ? (e.category==="mental"?t("Mental health"):t("General symptoms")) : isReadingCategory(e.category) ? displayLabel(e.temperature?.method || e.bloodGlucose?.context || "") : (e.feelings ?? [])
                        .slice(0, 2)
                        .map((f) => displayLabel(f.name))
                        .join(" · ") || t("No specific location")}
                  {e.duration ? ` · ${e.duration}` : ""}
                </span>
                <span className="mt-1 block text-[.7rem] text-muted">
                  {when(e.occurredAt)}
                </span>
                {e.location && !!e.feelings?.length && (
                  <span className="mt-1 block text-[.7rem] text-muted">
                    {t("With")}{" "}
                    {e.feelings
                      .slice(0, 2)
                      .map((f) => displayLabel(f.name).toLocaleLowerCase(formatLocale()))
                      .join(" · ")}
                  </span>
                )}
              </span>
              {e.symptoms && e.symptoms.length>1 ? <span className="shrink-0 text-xs font-bold">{e.symptoms.length} {t("symptoms")}</span> : e.kind !== "general" && !isReadingCategory(e.category) && <SeverityRating value={e.severity} />}
              <Icon name="chevron" className="size-3.5 text-line-strong" />
            </button>
          ))}
          </div>
        </section>
      ))}
    </div>
  );
}
