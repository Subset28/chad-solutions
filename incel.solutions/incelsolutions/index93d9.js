console.log("ðŸ§ª JS is updated: 2024-05-20");

let setStatus = function () {};

// Summary calculator
function summarizeResults() {
    console.log("▶ summarizeResults() invoked");
    const ratingCells = document.querySelectorAll('td[id^="assessment-"]');

    const counts = {
        perfect: 0,
        deviation0: 0,
        deviation1: 0,
        deviation2: 0,
        deviation3: 0,
        deviation4: 0,
    };

    const weights = {
        perfect: 2,
        deviation0: 1,
        deviation1: 0,
        deviation2: -1,
        deviation3: -2,
        deviation4: -2,
    };

    ratingCells.forEach(cell => {
        const html = cell.innerHTML;
        if (html.includes("perfect")) counts.perfect++;
        else if (html.includes("deviation-0")) counts.deviation0++;
        else if (html.includes("deviation-1")) counts.deviation1++;
        else if (html.includes("deviation-2")) counts.deviation2++;
        else if (html.includes("deviation-3")) counts.deviation3++;
        else if (html.includes("deviation-4")) counts.deviation4++;
    });

    const totalScore =
        counts.perfect * weights.perfect +
        counts.deviation0 * weights.deviation0 +
        counts.deviation1 * weights.deviation1 +
        counts.deviation2 * weights.deviation2 +
        counts.deviation3 * weights.deviation3 +
        counts.deviation4 * weights.deviation4;

    const maxScore = 22;
    const normalized = Math.max(0, Math.min(8, Math.round((totalScore / maxScore) * 9)));
    const psl = `PSL${normalized}`;

    const labels = {
        0: "Subhuman",
        1: "Sub5",
        2: "Low-tier Normie",
        3: "Normie",
        4: "Upper Normie",
        5: "Chadlite",
        6: "Chad",
        7: "Gigachad",
        8: "Terachad"
    };
    const label = labels[normalized] || "Unknown";

const hierarchyLabels = {
    8: {
        titles: ["Era Defining Man", "Immortal", "God Among Men"],
        description: "Men destined to define eras and change history, who will be remembered for millennia to come",
        color: "#A0D8EF"
    },
    7: {
        titles: ["King", "Explorer", "Philosopher"],
        description: "Philosophers, Kings, Explorers, and Inventors",
        color: "#4682B4"
    },
    6: {
        titles: ["Influential Artist", "Writer", "General"],
        description: "Influential Artists, Writers, and Generals",
        color: "#5F9EA0"
    },
    5: {
        titles: ["Diplomat", "Official", "Officer"],
        description: "Officers, Officials, Diplomats",
        color: "#8FBC8F"
    },
    4: {
        titles: ["Middle Management", "Soldier", "Craftsman"],
        description: "Middle Management, Soldiers, Craftsmen",
        color: "#8B5A2B"
    },
    3: {
        titles: ["Manual Laborerer", "Peasant", "Street Merchant"],
        description: "Manual Labourers, Peasants, Street Merchants",
        color: "#A52A2A"
    },
    2: {
        titles: ["Street Sweeper", "Drain Cleaner", "Waste Collector"],
        description: "Street Cleaners",
        color: "#B22222"
    },
    1: {
        titles: ["Sanitation Worker", "Toilet Scrubber", "Gutterman"],
        description: "Sanitation Workers",
        color: "#800000"
    },
    0: {
        titles: ["Untouchable", "Subhuman", "Bottom of the Barrel"],
        description: "Untouchables",
        color: "#2F2F2F"
    }
};


    const badgeClass = normalized <= 3 ? "danger" : normalized <= 6 ? "warning" : "success";
    const gradingToggle = document.getElementById("grading-toggle");
    const usePSL = gradingToggle ? gradingToggle.checked : true;

    const scoreCell = document.getElementById("total-score");
    const breakdownCell = document.getElementById("total-breakdown");
    const resultCell = document.getElementById("total-psl");

    if (scoreCell) scoreCell.innerHTML = `<strong>${totalScore}</strong>`;
    if (breakdownCell) breakdownCell.innerHTML = `
        Perfect: ${counts.perfect}, 
        Slight: ${counts.deviation0}, 
        Noticeable: ${counts.deviation1}, 
        Significant: ${counts.deviation2}, 
        Horrible: ${counts.deviation3}, 
        Extreme: ${counts.deviation4}
    `;

    if (resultCell) {
        if (usePSL) {
            resultCell.innerHTML = `<span class="badge bg-${badgeClass}">${psl}</span><br><small>${label}</small>`;
        } else {
            const h = hierarchyLabels[normalized] || hierarchyLabels[1];
const title = Array.isArray(h.titles)
    ? h.titles[Math.floor(Math.random() * h.titles.length)]
    : h.titles;

const lightColors = ["#A0D8EF", "#8FBC8F", "#A52A2A"];
const isLight = lightColors.includes(h.color);
const textColor = isLight ? "black" : "white";

resultCell.innerHTML = `
    <span class="badge" style="background-color: ${h.color}; color: ${textColor};">
        ${title}
    </span><br>
    <small style="color: ${h.color}; font-size: 0.75rem;">${h.description}</small>
`;

        }
    }
}

