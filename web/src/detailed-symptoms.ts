// Patient-observable descriptions; no conditions or diagnostic associations imported.
export const detailedSymptoms = {
 neck:{match:/neck/,labels:["Neck feels stiff","Hard to turn my head","Neck pain","Pain when turning my head to one side","Hard to look up"],sources:["https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/"]},
 throat:{match:/front of neck|throat/,labels:["Pain when swallowing","Dry or scratchy throat","Swollen glands in neck","Mild cough","Bad breath"],sources:["https://www.nhs.uk/symptoms/sore-throat/"]},
 abdomen:{match:/abdomen|belly|tummy/,labels:["Feeling bloated","Passing more wind","Full feeling after eating","Heartburn","Feeling sick","Vomiting","Hard to pass stool","Loose or watery stools","Tummy cramps","Pain after eating","Pain before a bowel movement","Pain that comes in waves"],sources:["https://www.nhs.uk/symptoms/stomach-ache/"]},
 nose:{match:/\b(?:nose|nostril)\b/,labels:["Blocked nose","Runny nose","Sneezing","Itchy nose","Nosebleed","Dryness inside nose","Reduced sense of smell","Changed sense of smell"],sources:["https://www.nhs.uk/conditions/allergic-rhinitis/","https://www.nhs.uk/conditions/nosebleed/","https://www.nhs.uk/symptoms/lost-or-changed-sense-smell/"]},
 eye:{match:/eye/,labels:["Red eye","Watery eyes","Gritty eyes","Sticky eyes","Blurred vision","Sensitive to light","Burning eyes","Feels like something in my eye","Itchy eyelids","Swollen eyelid","Crust on eyelids","Eye feels dry","Tears keep running","Pain when moving my eyes"],sources:["https://www.nhs.uk/symptoms/eye-pain/","https://www.nhs.uk/symptoms/eyelid-problems/"]},
 ear:{match:/\b(?:ear|earlobe)\b/,labels:["Ear pain","Trouble hearing","Fluid coming from ear","Ringing or buzzing in ear","Ear feels blocked","Itchy ear","Swelling around ear","Sore outer ear"],sources:["https://www.nhs.uk/symptoms/earache/","https://www.nhs.uk/conditions/tinnitus/"]},
 mouth:{match:/\b(?:mouth|lips?|tongue|teeth|gums?|jaw|chin|cheek)\b/,labels:["Toothache","Pain when biting","Swollen cheek or jaw","Sore patch in mouth","Mouth ulcer","Dry mouth","Cracked lips","Sore tongue","Gums bleed when brushing","Sore gums","Bad taste in mouth","Jaw clicks","Hard to open my mouth"],sources:["https://www.nhs.uk/symptoms/toothache/","https://www.nhs.uk/conditions/mouth-ulcers/","https://www.nhs.uk/conditions/gum-disease/","https://www.nhs.uk/conditions/temporomandibular-disorder-tmd/"]},
 scalp:{match:/scalp|forehead|temple|back of head|crown of head|hairline|eyebrows/,labels:["Headache","Scalp feels tender","Flaking scalp","Itchy scalp","Sore patch on scalp","Hair shedding more than usual"],sources:["https://www.nhs.uk/symptoms/headaches/","https://www.nhs.uk/conditions/dandruff/","https://www.nhs.uk/symptoms/hair-loss/"]},
 finger:{match:/^(?!.*\bwrist\b).*?(?:thumb|finger|knuckle)/,labels:["Pain when bending finger","Hard to straighten finger","Finger gets stuck","Finger clicks when moving","Hard to grip","Finger feels weak","Finger has changed colour","Numb fingertip","Swelling around finger joint","Lump at base of finger"],sources:["https://www.nhs.uk/symptoms/hand-pain/finger-pain/","https://www.nhs.uk/conditions/trigger-finger/"]},
 nail:{match:/nail/,labels:["Nail changed colour","Nail is loose","Nail breaks easily","Nail changed shape","Sore skin around nail","Swelling around nail","Pain beside nail"],sources:["https://www.nhs.uk/symptoms/nail-problems/"]},
 toe:{match:/toe/,labels:["Pain beside toenail","Toe changed colour","Pain when walking","Hard to move toe","Swollen toe joint","Lump near big toe","Toe feels cold","Sore skin between toes"],sources:["https://www.nhs.uk/symptoms/foot-pain/toe-pain/","https://www.nhs.uk/symptoms/nail-problems/"]},
 sole:{match:/sole|arch|heel(?! of palm)|ball of foot/,labels:["Heel pain when standing","Pain in first steps after rest","Pain along arch","Sore ball of foot","Hard patch of skin","Pain when putting weight on foot"],sources:["https://www.nhs.uk/symptoms/foot-pain/heel-pain/","https://www.nhs.uk/symptoms/foot-pain/pain-in-the-ball-of-the-foot/"]},
 breast:{match:/breast|nipple/,labels:["Heavy aching feeling","Breast lump","Breast looks swollen","Breast feels warm","Skin dimpling","Nipple looks different","Fluid from nipple","Sore nipple","Breast changed shape"],sources:["https://www.nhs.uk/symptoms/breast-pain/","https://www.nhs.uk/symptoms/nipple-discharge/"]},
 armpit:{match:/armpit/,labels:["Lump in armpit","Tender armpit","Swelling in armpit","Itchy armpit","Sore skin fold"],sources:["https://www.nhs.uk/symptoms/lumps/"]},
 joint:{match:/\b(?:knee|kneecap|ankle|elbow|wrist|shoulder|hip)\b/,labels:["Pain when moving","Pain at rest","Joint feels stiff after rest","Joint looks swollen","Joint feels warm","Painful clicking","Movement feels limited","Joint gives way"],sources:["https://www.nhs.uk/symptoms/joint-pain/"]},
 muscle:{match:/^(?!.*\b(?:wrist|hand|ankle|knee|shoulder|elbow|heel)\b).*?\b(?:thigh|calf|shin|arm|forearm|back|blade)\b/,labels:["Aching","Cramping","Muscle twitching","Tight feeling","Tender to touch","Pain with movement","Feels weak"],sources:["https://www.nhs.uk/conditions/sprains-and-strains/","https://www.nhs.uk/conditions/leg-cramps/"]},
 wrist:{match:/\b(?:wrist)\b/,labels:["Hard to bend my wrist", "Pain when turning my wrist", "Pain when putting weight through my hand", "Wrist clicks when moving", "Wrist feels stiff in the morning", "Wrist feels weak"],sources:["https://www.nhs.uk/symptoms/hand-pain/wrist-pain/"]},
 hand:{match:/\b(?:palm|back of hand|between fingers)\b/,labels:["Hard to make a fist", "Pain when opening my hand", "Pain when holding objects", "Hand feels weak", "Skin sore between fingers","Pain when opening a jar","Hard to hold a pen","Hand shakes when holding something"],sources:["https://www.nhs.uk/symptoms/hand-pain/"]},
 elbow:{match:/\b(?:elbow)\b/,labels:["Hard to bend my elbow", "Hard to straighten my elbow", "Pain when leaning on my elbow", "Pain when lifting or gripping","Pain when straightening my arm"],sources:["https://www.nhs.uk/symptoms/elbow-and-arm-pain/"]},
 shoulder:{match:/\b(?:shoulder|collarbone)\b/,labels:["Pain when raising my arm", "Pain when reaching behind me", "Pain when lying on this side", "Shoulder clicks when moving","Pain when reaching overhead"],sources:["https://www.nhs.uk/symptoms/shoulder-pain/"]},
 knee:{match:/\b(?:knee|kneecap)\b/,labels:["Pain on stairs", "Pain when kneeling", "Knee feels stiff after sitting", "Hard to bend my knee","Pain when straightening my leg","Hard to bear weight on this leg","Pain when walking downhill"],sources:["https://www.nhs.uk/symptoms/knee-pain/"]},
 ankle:{match:/\b(?:ankle|achilles)\b/,labels:["Hard to move my ankle", "Pain when standing on tiptoe", "Ankle feels stiff after rest", "Ankle feels unstable"],sources:["https://www.nhs.uk/symptoms/foot-pain/ankle-pain/"]},
 hip:{match:/\b(?:hip)\b/,labels:["Pain when getting up from a chair", "Pain when walking", "Hip feels stiff"],sources:["https://www.nhs.uk/symptoms/hip-pain/"]},
 heel:{match:/\b(?:heel(?! of palm)|arch|ball of foot|instep|edge of foot)\b/,labels:["Burning under my foot", "Feels like a stone under my foot", "Pain after standing", "Hard to lift my toes","Pain when taking the first few steps","Shoe feels tighter than usual"],sources:["https://www.nhs.uk/symptoms/foot-pain/pain-in-the-bottom-of-the-foot/"]},
 jaw:{match:/\b(?:jaw|teeth|gum)\b/,labels:["Pain when chewing", "Jaw feels stiff", "Jaw gets stuck", "Pain near the jaw joint"],sources:["https://www.nhs.uk/conditions/temporomandibular-disorder-tmd/"]},
 earSurface:{match:/\b(?:ear|earlobe)\b/,labels:["Pain when touching my ear", "Hearing sounds muffled", "Feels like pressure in my ear"],sources:["https://www.nhs.uk/symptoms/earache/"]},
 noseSurface:{match:/\b(?:nose|nostril)\b/,labels:["One nostril feels blocked", "Sore skin around nostril"],sources:["https://www.nhs.uk/conditions/allergic-rhinitis/"]},
 back:{match:/\b(?:back|spine|tailbone|flank)\b/,labels:["Pain when bending", "Pain when sitting", "Pain when twisting", "Back feels stiff after rest","Pain when turning in bed","Stiffness when getting out of bed"],sources:["https://www.nhs.uk/conditions/back-pain/"]},
 skin:{match:/./,labels:["Pain","Tender to touch","Looks swollen","Bruising","Feels numb","Pins and needles","Itchy skin","Skin rash","Dry or cracked skin","Lump under the skin","Skin feels warm","Skin colour changed","Blister","Open sore","Cut or scrape","Bleeding","Skin feels raw","Skin peeling","Skin feels tight","Skin feels unusually cold","Small raised bumps","Red patches","Clear fluid from skin","Pain when clothing rubs"],sources:["https://www.nhs.uk/symptoms/itchy-skin/","https://www.nhs.uk/symptoms/lumps/","https://www.nhs.uk/conditions/blisters/"]},
};
const preciseSuggestions = [
 {match:/^wrist crease$|^palm side of wrist$/,labels:["Pain when bending my palm towards my forearm","Wrist feels stiff when bending"]},
 {match:/^back of wrist$/,labels:["Pain when pushing up with my hand","Pain when bending my hand back"]},
 {match:/^thumb side of wrist$/,labels:["Pain when pinching with my thumb","Pain when lifting with my thumb"]},
 {match:/^little-finger side of wrist$/,labels:["Pain when turning a handle","Clicking on the little-finger side"]},
 {match:/^elbow crease$/,labels:["Pain inside the bend of my elbow","Skin sore in elbow crease"]},
 {match:/^(?:inner|outer) ankle bone$/,labels:["Tender over the ankle bone","Swelling around the ankle bone"]},
 {match:/^achilles tendon area$/,labels:["Stiffness above my heel","Pain when pushing off my foot"]},
 {match:/^kneecap$/,labels:["Pain around my kneecap when squatting"]},
 {match:/^upper calf$|^lower calf$/,labels:["Calf tightness when walking","Calf cramps at rest"]},
 {match:/^upper lip$|^lower lip$/,labels:["Split lip","Lip feels swollen"]},
 {match:/^tip of nose$|^bridge of nose$/,labels:["Tender skin on nose","Swelling on nose"]},
];

const regionGroups: Readonly<Record<string, readonly string[]>> = {
 wrist:["wrist"], hand:["hand"], finger:["hand"], elbow:["elbow"], shoulder:["shoulder","chest"],
 knee:["knee"], ankle:["ankle"], hip:["pelvis","thigh"], heel:["foot"], back:["upper-back","lower-back"],
 joint:["shoulder","elbow","wrist","knee","ankle","pelvis"],
 sole:["foot"], ear:["head"], earSurface:["head"], jaw:["head"], nose:["head"], noseSurface:["head"],
};
export function detailSuggestions(part:string, region:string) {
 const precise = preciseSuggestions.filter(group => group.match.test(part.toLowerCase()));
 const general = Object.entries(detailedSymptoms).filter(([key,group]) =>
   key !== "skin" && (!regionGroups[key] || regionGroups[key].includes(region)) && group.match.test(part.toLowerCase())
 ).map(([,group]) => group);
 return [...precise, ...general];
}
