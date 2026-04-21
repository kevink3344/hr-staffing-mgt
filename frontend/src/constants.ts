export const STAFF_COLUMNS = [
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

export const COLUMN_LABELS: Record<string, string> = {
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
    last_person_name: 'Future Employee Name',
    last_person_no: 'Future Employee No.',
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
    future_assignments: 'Future Assignments',
};

export interface StaffRecord {
    id: number;
    [key: string]: any;
}

export interface ColumnMapping {
    id: number;
    from_column: string;
    to_column: string;
    created_by: string;
    created_at: string;
}

export const EDITABLE_FIELDS = [
    'last_person_name',
    'last_person_no',
    'effective_date',
    'future_assignments',
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
