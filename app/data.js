// SortSense built-in data.
// Bundled products: barcodes verified against Open Food Facts on 16 Nov 2026
// (Nutella, Coca-Cola, Prince, Evian) plus well known products whose
// packaging is standard for the brand. Live lookup always tries Open Food
// Facts first; this table is the offline fallback and the demo set.
// Impact factors are simplified EPA WARM style estimates, labelled as such
// in the UI. They are directional, not a lifecycle assessment.

const MATERIAL_INFO = {
  aluminium: { label: "Aluminium", verdict: "recycle", bin: "Recycling bin", note: "Rinse it out. Aluminium can be recycled forever with no loss in quality.", co2PerKg: 8.9 },
  steel: { label: "Steel / tin", verdict: "recycle", bin: "Recycling bin", note: "Rinse it out. Steel is magnetic, so sorting plants pull it out easily.", co2PerKg: 1.8 },
  glass: { label: "Glass", verdict: "recycle", bin: "Glass bin", note: "Rinse it out and take off the lid. Glass never wears out in recycling.", co2PerKg: 0.3 },
  paper: { label: "Paper", verdict: "recycle", bin: "Recycling bin", note: "Keep it dry and clean. Greasy or food stained paper goes in the trash.", co2PerKg: 0.9 },
  cardboard: { label: "Cardboard", verdict: "recycle", bin: "Recycling bin", note: "Flatten the box so the truck fits more in. Tape is fine, leave it on.", co2PerKg: 0.9 },
  carton: { label: "Drinks carton", verdict: "recycle", bin: "Recycling bin", note: "Empty it, flatten it, put the cap back on. Cartons are paper with a thin plastic lining.", co2PerKg: 0.9 },
  pet: { label: "PET plastic", verdict: "recycle", bin: "Recycling bin", note: "Empty it and put the cap back on. PET is the most widely recycled plastic.", co2PerKg: 1.5 },
  hdpe: { label: "HDPE plastic", verdict: "recycle", bin: "Recycling bin", note: "Empty it and rinse it. HDPE is the sturdy plastic used for milk and detergent bottles.", co2PerKg: 1.4 },
  pp: { label: "PP plastic", verdict: "recycle", bin: "Recycling bin", note: "Check your local rules. Many cities take tubs and lids now, some do not.", co2PerKg: 1.0 },
  plastic: { label: "Plastic", verdict: "check", bin: "Check local rules", note: "Plastic recycling depends on the type. Look for the number in the triangle on the bottom.", co2PerKg: 1.0 },
  film: { label: "Plastic film", verdict: "trash", bin: "Trash", note: "Soft film jams sorting machines. Some grocery stores collect clean film at the entrance.", co2PerKg: 0 },
  mixed: { label: "Mixed materials", verdict: "trash", bin: "Trash", note: "Layers of different materials stuck together cannot be separated, so they go in the trash.", co2PerKg: 0 },
  styrofoam: { label: "Styrofoam", verdict: "trash", bin: "Trash", note: "Most cities do not recycle it. Some packaging stores take clean foam back.", co2PerKg: 0 },
  compost: { label: "Compostable", verdict: "compost", bin: "Compost", note: "Only if your city takes it. Compostable plastic needs an industrial composter, not a backyard pile.", co2PerKg: 0 },
  food: { label: "Food scraps", verdict: "compost", bin: "Compost", note: "Food in landfill makes methane. Compost it if you can, or use a food waste bin.", co2PerKg: 0.4 },
  battery: { label: "Battery", verdict: "special", bin: "Drop off point", note: "Never put batteries in any bin. They cause fires in trucks and plants. Take them to a drop off point.", co2PerKg: 0 },
  electronic: { label: "Electronics", verdict: "special", bin: "Drop off point", note: "Electronics hold valuable metals and toxic parts. Take them to an e waste collection point.", co2PerKg: 0 },
  hazardous: { label: "Hazardous", verdict: "special", bin: "Drop off point", note: "Paint, chemicals and aerosols need special handling. Check your city hazardous waste days.", co2PerKg: 0 },
  unknown: { label: "Unknown material", verdict: "check", bin: "Check local rules", note: "We could not tell what this is made of. Search the guide below or check your city rules.", co2PerKg: 0 },
};

