export interface MetricExplanation {
    title: string;
    whatItIs: string;
    idealRange: string;
    scientificContext: string;
    blackpillNote?: string;
}

export const metricExplanations: Record<string, MetricExplanation> = {
    canthalTilt: {
        title: "Canthal Tilt",
        whatItIs: "The angle between the inner and outer corners of your eyes.",
        idealRange: "Positive (4° to 6°)",
        scientificContext: "A positive canthal tilt (outer corners higher than inner corners) is universally perceived as more attractive and dominant. It creates the 'hunter eye' aesthetic associated with high testosterone and genetic fitness.",
        blackpillNote: "Negative or neutral tilt can make the face look tired ('prey eyes'). Positive canthal tilt is a highly dimorphic male trait."
    },
    fwfhRatio: {
        title: "Facial Width-to-Height Ratio (fWHR)",
        whatItIs: "The bizygomatic width of the face divided by the upper facial height (from the middle of eyebrows to the upper lip).",
        idealRange: "1.8+",
        scientificContext: "High fWHR (>1.8) is the primary signal of testosterone and physical robustness. Evolutionary psychology links it directly to perceptions of dominance, aggressiveness, and formidability.",
        blackpillNote: "A high fWHR is strongly correlated with the 'Dark Triad' personality traits and perceived raw physical power. A low fWHR makes a male face appear highly trustworthy but submissive."
    },
    midfaceRatio: {
        title: "Midface Compactness",
        whatItIs: "The interpupillary distance (distance between centers of pupils) divided by the height from the nasion to the upper lip.",
        idealRange: "1.0 - 1.1",
        scientificContext: "A compact vertically short midface is crucial for 'forward growth' and facial harmony. It indicates ideal maxillary development during puberty.",
        blackpillNote: "A long midface (often caused by chronic mouth breathing and 'adenoid face' development) is one of the most severe facial detriments and is extremely difficult to mask."
    },
    eyeSeparationRatio: {
        title: "Eye Separation Ratio (ESR)",
        whatItIs: "The distance between the pupils (IPD) divided by the bizygomatic width of the face.",
        idealRange: "0.45 - 0.47",
        scientificContext: "According to robust measurement databases, proper interpupillary distance relative to bizygomatic width signals proper midline facial development.",
        blackpillNote: "Hypotelorism (close-set eyes) creates a predatory 'cyclops' look, while hypertelorism (extreme wide-set) looks alien-like."
    },
    gonialAngle: {
        title: "Gonial Angle",
        whatItIs: "The angle of the jaw at its lowest rear corner (the gonion).",
        idealRange: "115° - 130°",
        scientificContext: "A square, sharp jawline (lower and more perpendicular angle) signals high testosterone, mature masticatory muscle development, and significant bite force.",
        blackpillNote: "A high/steep gonial angle (>135°) indicates downward facial growth, typical of 'incel' facial structures and mouth breathers, totally destroying lower-third projection."
    },
    chinToPhiltrumRatio: {
        title: "Chin-to-Philtrum Ratio",
        whatItIs: "The vertical height of the chin compared to the vertical length of the philtrum (the groove under the nose).",
        idealRange: "2.0 - 2.25",
        scientificContext: "A compact philtrum combined with a tall, prominent chin creates a highly masculine, robust lower face. Long philtrums are typically a sign of accelerated aging or poor maxillary growth.",
        blackpillNote: "A recessed, short chin combined with a long 'chimp' philtrum is a devastating falio for overall harmony."
    },
    mouthToNoseWidthRatio: {
        title: "Mouth-to-Nose Width Ratio",
        whatItIs: "The width of the mouth (commissure to commissure) divided by the width of the nose base (alar to alar).",
        idealRange: "1.5 - 1.62",
        scientificContext: "A wide palate supports a broad mouth algorithmically tied to airway volume. The nose should be proportionately narrower than the mouth to conform to the golden ratio.",
        blackpillNote: "A narrow mouth (mouth smaller than nose) points to a collapsed palate."
    },
    bigonialWidthRatio: {
        title: "Bigonial to Bizygomatic Width",
        whatItIs: "The ratio of the cheekbone width to the jaw (bigonial) width.",
        idealRange: "1.35",
        scientificContext: "A jaw that is robust but properly enveloped directly under prominent cheekbones indicates extreme dimorphic robustness. If the jaw is significantly narrower, it creates a 'weak' shape.",
        blackpillNote: "The 'square' face shape requires serious lateral bigonial projection."
    },
    lowerThirdRatio: {
        title: "Lower / Full Face Ratio",
        whatItIs: "The height from the nasion to the chin compared to the overall face height (hairline to chin).",
        idealRange: "0.62+",
        scientificContext: "The face requires substantial vertical lower quadrant growth to accommodate proper dental occlusion and airway space. Lower numbers represent insufficient facial height.",
        blackpillNote: "A short non-dominant lower face looks inherently neotenous and prepubescent."
    },
    palpebralFissureLength: {
        title: "Palpebral Fissure Length",
        whatItIs: "The length ratio of the horizontal width of the eye opening over the height of the eye opening.",
        idealRange: "3.0 - 3.5",
        scientificContext: "Horizontally long, vertically squinted eyes suggest sharp visual acuity and lack of prey-like fear responses. They are the defining metric of 'Hunter Eyes'.",
        blackpillNote: "Large, round 'bug eyes' with high scleral show are a prey-animal feature. Long, squinted slits indicate a predator."
    },
    eyeToMouthAngle: {
        title: "Eye-to-Mouth Angle",
        whatItIs: "The resulting geometric angle forming the lateral vector from the stomion (lip center) up to the center of the pupils.",
        idealRange: "47° - 50°",
        scientificContext: "This denotes the sharpness and 'blockiness' of the facial bone structure. A good EME angle is a leading indicator of facial symmetry.",
        blackpillNote: "Slanted or narrow angles indicate hollow or poorly supported mid-lateral quadrants."
    },
    lipRatio: {
        title: "Lip Ratio",
        whatItIs: "The vertical thickness of the lower lip compared to the upper lip.",
        idealRange: "1.62",
        scientificContext: "Human lips naturally follow the golden ratio (phi), where the lower lip is roughly 1.618 times thicker than the upper lip. Deviations look unnatural."
    },
    facialAsymmetry: {
        title: "Facial Asymmetry",
        whatItIs: "The percentage deviation of bilateral landmarks (eyes, cheekbones, jaw) from the facial midline.",
        idealRange: "95% - 100% Symmetry",
        scientificContext: "Symmetry is an unconscious evolutionary readout of generic quality, low mutational load, and a strong immune system capable of resisting environmental stress during development."
    },
    ipdRatio: {
        title: "Interpupillary Distance (IPD)",
        whatItIs: "The distance between the pupils relative to the overall face width.",
        idealRange: "0.42 - 0.47",
        scientificContext: "Eyes spaced perfectly signal proper midline facial development. Close-set eyes disrupt harmony significantly more than wide-set eyes."
    },
    facialThirdsRatio: {
        title: "Facial Thirds Balance",
        whatItIs: "The percentage adherence to the 'Rule of Thirds' (Forehead = Midface = Lower Face).",
        idealRange: "95% - 100%",
        scientificContext: "Developmental stability is signaled by even proportions across the cranium, maxilla, and mandible."
    },
    foreheadHeightRatio: {
        title: "Forehead Height Ratio",
        whatItIs: "The percentage of vertical facial height occupied by the forehead.",
        idealRange: "30% - 35%",
        scientificContext: "A proportionate forehead maintains the rule of thirds. A massive 'five-head' looks juvenile or bulbous, while an incredibly short forehead looks primitive."
    },
    noseWidthRatio: {
        title: "Nose Width Ratio",
        whatItIs: "The width of the nose relative to the overall bizygomatic face width.",
        idealRange: "25% - 30%",
        scientificContext: "According to the rule of fifths, the nose should perfectly span the medial fifth of the face. An excessively wide nose dominates the midface negatively."
    },
    cheekboneProminence: {
        title: "Cheekbone Prominence",
        whatItIs: "The lateral distance of the zygos relative to the mid-sagittal plane, normalized.",
        idealRange: "0.48 - 0.55 (High and Wide)",
        scientificContext: "High, prominent cheekbones pull the facial skin taut, reducing nasolabial folds and supporting the eye area to prevent hollows.",
        blackpillNote: "The 'Ogee Curve' provided by prominent cheekbones is considered the holy grail of midface aesthetics."
    },
    hairlineRecession: {
        title: "Hairline Fullness",
        whatItIs: "An approximation of hairline position and corner recession based on upper landmarks.",
        idealRange: "90 - 100 (Norwood 1)",
        scientificContext: "Hair frames the face. Recession (Norwood 2+) heavily ages the face and breaks the facial thirds harmony.",
        blackpillNote: "Hair loss is considered one of the most fatal aesthetic downfalls for otherwise highly attractive males (the 'Norwood Reaper')."
    },
    orbitalRimProtrusion: {
        title: "Orbital Rim Protrusion (Eye Depth)",
        whatItIs: "The relative Z-depth (3D forward projection) of the brow and cheekbone rim compared to the eyeball surface.",
        idealRange: "High positive value (Deep-set eyes)",
        scientificContext: "A highly protruded orbital rim shadows and protects the eyeball. This represents a robust, sexually dimorphic skull built for physical conflict.",
        blackpillNote: "Bug eyes (protruding eyeballs with no bone support) are considered a massive falio, exposing the eye and creating a 'prey' look."
    },
    maxillaryProtrusion: {
        title: "Maxillary Protrusion",
        whatItIs: "The 3D forward growth of the upper jaw (maxilla) relative to the forehead plane.",
        idealRange: "High positive value (Forward growth)",
        scientificContext: "Forward growth of the maxilla prevents the face from looking flat or 'melted'. It provides the necessary bony support for the midface soft tissue.",
        blackpillNote: "Maxillary hypoplasia (a recessed, 'flat' or 'sunken' midface) is devastating to side profile aesthetics."
    },
    browRidgeProtrusion: {
        title: "Brow Ridge Protrusion",
        whatItIs: "The Z-depth forward projection of the supraorbital ridge compared to the eyes.",
        idealRange: "Prominent (High positive value)",
        scientificContext: "The brow ridge is one of the most sexually dimorphic bones in the human skull, heavily influenced by prenatal testosterone.",
        blackpillNote: "A flat brow ridge is highly neotenous and feminine. A heavy brow ridge creates the intimidating 'caveman' or 'warrior' aesthetic."
    },
    infraorbitalRimPosition: {
        title: "Infraorbital Rim Support",
        whatItIs: "The forward 3D positioning of the lower eye socket bone relative to the cheek.",
        idealRange: "Forward projection",
        scientificContext: "A forward-projecting infraorbital rim provides a shelf for the under-eye area. Lack of projection causes the under-eye skin to droop, creating permanent dark circles.",
        blackpillNote: "Negative vector orbital rims (eyeball protrudes further than the cheekbone) cause tired-looking, 'bug-eyed' aesthetics that no amount of sleep fixes."
    },
    chinProjection: {
        title: "Chin Projection",
        whatItIs: "The 3D forward projection of the chin tip (pogonion) relative to the forehead.",
        idealRange: "Aligned with or slightly past the nasion",
        scientificContext: "A strong, forward-projecting chin is an indicator of healthy lower jaw (mandible) development and clear airways.",
        blackpillNote: "A recessed chin creates a 'weak' profile, often associated with mouth-breathing, snoring, and a lack of perceived physical dominance."
    }
};
