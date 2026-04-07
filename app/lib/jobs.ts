export type Job = {
  id: string;
  title: string;
  trust: string;
  region: string;
  specialty: string;
  grade: string;
  contractType: "Permanent" | "Fixed Term" | "Locum" | "Part-time";
  trustType: "Acute" | "Mental Health" | "Community" | "Teaching" | "Foundation";
  salaryRange: string;
  closingDate: string;
  trustRating: number;
  trustReviewCount: number;
  source: "NHS Jobs" | "Trust Website" | "BMJ Careers";
  description: string;
  requirements: string[];
  benefits: string[];
  ltftFriendly: boolean;
  onCallFrequency: string;
};

export const JOBS: Job[] = [
  {
    id: "1",
    title: "Cardiology Registrar",
    trust: "Royal Free London NHS Foundation Trust",
    region: "London",
    specialty: "Cardiology",
    grade: "ST5",
    contractType: "Permanent",
    trustType: "Teaching",
    salaryRange: "£55,329 – £63,152",
    closingDate: "2026-04-18",
    trustRating: 4.2,
    trustReviewCount: 38,
    source: "NHS Jobs",
    description:
      "We are looking for an enthusiastic and motivated Cardiology Registrar to join our expanding team at the Royal Free Hospital. You will be working alongside a highly skilled multi-disciplinary team delivering comprehensive cardiac care across a tertiary centre. The post offers excellent training opportunities with access to complex interventional procedures, advanced imaging, and electrophysiology.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "MRCP (UK) or equivalent",
      "Minimum 4 years postgraduate experience in general medicine with at least 2 in cardiology",
      "Advanced Life Support (ALS) provider",
      "Demonstrated commitment to cardiology as a career",
    ],
    benefits: [
      "Excellent on-site training and education programme",
      "Study leave allowance of 30 days per year",
      "Access to NHS pension scheme",
      "Subsidised on-site parking",
      "Employee assistance programme",
    ],
    ltftFriendly: true,
    onCallFrequency: "1 in 8",
  },
  {
    id: "2",
    title: "Emergency Medicine Consultant",
    trust: "Manchester University NHS Foundation Trust",
    region: "North West",
    specialty: "Emergency Medicine",
    grade: "Consultant",
    contractType: "Permanent",
    trustType: "Teaching",
    salaryRange: "£93,666 – £126,281",
    closingDate: "2026-04-22",
    trustRating: 4.5,
    trustReviewCount: 61,
    source: "NHS Jobs",
    description:
      "Manchester University NHS Foundation Trust is one of the largest acute trusts in the UK. We are seeking an experienced and dynamic Emergency Medicine Consultant to join our busy department at Wythenshawe Hospital. You will play a key clinical and leadership role within our team, contributing to service development, education, and governance.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "FRCEM or equivalent specialist qualification",
      "Entry on the Specialist Register or within 6 months of CCT",
      "Significant experience in emergency medicine at senior level",
      "Evidence of leadership and management skills",
    ],
    benefits: [
      "10 Programmed Activities per week (2 supporting PAs included)",
      "Dedicated research and teaching time available",
      "Relocation expenses considered",
      "Flexible working arrangements",
      "Excellent CPD support budget",
    ],
    ltftFriendly: true,
    onCallFrequency: "1 in 10",
  },
  {
    id: "3",
    title: "General Practitioner",
    trust: "Cambridgeshire & Peterborough ICB",
    region: "East of England",
    specialty: "General Practice",
    grade: "SAS",
    contractType: "Part-time",
    trustType: "Community",
    salaryRange: "£68,000 – £82,000",
    closingDate: "2026-04-14",
    trustRating: 3.8,
    trustReviewCount: 22,
    source: "Trust Website",
    description:
      "We are recruiting for a salaried GP to join our friendly and forward-thinking practice in the heart of Cambridge. This is a 6-session-per-week post with opportunities for additional sessions. Our practice is training-accredited and benefits from excellent clinical and administrative support. Flexible working is actively encouraged.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "MRCGP or equivalent",
      "Inclusion on the GP Performers List",
      "Evidence of revalidation and continued professional development",
      "Strong clinical skills with broad general practice experience",
    ],
    benefits: [
      "6 sessions per week (flexible days)",
      "Protected admin time and regular clinical meetings",
      "NHS pension contribution",
      "Indemnity covered by the practice",
      "Supportive multidisciplinary team environment",
    ],
    ltftFriendly: true,
    onCallFrequency: "None",
  },
  {
    id: "4",
    title: "Core Psychiatry Trainee",
    trust: "South London and Maudsley NHS Foundation Trust",
    region: "London",
    specialty: "Psychiatry",
    grade: "CT2",
    contractType: "Fixed Term",
    trustType: "Mental Health",
    salaryRange: "£37,191 – £47,596",
    closingDate: "2026-05-01",
    trustRating: 4.7,
    trustReviewCount: 89,
    source: "NHS Jobs",
    description:
      "The South London and Maudsley NHS Foundation Trust (SLaM) is one of the leading mental health trusts in the world, affiliated with King's College London. This post is ideal for a doctor wishing to develop their career in psychiatry, offering rotations through inpatient, crisis, and community mental health teams in a world-class academic environment.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "MBChB or equivalent medical degree",
      "Foundation competencies achieved or equivalent",
      "Genuine interest in psychiatry as a specialty",
      "Good communication and team working skills",
    ],
    benefits: [
      "Regular educational supervision with a named educational supervisor",
      "Strong academic links with KCL Institute of Psychiatry",
      "Access to Maudsley Learning platform",
      "Wellbeing support and pastoral care",
      "On-call banding supplement",
    ],
    ltftFriendly: true,
    onCallFrequency: "1 in 6",
  },
  {
    id: "5",
    title: "Consultant Orthopaedic Surgeon",
    trust: "Leeds Teaching Hospitals NHS Trust",
    region: "Yorkshire & Humber",
    specialty: "Orthopaedics",
    grade: "Consultant",
    contractType: "Permanent",
    trustType: "Teaching",
    salaryRange: "£93,666 – £126,281",
    closingDate: "2026-04-30",
    trustRating: 4.1,
    trustReviewCount: 45,
    source: "BMJ Careers",
    description:
      "Leeds Teaching Hospitals NHS Trust is one of the busiest and most successful NHS foundation trusts in the country. We have an exciting opportunity for a Consultant Orthopaedic Surgeon with a subspecialty interest in hip and knee arthroplasty. The successful candidate will join a well-established team and contribute to our high-volume elective and emergency orthopaedic service.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "FRCS (Tr & Orth) or equivalent",
      "Entry on the Specialist Register",
      "Subspecialty interest in lower limb arthroplasty",
      "Excellent track record in surgical outcomes",
    ],
    benefits: [
      "10 PAs per week with flexible job plan",
      "Purpose-built orthopaedic theatres with robotic assistance",
      "Active research and innovation programme",
      "Generous relocation package available",
      "On-site gym and wellbeing facilities",
    ],
    ltftFriendly: false,
    onCallFrequency: "1 in 12",
  },
  {
    id: "6",
    title: "Paediatric Registrar",
    trust: "Great Ormond Street Hospital",
    region: "London",
    specialty: "Paediatrics",
    grade: "ST4",
    contractType: "Fixed Term",
    trustType: "Teaching",
    salaryRange: "£52,530 – £58,400",
    closingDate: "2026-04-25",
    trustRating: 4.8,
    trustReviewCount: 112,
    source: "NHS Jobs",
    description:
      "Great Ormond Street Hospital for Children NHS Foundation Trust is a world-renowned specialist children's hospital. This Paediatric Registrar post offers unparalleled exposure to complex and rare paediatric conditions across a wide range of specialties. Trainees benefit from close supervision, excellent teaching, and opportunities for research and publication.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "MRCPCH or equivalent",
      "Minimum ST4 level or equivalent experience in paediatrics",
      "ALS/APLS certification",
      "Interest in sub-specialty paediatric medicine",
    ],
    benefits: [
      "Unparalleled subspecialty paediatric experience",
      "Strong academic links with UCL Great Ormond Street Institute of Child Health",
      "Structured research time available",
      "Active junior doctor wellbeing programme",
      "On-site subsidised accommodation",
    ],
    ltftFriendly: true,
    onCallFrequency: "1 in 7",
  },
  {
    id: "7",
    title: "Anaesthetics SAS Doctor",
    trust: "Norfolk and Norwich University Hospitals NHS Trust",
    region: "East of England",
    specialty: "Anaesthetics",
    grade: "SAS",
    contractType: "Permanent",
    trustType: "Acute",
    salaryRange: "£55,329 – £67,786",
    closingDate: "2026-05-07",
    trustRating: 3.9,
    trustReviewCount: 29,
    source: "Trust Website",
    description:
      "Norfolk and Norwich University Hospital is a major regional centre serving a population of approximately 900,000 across Norfolk and surrounding areas. We are looking for an experienced SAS Anaesthetist to join our busy department. The post offers a varied clinical workload including elective, emergency, and obstetric anaesthesia, with opportunities for specialist interests.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "FRCA or equivalent, or demonstrable SAS-level experience in anaesthetics",
      "Minimum 5 years post-foundation experience in anaesthetics",
      "ALS provider certificate",
      "Competence in general and regional anaesthesia",
    ],
    benefits: [
      "Structured SAS development programme",
      "Study leave entitlement of 30 days pro rata",
      "Dedicated SAS mentor and educational supervisor",
      "Employee assistance and wellbeing programme",
      "NHS pension scheme",
    ],
    ltftFriendly: false,
    onCallFrequency: "1 in 9",
  },
  {
    id: "8",
    title: "Consultant Radiologist",
    trust: "University College London Hospitals NHS Foundation Trust",
    region: "London",
    specialty: "Radiology",
    grade: "Consultant",
    contractType: "Permanent",
    trustType: "Teaching",
    salaryRange: "£93,666 – £126,281",
    closingDate: "2026-05-12",
    trustRating: 4.3,
    trustReviewCount: 54,
    source: "NHS Jobs",
    description:
      "University College London Hospitals NHS Foundation Trust is one of the UK's leading NHS trusts. We have an exciting vacancy for a Consultant Radiologist with a subspecialty interest in body MRI/CT. The successful candidate will join a collaborative and forward-thinking radiology department with strong links to the UCL Faculty of Medical Sciences.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "FRCR or equivalent",
      "Entry on the Specialist Register",
      "Subspecialty interest in cross-sectional body imaging",
      "Experience with interventional radiology desirable",
    ],
    benefits: [
      "10 PAs per week with 2 SPAs",
      "Access to cutting-edge imaging technology including PET-MRI",
      "Active research and innovation opportunities",
      "Generous CPD budget",
      "Excellent transport links in central London",
    ],
    ltftFriendly: true,
    onCallFrequency: "1 in 14",
  },
  {
    id: "9",
    title: "General Surgery Core Trainee",
    trust: "North Bristol NHS Trust",
    region: "South West",
    specialty: "General Surgery",
    grade: "CT2",
    contractType: "Fixed Term",
    trustType: "Acute",
    salaryRange: "£40,257 – £51,017",
    closingDate: "2026-04-16",
    trustRating: 4.0,
    trustReviewCount: 31,
    source: "NHS Jobs",
    description:
      "North Bristol NHS Trust operates Southmead Hospital, one of the largest acute hospitals in the South West. This General Surgery Core Training post provides an excellent grounding in all aspects of general and emergency surgery. Trainees rotate through upper GI, colorectal, breast, and emergency surgical teams, with structured teaching and simulation.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "MRCS Part A (or equivalent) preferred",
      "Foundation competencies and minimum 1 year surgical experience",
      "ATLS provider certification or willingness to obtain",
      "Commitment to a surgical career",
    ],
    benefits: [
      "Weekly structured surgical skills teaching programme",
      "Regular simulation training using Southmead's state-of-the-art sim lab",
      "Supportive rota with clear handover processes",
      "Trainee welfare officer and wellbeing support",
      "On-call supplement and unsocial hours payment",
    ],
    ltftFriendly: false,
    onCallFrequency: "1 in 5",
  },
  {
    id: "10",
    title: "Dermatology Registrar",
    trust: "Guy's and St Thomas' NHS Foundation Trust",
    region: "London",
    specialty: "Dermatology",
    grade: "ST3",
    contractType: "Permanent",
    trustType: "Teaching",
    salaryRange: "£52,530 – £58,400",
    closingDate: "2026-05-05",
    trustRating: 4.6,
    trustReviewCount: 77,
    source: "BMJ Careers",
    description:
      "Guy's and St Thomas' NHS Foundation Trust is one of the UK's busiest and most successful NHS foundation trusts. This Dermatology Registrar post is within a high-volume, academically active department offering exposure to a broad range of general and complex dermatological conditions, including inflammatory skin disease, skin cancer, dermatological surgery, and paediatric dermatology.",
    requirements: [
      "Full GMC registration with a licence to practise",
      "MRCP (UK) or equivalent",
      "Minimum ST3 level or demonstrable equivalent experience in dermatology",
      "Commitment to a career in dermatology",
      "Evidence of academic activity (audit, QIP, or research)",
    ],
    benefits: [
      "Broad subspecialty exposure including Mohs micrographic surgery",
      "Strong academic links with King's College London",
      "Regular departmental teaching and journal clubs",
      "Annual study leave budget",
      "Active trainee support network",
    ],
    ltftFriendly: true,
    onCallFrequency: "1 in 10",
  },
];

export function getJob(id: string): Job | undefined {
  return JOBS.find((j) => j.id === id);
}

export const SPECIALTIES = [
  "Anaesthetics",
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "General Practice",
  "General Surgery",
  "Orthopaedics",
  "Paediatrics",
  "Psychiatry",
  "Radiology",
];

export const GRADES = ["FY1", "FY2", "CT1", "CT2", "ST3", "ST4", "ST5", "ST6", "SAS", "Consultant"];

export const CONTRACT_TYPES = ["Permanent", "Fixed Term", "Locum", "Part-time"];

export const TRUST_TYPES = ["Acute", "Mental Health", "Community", "Teaching", "Foundation"];

export const SOURCES = ["NHS Jobs", "Trust Website", "BMJ Careers"];
