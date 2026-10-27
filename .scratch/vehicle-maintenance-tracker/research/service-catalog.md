# Standard service catalog — research (draft)

Researched: 2026-10-26 · For ticket [03 — Standard service catalog](../issues/03-standard-service-catalog.md) · Market: US, English, miles (see [02](../issues/02-market-locale-currency-units.md)).

## Summary

- **There is no industry-standard US list of vehicle services.** Every OEM publishes a model-specific maintenance schedule in the owner's manual, and every chain organizes its menu differently. The catalog below is a synthesis, not a copy of any one source.
- **Dealers sell packages, not line items.** Honda's Maintenance Minder (A/B + sub-items 1–7), Toyota's 5,000-mile visits, GM/Ford oil-life-monitor visits and the generic "30k/60k/90k service" all bundle several of the services below. How the catalog treats packages is left open (see Open questions).
- **Chains converge on ~10 top-level categories.** Jiffy Lube's national menu: Oil Change, Battery, Brakes, Engine, Exterior & Glass, Filters, Fluids, Inspections, Suspension, Tires. Firestone and Pep Boys add Heating & Cooling, Fuel System, Alignment, Inspections & Diagnostics. Detailing and body shops add appearance and collision work that the mechanical chains don't cover.
- **Draft:** 14 categories, 117 services. 37 carry a typical recurring interval (mileage, time or both); 5 more are wear-based. The rest are as needed. Intervals vary widely by OEM, model, powertrain and driving conditions ("severe service"), so the ranges are only indicative.

## Methodology

