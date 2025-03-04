// This file contains hard-coded permit entities and their URLs
// This can be used as a reference for the permit entities in the repository

export const permitEntities = [
  {
    address: "10490 GANDY BLVD, ST PETERSBURG FL 33702",
    recordNumber: "BC-DMO-25-00005",
    recordType: "Commercial demolition",
    status: "Awaiting plans",
    projectName: "Kennel Club",
    entityId: "XrDuCGpVtBXEX7jE4YqQEc",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/XrDuCGpVtBXEX7jE4YqQEc"
  },
  {
    address: "10596 GANDY BLVD, ST PETERSBURG FL 33702",
    recordNumber: "BC-ELE-25-00045",
    recordType: "Commercial electrical",
    status: "Incomplete submittal",
    projectName: "(FLAG) CS - FIRE ALARM - Goodwill Suncoast",
    entityId: "Tk2TLvxj5GtEbV7vVNrx1N",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/Tk2TLvxj5GtEbV7vVNrx1N"
  },
  {
    address: "10636 GANDY BLVD, 43, ST PETERSBURG 33702",
    recordNumber: "BR-DMO-25-00104",
    recordType: "Residential demolition",
    status: "Awaiting plans",
    projectName: "Mobile Home Demolition",
    entityId: "UsdepoWa8vGmEuC2xn4j1f",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/UsdepoWa8vGmEuC2xn4j1f"
  },
  {
    address: "10947 1ST WAY N, ST PETERSBURG FL 33702",
    recordNumber: "EBP-25-02511",
    recordType: "Express building permit",
    status: "Submitted",
    projectName: "Mitchell residence",
    entityId: "6Cd8uVKtsEmquNdwpojkqS",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/6Cd8uVKtsEmquNdwpojkqS"
  },
  {
    address: "2628 65TH AVE N, ST PETERSBURG FL 33702",
    recordNumber: "BR-SOL-24-00780.001",
    recordType: "Residential revision-supplement",
    status: "In review",
    projectName: "Revision Request (BR-SOL-24-00780)",
    entityId: "VfRjw4eaBvqiAqgA5JiPTN",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/VfRjw4eaBvqiAqgA5JiPTN"
  },
  {
    address: "3231 66TH AVE N, ST PETERSBURG FL 33702",
    recordNumber: "BR-PLB-25-00053",
    recordType: "Residential plumbing",
    status: "Awaiting plans",
    projectName: "Ashley Fischer",
    entityId: "LmDNEMdLE1jwpKVtU3NQcJ",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/LmDNEMdLE1jwpKVtU3NQcJ"
  },
  {
    address: "6443 26TH WAY N, ST PETERSBURG FL 33702",
    recordNumber: "EBP-25-02988",
    recordType: "Express building permit",
    status: "Issued",
    projectName: "Toebaas",
    entityId: "LK6wzjrvGJVjex45bXyMTD",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/LK6wzjrvGJVjex45bXyMTD"
  },
  {
    address: "6485 31ST ST N, ST PETERSBURG FL 33702",
    recordNumber: "BR-SFR-24-00209.001",
    recordType: "Residential revision-supplement",
    status: "Closed - supp-rev approved",
    projectName: "Revision Request (BR-SFR-24-00209)",
    entityId: "Y1TS4rBUY5Cg2SasK1o3g7",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/Y1TS4rBUY5Cg2SasK1o3g7"
  },
  {
    address: "6563 28TH ST N, ST PETERSBURG FL 33702",
    recordNumber: "EBP-25-02793",
    recordType: "Express building permit",
    status: "Issued",
    projectName: "Brad Graham - Florida Real Estate Mgt. Invest.",
    entityId: "Y3fdGQw6kXnEKTXAjFCwnm",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/Y3fdGQw6kXnEKTXAjFCwnm"
  },
  {
    address: "6599 31ST ST N, ST PETERSBURG FL 33702",
    recordNumber: "25TMP-011454",
    recordType: "Express building permit",
    status: "N/a",
    projectName: "New Meter Main",
    entityId: "HkkxEbhCBTqU1VGnV5R7JC",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/HkkxEbhCBTqU1VGnV5R7JC"
  },
  {
    address: "6599 31ST ST N, ST PETERSBURG FL 33702",
    recordNumber: "BR-ELE-25-00132",
    recordType: "Residential electrical",
    status: "Closed - withdrawn",
    projectName: "Meter Main",
    entityId: "RZByHuuGmDFXbtyNizH2Gt",
    url: "https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/RZByHuuGmDFXbtyNizH2Gt"
  }
];

// If running this file directly, print the permit entities
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(permitEntities, null, 2));
}
