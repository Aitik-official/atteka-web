/** Common GST SAC / service accounting codes for master seed */
export const SAC_CODE_SEED: { sacCode: string; description: string; used?: boolean }[] = [
  { sacCode: "99", description: "All Services" },
  { sacCode: "9954", description: "Construction services" },
  { sacCode: "9961", description: "Services in wholesale trade" },
  { sacCode: "9962", description: "Services in retail trade" },
  { sacCode: "9963", description: "Accommodation, food and beverage services" },
  { sacCode: "9964", description: "Passenger transport services" },
  { sacCode: "9965", description: "Goods Transport Services" },
  { sacCode: "996511", description: "Road transport services of goods including letters, parcels, live animals, etc" },
  { sacCode: "996512", description: "Railway transport services of goods" },
  { sacCode: "996513", description: "Coastal and transoceanic water transport services of goods" },
  { sacCode: "996519", description: "Other land transport services of goods n.e.c." },
  { sacCode: "9966", description: "Rental services of transport vehicles with or without operators" },
  { sacCode: "9967", description: "Supporting services in transport" },
  { sacCode: "996711", description: "Container handling services" },
  { sacCode: "996719", description: "Other supporting services for road transport" },
  { sacCode: "9968", description: "Postal and courier services" },
  { sacCode: "9969", description: "Electricity, gas, water and other distribution services" },
  { sacCode: "9971", description: "Financial and related services" },
  { sacCode: "9972", description: "Real estate services" },
  { sacCode: "9973", description: "Leasing or rental services without operator" },
  { sacCode: "9981", description: "Research and development services" },
  { sacCode: "9982", description: "Legal and accounting services" },
  { sacCode: "9983", description: "Other professional, technical and business services" },
  { sacCode: "9984", description: "Telecommunications, broadcasting and information supply services" },
  { sacCode: "9985", description: "Support services" },
  { sacCode: "9986", description: "Support services to agriculture, hunting, forestry, fishing, mining and utilities" },
  { sacCode: "9987", description: "Maintenance, repair and installation (except construction) services" },
  { sacCode: "9988", description: "Manufacturing services on physical inputs owned by others" },
  { sacCode: "9989", description: "Other manufacturing services; publishing, printing and reproduction services" },
  { sacCode: "9991", description: "Public administration and other services provided to the community as a whole; compulsory social security services" },
  { sacCode: "9992", description: "Education services" },
  { sacCode: "9993", description: "Human health and social care services" },
  { sacCode: "9994", description: "Sewage and waste collection, treatment and disposal and other environmental protection services" },
  { sacCode: "9995", description: "Services of membership organisations" },
  { sacCode: "9996", description: "Recreational, cultural and sporting services" },
  { sacCode: "9997", description: "Other services" },
  { sacCode: "9998", description: "Domestic services" },
  { sacCode: "9999", description: "Services provided by extraterritorial organisations and bodies" },
  // Expand with chapter variants so pagination looks populated like production
  ...Array.from({ length: 560 }, (_, i) => {
    const n = 1000 + i;
    return {
      sacCode: String(n),
      description: `Service accounting code ${n}`,
      used: false as boolean
    };
  })
];
