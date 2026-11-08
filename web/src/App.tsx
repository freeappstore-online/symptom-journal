import { t, displayLabel, formatLocale, language, matchesLabel, setLanguage } from "./language";
import { HelpPage } from "./HelpPage";
import { SummaryOverview } from "./SummaryOverview";
import { HistoryCalendar } from "./HistoryCalendar";
import { BodyHistory } from "./BodyHistory";
import { LibrarySelect } from "./LibrarySelect";
import { HomeSnapshot } from "./HomeSnapshot";
import { RecordTiles } from "./RecordTiles";
import { entrySymptoms, entryTitle, libraryScope, quickOptions } from "./logging";
import type { LogCategory, SymptomRating } from "./store";
import { LocationObservation } from "./LocationObservation";
import { specificLocationName } from "./subregions";
import { PhotoEditor, EntryPhotos } from "./EntryPhotos";
import { locationLabel, profileModel, profileIllustration } from "./anatomy";
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
  loadDiary,
  profileEntries,
  saveDiary,
  validateDiary,
  type Diary,
  type BodyIllustration,
  type Entry,
  type GeneralFeeling,
  type Location,
  type Profile,
  type Sex,
} from "./store";

const NAV: NavItem[] = [
  { label: "Home", href: "/", title: "Home — Symptom Journal" },
  { label: "Summary", href: "/history", title: "Summary — Symptom Journal" },
  {
    label: "Backup & privacy",
    href: "/settings",
    title: "Backup — Symptom Journal",
  },
  { label: "Help", href: "/help", title: "Help — Symptom Journal" },
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
function download(diary: Diary) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(diary, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `symptom-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initial() {
  try {
    return { ...loadDiary(window.localStorage), error: "" };
  } catch {
    return {
      diary: emptyDiary(),
      raw: null,
      error:
        "Your saved diary could not be read. Nothing has been replaced. Check browser storage or reload before continuing.",
    };
  }
}
export default function App() {
  const [locale, setLocale] = useState(language);
  const [boot] = useState(initial);
  const [diary, setDiary] = useState(boot.diary);
  const raw = useRef(boot.raw);
  const [error, setError] = useState(boot.error);
  const [notice, setNotice] = useState("");
  const [path, setPath] = useState(window.location.pathname);
  const [active, setActive] = useState<string | null>(null);
  const [step, setStep] = useState<
    | "home"
    | "new"
    | "editProfile"
    | "map"
    | "record"
    | "detail"
    | "report"
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
  const commit = (next: Diary) => {
    if (boot.error) {
      setError(boot.error);
      return false;
    }
    try {
      raw.current = saveDiary(window.localStorage, next, raw.current);
      setDiary(next);
      setError("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("another tab")
          ? e.message
          : "Could not save. Your changes have not been stored. Browser storage may be full or unavailable. Export a backup before clearing any data.",
      );
      return false;
    }
  };
  const saveCustom=(names:string[],scope:string)=>{
    if(!profile)return;
    const old=diary.customSymptoms??[];
    const additions=names.filter(name=>!old.some(c=>c.profileId===profile.id && c.scope===scope && c.name.toLowerCase()===name.toLowerCase()));
    if(!additions.length)return;
    if(old.length+additions.length>500){setError("Your library is full. You can still record these symptoms.");return;}
    const customSymptoms=[...old,...additions.map(name=>({profileId:profile.id,name,scope}))];
    if(commit({...diary,customSymptoms}))setNotice("Saved to your symptom library.");
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
    step === "new"
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
                  ? category==="body"?"Review entry":category==="physical"?"General symptoms":category==="mental"?"Mental health":"Body temperature"
                  : step === "detail"
                    ? "Entry details"
                    : step === "report"
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
      <Shell app={fas} appName="Symptom Journal" nav={NAV.map(item => ({...item, label:t(item.label), title:locale === "en" ? item.title : `${t(item.label)} — Symptom Journal`}))} onNavigate={navigate} renderNav={({items,currentPath,onNavigate})=><nav data-journal-nav aria-label={t("Main")} className="fixed inset-x-0 bottom-0 z-50 flex justify-around gap-1 border-t border-line bg-panel px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-lg sm:static sm:border-0 sm:p-0 sm:shadow-none">
          {items.map((item,i)=><a key={item.href} href={item.href} aria-current={currentPath===item.href?"page":undefined} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onNavigate(item.href);}}} className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 sm:px-4 text-xs font-bold text-muted aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent sm:flex-row sm:text-sm"><Icon name={i===0?"home":i===1?"chart":i===2?"settings":"help"}/><span>{i===2?t("Settings"):item.label}</span></a>)}
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
                onSave={(values) => {
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
                  if (commit(next)) {
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
                      disabled={!!boot.error}
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
                    disabled={!!boot.error}
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
                <HomeSnapshot entries={entries} />
                <h2 className="text-base sm:text-lg [@media(max-height:580px)]:sr-only">{t("What would you like to record?")}</h2>
                <RecordTiles onChoose={start}/>
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
                onSave={(values) => {
                  const e: Entry = {
                    ...values,
                    category,
                    kind: values.temperature?"symptom":values.symptoms?.length?"symptom":feelings.length?"general":"symptom",
                    symptom:values.temperature?"Body temperature":values.symptoms?.[0]?.name??values.symptom,
                    severity:values.temperature?undefined:values.symptoms?.[0]?.severity??values.severity,
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
                  if (commit(next)) {
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
                    {entry.kind !== "general" && !entry.temperature && !entry.symptoms && (
                      <SeverityRating value={entry.severity} />
                    )}
                  </div>
                  {!!entry.symptoms?.length && <ul className="mt-4 divide-y divide-line">{entry.symptoms.map(s=><li key={s.name} className="flex items-center justify-between py-3"><span>{displayLabel(s.name)}</span><SeverityRating value={s.severity}/></li>)}</ul>}
                  {entry.temperature && <p className="mt-3 text-sm text-muted">{displayLabel(entry.temperature.method) || "Measurement site not recorded"}</p>}
                  <dl className="my-5 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted">{t("Location")}</dt>
                      <dd className="font-semibold">
                        {entry.location ? displayLabel(specificLocationName(entry.location)) : t("No specific location")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">{t("Duration")}</dt>
                      <dd className="break-words font-semibold">
                        {entry.duration || "Not recorded"}
                      </dd>
                    </div>
                  </dl>
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

                  {entries.length > 0 && (
                    <button
                      className={secondary}
                      onClick={() => setStep("report")}
                    >
                      {t("Preview printable report")}
                    </button>
                  )}
                </>
              ) : (
                <ChooseFirst onChoose={() => navigate("/")} />
              ))}
            {step === "report" && profile && (
              <>
                <button className={`${primary} print:hidden`} onClick={() => window.print()}>
                  {t("Print or save PDF")}
                </button>
                <article className="symptom-report mt-4 space-y-5 rounded-[1.75rem] bg-panel p-5 print:mt-0 print:p-0">
                  <div className="break-inside-avoid space-y-1">
                    <h2 className="text-2xl font-bold">{t("Symptom report")}</h2>
                    <p className="break-words font-semibold">{profile.name}</p>
                    <p className="text-sm text-muted">
                      {historyEntries.length} {historyEntries.length === 1 ? t("entry") : t("entries")}
                      {historyPart && ` · ${displayLabel(historyPart)}`}
                    </p>
                    {historyEntries.some(e=>e.location) && <p className="text-sm text-muted">{t("Left and right refer to the patient’s own body.")}</p>}
                  </div>
                  {historyEntries.map(e => {
                    const symptoms = entrySymptoms(e);
                    const heading = e.location ? locationLabel(e.location) : e.temperature ? "Temperature" : e.category === "mental" ? "Mood" : "General symptoms";
                    return <section key={e.id} className="space-y-3 border-t border-line pt-4">
                      <div className="break-inside-avoid space-y-2">
                        <time className="block text-sm text-muted" dateTime={e.occurredAt}>{when(e.occurredAt)}</time>
                        <h3 className="text-lg font-bold">{displayLabel(heading)}</h3>
                        {!!symptoms.length && <ul className="divide-y divide-line text-sm" aria-label={t("Symptom severity")}>
                          {symptoms.map((symptom,i) => <li key={i} className="flex justify-between gap-3 py-1.5">
                            <span className="min-w-0 break-words">{displayLabel(symptom.name)}</span>
                            <span className="shrink-0 tabular-nums" aria-label={t("Severity {score} out of 10", {score:symptom.severity})}>{symptom.severity}/10</span>
                          </li>)}
                        </ul>}
                        {e.temperature && <p className="text-sm"><strong>{e.temperature.celsius.toFixed(1)} °C</strong>{e.temperature.method && ` · ${displayLabel(e.temperature.method)}`}</p>}
                        {e.duration && <p className="text-sm">{t("Duration")} {e.duration}</p>}
                      </div>
                      {!!e.feelings?.length && <ul className="divide-y divide-line text-sm" aria-label={t("Other symptoms and mood")}>
                        {e.feelings.map((feeling,i) => <li key={i} className="break-inside-avoid py-1.5">
                          <div className="flex justify-between gap-3">
                            <span className="min-w-0 break-words">{displayLabel(feeling.name)}{feeling.kind === "mood" && <span className="text-muted"> {t("· Mood")}</span>}</span>
                            <span className="shrink-0 tabular-nums" aria-label={t("Intensity {score} out of 10", {score:feeling.intensity})}>{feeling.intensity}/10</span>
                          </div>
                          {feeling.notes && <p className="mt-1 whitespace-pre-wrap break-words">{feeling.notes}</p>}
                        </li>)}
                      </ul>}
                      {e.notes && <p className="whitespace-pre-wrap break-words text-sm"><strong className="block">{t("Notes")}</strong>{e.notes}</p>}
                      {e.location && (e.location.surface3d || (e.location.illustration && e.location.illustration !== "none")) && (
                        <div className="max-w-sm break-inside-avoid">
                          <LocationSketch value={e.location} readOnly showLabel={false}/>
                        </div>
                      )}
                      <EntryPhotos photos={e.photos} />
                    </section>;
                  })}
                </article>
                <button
                  className={`${secondary} print:hidden`}
                  onClick={() => setStep("home")}
                >
                  {t("Back to summary")}
                </button>
              </>
            )}
            {step === "home" && path === "/help" && <HelpPage onBackup={()=>navigate("/settings")}/>}
            {step === "home" && path === "/settings" && (
              <>
                {languagePicker}
                <Panel><h2 className="text-lg font-bold">{t("Profile")}</h2><button className={`${secondary} mt-3`} onClick={()=>navigate("/profile")}>{t("View or edit profile details →")}</button></Panel>
                <Panel>
                  <h2 className="text-lg font-bold">{t("Keep a copy")}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {t("Backups include every profile and diary on this device. Store the file somewhere private.")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className={primary}
                      onClick={() => {
                        download(diary);
                        setNotice(
                          "Backup file created. Check your browser’s downloads.",
                        );
                      }}
                      disabled={!!boot.error}
                    >
                      {t("Export backup")}
                    </button>
                    <button
                      className={secondary}
                      onClick={() => file.current?.click()}
                      disabled={!!boot.error}
                    >
                      {t("Restore backup")}
                    </button>
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
                          if (f.size > 10_000_000)
                            throw Error(
                              "Backup exceeds the 10 MB import limit.",
                            );
                          setPending(validateDiary(JSON.parse(await f.text())));
                        } catch (ex) {
                          setError(
                            ex instanceof Error
                              ? ex.message
                              : "Could not read this file.",
                          );
                        }
                      }}
                    />
                  </div>
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
              !["/", "/history", "/settings", "/profile", "/help"].includes(path) && (
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
        <ConfirmDialog
          open={pending !== null}
          title={t("Replace this device’s diary?")}
          message={
            pending
              ? t("Restore {profiles} profiles and {entries} entries. This replaces all current profiles and entries. Export a backup first if you need to keep them.", {profiles:pending.profiles.length, entries:pending.entries.length})
              : ""
          }
          confirmLabel={t("Replace and restore")}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (pending && commit(pending)) {
              setPending(null);
              setActive(null);
              navigate("/");
              setNotice("Backup restored.");
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
          onConfirm={() => {
            if (
              commit({
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
 const valid=category==="temperature"?temperature!=="" && celsius>=30 && celsius<=45:symptoms.length>0 || feelings.length>0;
 const snapshot=()=>({symptom:symptoms[0]?.name??entry?.symptom??"",severity:symptoms[0]?.severity??entry?.severity,symptoms:symptoms.length?symptoms:undefined,
   occurredAt:occurredAt && Number.isFinite(Date.parse(occurredAt))?new Date(occurredAt).toISOString():new Date().toISOString(),duration,notes,photos,
   ...(category==="temperature"?{temperature:{celsius:Math.round(celsius*100)/100,method}}:{})});
 const submit=(e:FormEvent)=>{e.preventDefault();if(busy)return;if((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value")==="back"){onBack(snapshot());return;}if(valid)onSave(snapshot());};
 return <form id="entry-form" className="space-y-5" onSubmit={submit}>
   {category==="body" ? <><div className="flex items-center justify-between gap-3"><h2 className="text-lg">{location?displayLabel(specificLocationName(location)):t("No location")}</h2><button type="button" className="min-h-11 text-sm text-accent underline" disabled={busy} onClick={()=>onLocation(snapshot())}>{t("Edit body part")}</button></div>
     <ul className="divide-y divide-line rounded-2xl bg-panel px-4">{symptoms.map(v=><li key={v.name} className="flex items-center justify-between gap-3 py-4"><span className="font-bold">{displayLabel(v.name)}</span><SeverityRating value={v.severity}/></li>)}</ul>
   </> : category==="temperature" ? <div className="space-y-4 rounded-3xl bg-panel p-5"><div className="grid grid-cols-[1fr_6rem] gap-3"><Field label={t("Temperature")}><input aria-label={t("Temperature")} type="number" min={unit==="C"?30:86} max={unit==="C"?45:113} step="0.1" required inputMode="decimal" className={input} value={temperature} onChange={e=>setTemperature(e.target.value)}/></Field><Field label={t("Unit")}><select aria-label={t("Temperature unit")} className={input} value={unit} onChange={e=>{const old=unit;if(temperature)setTemperature((old==="C"?Number(temperature)*9/5+32:(Number(temperature)-32)*5/9).toFixed(1));setUnit(e.target.value);}}><option value="C">°C</option><option value="F">°F</option></select></Field></div><Field label={t("Measurement site (optional)")}><select className={input} value={method} onChange={e=>setMethod(e.target.value)}><option value="">{t("Not recorded")}</option>{["Mouth","Armpit","Ear","Forehead","Rectal","Other"].map(m=><option key={m} value={m}>{t(m)}</option>)}</select></Field></div> : <LocationObservation title={category==="mental"?t("How are you feeling?"):t("What are you noticing?")} location={null} value={symptoms} onChange={setSymptoms} options={quickOptions[category]} custom={custom} onSaveCustom={onSaveCustom}/>}
   {!!feelings.length && <FeelingsSummary value={feelings}/>}
   <Field label={t("When")}><input className={input} type="datetime-local" required value={occurredAt} onChange={e=>setOccurredAt(e.target.value)}/></Field>
   {category!=="temperature" && <Field label={t("Duration (optional)")}><input className={input} maxLength={80} placeholder={t("e.g. 45 minutes")} value={duration} onChange={e=>setDuration(e.target.value)}/></Field>}
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
                    : e.symptoms?.length ? (e.category==="mental"?t("Mental health"):t("General symptoms")) : e.temperature ? displayLabel(e.temperature.method) || t("Thermometer reading") : (e.feelings ?? [])
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
              {e.symptoms && e.symptoms.length>1 ? <span className="shrink-0 text-xs font-bold">{e.symptoms.length} {t("symptoms")}</span> : e.kind !== "general" && !e.temperature && <SeverityRating value={e.severity} />}
              <Icon name="chevron" className="size-3.5 text-line-strong" />
            </button>
          ))}
          </div>
        </section>
      ))}
    </div>
  );
}
