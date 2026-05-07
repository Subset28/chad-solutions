export interface MetricRecommendation {
    surgical: string[];
    nonSurgical: string[];
    lifestyle: string[];
    outlook: string;
}

export const metricRecommendations: Record<string, MetricRecommendation> = {
    canthalTilt: {
        surgical: [
            "Lateral canthoplasty — surgically repositions the outer eye corner upward, directly creating a positive canthal tilt",
            "Fox eye thread lift — minimally invasive threading that pulls the lateral eye corner upward"
        ],
        nonSurgical: [
            "Fox eye brow lamination + tail shaping — lifting the outer brow tail creates an optical illusion of positive tilt",
            "Eyeliner technique: extending the outer corner upward dramatically reshapes perceived tilt"
        ],
        lifestyle: [
            "Mewing (proper tongue posture) may improve orbital bone positioning over years if done consistently during development",
            "Reducing body fat reduces puffiness around the eye area, making the natural tilt more visible"
        ],
        outlook: "Negative canthal tilt is primarily skeletal. Non-surgical options provide cosmetic illusions but surgery is the only definitive solution."
    },
    fWHR: {
        surgical: [
            "Zygoma (cheekbone) implants — increases bizygomatic width directly",
            "Masseter muscle hypertrophy via Botox titration (unilateral dosing, not reduction) — though this is controversial",
            "Bichectomy (buccal fat removal) — reduces vertical midface, improving apparent width-to-height ratio"
        ],
        nonSurgical: [
            "Heavy chewing gum (mastic gum, falim gum) — hypertrophies masseter muscles over months, widening the lower face",
            "Strategic beard shaping to create width illusion at the jaw level"
        ],
        lifestyle: [
            "Lean bulking to add muscle mass to the traps and neck — frames the face as wider",
            "Reduce overall body fat % — a lean face with good muscle shows more facial bone structure"
        ],
        outlook: "fWHR is one of the most heritable facial traits. Cheekbone implants are the highest-impact surgical option and are reversible."
    },
    midfaceRatio: {
        surgical: [
            "Le Fort I osteotomy — surgical maxillary impaction to shorten a long midface",
            "Rhinoplasty with tip deprojection — reduces apparent midface length",
            "Strategic bimaxillary surgery for severe long-face syndrome"
        ],
        nonSurgical: [
            "Facial hair: a full mustache visually shortens the philtrum and compresses midface appearance",
            "Hairstyle choice: volume at the top (quiff, pompadour) draws the eye up, reducing apparent midface length"
        ],
        lifestyle: [
            "Consistent nasal breathing habits (mouth taping at night) prevent further midface elongation",
            "Mewing: correct tongue posture applies upward and forward pressure on the palate — may counteract downward growth long-term"
        ],
        outlook: "A long midface is primarily skeletal. Surgery is the only corrective option. Cosmetic work can only partially offset the appearance."
    },
    gonialAngle: {
        surgical: [
            "Jaw angle implants — adds volume and sharpness to the gonial region, lowering the apparent angle",
            "Mandibular angle osteotomy — physically reshapes the goinal bone",
            "Custom jawline implants — the gold standard for full jaw reshaping"
        ],
        nonSurgical: [
            "Heavy resistance chewing (mastic gum, Jawzrsize) hypertrophies masseter muscles, creating a denser lower jaw appearance",
            "Filler at the gonial angle — technically reversible, can sharpen the jaw angle temporarily"
        ],
        lifestyle: [
            "Reduce body fat — especially sub-20% for males — reveals bone structure underneath",
            "Mewing builds upward and forward jaw tension over time if started young enough"
        ],
        outlook: "Gonial angle is a strong genetic trait. Jaw implants are highly effective. Filler is a good temporary option to test aesthetics before committing."
    },
    chinToPhiltrumRatio: {
        surgical: [
            "Genioplasty (sliding) — repositions the chin forward and/or downward to increase height",
            "Chin implant — increases projection and can add vertical height",
            "Lip lift (subnasal) — shortens the philtrum directly, improving the ratio"
        ],
        nonSurgical: [
            "Strategic beard positioning: a chinstrap or goatee elongates the perceived chin",
            "Chin filler — nonsurgical increases chin projection and length"
        ],
        lifestyle: [
            "Mewing and correct bite development may modestly increase chin forward position",
            "Maintaining low body fat reduces submental fat, revealing more chin structure"
        ],
        outlook: "For a weak chin, implants or genioplasty are highly effective. For a long philtrum, a lip lift is a relatively simple, low-risk surgery with dramatic results."
    },
    mouthToNoseWidthRatio: {
        surgical: [
            "Alaplasty (alar base reduction) — narrows the nose base directly, improving the ratio",
            "Palate expansion surgery — increases mouth width at a skeletal level"
        ],
        nonSurgical: [
            "Palate expander (orthodontic, non-surgical) — if under 25, physical jaw expansion can widen the mouth",
            "Contouring makeup: highlighting the corners of the mouth creates an illusion of width"
        ],
        lifestyle: [
            "Heavy chewing exercises may marginally widen the palate in young adults",
            "Mewing applies lateral pressure on the palate, which may widen it over years in development"
        ],
        outlook: "A narrow mouth is primarily a palate development issue. Orthodontic or surgical palate expansion is the root-cause fix."
    },
    bigonialRatio: {
        surgical: [
            "Mandibular angle implants — increases jaw angle width and projection",
            "Jaw angle osteointegration implants — the most robust solution for jaw width"
        ],
        nonSurgical: [
            "Mastic gum chewing — strengthens and hypertrophies masseter and medial pterygoid muscles",
            "Strategic beard shaping along the jaw angle creates width and definition"
        ],
        lifestyle: [
            "Gaining strength training muscle on the neck and traps indirectly supports jaw framing",
            "Body fat reduction (sub-15%) will reveal whatever mandibular width exists under soft tissue"
        ],
        outlook: "A narrow bigonial width is purely skeletal. Implants are reliable and highly effective. Chewing is a non-surgical booster."
    },
    palpebralFissureLength: {
        surgical: [
            "Lateral canthoplasty — extends the outer corner of the eye, increasing horizontal length",
            "Medial epicanthoplasty — removes the medial epicanthal fold, opening the inner corner",
            "Double eyelid surgery (for those with epicanthal folds) — defines the crease and opens the eye horizontally"
        ],
        nonSurgical: [
            "Eyeliner technique: drawing along the waterline and slightly extending the outer corner elongates perceived PFL",
            "Castor oil applied to lash roots may thicken lashes, adding to the illusion of deeper, longer eyes"
        ],
        lifestyle: [
            "Reducing allergies and salt intake reduces under-eye puffiness, revealing more of the eye shape",
            "Quality sleep and cold-water eye washing reduces lid inflammation"
        ],
        outlook: "True PFL increase is surgical. Non-surgical options are powerful illusions. Lateral canthoplasty is the single most impactful hunter-eye surgery available."
    },
    overallSymmetry: {
        surgical: [
            "Unilateral cheekbone or jaw implant — corrects structural asymmetries",
            "Orthognathic (jaw) surgery — corrects bite and skeletal crossover causing one side to be more developed"
        ],
        nonSurgical: [
            "Strategic facial hair: subtle shaping on the weaker side adds visual weight",
            "Hairstyle side-parting toward the weaker side to balance apparent width"
        ],
        lifestyle: [
            "Sleeping symmetrically (back-sleeping, no face-pressing on a pillow) prevents worsening of asymmetry",
            "Chewing bilaterally — most people have a dominant chewing side, which over-develops one masseter",
            "Correcting postural scoliosis may reduce facial asymmetry caused by head tilt compensation"
        ],
        outlook: "Perfect facial symmetry (100%) doesn't exist in nature. Below 85% is when asymmetry becomes visually detectable and may warrant correction."
    },
    cheekboneProminence: {
        surgical: [
            "Zygoma (malar) implants — direct skeletal augmentation of the cheekbone projection",
            "Fat transfer to malar region — natural volume augmentation using your own fat cells",
            "Custom polymer or titanium cheekbone implants — most precise outcome"
        ],
        nonSurgical: [
            "Hyaluronic acid filler to the malar region — immediately adds the appearance of cheekbone projection",
            "Contouring (makeup) under the cheekbone creates a shadow illusion of projection"
        ],
        lifestyle: [
            "Reducing body fat percentage to sub-15% is the single most impactful lifestyle change — reveals all bone structure",
            "Facial exercises (mewing, smiling muscle training) don't build bones but may improve tissue tone"
        ],
        outlook: "Malar implants are considered one of the best-value maxillofacial procedures. Filler is an excellent first step to preview the effect."
    },
    hairlineRecession: {
        surgical: [
            "FUE/FUT hair transplant — to restore hairline density and shape",
            "Scalp micropigmentation — permanent cosmetic tattooing simulating hair follicles",
            "PRP (Platelet-Rich Plasma) injections — may slow or partially reverse early-stage recession"
        ],
        nonSurgical: [
            "Minoxidil (Rogaine) 5% — proven to slow and partially reverse hair loss",
            "Finasteride (Propecia) — DHT blocker, most clinically proven oral treatment for MPB"
        ],
        lifestyle: [
            "Reduce chronic stress (cortisol elevation accelerates MPB)",
            "Optimize diet: ensure adequate Zinc, Biotin, Iron, and Vitamin D3",
            "Avoid harsh shampooing and high-heat styling on already thin hair"
        ],
        outlook: "Hair loss is highly genetic (androgenetic alopecia). Finasteride + Minoxidil is the current gold standard first line. Transplant is near-permanent at advanced stages."
    },
    skinQuality: {
        surgical: [
            "CO2 laser resurfacing — ablates surface skin, dramatically reducing textures and pores",
            "Microneedling with PRP — stimulates collagen remodeling to fill acne scars and reduce texture",
            "Chemical peels (TCA, Jessner) — chemical exfoliation that targets uneven texture and scarring"
        ],
        nonSurgical: [
            "Tretinoin (Retin-A) 0.025%-0.1% — the single most proven topical for skin texture and clarity",
            "Niacinamide 10% serum — reduces pore appearance and surface texture",
            "AHA/BHA chemical exfoliants (glycolic acid, salicylic acid) — remove dead skin cells weekly"
        ],
        lifestyle: [
            "Eliminate dairy and high-glycemic foods (primary dietary drivers of acne for most people)",
            "Apply SPF 50 daily — UV damage is the #1 cause of skin texture degradation",
            "Hydration: drink 3L+ of water daily, use a humidifier, and apply a ceramide moisturizer",
            "Pillow hygiene: change pillowcases every 2-3 days to prevent bacterial re-exposure"
        ],
        outlook: "Glass skin is achievable for most people with consistent dermatological intervention. Tretinoin + SPF is the minimum effective stack."
    },
    doubleChinRisk: {
        surgical: [
            "Submentoplasty — removal of submental fat and tightening of the platysma muscle",
            "Kybella injections — injectable deoxycholic acid that destroys submental fat cells permanently",
            "Chin implant + neck liposuction — combined procedure for maximum jawline definition"
        ],
        nonSurgical: [
            "CoolSculpting (cryolipolysis) to the submental area — non-invasive fat cell reduction",
            "HIFU (High-Intensity Focused Ultrasound) to tighten submental laxity"
        ],
        lifestyle: [
            "Caloric deficit: the most effective intervention — submental fat is directly proportional to overall body fat",
            "Reduce sodium and alcohol intake — both cause bloating and water retention in the face",
            "Cardio 3-5x/week accelerates facial fat reduction alongside diet",
            "Neck exercises (yes/no head movements) tone the platysma muscle"
        ],
        outlook: "For most people under 30, submental fat responds well to dietary intervention. True double chin with skin laxity requires clinical or surgical treatment."
    },
    orbitalRimProtrusion: {
        surgical: [
            "Orbital rim implants — custom implants that augment the bony rim surrounding the eye socket",
            "Cheekbone (zygoma) implants — indirectly improves orbital support and deep-set appearance",
            "Brow bone augmentation — PMMA or custom implants to build the supraorbital ridge"
        ],
        nonSurgical: [
            "Filler to the tear trough / infraorbital region — creates an illusion of deeper-set eyes",
            "Upper eyelid filler (very advanced) — adds subtle supraorbital volume"
        ],
        lifestyle: [
            "Reduce body fat — suborbital fat pads shrink with leanness, making eyes appear deeper-set",
            "Quality sleep and reduced alcohol consumption reduces periorbital edema"
        ],
        outlook: "Orbital rim depth is entirely skeletal. Custom 3D-printed orbital implants are the gold standard for achieving deep-set eyes surgically."
    },
    maxillaryProtrusion: {
        surgical: [
            "Le Fort I osteotomy — surgical forward movement of the entire maxilla (mid-face advancement)",
            "Cheekbone implants — increase the apparent forward projection of the mid-face",
            "Rhinoplasty (deprojected) — a smaller nose can make the midface appear more prominent"
        ],
        nonSurgical: [
            "Filler to the midface area — temporary but immediate support under the eyes and along the midface",
            "Cheekbone filler at the malar eminence — creates the illusion of forward projection"
        ],
        lifestyle: [
            "Mewing and correct oral posture during development — may foster anterior growth of the maxilla",
            "Nasal breathing habit — prevents downward facial growth patterns"
        ],
        outlook: "Maxillary retrusion is a bone-level issue. Bimax surgery (Le Fort I) is highly invasive but transformative. Filler is a valid cosmetic bridge solution."
    },
    browRidgeProtrusion: {
        surgical: [
            "Forehead/brow augmentation with PMMA or custom implants — directly builds the supraorbital ridge",
            "Bone cement sculpting — performed by maxillofacial surgeons, shapes the forehead and brow area"
        ],
        nonSurgical: [
            "Brow grooming to maximize arch and width — a strongly defined brow shadow emphasizes the ridge",
            "Highlight/contour under and above the brow can simulate depth and ridge prominence"
        ],
        lifestyle: [
            "Testosterone optimization (if clinically low) — the brow ridge is sexually dimorphic and responds to androgens",
            "Heavy compound lifting (squats, deadlifts) maximizes natural testosterone production"
        ],
        outlook: "Brow ridge is a bone structure metric. Augmentation surgery is the only path to structural change. Cosmetic options provide significant illusion effect."
    },
    infraorbitalRimPosition: {
        surgical: [
            "Infraorbital rim implants — directly augments the lower orbital rim, supporting the under-eye",
            "Midfacial fat transfer — replenishes volume under the eyes, mimicking rim projection",
            "Custom cheek-to-orbit implants — comprehensive solution for under-eye support"
        ],
        nonSurgical: [
            "Tear trough filler (hyaluronic acid) — fills the hollow under the eye, reducing dark circles",
            "PRP injections under the eye — stimulates collagen production in the infraorbital area"
        ],
        lifestyle: [
            "Prioritize sleep (dark circles are worsened by sub-7 hours/night)",
            "Reduce alcohol and sodium (both cause periorbital water retention and pooling)"
        ],
        outlook: "A recessed infraorbital rim is skeletal. Tear trough filler is incredibly popular and effective as a temporary solution. Implants are permanent."
    },
    chinProjection: {
        surgical: [
            "Silicone chin implant — most common, reversible, and highly effective for projection",
            "Sliding genioplasty — bone cut and advancement, more complex but completely natural",
            "Extended anatomical chin implants — provide projection plus some vertical height"
        ],
        nonSurgical: [
            "Chin filler — hyaluronic acid injections directly increase projection temporarily (12-18 months)",
            "Beard styling: a short goatee or chinstrap creates the visual illusion of  chin projection"
        ],
        lifestyle: [
            "Maintain low body fat — submental fat directly obscures chin projection",
            "Good posture (chin slightly tucked) can improve photo chin appearance significantly"
        ],
        outlook: "Chin implants are one of the highest-value procedures in aesthetic surgery with high patient satisfaction. Filler is ideal for testing the look first."
    },
    eyeToMouthAngle: {
        surgical: [
            "Combination of zygoma implants + jaw implants — repositions the facial landmarks to correct the angle",
            "Genioplasty — repositioning the chin changes the mouth position and thus the angle"
        ],
        nonSurgical: [
            "This metric is primarily structural and cannot be meaningfully modified non-surgically",
            "Strategic hairstyle choices can alter the perceived face shape and angle"
        ],
        lifestyle: [
            "Body fat reduction will not change the angle but will improve overall facial proportion",
            "Ensure correct head posture for photo — chin slightly back and down for neutral expression"
        ],
        outlook: "The eye-to-mouth angle is one of the most structural metrics — largely genetic and skeletal. It changes secondarily when other skeletal work is done."
    },
    facialThirdsRatio: {
        surgical: [
            "Forehead reduction surgery — lowers the hairline to reduce forehead size",
            "Le Fort I maxillary impaction — compresses a long midface",
            "Genioplasty or chin implant — alters lower third height and projection"
        ],
        nonSurgical: [
            "Strategic hairline framing — bringing hair down creates a shorter-looking upper third",
            "Beard styling to add visual height to the lower third"
        ],
        lifestyle: [
            "Hairstyle manipulation is the most accessible tool — adjust based on which third is proportionally off",
            "Correct posture prevents the appearance of a compressed lower face"
        ],
        outlook: "True facial thirds correction is surgical. However, hairstyle and grooming are powerful enough to visually align the face for most people."
    },
    foreheadHeightRatio: {
        surgical: [
            "Hairline lowering surgery (scalp advancement) — physically lowers the hairline forward",
            "Forehead reduction via hair transplant — a less invasive alternative using grafts at the hairline",
            "Brow lift — raises the brows, altering the apparent forehead proportion"
        ],
        nonSurgical: [
            "Side-swept or fringe bangs — immediately conceal a large forehead",
            "Hair texturizing at the temporal corners reduces apparent fivehead width"
        ],
        lifestyle: [
            "Hairstyle is entirely within your control and highly effective here",
            "Facial hair on the lower face creates vertical balance"
        ],
        outlook: "A large forehead is mostly cosmetic and highly manageable with the right haircut. If it's a priority, scalp advancement has excellent outcomes."
    },
    noseWidthRatio: {
        surgical: [
            "Alaplasty (alar base reduction) — specifically narrows the alar base of the nose",
            "Rhinoplasty with alar cinch sutures — draws alar bases medially",
            "Preservation rhinoplasty — modern technique preserving nasal anatomy while refining width"
        ],
        nonSurgical: [
            "Nose contouring makeup — highlighting along the nasal dorsum and shadowing the alars creates a narrower illusion",
            "Rhinoplasty fillers (liquid rhino) — cannot narrow but can create illusion of narrowness via projection"
        ],
        lifestyle: [
            "Body fat reduction will slightly narrow the nose (nasal soft tissue responds to overall fat loss)",
            "Avoid sustained high cortisol — can cause nasal tip soft tissue swelling"
        ],
        outlook: "Wide nose width responds extremely well to surgical intervention. Alaplasty is low-risk with dramatic impact on facial proportion."
    },
    lipRatio: {
        surgical: [
            "Fat transfer to the upper lip — permanently augments thin upper lips to approach the golden ratio",
            "Lip implants (Permalip) — permanent silicone implants, highly consistent results",
            "Lip lift (upper) — shortens the upper lip and increases tooth show, indirectly improving ratio"
        ],
        nonSurgical: [
            "Upper lip hyaluronic acid filler — most popular cosmetic procedure globally, reversible with hyaluronidase",
            "Lip liner overdrawing — creating a shadow outside the vermilion border appears to increase lip volume"
        ],
        lifestyle: [
            "Lip conditioning and topical peptides (Matrixyl) improve lip texture and slight plumping",
            "Sun protection on lips — UV damage thins and denatures lip tissue over time"
        ],
        outlook: "Lip filler for balanced ratios is highly effective and extremely low-risk when performed by a skilled injector. Results last 9-18 months."
    },
    esr: {
        surgical: [
            "This metric is entirely bony and cannot be meaningfully altered surgically in adults",
            "Medial epicanthoplasty (for genetic medial folds) — opens the inner corner, slightly affecting perceived spacing"
        ],
        nonSurgical: [
            "Eyeliner: dark inner-corner liner makes eyes appear closer-set; omitting inner liner and highlighting the inner corner increases perceived spacing",
            "Contouring the nasal bridge can subtly affect perceived IPD"
        ],
        lifestyle: [
            "IPD is purely skeletal and cannot be modified via lifestyle choices"
        ],
        outlook: "IPD is largely a genetic bone measurement. Minor shifts in perceived spacing can be achieved cosmetically, but structural change is not possible in adults."
    },
    uee: {
        surgical: [
            "Supraorbital rim implants — build up the brow ridge to physically hood the eye",
            "Blepharoplasty (Upper) — removes excess skin if the UEE is caused by sagging, though true 'hunter eyes' require more bone support",
            "Upper eyelid filler — adds volume to the upper lid area to reduce exposure and create a 'hooded' look"
        ],
        nonSurgical: [
            "Eyelid tape — a temporary cosmetic fix to create a hooded lid appearance",
            "Strategic brow grooming — keeping brows lower and flatter can minimize the appearance of UEE"
        ],
        lifestyle: [
            "Quality sleep — reduces inflammation that can make eyelids look puffy and more exposed",
            "Reducing salt intake — prevents water retention that can lead to 'bug eye' appearance"
        ],
        outlook: "UEE is largely determined by the relationship between the eyeball and the supraorbital ridge. Bone-weight changes via implants are the most effective structural fix."
    },
    philtrumLength: {
        surgical: [
            "Subnasal Lip Lift — the gold standard for shortening the philtrum directly and increasing upper lip show",
            "Le Fort I osteotomy with maxillary impaction — shortens the overall midface and philtrum distance skeletal-wise"
        ],
        nonSurgical: [
            "Upper lip filler — by adding volume to the upper lip, the perceived length of the philtrum is reduced",
            "Mustache grooming — a well-maintained mustache can effectively hide a long philtrum"
        ],
        lifestyle: [
            "Correct oral posture (Mewing) — applies upward pressure that may counteract long-term philtrum elongation",
            "Sun protection — prevents the loss of collagen that causes the philtrum to sag and lengthen with age"
        ],
        outlook: "A long philtrum is a difficult trait to fix without surgery. A subnasal lip lift is highly effective but requires careful scar management."
    }
};
