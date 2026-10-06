import data from "../../content/settings/site.json";

/** Site-wide contact details, edited in Decap CMS under "Site settings". */
export type Opening = { title: string; type: string; blurb: string };

export const site = data as {
  contactEmail: string;
  inquirySubject: string;
  instagramHandle: string;
  instagramUrl: string;
  location: string;
  menuFooter: string;
  contactTitle: string;
  contactButton: string;
  careersEmail: string;
  careersSubject: string;
  careersButton: string;
  openings: Opening[];
};

export const mailto = (email: string, subject?: string) =>
  `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;

export const inquiryHref = mailto(site.contactEmail, site.inquirySubject);
export const careersHref = mailto(site.careersEmail, site.careersSubject);
