import Papa from 'papaparse';

/**
 * Downloads a Blob to the user's computer
 */
export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports data to a CSV file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToCsv(filename, rows, columns = null) {
  let csvContent;
  if (columns) {
    csvContent = Papa.unparse({
      fields: columns,
      data: rows.map(r => columns.map(c => r[c] ?? ''))
    });
  } else {
    csvContent = Papa.unparse(rows);
  }

  // Prepend \uFEFF BOM for Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(filename, blob);
}

/**
 * Generates a blank CSV template for HR contacts
 */
export function downloadContactsTemplate() {
  const sampleHeaders = [
    'name',
    'company',
    'phone',
    'status',
    'followup_date',
    'interview_date',
    'next_action',
    'notes'
  ];
  const sampleRows = [
    [
      'Anjali Sharma',
      'Acme Tech Solutions',
      '+91 9876543210',
      'Connected',
      '2026-12-01',
      '',
      'Send resume',
      'Discussed Frontend Developer position'
    ],
    [
      'Vikram Malhotra',
      'Global Software Labs',
      '9811223344',
      'Not Called',
      '',
      '',
      'Call again',
      'Found recruiter on LinkedIn'
    ]
  ];

  const csv = Papa.unparse({
    fields: sampleHeaders,
    data: sampleRows
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob('job-tracker-contacts-template.csv', blob);
}

/**
 * Generates a blank CSV template for Job Applications
 */
export function downloadApplicationsTemplate() {
  const sampleHeaders = [
    'company_name',
    'job_title',
    'location',
    'job_url',
    'application_date',
    'expected_ctc',
    'offered_ctc',
    'application_status',
    'recruiter_name',
    'recruiter_phone',
    'notes'
  ];
  const sampleRows = [
    [
      'Google',
      'Software Engineer II',
      'Bengaluru / Remote',
      'https://careers.google.com/jobs/results/12345',
      '2026-11-20',
      '2800000',
      '',
      'Applied',
      'Rohit Sen',
      '9988776655',
      'Applied via employee referral'
    ]
  ];

  const csv = Papa.unparse({
    fields: sampleHeaders,
    data: sampleRows
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob('job-tracker-applications-template.csv', blob);
}

