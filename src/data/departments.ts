export interface RoleOption {
  label: string;
  value: string;
}

export interface Department {
  label: string;
  value: string;
  roles: RoleOption[];
}

export const DEPARTMENTS: Department[] = [
  {
    label: 'Software Development',
    value: 'software_development',
    roles: [
      { label: 'Frontend Developer', value: 'frontend_developer' },
      { label: 'Backend Developer', value: 'backend_developer' },
      { label: 'Full Stack Engineer', value: 'full_stack_engineer' },
      { label: 'QA Automation Engineer', value: 'qa_automation_engineer' },
      { label: 'UI/UX Designer', value: 'ui_ux_designer' },
    ],
  },
  {
    label: 'IT',
    value: 'it',
    roles: [
      { label: 'IT Support Specialist', value: 'it_support_specialist' },
      { label: 'Systems Administrator', value: 'systems_administrator' },
      { label: 'Network Engineer', value: 'network_engineer' },
      { label: 'Cloud/DevOps Engineer', value: 'cloud_devops_engineer' },
    ],
  },
  {
    label: 'Human Resources',
    value: 'human_resources',
    roles: [
      { label: 'HR Specialist', value: 'hr_specialist' },
      { label: 'Technical Recruiter', value: 'technical_recruiter' },
      { label: 'Payroll Specialist', value: 'payroll_specialist' },
    ],
  },
  {
    label: 'Marketing',
    value: 'marketing',
    roles: [
      { label: 'SEO Specialist', value: 'seo_specialist' },
      { label: 'Content Writer', value: 'content_writer' },
      { label: 'Social Media Manager', value: 'social_media_manager' },
    ],
  },
  {
    label: 'Sales',
    value: 'sales',
    roles: [
      { label: 'Account Executive', value: 'account_executive' },
      { label: 'Sales Development Representative', value: 'sales_development_representative' },
      { label: 'Customer Success Specialist', value: 'customer_success_specialist' },
    ],
  },
];

export const TIMEZONES = [{ label: 'Manila — UTC+8 (Asia/Manila)', value: 'Asia/Manila' }];