async function main() {
    const _model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
        maxFaces: 1
    });
    window.database = await setupDatabase();
    const imageInputFile = document.getElementById("image-file");
    const imageInputUrl = document.getElementById("image-url");
    const introductionElement = document.getElementById("introduction");
    const analyzingElement = document.getElementById("analyzing");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    let data = void 0;

const gradingToggle = document.getElementById("grading-toggle");
if (gradingToggle) {
    gradingToggle.addEventListener("change", summarizeResults);
}


    imageInputFile.addEventListener("change", async () => {
        if (imageInputFile.files[0]) {
            introductionElement.style.display = "none";
            analyzingElement.classList.remove("d-none");
            data && clearData();

            setStatus("Reading image");

            imageInputUrl.value = "";

            let url = URL.createObjectURL(imageInputFile.files[0]);

            await onChange(url);
        }
    });

    imageInputUrl.addEventListener("change", async () => {
        if (imageInputUrl.value) {
            introductionElement.style.display = "none";
            analyzingElement.classList.remove("d-none");
            data && clearData();

            setStatus("Downloading image");

            imageInputFile.value = "";

            let file = await (await fetch(imageInputUrl.value)).blob();
            let url = URL.createObjectURL(file);

            await onChange(url);
        }
    });

    async function onChange(url) {
        setStatus("Analyzing");

        let analysis = await analyze(canvas, ctx, url);

        data = analysis.criteria = {
            midfaceRatio: {...createBindings(analysis.criteria.midfaceRatio, "midface-ratio")},
            facialWidthToHeightRatio: {...createBindings(analysis.criteria.facialWidthToHeightRatio, "facial-width-to-height-ratio")},
            chinToPhiltrumRatio: {...createBindings(analysis.criteria.chinToPhiltrumRatio, "chin-to-philtrum-ratio")},
            canthalTilt: {...createBindings(analysis.criteria.canthalTilt, "canthal-tilt")},
            mouthToNoseRatio: {...createBindings(analysis.criteria.mouthToNoseRatio, "mouth-to-nose-ratio")},
            bigonialWidth: {...createBindings(analysis.criteria.bigonialWidth, "bigonial-width")},
            lipRatio: {...createBindings(analysis.criteria.lipRatio, "lip-ratio")},
            eyeSeparationRatio: {...createBindings(analysis.criteria.eyeSeparationRatio, "eye-separation-ratio")},
            eyeToMouthAngle: {...createBindings(analysis.criteria.eyeToMouthAngle, "eye-to-mouth-angle")},
            lowerThirdHeight: {...createBindings(analysis.criteria.lowerThirdHeight, "lower-third-height")},
            palpebralFissureLength: {...createBindings(analysis.criteria.palpebralFissureLength, "palpebral-fissure-length")},
            eyeColor: {...createBindings(analysis.criteria.eyeColor, "eye-color")},
        };

        function createBindings(metric, id) {
            return {
                analysis: metric,
                render: document.getElementById(`value-${id}`),
                toggle: document.getElementById(`toggle-${id}`),
                ideal: document.getElementById(`ideal-${id}`),
                assessment: document.getElementById(`assessment-${id}`),
            };
        }

        let calculate = () => {
            for (let i of Object.values(analysis.criteria)) {
                i.analysis.calculate();
                i.render.innerHTML = i.analysis.render();
                i.ideal.innerHTML = i.analysis.ideal();
                i.assessment.innerHTML = i.analysis.assess();
            }

            analysis.criteria.eyeColor.analysis.detect(
                analysis.image,
                Array.from(analysis.criteria.eyeColor.render.children).map(i => i.getContext("2d"))
            );

            summarizeResults(); // Ã°Å¸â€˜Ë† Score update
        }

        let render = () => {
            analysis.resetToImage();
            for (let i of Object.values(analysis.criteria)) {
                if (i.toggle.checked) {
                    i.analysis.draw(ctx);
                }
            }
        }

        for (let i of Object.values(analysis.criteria)) {
            i.toggle.onchange = () => render();
        }

        let moving = false;

        canvas.onmousedown = ({ offsetX: x, offsetY: y }) => {
            let necessaryPoints = Object.values(analysis.criteria).filter(i => i.toggle.checked).map(i => i.analysis.necessaryPoints()).flat();

            for (let i in analysis.points) {
                if (analysis.points.hasOwnProperty(i) && necessaryPoints.includes(i)) {
                    if (Math.sqrt(
                        (analysis.points[i][0] - x) ** 2
                        + (analysis.points[i][1] - y) ** 2
                    ) <= analysis.arcRadius) {
                        moving = i;
                        return;
                    }
                }
            }
        }

        canvas.ontouchstart = (e) => {
            let bcr = e.target.getBoundingClientRect();
            let x = e.targetTouches[0].clientX - bcr.x;
            let y = e.targetTouches[0].clientY - bcr.y;
            canvas.onmousedown({ offsetX: x, offsetY: y });
        }

        canvas.onmouseup = () => {
            moving = false;
        }

        canvas.ontouchend = canvas.ontouchcancel = (e) => {
            canvas.onmouseup();
        }

        canvas.onmousemove = ({ offsetX: x, offsetY: y }) => {
            if (moving) {
                analysis.points[moving] = [x, y];
                calculate();
                render();
            } else {
                let necessaryPoints = Object.values(analysis.criteria).filter(i => i.toggle.checked).map(i => i.analysis.necessaryPoints()).flat();

                for (let i in analysis.points) {
                    if (analysis.points.hasOwnProperty(i) && necessaryPoints.includes(i)) {
                        if (Math.sqrt(
                            (analysis.points[i][0] - x) ** 2
                            + (analysis.points[i][1] - y) ** 2
                        ) <= analysis.arcRadius) {
                            render();
                            ctx.beginPath();
                            ctx.strokeStyle = "gray";
                            let oldLineWidth = ctx.lineWidth;
                            ctx.lineWidth = 0.5;
                            ctx.arc(analysis.points[i][0], analysis.points[i][1], ctx.arcRadius + 1.5, 0, 2 * Math.PI);
                            ctx.stroke();
                            ctx.lineWidth = oldLineWidth;
                            return;
                        }
                    }
                }
                render();
            }
        }

        canvas.ontouchmove = (e) => {
            let bcr = e.target.getBoundingClientRect();
            let x = e.targetTouches[0].clientX - bcr.x;
            let y = e.targetTouches[0].clientY - bcr.y;
            canvas.onmousemove({ offsetX: x, offsetY: y });
        }

        analyzingElement.classList.add("d-none");

        calculate();
        render();
    }

    function clearData() {
        canvas.width = 0;
        canvas.height = 0;
        for (let i of Object.values(data)) {
            i.render.innerHTML = "";
            i.ideal.innerHTML = "";
            i.assessment.innerHTML = "";
        }
    }

    setStatus = (text) => document.getElementById("analyzing-status").innerHTML = text;

    document.querySelector("#loading").style.display = "none";
    document.querySelector(".container").classList.remove("d-none");
}

async function analyze(canvas, ctx, url) {
    setStatus("Loading image");

    let image = await loadImage(url);

    canvas.width = image.width;
    canvas.height = image.height;
    resetToImage(ctx, image);
    ctx.lineWidth = Math.sqrt((image.width * image.height) / 100000);
    ctx.arcRadius = Math.sqrt((image.width * image.height) / 100000);

    setStatus("Analyzing");

    const model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
        maxFaces: 1
    });
    let face = await findLandmarks(model, image);
    let [points, criteria] = analyseCriteria(face);

    return {
        image,
        resetToImage: () => resetToImage(ctx, image),
        points,
        criteria,
        arcRadius: ctx.arcRadius,
    };
}

function loadImage(url) {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = url;
        image.addEventListener("load", () => resolve(image));
    });
}

function resetToImage(ctx, image) {
    ctx.drawImage(image, 0, 0);
}

async function findLandmarks(model, image) {
    const predictions = await model.estimateFaces({ input: image });
    if (predictions.length > 0) {
        return predictions[0];
    } else {
        throw new Error("No face detected");
    }
}

(async function () {
    await main();
})();
