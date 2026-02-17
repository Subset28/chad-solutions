import Foundation

struct GuideData {
    static let allGuides: [Guide] = [
        // Fundamentals
        Guide(
            title: "The Importance of Posture",
            subtitle: "Fixing forward head posture",
            category: .fundamentals,
            content: """
            Good posture is the foundation of aesthetics. Forward head posture (nerd neck) not only looks unattractive but affects your jawline definition and height.
            
            **How to fix:**
            1. Chin Tucks: Retract your chin straight back, creating a 'double chin', hold for 5s. Repeat 10x.
            2. Wall Angels: Stand against a wall, keep lower back flat, move arms up and down like a snow angel.
            3. Sleep on your back with a thin pillow.
            """,
            imageName: "posture"
        ),
        
        // Aesthetics / Mewing
        Guide(
            title: "Mewing 101",
            subtitle: "Correct tongue posture",
            category: .aesthetics,
            content: """
            Mewing is the practice of resting the tongue against the roof of the mouth to improve facial structure.
            
            **The Technique:**
            1. **Suction Hold:** Swallow your saliva and hold the vacuum. Your tongue should be flat against the roof, including the back third.
            2. **Teeth Contact:** Teeth should be slightly touching or slightly apart (butterfly touch). Do NOT clench.
            3. **Lip Seal:** Lips should be sealed comfortably. Breathe through your nose.
            
            *Consistency is key. It acts as a natural retainer and can expand the palate over years.*
            """,
            imageName: "mewing"
        ),
        Guide(
            title: "Understanding Gonial Angle",
            subtitle: "Jawline geometry explained",
            category: .aesthetics,
            content: """
            The Gonial Angle is the angle formed by the jawline. A 'masculine' or ideal angle is typically between 110° and 130°.
            
            - **Square Jaw:** Closer to 90-110°.
            - **Calculated Ideal:** ~120°.
            - **Soft/Steep Jaw:** > 140°.
            
            **Can you change it?**
            Chewing hard foods or mastic gum can build the masseter muscles, which may visually widen the jaw (increasing bizygomatic/bigonial ratio) and define the angle, but bone structure doesn't change drastically after puberty without surgery.
            """,
            imageName: "jawline"
        ),
        
        // Softmaxxing / Skincare
        Guide(
            title: "Basic Skincare Routine",
            subtitle: "Clear skin essentials",
            category: .softmaxxing,
            content: """
            You don't need a 10-step routine. You need consistency.
            
            **AM Routine:**
            1. Cleanser (Gentle).
            2. Vitamin C Serum (Brightening).
            3. Moisturizer.
            4. SPF 50+ (Non-negotiable).
            
            **PM Routine:**
            1. Cleanser.
            2. Retinol (The gold standard for anti-aging and acne).
            3. Moisturizer.
            
            *Drink 3L of water daily.*
            """,
            imageName: "skincare"
        ),
        Guide(
            title: "Hair and Eyebrows",
            subtitle: "Framing the face",
            category: .softmaxxing,
            content: """
            **Eyebrows:**
            - Men should keep eyebrows thick but clean.
            - Pluck stray hairs between the brows (unibrow).
            - Pluck strays far below the arch.
            - Tinting eyebrows darker can increase contrast and masculinity.
            
            **Hair:**
            - Find a hairstyle that suits your face shape (Oval, Square, Diamond).
            - Keep sides shorter to accentuate jawline width.
            """,
            imageName: "grooming"
        ),
        
        // Bodymaxxing
        Guide(
            title: "Low Body Fat %",
            subtitle: "The key to facial definition",
            category: .bodymaxxing,
            content: """
            No amount of jaw exercise will show if it's covered in fat.
            
            - **10-12%:** Ideal for maximum facial definition (hollow cheeks).
            - **15%:** Healthy, sustainable, some definition.
            - **20%+:** Rounder face, less definition.
            
            **Action:** Caloric deficit + High Protein. Lift weights to maintain muscle while losing fat.
            """,
            imageName: "lean"
        ),
        Guide(
            title: "Aesthetic V-Taper",
            subtitle: "Shoulder to waist ratio",
            category: .bodymaxxing,
            content: """
            The V-Taper is the universal sign of masculinity.
            
            **Focus Muscles:**
            1. **Lateral Delts:** Lateral raises (spam these).
            2. **Lats:** Pull-ups and pulldowns.
            3. **Waist:** Keep it tight (diet). Avoid heavy weighted oblique exercises if you have a blocky waist.
            """,
            imageName: "gym"
        )
    ]
}
