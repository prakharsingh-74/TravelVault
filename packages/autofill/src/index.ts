export interface FieldSelector {
  selector: string;
  type: 'text' | 'select' | 'radio' | 'checkbox';
  valueTransformer?: (profile: any) => string;
}

export interface SiteRules {
  passengerRowsSelector?: string;
  fields: {
    name?: FieldSelector[];
    age?: FieldSelector[];
    gender?: FieldSelector[];
    nationality?: FieldSelector[];
    berth?: FieldSelector[];
    meal?: FieldSelector[];
    mobile?: FieldSelector[];
    email?: FieldSelector[];
  };
}

// Special mappings for popular sites
export const AUTOFILL_RULES: Record<string, SiteRules> = {
  // IRCTC Tatkal passenger forms are usually grids with multiple passenger rows
  irctc: {
    passengerRowsSelector: '.ui-table-tbody tr, .passenger-row, .passenger-detail-table tr',
    fields: {
      name: [
        { selector: 'input[placeholder*="Passenger Name"], input[formcontrolname*="passengerName"]', type: 'text' }
      ],
      age: [
        { selector: 'input[placeholder*="Age"], input[formcontrolname*="passengerAge"]', type: 'text' }
      ],
      gender: [
        { selector: 'select[formcontrolname*="passengerGender"], select[formcontrolname*="gender"]', type: 'select' }
      ],
      berth: [
        { selector: 'select[formcontrolname*="passengerBerthChoice"], select[formcontrolname*="berth"]', type: 'select' }
      ],
      meal: [
        { selector: 'select[formcontrolname*="passengerFoodChoice"], select[formcontrolname*="food"]', type: 'select' }
      ]
    }
  },
  
  makemytrip: {
    fields: {
      name: [
        { selector: 'input[placeholder*="First Name"], input[name*="firstName"]', type: 'text' },
        { selector: 'input[placeholder*="Last Name"], input[name*="lastName"]', type: 'text' }
      ],
      mobile: [
        { selector: 'input[placeholder*="Mobile"], input[name*="mobile"]', type: 'text' }
      ],
      email: [
        { selector: 'input[placeholder*="Email"], input[name*="email"]', type: 'text' }
      ]
    }
  },

  // Fallback generic site rules based on common attributes
  generic: {
    fields: {
      name: [
        { selector: 'input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]', type: 'text' }
      ],
      age: [
        { selector: 'input[name*="age" i], input[id*="age" i], input[placeholder*="age" i]', type: 'text' }
      ],
      gender: [
        { selector: 'select[name*="gender" i], select[id*="gender" i]', type: 'select' }
      ],
      mobile: [
        { selector: 'input[type="tel"], input[name*="phone" i], input[name*="mobile" i]', type: 'text' }
      ],
      email: [
        { selector: 'input[type="email"], input[name*="email" i]', type: 'text' }
      ]
    }
  }
};

/**
 * Detects which rule matches the current page domain
 */
export function getRulesForUrl(url: string): SiteRules {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname.includes('irctc')) {
    return AUTOFILL_RULES.irctc;
  }
  if (hostname.includes('makemytrip')) {
    return AUTOFILL_RULES.makemytrip;
  }
  return AUTOFILL_RULES.generic;
}

/**
 * Calculate age based on date of birth
 */
export function calculateAge(dobString: string): number {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
