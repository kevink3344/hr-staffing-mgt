export interface StaffRecord {
    id: number;
    employee_name: string;
    emp_no?: string;
    contract_renewal_yr?: string;
    contract?: string;
    contract_end?: string;
    emp_percent?: string;
    pos_start?: string;
    pos_end?: string;
    pos_no?: string;
    account_code?: string;
    license_type?: string;
    expires?: string;
    position_name?: string;
    classroom_teaching_assignment?: string;
    mo_available?: string;
    mo_used?: string;
    track?: string;
    last_person_name?: string;
    last_person_no?: string;
    effective_date?: string;
    classroom_assign?: string;
    pos_no_new?: string;
    mos?: string;
    emp_percent_new?: string;
    track_new?: string;
    pay_grade?: string;
    step?: string;
    contract_type?: string;
    contract_start_date?: string;
    contract_end_date?: string;
    letter_needed?: string;
    comments?: string;
    created_at?: string;
    updated_at?: string;
}

export interface StaffRecordHistory {
    id: number;
    record_id: number;
    changed_by: string;
    changes: Record<string, { from: string | null; to: string | null }>;
    created_at: string;
}

export interface SavedView {
    id: number;
    name: string;
    column_keys: string[];
    created_by: string;
    is_system: number;
    created_at: string;
    updated_at: string;
}

export const STAFF_RECORD_COLUMNS = [
    'employee_name',
    'emp_no',
    'contract_renewal_yr',
    'contract',
    'contract_end',
    'emp_percent',
    'pos_start',
    'pos_end',
    'pos_no',
    'account_code',
    'license_type',
    'expires',
    'position_name',
    'classroom_teaching_assignment',
    'mo_available',
    'mo_used',
    'track',
    'last_person_name',
    'last_person_no',
    'effective_date',
    'classroom_assign',
    'pos_no_new',
    'mos',
    'emp_percent_new',
    'track_new',
    'pay_grade',
    'step',
    'contract_type',
    'contract_start_date',
    'contract_end_date',
    'letter_needed',
    'comments',
] as const;

export const COLUMN_LABELS: Record<typeof STAFF_RECORD_COLUMNS[number], string> = {
    employee_name: 'Employee Name',
    emp_no: 'Emp No.',
    contract_renewal_yr: 'Contract Renewal Yr',
    contract: 'Contract',
    contract_end: 'Contract End',
    emp_percent: '% Emp',
    pos_start: 'Pos Start',
    pos_end: 'Pos End',
    pos_no: 'Pos No.',
    account_code: 'Account Code',
    license_type: 'License Type',
    expires: 'Expires',
    position_name: 'Position Name',
    classroom_teaching_assignment: 'Classroom/Teaching Assignment',
    mo_available: 'Mo. Available',
    mo_used: 'Mo. Used',
    track: 'Track',
    last_person_name: 'Last Person Name',
    last_person_no: 'Last Person #',
    effective_date: 'Effective Date',
    classroom_assign: 'Classroom Assign',
    pos_no_new: 'Pos No. (New)',
    mos: 'Mos.',
    emp_percent_new: '% Emp (New)',
    track_new: 'Track (New)',
    pay_grade: 'Pay Grade',
    step: 'Step',
    contract_type: 'Contract Type',
    contract_start_date: 'Contract Start Date',
    contract_end_date: 'Contract End Date',
    letter_needed: 'Letter Needed?',
    comments: 'Comments',
};
