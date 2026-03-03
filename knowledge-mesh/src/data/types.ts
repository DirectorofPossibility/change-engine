export interface Domain {
  id: string;
  label: string;
  color: string;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  domain_id: string;
  summary: string;
  website?: string;
  focus_areas?: string[];
}