// keyword -> material key, checked in order
const MATERIAL_KEYWORDS = [
  ["aluminium", "aluminium"], ["aluminum", "aluminium"],
  ["steel", "steel"], ["tin", "steel"], ["metal", "steel"],
  ["pet", "pet"], ["pet-bottle", "pet"], ["pet bottle", "pet"],
  ["hdpe", "hdpe"], ["hdpe-film", "film"],
  ["pp", "pp"], ["polypropylene", "pp"],
  ["glass", "glass"],
  ["cardboard", "cardboard"], ["carton", "carton"], ["etui-en-carton", "cardboard"],
  ["paper", "paper"],
  ["film", "film"], ["flexible", "film"], ["plastic bag", "film"], ["cling", "film"],
  ["styrofoam", "styrofoam"], ["polystyrene", "styrofoam"], ["eps", "styrofoam"],
  ["pla", "compost"], ["compostable", "compost"],
  ["battery", "battery"], ["batteries", "battery"],
  ["electronic", "electronic"], ["e-waste", "electronic"],
  ["plastic", "plastic"],
  ["packet", "mixed"], ["multi", "mixed"], ["composite", "mixed"],
];

const VERDICT_META = {
  recycle: { label: "Recycle it", cls: "v-recycle" },
  trash: { label: "Trash it", cls: "v-trash" },
  compost: { label: "Compost it", cls: "v-compost" },
  special: { label: "Drop it off", cls: "v-special" },
  check: { label: "Check first", cls: "v-check" },
};

// Bundled products: barcode -> { name, parts: [{part, material, weightKg}], source }
const BUNDLED_PRODUCTS = {
  "3017620422003": { name: "Nutella Hazelnut Spread", parts: [
    { part: "Jar", material: "glass", weightKg: 0.20 },
    { part: "Lid", material: "pp", weightKg: 0.02 },
    { part: "Seal", material: "aluminium", weightKg: 0.002 },
  ], source: "Open Food Facts, verified 16 Nov 2026" },
  "5449000000996": { name: "Coca-Cola Original", parts: [
    { part: "Can", material: "aluminium", weightKg: 0.015 },
  ], source: "Open Food Facts, verified 16 Nov 2026" },
  "7622210449283": { name: "Prince Biscuits", parts: [
    { part: "Box", material: "cardboard", weightKg: 0.05 },
    { part: "Wrapper", material: "film", weightKg: 0.01 },
  ], source: "Open Food Facts, verified 16 Nov 2026" },
  "3068320055008": { name: "Evian Mineral Water 500ml", parts: [
    { part: "Bottle", material: "pet", weightKg: 0.025 },
    { part: "Cap", material: "pp", weightKg: 0.005 },
  ], source: "Open Food Facts, verified 16 Nov 2026" },
  "0079298000078": { name: "Evian Spring Water", parts: [
    { part: "Bottle", material: "pet", weightKg: 0.025 },
    { part: "Cap", material: "pp", weightKg: 0.005 },
  ], source: "Open Food Facts, verified 16 Nov 2026" },
  "5053990104825": { name: "Pringles Original", parts: [
    { part: "Tube", material: "mixed", weightKg: 0.08 },
    { part: "Lid", material: "pp", weightKg: 0.01 },
    { part: "Base", material: "steel", weightKg: 0.01 },
  ], source: "Built-in guide data: composite tube, foil lining and plastic lid cannot be separated" },
  "5000157023481": { name: "Heinz Baked Beans", parts: [
    { part: "Tin", material: "steel", weightKg: 0.05 },
    { part: "Label", material: "paper", weightKg: 0.005 },
  ], source: "Built-in guide data: standard steel food tin with paper label" },
};