1. Surveyed OEM maintenance programs (Honda Maintenance Minder, Toyota/ToyotaCare schedule, GM Oil Life System and Chevrolet schedules, Ford Intelligent Oil-Life Monitor and schedules) through dealer pages and KBB's schedules, which are copied from owner's manuals.
2. Surveyed national chains' service menus and schedules: Jiffy Lube (national nav), Firestone Complete Auto Care, Pep Boys (service categories and the published "auto care schedule").
3. Surveyed detailing and collision/body-shop menus, which are not standardized, to cover appearance and body work.
4. Added US-specific paperwork items (state safety inspection, emissions test, registration) and consumer guidance for typical intervals (USAA, AAA, owner's-manual excerpts).
5. Merged the menus into one taxonomy, deduplicated, and normalized names to plain US English as an Owner would say them (e.g. "Oil & filter change", not "Lube, oil & filter").

Some primary pages (firestonecompleteautocare.com, pepboys.com) returned HTTP 403 to automated fetch. For those, the menu contents come from search-result excerpts of the same official pages.

## Sources

OEM programs and schedules
- Honda Maintenance Minder, owner's manual excerpt (techinfo.honda.com): https://techinfo.honda.com/rjanisis/pubs/OM/AH/A3V02626IOM/enu/details/131237047-192706.html
- Honda Canada, maintenance schedules: https://honda.ca/en/service-parts/maintenance-schedules
- Germain Honda, Maintenance Minder codes: https://www.germaincars.com/honda-maintenance-minder-codes/
- Brannon Honda, Maintenance Minder codes: https://www.brannonhonda.com/hondas-maintenance-minder-codes-birmingham-al/
- J.D. Power, Toyota maintenance guide: https://www.jdpower.com/cars/shopping-guides/toyota-car-maintenance-guide
- Passport Toyota, ToyotaCare: https://www.passporttoyota.com/blogs/716/peace-of-mind-comes-standard-with-toyotacare
- North Hollywood Toyota, after ToyotaCare: https://www.northhollywoodtoyota.com/blog/what-happens-after-toyotacare-expires
- KBB, Chevrolet maintenance schedules: https://www.kbb.com/ownership-history-by-make/chevrolet-maintenance-schedules/
- KBB, Ford maintenance schedules: https://www.kbb.com/ownership-history-by-make/ford-maintenance-schedules/
- KBB, Ford Edge 2018 schedule: https://www.kbb.com/ford/edge/2018/maintenance-schedules/
- Mazda owner's manual, scheduled maintenance (coolant/brake fluid/plugs): https://owners-manual.mazda.com/gen/en/mazda3/mazda3_8gd7ee17h/contents/07020106.html

Chains and shops
- Jiffy Lube, national services menu: https://www.jiffylube.com/
- Firestone Complete Auto Care, maintenance: https://www.firestonecompleteautocare.com/maintain/
- Pep Boys, auto service & repair: https://www.pepboys.com/auto-service-repair
- Pep Boys, auto care schedule: https://www.pepboys.com/tips-guides/service-maintenance/auto-care-schedule
- Pep Boys, fuel system service: https://www.pepboys.com/auto-service-repair/fuel-system
- Fresno Lexus, 30k/60k/90k services: https://www.fresnolexus.com/service/service-faq/
- AAA, what to expect at 30k/60k/90k: https://www.acg.aaa.com/connect/blogs/5c/auto/what-to-expect-at-30k-60k-and-90k-mile-service
- Wrench, scheduled maintenance (30K/60K/90K): https://wrench.com/services/scheduled-maintenance-30k-60k-90k-mobile-mechanic

Detailing and body
- Porsche Tulsa, dealer detail services: https://tulsa.porsche.com/en/service/detail-services
- Childress Collision Center (PDR), Nashville: https://magicpin.com/usa/Nashville/The-Gulch/Autocare/Childress-Collision-Center/store/2554582
- (Detailing menus from individual shop booking pages were consistent: wash & wax, interior shampoo, clay bar, paint correction, ceramic coating, headlight restoration.)

Typical intervals and paperwork
- USAA, vehicle maintenance checklist: https://www.usaa.com/advice/vehicle-maintenance-checklist/
- Peddle, intervals for wipers, fluids, tires, brakes: https://peddle.com/blog/maintenance-and-repair/maintenance-intervals-for-all-the-little-things-fluid-wipers-tires-brakes-etc
- Wikipedia, vehicle inspection in the US: https://en.wikipedia.org/wiki/Vehicle_inspection_in_the_United_States
- Vermont Legislative Research Service, vehicle inspections (Feb 2026): https://www.uvm.edu/d10-files/documents/2026-02/Vehicle-Inspections.pdf

## How dealers bundle services (packages)

| Program | How it bundles | Catalog services it maps to |
|---|---|---|
| Honda Maintenance Minder | Main code **A** (oil) or **B** (oil + filter + inspections), plus sub-items **1** tire rotation, **2** engine air filter + cabin filter + drive belt inspection, **3** transmission (+ transfer) fluid, **4** spark plugs + timing belt + valve clearance + water pump inspection, **5** coolant, **6** rear differential fluid, **7** brake fluid. Codes combine, e.g. "B12". Newer models may show "0"/"9". Brake fluid every 3 years if item 7 never shows. | `oil-change`, `multi-point-inspection`, `tire-rotation`, `engine-air-filter`, `cabin-air-filter`, `drive-belt`, `transmission-fluid`, `transfer-case-fluid`, `spark-plugs`, `timing-belt`, `valve-adjustment`, `water-pump`, `coolant-flush`, `differential-fluid`, `brake-fluid-flush` |
| Toyota scheduled maintenance | Visits every 5,000 mi / 6 mo. Alternating visits are inspection + rotation, and oil + filter (synthetic, 10,000 mi / 12 mo). Cabin filter added at some visits. Coolant first at 100k mi / 120 mo. ToyotaCare covers these visits for a limited term (2 yr / 25k mi; one dealer reports 1 yr / 10k for MY2027+, unverified). | `oil-change`, `tire-rotation`, `multi-point-inspection`, `cabin-air-filter`, `engine-air-filter`, `coolant-flush` |
| GM Oil Life System / Ford Intelligent Oil-Life Monitor | Oil change when the monitor says so (Ford: "change soon" at 5 %, "required" at 0 %). Mileage visits (e.g. GM 7.5k / 22.5k / 45k, Ford 10k / 30k / 40k) add rotation, cabin filter (GM 22.5k), engine air filter (Ford 30k, GM 45k), axle fluid. | `oil-change`, `tire-rotation`, `cabin-air-filter`, `engine-air-filter`, `differential-fluid`, `brake-inspection` |
| "30k / 60k / 90k service" (dealers and independents) | Generic milestone visits: 30k ≈ oil, filters, rotation, inspection. 60k adds coolant, plugs, transmission, power-steering, fuel-system service. 90k ≈ everything, often the timing belt. | Many; contents vary by shop. |
| Chain menus | Brake "Standard/Premium" packages (pads + rotor resurfacing). "Signature Service" oil change (oil + chassis lube + top-offs + tire pressure). Detailing "Full detail" (wash, clay, sealant, interior). | `brake-pads`, `brake-rotors`, `oil-change`, `chassis-lubrication`, `fluid-top-off`, `full-detail`, … |

In practice an Owner's receipt is often one line ("B12 service — $189", "60K service — $650") or several lines on one invoice. The catalog can't stay neutral on this; see Open question 3.

## Draft catalog

Conventions
- **Slugs** are kebab-case, English, stable identifiers that are never re-used. Display names can change, slugs cannot.
- **Interval** is the *typical US range* for a gasoline vehicle under normal service, from the sources above. **Intervals vary by OEM, model, powertrain and driving conditions; the owner's manual / the vehicle's maintenance reminder is the authority.** "—" means as needed (no recurring interval). "≈" marks a range with weak agreement among sources.
- Each service belongs to exactly one category in this draft. Where menus disagree (cabin filter: "Filters" vs "HVAC"), it goes where an Owner would look first.

### 1. `routine-maintenance` — Routine Maintenance

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `oil-change` | Oil & filter change | Drain and replace engine oil and oil filter (conventional, blend or synthetic). | 5,000–10,000 mi or 6–12 mo (synthetic); 3,000–5,000 mi on older/conventional. Follow the oil-life monitor where equipped. |
| `scheduled-maintenance` | Scheduled maintenance (package) | A manufacturer or shop maintenance package (e.g. Honda B12, Toyota 30K, "60K service"). | Per OEM schedule (e.g. every 5,000–10,000 mi). See packages. |
| `multi-point-inspection` | Multi-point inspection | General check of fluids, belts, hoses, brakes, tires, lights and leaks. | Every oil change / 6–12 mo |
| `engine-air-filter` | Engine air filter replacement | Replace the engine intake air filter. | 15,000–45,000 mi (e.g. Ford 30k, GM 45k) |
| `cabin-air-filter` | Cabin air filter replacement | Replace the dust/pollen filter for the passenger cabin. | 15,000–30,000 mi or 12–24 mo (e.g. GM 22.5k) |
| `fuel-filter` | Fuel filter replacement | Replace an external/serviceable fuel filter (many modern cars have none). | ≈ 30,000–60,000 mi where serviceable |
| `fluid-top-off` | Fluid check & top-off | Check and top off washer, coolant, brake, power-steering and other fluids. | Every oil change |
| `chassis-lubrication` | Chassis lubrication | Grease suspension and steering fittings (mostly trucks and older vehicles). | Every oil change where fittings exist |
| `wiper-blades` | Wiper blade replacement | Replace front and/or rear wiper blades. | 6–12 mo |

### 2. `brakes` — Brakes

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `brake-inspection` | Brake inspection | Measure pads/shoes and rotors/drums, check lines, hoses and parking brake. | 10,000–12,000 mi / 12 mo (often with rotation) |
| `brake-pads` | Brake pad replacement | Replace disc brake pads (front and/or rear axle). | ≈ 30,000–70,000 mi, wear-based |
| `brake-rotors` | Brake rotor resurfacing / replacement | Machine or replace brake rotors. | Wear-based, often with pads |
| `brake-shoes-drums` | Brake shoes & drums | Replace drum brake shoes and/or drums. | Wear-based |
| `brake-calipers` | Brake caliper repair / replacement | Rebuild or replace a sticking or leaking caliper. | — |
| `brake-lines-hoses` | Brake line & hose repair | Replace a corroded or leaking brake line or hose. | — |
| `brake-fluid-flush` | Brake fluid flush | Replace brake fluid, which absorbs moisture over time. | 2–3 yr (Honda 3 yr) or ≈ 30,000 mi |
| `parking-brake` | Parking brake service | Adjust or repair the parking/emergency brake (cable or electronic). | — |
| `abs-repair` | ABS repair | Diagnose and repair the anti-lock braking system (sensors, module). | — |

### 3. `tires-wheels` — Tires & Wheels

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `tire-rotation` | Tire rotation | Move tires between positions to even out wear. | 5,000–7,500 mi (some OEMs 10,000) |
| `tire-replacement` | Tire replacement | Mount new tires (one, a pair or a set). | By tread depth (2/32" minimum) or ≈ 6–10 yr of age |
| `tire-repair` | Flat tire repair | Patch/plug a punctured tire. | — |
| `wheel-balancing` | Wheel balancing | Balance tire/wheel assemblies to remove vibration. | With new tires / when vibration appears |
| `wheel-alignment` | Wheel alignment | Adjust camber, caster and toe to spec. | Check every 12 mo or with new tires |
| `tpms-service` | TPMS sensor service | Replace or reprogram a tire-pressure monitoring sensor. | — |
| `seasonal-tire-swap` | Seasonal tire changeover | Swap between winter and summer/all-season tires or wheels. | Twice a year (where used) |
| `wheel-repair` | Wheel repair / replacement | Repair curb rash or a bent wheel, or replace a wheel. | — |
| `tire-pressure-check` | Tire pressure check & nitrogen fill | Set tire pressures, including the spare; nitrogen fill. | Monthly (Owner) |

### 4. `suspension-steering` — Suspension & Steering

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `shocks-struts` | Shocks & struts replacement | Replace worn shock absorbers or strut assemblies. | ≈ 50,000–100,000 mi, condition-based |
| `ball-joints` | Ball joint replacement | Replace worn upper/lower ball joints. | — |
| `tie-rod-ends` | Tie rod end replacement | Replace inner/outer tie rod ends (alignment needed afterward). | — |
| `control-arms-bushings` | Control arm & bushing replacement | Replace control arms or worn suspension bushings. | — |
| `sway-bar-links` | Sway bar link & bushing replacement | Replace stabilizer bar links or bushings. | — |
| `springs` | Coil / leaf spring replacement | Replace broken or sagging springs. | — |
| `wheel-bearings` | Wheel bearing / hub replacement | Replace a noisy or loose wheel bearing or hub assembly. | — |
| `power-steering-fluid` | Power steering fluid service | Flush or replace hydraulic power-steering fluid. | ≈ 50,000–100,000 mi where hydraulic |
| `steering-repair` | Steering rack / pump repair | Repair or replace the steering rack, gearbox or power-steering pump. | — |
| `suspension-lift-lower` | Lift / lowering kit installation | Install a lift kit, leveling kit or lowering springs. | — |

### 5. `engine-exhaust` — Engine & Exhaust

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `check-engine-diagnostics` | Check engine light diagnostics | Read trouble codes and diagnose a warning light or drivability issue. | — |
| `spark-plugs` | Spark plug replacement | Replace spark plugs (tune-up). | 60,000–120,000 mi (iridium/platinum); ≈ 30,000 mi copper |
| `ignition-coils` | Ignition coil replacement | Replace failed ignition coils or plug wires. | — |
| `timing-belt` | Timing belt replacement | Replace the timing belt (often with water pump and tensioner), if equipped. | 60,000–105,000 mi or ≈ 7–10 yr, if equipped |
| `timing-chain` | Timing chain repair | Replace a stretched timing chain, guides or tensioners. | — |
| `drive-belt` | Drive / serpentine belt replacement | Replace the accessory drive belt and tensioner. | Inspect; replace ≈ 60,000–100,000 mi |
| `valve-adjustment` | Valve clearance adjustment | Inspect and adjust valve lash. | Per OEM (e.g. Honda via sub-item 4) |
| `fuel-system-cleaning` | Fuel system / injector cleaning | Clean injectors, intake valves and throttle body. | ≈ 15,000–30,000 mi (shop-recommended; rarely OEM-required) |
| `throttle-body-cleaning` | Throttle body cleaning | Clean carbon from the throttle body. | — |
| `pcv-valve` | PCV valve replacement | Replace the positive crankcase ventilation valve. | — |
| `gasket-seal-repair` | Oil leak / gasket repair | Replace leaking gaskets or seals (valve cover, oil pan, rear main…). | — |
| `engine-mounts` | Engine / transmission mount replacement | Replace worn motor or transmission mounts. | — |
| `turbo-repair` | Turbocharger repair | Repair or replace a turbocharger or its plumbing. | — |
| `engine-repair` | Engine repair / replacement | Major internal engine repair, rebuild or swap. | — |
| `exhaust-repair` | Exhaust & muffler repair | Repair or replace exhaust pipes, muffler or hangers. | — |
| `catalytic-converter` | Catalytic converter replacement | Replace a failed or stolen catalytic converter. | — |
| `oxygen-sensor` | Oxygen sensor replacement | Replace an upstream/downstream O2 sensor. | — |
| `evap-system` | EVAP system repair | Repair evaporative emissions leaks (gas cap, purge valve, hoses). | — |

### 6. `transmission-drivetrain` — Transmission & Drivetrain

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `transmission-fluid` | Transmission fluid service | Drain/fill or flush automatic, CVT or manual transmission fluid. | 30,000–60,000 mi (some "lifetime"/100k+) |
| `transfer-case-fluid` | Transfer case fluid service | Replace transfer case fluid on 4WD/AWD vehicles. | ≈ 30,000–60,000 mi, if equipped |
| `differential-fluid` | Differential fluid service | Replace front/rear differential or axle fluid. | ≈ 30,000–60,000 mi, if equipped |
| `clutch` | Clutch replacement | Replace the clutch disc, pressure plate and release bearing. | — |
| `clutch-hydraulics` | Clutch hydraulics service | Repair or bleed the clutch master/slave cylinder. | — |
| `cv-axle` | CV axle / boot replacement | Replace a CV axle or a torn CV boot. | — |
| `driveshaft-u-joints` | Driveshaft & U-joint repair | Repair or replace the driveshaft, U-joints or center bearing. | — |
| `transmission-repair` | Transmission repair / rebuild | Major transmission repair, rebuild or replacement. | — |

### 7. `cooling` — Cooling System

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `coolant-flush` | Coolant flush / replacement | Drain and refill engine coolant (antifreeze). | Long-life: first at 100,000–150,000 mi or 10 yr, then ≈ 50,000 mi / 5 yr. Older/conventional: ≈ 30,000 mi / 2 yr |
| `radiator` | Radiator repair / replacement | Repair or replace a leaking or clogged radiator. | — |
| `water-pump` | Water pump replacement | Replace the coolant water pump. | Often with timing belt |
| `thermostat` | Thermostat replacement | Replace a stuck engine thermostat. | — |
| `coolant-hoses` | Coolant hose replacement | Replace radiator or heater hoses and clamps. | Inspect; ≈ 4–5 yr |
| `cooling-fan` | Cooling fan repair | Repair or replace the radiator cooling fan or its relay. | — |

### 8. `electrical-battery` — Electrical & Battery

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `battery-test` | Battery & charging test | Test battery, alternator output and starter draw. | Annually after ~3 yr |
| `battery-replacement` | Battery replacement | Replace the 12-volt battery. | 3–5 yr |
| `alternator` | Alternator replacement | Replace a failing alternator. | — |
| `starter` | Starter replacement | Replace the starter motor or solenoid. | — |
| `bulb-replacement` | Light bulb replacement | Replace headlight, taillight, brake or other bulbs/LED units. | — |
| `electrical-repair` | Electrical diagnosis & wiring repair | Diagnose and repair wiring, fuses, relays, modules or sensors. | — |
| `key-fob` | Key fob battery / programming | Replace a key-fob battery, cut or program a key. | Fob battery ≈ 2–4 yr |
| `power-accessories` | Power window / lock / mirror repair | Repair window regulators, door lock actuators, power mirrors. | — |
| `audio-electronics` | Audio & electronics installation | Install or repair stereo, speakers, dash cam, remote start, etc. | — |

### 9. `hvac` — Heating & A/C

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `ac-recharge` | A/C evacuate & recharge | Evacuate, leak-check and recharge refrigerant. | — (when cooling drops) |
| `ac-repair` | A/C repair | Repair or replace compressor, condenser, evaporator or lines. | — |
| `heater-repair` | Heater repair | Repair heater core, blend doors or heater valve. | — |
| `blower-motor` | Blower motor / resistor repair | Replace blower motor or resistor (fan speeds not working). | — |

### 10. `body-paint` — Body & Paint

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `collision-repair` | Collision repair | Repair accident damage (panels, structure, paint), often via insurance. | — |
| `dent-repair` | Dent repair | Conventional dent repair with filler and paint. | — |
| `paintless-dent-repair` | Paintless dent repair (PDR) | Push out dings and hail dents without repainting. | — |
| `bumper-repair` | Bumper repair / replacement | Repair, refinish or replace a bumper cover. | — |
| `scratch-touch-up` | Scratch & chip touch-up | Touch up paint chips and light scratches. | — |
| `panel-repaint` | Panel repaint | Repaint one or more panels with color matching and clear coat. | — |
| `full-repaint` | Full repaint | Repaint the entire vehicle. | — |
| `rust-repair` | Rust repair | Cut out and repair rusted metal. | — |
| `undercoating` | Undercoating / rustproofing | Apply undercoating or rust-inhibitor treatment. | ≈ Annually (oil-based sprays) |
| `vinyl-wrap` | Vinyl wrap | Apply a full or partial vinyl wrap. | — |

### 11. `glass` — Glass

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `windshield-chip-repair` | Windshield chip repair | Resin repair of a small chip or crack. | — |
| `windshield-replacement` | Windshield replacement | Replace the windshield. | — |
| `window-replacement` | Side / rear window replacement | Replace door glass, quarter glass or back glass. | — |
| `adas-calibration` | ADAS camera calibration | Recalibrate driver-assist cameras/sensors after glass or alignment work. | — |
| `window-tint` | Window tinting | Apply or remove window film. | — |

### 12. `detailing` — Detailing & Appearance

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `car-wash` | Car wash | Exterior wash (automatic or hand). | — (Owner preference) |
| `hand-wash-wax` | Hand wash & wax | Hand wash plus wax or sealant. | Wax ≈ every 2–3 mo |
| `interior-cleaning` | Interior cleaning | Vacuum, wipe-down, glass and vents. | — |
| `upholstery-shampoo` | Carpet & upholstery shampoo | Shampoo/steam carpets and seats; condition leather. | — |
| `full-detail` | Full detail (interior + exterior) | Package combining exterior and interior detailing. | — |
| `clay-bar` | Clay bar decontamination | Remove embedded contaminants from paint. | — |
| `paint-correction` | Paint correction / polishing | Machine polish to remove swirls and scratches. | — |
| `ceramic-coating` | Ceramic coating | Apply a ceramic paint coating. | Per product, ≈ 2–7 yr |
| `paint-protection-film` | Paint protection film (PPF) | Apply clear protective film to paint. | — |
| `headlight-restoration` | Headlight restoration | Sand, polish and UV-seal hazy headlight lenses. | — |
| `odor-removal` | Odor removal | Ozone or enzyme treatment for smoke, pet or mildew odors. | — |
| `engine-bay-cleaning` | Engine bay cleaning | Degrease and dress the engine bay. | — |

### 13. `inspections-registration` — Inspections & Registration

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `state-safety-inspection` | State safety inspection | Periodic safety inspection required by some states. | Annual or biennial, by state (~15–17 states) |
| `emissions-test` | Emissions test / smog check | Emissions inspection required in some states/counties. | Annual or biennial, by state/county (~27 states, often only some areas) |
| `registration-renewal` | Registration renewal | Renew vehicle registration/tags with the state DMV. | Annual or biennial, by state |
| `pre-purchase-inspection` | Pre-purchase inspection | Independent inspection before buying a used vehicle. | — |
| `recall-service` | Recall / warranty repair | Repair under a manufacturer recall, TSB or warranty (often $0). | — |

### 14. `other` — Other

| Slug | Display name | Description | Typical interval |
|---|---|---|---|
| `accessory-installation` | Accessory installation | Install a hitch, roof rack, bed liner, floor mats, etc. | — |
| `towing-roadside` | Towing & roadside assistance | Tow, jump start, lockout or fuel delivery. | — |
| `custom` | Other (custom) | Anything not in the catalog; the Owner names it. | — |

**Counts:** 14 categories, 117 services (9 + 9 + 9 + 10 + 18 + 8 + 6 + 9 + 4 + 10 + 5 + 12 + 5 + 3). 37 have a recurring interval. 5 are wear-based or tied to another service (`brake-rotors`, `brake-shoes-drums`, `wheel-balancing`, `water-pump`, `valve-adjustment`). The rest are as needed. This is above the ~60–100 target. If a shorter picker is wanted, the easiest cuts are the long tail of repair items in `engine-exhaust` and `suspension-steering` (`pcv-valve`, `throttle-body-cleaning`, `turbo-repair`, `engine-mounts`, `springs`, `sway-bar-links`, `clutch-hydraulics`, `cooling-fan`), which `custom` or a broader "repair" item could absorb.

### Notes on coverage

- **Hybrids/EVs.** The catalog is gas-centric. EVs skip `oil-change`, `spark-plugs`, `transmission-fluid` and most of `engine-exhaust`, but add items like high-voltage battery coolant, reduction-gear fluid and charging-equipment work. They still need `cabin-air-filter`, `brake-fluid-flush`, `tire-rotation` and the 12-V `battery-replacement`. Hybrids need nearly everything plus inverter coolant. Not included yet; see Open question 8.
- **Diesel-specific items** (DEF fluid, diesel particulate filter, fuel-water separator, glow plugs) are not included. They could live in `engine-exhaust`.
- **Fuel, insurance, tolls, parking, loan payments** are costs of ownership, not services, and are deliberately absent. `registration-renewal` is the only paperwork cost included, per the ticket's brief. See Open question 7.

## Open questions for the human

These are recorded, not decided.

1. **Where the catalog lives.** Static list in code (a shared TypeScript constant used by app and API; the DB stores the slug) vs a DB-seeded `service_type` table (seeded by migration, FK from records) vs both (code as source of truth, synced to a table). This affects how a catalog change ships (app release vs migration) and whether the app works with the catalog offline.
2. **Line items vs one service per record.** Is one logged visit = one service, or one visit with many services (an invoice with lines)? If many, is cost recorded per line, per visit, or both (parts/labor/tax split?). Real receipts mix both styles. *Likely deserves its own grilling ticket; it shapes the core domain model.*
3. **Packages.** Options: (a) a single `scheduled-maintenance` service with free text/code ("B12", "60K"); (b) the Owner picks the individual services the package contained (decomposed, one total cost); (c) catalog-defined package templates (e.g. "Honda B12" expands into its services); (d) packages as a distinct concept next to services. Dealer and chain menus sell packages, but reminders need individual services.
4. **Intervals in v1.** Ship no intervals (pure log), generic default intervals per service (the ranges above, editable), or Owner-entered intervals per vehicle and service. OEM-specific schedules need a paid data source (NHTSA vPIC has no maintenance schedules), so they're likely out of scope. Ties into the "Service reminders" item on the map.
5. **Custom services.** One-off free-text "Other" per record, vs Owner-defined custom service types that are reusable, selectable later and possibly reminder-capable. Can a custom service pick a category?
6. **Attributes / granularity.** Are variants separate services or attributes on a record? Examples: front vs rear axle (brakes), oil type (synthetic/conventional), number of tires, tire brand/size, part brand/number, warranty. Or is it all just a free-text notes field in v1?
7. **Non-service costs.** Are fuel, insurance, registration, tolls, parking or car washes in scope for cost tracking? The ticket brief includes registration-type items. Fuel logging especially would change the product (MPG tracking). *Could deserve its own scoping ticket.*
8. **Powertrain-aware catalog.** Should the catalog be filtered or extended by fuel type (gas/diesel/hybrid/EV, which NHTSA vPIC decoding returns) or stay one flat list? Should EV/diesel items be added in v1?
9. **Catalog evolution.** Policy for renaming/merging/retiring slugs once records reference them (soft-retire flag? never delete?). Do records snapshot the display name?
10. **Category assignment.** Is a service's category fixed by the catalog, or can an Owner re-categorize? Can a service sit in more than one category (e.g. cabin filter under Routine Maintenance and Heating & A/C)? This matters for cost-by-category reports.
11. **Who did the work.** Record the shop/provider (dealer, chain, independent, DIY) per record? Not a catalog question, but it surfaced from the menus. DIY changes cost semantics (parts only).
12. **Quick picks / ordering.** Should the picker surface a short "common" list (oil change, tire rotation, brakes, battery, car wash, inspection) ahead of the full catalog, and is that list static?
