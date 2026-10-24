# AgroRent Terminology Glossary (English — मराठी — हिन्दी)

This glossary establishes consistent, context-aware agricultural terminology across all translations in AgroRent. Terms are specifically chosen to be familiar, respectful, and easily understood by Indian farmers, avoiding unnecessarily stiff, overly formal, or machine-translated vocabulary.

---

## 1. Core Terminology Table

| English Term | Marathi (मराठी) | Hindi (हिन्दी) | Context & Rationale |
| :--- | :--- | :--- | :--- |
| **Agricultural Equipment / Machinery** | शेतकी अवजारे / कृषी अवजारे | कृषि उपकरण / खेती की मशीनें | Standard term for farm implements, tractors, and machinery. Familiar to rural communities. |
| **Equipment Rental** | अवजारे भाडेतत्त्वावर / उपकरण भाडे | उपकरण किराया / किराये पर मशीन | "भाडेतत्त्वावर" is universally understood in Maharashtra for hiring farm tools; "किराया" is the standard Hindi term. |
| **Equipment Owner** | उपकरण मालक / अवजार मालक | उपकरण मालिक | "मालक" (MR) and "मालिक" (HI) are respectful and immediately recognize ownership. |
| **Renter / Renting Farmer** | भाडेकरू शेतकरी | किरायेदार किसान | Avoids technical legalisms (e.g., पट्टेदार); natural and conversational. |
| **Booking Request** | बुकिंग विनंती | बुकिंग अनुरोध | "विनंती" (MR) and "अनुरोध" (HI) express a polite, pending request awaiting owner approval. |
| **Booking Approval / Approved** | बुकिंग मंजुरी / मंजूर | बुकिंग स्वीकृति / स्वीकृत | Clear status indicating the owner has accepted the rental request. |
| **Booking Rejection / Rejected** | नाकारले / अस्वीकृत | अस्वीकृत | Clear and unambiguous status indicating request was declined. |
| **Booking Cancellation / Cancelled** | रद्द केले | रद्द | Universally understood across languages for cancellation. |
| **Availability (Available / Unavailable)** | उपलब्धता (उपलब्ध / अनुपलब्ध) | उपलब्धता (उपलब्ध / अनुपलब्ध) | Indicates if the machinery is currently free to be booked. |
| **Rental Duration (Hour / Day)** | भाडे कालावधी (तास / दिवस) | किराये की अवधि (घंटा / दिन) | "कालावधी" (MR) and "अवधि" (HI) with hourly ("तास / घंटा") and daily ("दिवस / दिन") units. |
| **Rental Charges / Price** | भाडे दर / शुल्क | किराये का शुल्क / दर | Clear pricing term; distinct from purchase cost. |
| **Pickup and Delivery** | पिकअप आणि डिलिव्हरी (स्वतः घेऊन जाणे / पोहोचवणे) | पिकअप और डिलीवरी | Practical balance between recognizable loan words and localized descriptions. |
| **Completed Rental** | पूर्ण झालेली भाडे सेवा | पूर्ण हुआ किराया | Designates finalized bookings eligible for reviews and earnings calculation. |
| **Primary Photo** | मुख्य फोटो | मुख्य फोटो | "फोटो" is widely recognized by smartphone-using farmers; clearer than "छायाचित्र". |
| **Rating & Reviews / Feedback** | रेटिंग आणि अभिप्राय | रेटिंग और समीक्षा / अभिप्राय | "अभिप्राय" (MR) and "समीक्षा" (HI) represent user reviews and constructive feedback. |
| **Rate Owner** | मालकाला रेटिंग द्या | मालिक को रेटिंग दें | Actionable, concise button label. |
| **Instant Booking** | त्वरित बुकिंग | तुरंत बुकिंग | Indicates immediate booking confirmation without manual owner review. |
| **Request to Book** | बुकिंगसाठी विनंती पाठवा | बुकिंग का अनुरोध करें | Indicates owner review is required before confirmation. |

---

## 2. Equipment Categories

| Category Key | English | Marathi (मराठी) | Hindi (हिन्दी) |
| :--- | :--- | :--- | :--- |
| `allCategories` | All Categories | सर्व प्रकार | सभी श्रेणियां |
| `tractors` | Tractors | ट्रॅक्टर | ट्रैक्टर |
| `harvesters` | Harvesters | हार्वेस्टर / काढणी यंत्र | हार्वेस्टर / कटाई मशीन |
| `rotavators` | Rotavators | रोटाव्हेटर | रोटावेटर |
| `seedDrills` | Seed Drills | पेरणी यंत्र | बीज बोने की मशीन (सीड ड्रिल) |
| `cultivators` | Cultivators | कल्टिव्हेटर / नांगरणी यंत्र | कल्टीवेटर |
| `sprayers` | Sprayers | फवारणी यंत्र | छिड़काव मशीन (स्प्रेयर) |
| `powerTillers` | Power Tillers | पॉवर टिलर | पावर टिलर |
| `otherMachinery` | Other Machinery | इतर अवजारे | अन्य मशीनें |

---

## 3. Booking Status Mapping

Backend status codes are strictly preserved in application logic and API payloads:
- `PENDING` → Marathi: `प्रतीक्षेत (मंजुरीची प्रतीक्षा)` / Hindi: `प्रतीक्षारत (स्वीकृति की प्रतीक्षा)`
- `APPROVED` → Marathi: `मंजूर` / Hindi: `स्वीकृत`
- `REJECTED` → Marathi: `नाकारले` / Hindi: `अस्वीकृत`
- `CANCELLED` → Marathi: `रद्द` / Hindi: `रद्द`
- `COMPLETED` → Marathi: `पूर्ण` / Hindi: `पूर्ण`

---

## 4. Linguistic Guidelines

1. **Simplicity Over Formalisms**: Avoid overly Sanskritized Marathi/Hindi when an everyday agrarian term communicates better (e.g., using "भाडेतत्त्वावर" instead of "पट्टाधिकार").
2. **Action-Oriented Buttons**: Labels should be direct (e.g., "उपकरण भाड्याने घ्या", "बदल जतन करा").
3. **Preserve User Content**: Actual machinery names ("Mahindra 575 DI"), descriptions, and farmer-typed notes are user-generated and MUST NOT be auto-translated.