// "What goes where" guide: name, material, bin, note
const GUIDE = [
  ["Aluminium can", "aluminium", "Rinse, crush if you like. One of the best things you can recycle."],
  ["Steel food tin", "steel", "Rinse it out. The paper label can stay on."],
  ["Glass jar", "glass", "Rinse it out, lid off. Broken glass goes in the trash, wrapped in paper."],
  ["Glass bottle", "glass", "Rinse it out. Corks go in the trash unless your city collects them."],
  ["Plastic water bottle", "pet", "Empty it, cap back on. The cap is recyclable too."],
  ["Milk jug", "hdpe", "Rinse it out. One of the easiest plastics to recycle."],
  ["Detergent bottle", "hdpe", "Rinse it out. Pumps go in the trash, the bottle is recyclable."],
  ["Yogurt tub", "pp", "Rinse it out. Check local rules, many cities take tubs now."],
  ["Takeaway container", "pp", "Clean it first. Greasy containers go in the trash."],
  ["Milk carton", "carton", "Empty it, flatten it, cap on."],
  ["Juice carton", "carton", "Same as a milk carton. Empty and flatten."],
  ["Cereal box", "cardboard", "Flatten it. Take the plastic bag out, that goes in the trash."],
  ["Cardboard box", "cardboard", "Flatten it. Remove tape and labels if you can."],
  ["Newspaper", "paper", "Keep it dry. Wet paper cannot be recycled."],
  ["Office paper", "paper", "Staples are fine. Shredded paper goes in the trash in most cities."],
  ["Pizza box", "cardboard", "Clean parts recycle, greasy parts go in the trash or compost."],
  ["Egg carton (cardboard)", "cardboard", "Recycle it if it is clean and dry."],
  ["Egg carton (foam)", "styrofoam", "Trash in most cities."],
  ["Plastic shopping bag", "film", "Trash, or return clean bags to a store collection bin."],
  ["Cling film", "film", "Trash. It tangles sorting machines."],
  ["Chip bag", "mixed", "Trash. Layers of plastic and foil stuck together cannot be split."],
  ["Coffee cup (paper)", "mixed", "Trash in most cities. The plastic lining makes it hard to recycle."],
  ["Coffee pod", "mixed", "Trash unless your brand runs a take back program."],
  ["Plastic straw", "plastic", "Trash. Too small for sorting machines to catch."],
  ["Plastic cutlery", "plastic", "Trash. Too small and too mixed to recycle."],
  ["Styrofoam box", "styrofoam", "Trash in most cities."],
  ["Bubble wrap", "film", "Trash, or drop it at a store that collects film."],
  ["Envelope", "paper", "Recycle it. The plastic window is fine in most plants."],
  ["Book", "paper", "Recycle it. Hard covers go in the trash."],
  ["Light bulb (LED)", "electronic", "Drop off point. Never in the bin."],
  ["Battery", "battery", "Drop off point. Batteries cause fires in trucks and plants."],
  ["Old phone", "electronic", "Drop off point or a trade in program."],
  ["Charger cable", "electronic", "Drop off point with other e waste."],
  ["Paint can", "hazardous", "Hazardous waste day. Never pour paint down the drain."],
  ["Aerosol can", "steel", "Empty it fully, then recycle. If it still sprays, it is hazardous."],
  ["Toothpaste tube", "mixed", "Trash in most cities. Some brands run a take back program."],
  ["Shampoo bottle", "hdpe", "Rinse it out and recycle it."],
  ["Wine cork (natural)", "compost", "Compost it. Plastic corks go in the trash."],
  ["Banana peel", "food", "Compost it. Food in landfill makes methane."],
  ["Coffee grounds", "food", "Compost them. Great for gardens."],
  ["Food scraps", "food", "Compost or a food waste bin. Never in recycling."],
  ["Clothing", "unknown", "Donate it if it is wearable. Worn out clothes go to textile recycling if your city has it."],
];

// ImageNet label (lowercase substring) -> material guess, for the photo check.
const IMAGENET_MAP = [
  ["pop bottle", "pet", "A plastic bottle. Check the bottom for the recycling number."],
  ["water bottle", "pet", "A plastic bottle. Check the bottom for the recycling number."],
  ["beer bottle", "glass", "A glass bottle. Rinse it and recycle it."],
  ["wine bottle", "glass", "A glass bottle. Rinse it and recycle it."],
  ["beer can", "aluminium", "An aluminium can. Rinse and recycle."],
  ["milk can", "steel", "A metal can. Rinse and recycle."],
  ["ashcan", "steel", "Metal. Recycle it if it is clean."],
  ["plastic bag", "film", "Soft plastic film. Trash, or a store collection bin."],
  ["shopping bag", "film", "Soft plastic film. Trash, or a store collection bin."],
  ["cardboard", "cardboard", "Cardboard. Flatten and recycle."],
  ["carton", "cardboard", "Cardboard. Flatten and recycle."],
  ["packet", "mixed", "A packet. Most packets are mixed materials, so trash."],
  ["envelope", "paper", "Paper. Recycle it."],
  ["paper towel", "paper", "Paper, but used towels go in the trash or compost."],
  ["banana", "food", "Food. Compost it."],
  ["apple", "food", "Food. Compost it."],
  ["orange", "food", "Food. Compost it."],
  ["broccoli", "food", "Food. Compost it."],
  ["cucumber", "food", "Food. Compost it."],
  ["mushroom", "food", "Food. Compost it."],
  ["cellular telephone", "electronic", "Electronics. Drop it off, never bin it."],
  ["laptop", "electronic", "Electronics. Drop it off, never bin it."],
  ["remote control", "electronic", "Electronics. Drop it off, and take the batteries out."],
  ["toaster", "electronic", "Electronics. Drop it off."],
  ["coffee mug", "glass", "Ceramics and mugs are not recyclable. Trash, or donate it."],
  ["goblet", "glass", "Glassware is not the same as bottle glass. Trash it."],
  ["vase", "glass", "Glassware is not bottle glass. Trash it."],
  ["can opener", "steel", "Metal. Recycle it."],
  ["sunglasses", "mixed", "Mixed materials. Trash."],
  ["book", "paper", "Paper. Recycle it."],
  ["newspaper", "paper", "Paper. Recycle it, keep it dry."],
  ["toilet tissue", "paper", "Used tissue goes in the trash or compost."],
];
